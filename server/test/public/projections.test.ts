import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';

import { startTestServer, seedAdmin, loginAsAdmin, bearer } from '../test-bootstrap-mongo.js';

const published = {
  slug: 'led-therapy',
  name: 'LED Therapy',
  category: 'skin',
  shortDescription: 'Low-level light therapy for calm, clear skin.',
  description: ['A first paragraph about LED therapy.'],
  steps: ['Cleanse', 'LED session'],
  benefits: ['Calmer skin'],
  considerations: ['Not for photosensitive clients'],
  faqs: [{ question: 'How long is a session?', answer: 'About thirty minutes.' }],
  isFeatured: true,
  visual: 'orbit',
  publishedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};

describe('public projections', () => {
  let app: Express;
  let stop: () => Promise<void>;
  let token: string;

  beforeAll(async () => {
    const server = await startTestServer();
    app = server.app;
    stop = server.stop;
    await seedAdmin();
    token = await loginAsAdmin(app);

    await request(app)
      .post('/api/admin/categories')
      .set(bearer(token))
      .send({ slug: 'skin', name: 'Skin', description: 'Skin treatments.' });

    await request(app).post('/api/admin/services').set(bearer(token)).send(published);

    await request(app)
      .post('/api/admin/gallery')
      .set(bearer(token))
      .send({
        title: 'Treatment room',
        alt: 'A calm treatment room',
        category: 'clinic',
        cloudId: 'blue-miror/room-1',
        variant: 'drape',
        publishedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      });

    await request(app)
      .post('/api/admin/testimonials')
      .set(bearer(token))
      .send({
        name: 'A Client',
        treatment: 'LED Therapy',
        quote: 'Calm, careful and clear.',
        consentStoredAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
        publishedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      });

    await request(app)
      .post('/api/admin/team')
      .set(bearer(token))
      .send({
        name: 'Dr Example',
        designation: 'Aesthetic Practitioner',
        bio: 'Experienced practitioner.',
        cloudId: null,
        publishedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      });

    await request(app)
      .post('/api/admin/faqs')
      .set(bearer(token))
      .send({
        question: 'Do I need a consultation?',
        answer: 'Yes, always.',
        category: 'general',
        publishedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      });
  });

  afterAll(async () => {
    await stop();
  });

  it('lists services with category names and pagination meta', async () => {
    const response = await request(app).get('/api/public/services');

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({
      slug: 'led-therapy',
      categoryName: 'Skin',
      isPlaceholder: false,
    });
    expect(response.body.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
  });

  it('returns a service detail with its related list', async () => {
    const response = await request(app).get('/api/public/services/led-therapy');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      slug: 'led-therapy',
      isPlaceholder: false,
    });
    expect(response.body.data.faqs).toEqual([
      { question: 'How long is a session?', answer: 'About thirty minutes.' },
    ]);
    expect(Array.isArray(response.body.data.related)).toBe(true);
  });

  it('filters services by category and search term', async () => {
    const byCategory = await request(app).get('/api/public/services?category=skin');
    expect(byCategory.status).toBe(200);
    expect(byCategory.body.data.items).toHaveLength(1);

    const bySearch = await request(app).get('/api/public/services?q=led');
    expect(bySearch.body.data.items).toHaveLength(1);

    const empty = await request(app).get('/api/public/services?q=nonexistent');
    expect(empty.body.data.items).toHaveLength(0);
    expect(empty.body.data.isDemo).toBe(true);
  });

  it('returns 404 for an unknown service', async () => {
    const response = await request(app).get('/api/public/services/missing-service');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
  });

  it('does not expose an unpublished treatment by slug', async () => {
    await request(app)
      .post('/api/admin/services')
      .set(bearer(token))
      .send({
        ...published,
        slug: 'draft-treatment',
        name: 'Draft Treatment',
        isFeatured: false,
        publishedAt: null,
      });

    const response = await request(app).get('/api/public/services/draft-treatment');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
  });

  it('never exposes admin-only fields', async () => {
    const response = await request(app).get('/api/public/services/led-therapy');
    const serialized = JSON.stringify(response.body);

    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('isArchived');
  });

  it('returns published gallery items with their categories', async () => {
    const response = await request(app).get('/api/public/gallery');

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({
      title: 'Treatment room',
      variant: 'drape',
    });
    expect(response.body.data.categories).toContain('clinic');
  });

  it('returns published testimonials and team members', async () => {
    const testimonials = await request(app).get('/api/public/testimonials');
    expect(testimonials.status).toBe(200);
    expect(testimonials.body.data.items[0]).toMatchObject({ name: 'A Client' });

    const team = await request(app).get('/api/public/team');
    expect(team.status).toBe(200);
    expect(team.body.data.items[0]).toMatchObject({ designation: 'Aesthetic Practitioner' });
  });

  it('returns published faqs', async () => {
    const response = await request(app).get('/api/public/faqs');

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({
      question: 'Do I need a consultation?',
    });
  });
});
