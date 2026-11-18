import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';

import { startTestServer, seedAdmin, loginAsAdmin, bearer } from '../test-bootstrap-mongo.js';

const servicePayload = {
  slug: 'signature-facial',
  name: 'Signature Facial',
  category: 'skin',
  shortDescription: 'A considered, results-led facial.',
  description: ['A first description paragraph.'],
  steps: ['Consultation', 'Treatment'],
  benefits: ['Visible glow'],
  considerations: ['Patch test advised'],
  faqs: [{ question: 'Is it safe?', answer: 'Yes, after consultation.' }],
  isFeatured: true,
  visual: 'bloom',
  publishedAt: null,
};

describe('admin CRUD', () => {
  let app: Express;
  let stop: () => Promise<void>;
  let token: string;

  beforeAll(async () => {
    const server = await startTestServer();
    app = server.app;
    stop = server.stop;
    await seedAdmin();
    token = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await stop();
  });

  it('creates, reads, updates and archives a service', async () => {
    const created = await request(app)
      .post('/api/admin/services')
      .set(bearer(token))
      .send(servicePayload);

    expect(created.status).toBe(201);
    const serviceId = created.body.data.id as string;
    expect(serviceId).toBeTruthy();

    const read = await request(app).get(`/api/admin/services/${serviceId}`).set(bearer(token));
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ slug: 'signature-facial', isFeatured: true });

    const updated = await request(app)
      .put(`/api/admin/services/${serviceId}`)
      .set(bearer(token))
      .send({ name: 'Updated Signature Facial' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Updated Signature Facial');

    const archived = await request(app)
      .delete(`/api/admin/services/${serviceId}`)
      .set(bearer(token));

    expect(archived.status).toBe(200);
    expect(archived.body.data.isArchived).toBe(true);

    const afterArchive = await request(app)
      .get(`/api/admin/services/${serviceId}`)
      .set(bearer(token));
    expect(afterArchive.status).toBe(404);
  });

  it('rejects an invalid service payload', async () => {
    const response = await request(app)
      .post('/api/admin/services')
      .set(bearer(token))
      .send({ slug: 'Not A Slug', name: '' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists services with pagination metadata', async () => {
    const response = await request(app)
      .get('/api/admin/services?page=1&limit=10')
      .set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      items: expect.any(Array),
      page: 1,
      limit: 10,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('creates and updates a category', async () => {
    const created = await request(app)
      .post('/api/admin/categories')
      .set(bearer(token))
      .send({ slug: 'skin', name: 'Skin', description: 'Skin treatments.' });

    expect(created.status).toBe(201);

    const updated = await request(app)
      .put('/api/admin/categories/skin')
      .set(bearer(token))
      .send({ name: 'Skin Health' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Skin Health');
  });

  it('creates and archives a gallery item', async () => {
    const created = await request(app).post('/api/admin/gallery').set(bearer(token)).send({
      title: 'Clinic interior',
      alt: 'Calm clinic interior',
      category: 'clinic',
      cloudId: 'blue-miror/clinic-1',
      variant: 'arch',
      publishedAt: null,
    });

    expect(created.status).toBe(201);

    const archived = await request(app)
      .delete(`/api/admin/gallery/${created.body.data.id}`)
      .set(bearer(token));

    expect(archived.status).toBe(200);
    expect(archived.body.data.isArchived).toBe(true);
  });

  it('creates and archives a team member', async () => {
    const created = await request(app).post('/api/admin/team').set(bearer(token)).send({
      name: 'Dr Example',
      designation: 'Aesthetic Practitioner',
      bio: null,
      cloudId: null,
      publishedAt: null,
    });

    expect(created.status).toBe(201);

    const archived = await request(app)
      .delete(`/api/admin/team/${created.body.data.id}`)
      .set(bearer(token));

    expect(archived.status).toBe(200);
    expect(archived.body.data.isArchived).toBe(true);
  });

  it('creates and publishes a testimonial', async () => {
    const created = await request(app).post('/api/admin/testimonials').set(bearer(token)).send({
      name: 'A Client',
      treatment: 'Signature Facial',
      quote: 'Considered and calm throughout.',
      consentStoredAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    });

    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe('A Client');
  });

  it('creates and archives an faq', async () => {
    const created = await request(app).post('/api/admin/faqs').set(bearer(token)).send({
      question: 'Do you offer consultations?',
      answer: 'Yes, every treatment starts with one.',
      category: 'general',
      publishedAt: null,
    });

    expect(created.status).toBe(201);

    const archived = await request(app)
      .delete(`/api/admin/faqs/${created.body.data.id}`)
      .set(bearer(token));

    expect(archived.status).toBe(200);
    expect(archived.body.data.isArchived).toBe(true);
  });

  it('upserts website settings', async () => {
    const response = await request(app)
      .put('/api/admin/settings')
      .set(bearer(token))
      .send({
        site: {
          name: 'Blue Miror',
          category: 'Aesthetic Clinic',
          tagline: 'Aesthetic care, considered.',
          defaultDescription: 'A service-led aesthetic clinic.',
        },
        brand: { logoUrl: '/brand/blue-miror-logo.png', logoAlt: 'Blue Miror crest' },
        contact: {
          phone: null,
          email: null,
          whatsappDisplay: null,
          address: null,
          mapsUrl: null,
          directionsUrl: null,
          hours: [{ label: 'Monday', value: '9:00 - 18:00' }],
        },
        whatsapp: {
          enabled: true,
          countryCode: '+44',
          number: '7700900123',
          defaultMessage: 'Hello',
          bookingMessageTemplate: null,
          serviceEnquiryTemplate: null,
          cta: {
            booking: 'Book a consultation',
            serviceEnquiry: 'Ask about this treatment',
            floating: 'Chat on WhatsApp',
          },
        },
        booking: {
          primaryChannel: 'whatsapp',
          responseExpectation: 'Within one business day.',
          note: 'Requests are reviewed before confirmation.',
        },
        social: [],
        seo: {
          defaultTitle: 'Blue Miror',
          defaultDescription: 'A considered aesthetic clinic.',
          canonicalBaseUrl: null,
        },
        legal: { lastUpdated: new Date().toISOString() },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.whatsapp).toMatchObject({ enabled: true, number: '7700900123' });
  });

  it('returns 401 for unauthenticated admin requests', async () => {
    const response = await request(app).get('/api/admin/settings');

    expect(response.status).toBe(401);
  });
});
