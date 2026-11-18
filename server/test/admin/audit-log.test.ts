import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuditLog } from '../../src/models/audit-log.model.js';
import {
  startTestServer,
  resetDatabase,
  seedAdmin,
  loginAsAdmin,
  bearer,
  testAdminPassword,
} from '../test-bootstrap-mongo.js';

let app: Express;
let stop: () => Promise<void>;
let token: string;

async function waitForEntry(action: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const entry = await AuditLog.findOne({ action }).sort({ createdAt: -1 }).lean();
    if (entry) return entry;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return null;
}

beforeAll(async () => {
  const server = await startTestServer();
  app = server.app;
  stop = server.stop;
});

afterAll(async () => {
  await stop();
});

beforeEach(async () => {
  await resetDatabase();
  await seedAdmin();
  token = await loginAsAdmin(app);
});

describe('admin audit log', () => {
  it('requires an authenticated admin to read the log', async () => {
    const response = await request(app).get('/api/admin/audit');
    expect(response.status).toBe(401);
  });

  it('records a settings change without storing the payload', async () => {
    const settings = {
      site: {
        name: 'Blue Miror',
        category: 'Aesthetic Clinic',
        tagline: null,
        defaultDescription: 'A clinic.',
      },
      brand: { logoUrl: '/logo.png', logoAlt: 'Blue Miror' },
      contact: {
        phone: null,
        email: null,
        whatsappDisplay: null,
        address: null,
        mapsUrl: null,
        directionsUrl: null,
        hours: [],
      },
      whatsapp: {
        enabled: false,
        countryCode: null,
        number: null,
        defaultMessage: null,
        bookingMessageTemplate: null,
        serviceEnquiryTemplate: null,
        cta: { booking: 'Book', serviceEnquiry: 'Ask', floating: 'Chat' },
      },
      booking: { primaryChannel: 'whatsapp', responseExpectation: null, note: 'Reviewed first.' },
      social: [],
      seo: { defaultTitle: 'Blue Miror', defaultDescription: 'A clinic.', canonicalBaseUrl: null },
      legal: { lastUpdated: null },
    };

    const saved = await request(app).put('/api/admin/settings').set(bearer(token)).send(settings);
    expect(saved.status).toBe(200);

    const entry = await waitForEntry('settings.update');
    expect(entry).not.toBeNull();
    expect(entry?.method).toBe('PUT');
    expect(entry?.path).toBe('/api/admin/settings');
    expect(entry?.statusCode).toBe(200);
    expect(entry?.adminEmail).toBeTruthy();

    // The audit record is metadata only: no request payload is stored.
    expect(Object.keys(entry ?? {})).not.toContain('body');
    expect(JSON.stringify(entry)).not.toContain('Reviewed first.');
  });

  it('records service creation and updates with the affected id', async () => {
    const created = await request(app)
      .post('/api/admin/services')
      .set(bearer(token))
      .send({
        slug: 'audit-consultation',
        name: 'Audit consultation',
        category: 'consultations',
        shortDescription: 'A short description.',
        description: ['Overview.'],
        steps: ['Consultation'],
        benefits: ['Clarity'],
        considerations: ['Assessment'],
        faqs: [{ question: 'Is it safe?', answer: 'Discussed in person.' }],
        publishedAt: null,
      });

    expect(created.status).toBe(201);
    const createdEntry = await waitForEntry('service.create');
    expect(createdEntry?.entityType).toBe('service');

    const id = created.body.data.id as string;
    const updated = await request(app)
      .put(`/api/admin/services/${id}`)
      .set(bearer(token))
      .send({ price: null });

    expect(updated.status).toBe(200);
    const updateEntry = await waitForEntry('service.update');
    expect(updateEntry?.entityId).toBe(id);
  });

  it('does not record rejected writes', async () => {
    const rejected = await request(app)
      .post('/api/admin/services')
      .set(bearer(token))
      .send({ name: 'Missing everything else' });

    expect(rejected.status).toBe(422);
    expect(await AuditLog.countDocuments({ action: 'service.create' })).toBe(0);
  });

  it('records login, logout and password changes without the credential value', async () => {
    const newPassword = 'Rotated-Passphrase-2026';

    const changed = await request(app)
      .patch('/api/admin/password')
      .set(bearer(token))
      .send({ currentPassword: testAdminPassword, newPassword });
    expect(changed.status).toBe(200);

    const passwordEntry = await waitForEntry('admin.password_change');
    expect(passwordEntry).not.toBeNull();
    expect(JSON.stringify(passwordEntry)).not.toContain(newPassword);
    expect(JSON.stringify(passwordEntry)).not.toContain(testAdminPassword);
  });

  it('records failed sign-in attempts without the attempted email', async () => {
    const failure = await request(app)
      .post('/api/admin/login')
      .send({ email: 'someone-else@example.com', password: 'wrong-password-value' });
    expect(failure.status).toBe(401);

    const entry = await waitForEntry('admin.login_failed');
    expect(entry?.adminId).toBe('anonymous');
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain('someone-else@example.com');
    expect(serialized).not.toContain('wrong-password-value');
  });

  it('lists entries newest first with pagination and an action filter', async () => {
    await request(app)
      .put('/api/admin/settings')
      .set(bearer(token))
      .send({ booking: { primaryChannel: 'whatsapp', responseExpectation: null, note: 'Note.' } });
    await waitForEntry('settings.update');

    const created = await request(app)
      .post('/api/admin/faqs')
      .set(bearer(token))
      .send({ question: 'Question?', answer: 'Answer.', category: 'Booking', publishedAt: null });
    expect(created.status).toBe(201);
    await waitForEntry('faq.create');

    const page = await request(app).get('/api/admin/audit?page=1&limit=1').set(bearer(token));
    expect(page.status).toBe(200);
    expect(page.body.data.items).toHaveLength(1);
    expect(page.body.data.total).toBeGreaterThanOrEqual(2);
    expect(page.body.data.totalPages).toBeGreaterThanOrEqual(2);

    const filtered = await request(app)
      .get('/api/admin/audit?action=faq.create')
      .set(bearer(token));
    expect(filtered.status).toBe(200);
    expect(
      filtered.body.data.items.every((item: { action: string }) => item.action === 'faq.create'),
    ).toBe(true);
  });
});
