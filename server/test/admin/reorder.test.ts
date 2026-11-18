import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import {
  startTestServer,
  resetDatabase,
  seedAdmin,
  loginAsAdmin,
  bearer,
} from '../test-bootstrap-mongo.js';
import { Category, Service } from '../../src/models/index.js';

let app: Express;
let stop: () => Promise<void>;
let token: string;

const serviceBase = {
  shortDescription: 'A sample description used only by the test suite.',
  description: ['Sample paragraph.'],
  steps: ['Sample step.'],
  benefits: ['Sample benefit.'],
  considerations: ['Sample consideration.'],
  faqs: [{ question: 'Sample question?', answer: 'Sample answer.' }],
};

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

describe('admin ordering endpoints', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .patch('/api/admin/services/reorder')
      .send({ ids: ['000000000000000000000001'] });

    expect(response.status).toBe(401);
  });

  it('rejects a reorder payload that is not a list of ids', async () => {
    const response = await request(app)
      .patch('/api/admin/services/reorder')
      .set(bearer(token))
      .send({ ids: ['not-an-object-id'] });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('SERVICE_REORDER_INVALID');
  });

  it('stores the supplied service order and returns it sorted', async () => {
    const first = await Service.create({
      ...serviceBase,
      slug: 'first-service',
      name: 'First service',
      category: 'consultations',
    });
    const second = await Service.create({
      ...serviceBase,
      slug: 'second-service',
      name: 'Second service',
      category: 'consultations',
    });

    const response = await request(app)
      .patch('/api/admin/services/reorder')
      .set(bearer(token))
      .send({ ids: [second._id.toString(), first._id.toString()] });

    expect(response.status).toBe(200);

    const stored = await Service.find({ isArchived: false }).sort({ order: 1 }).lean();
    expect(stored.map((item) => item.slug)).toEqual(['second-service', 'first-service']);

    const list = await request(app).get('/api/admin/services').set(bearer(token));
    expect(list.body.data.items.map((item: { slug: string }) => item.slug)).toEqual([
      'second-service',
      'first-service',
    ]);
  });

  it('stores the supplied category order', async () => {
    await Category.create({ slug: 'zebra', name: 'Zebra', description: null });
    await Category.create({ slug: 'alpha', name: 'Alpha', description: null });

    const response = await request(app)
      .patch('/api/admin/categories/reorder')
      .set(bearer(token))
      .send({ slugs: ['zebra', 'alpha'] });

    expect(response.status).toBe(200);

    const list = await request(app).get('/api/admin/categories').set(bearer(token));
    expect(list.body.data.items.map((item: { slug: string }) => item.slug)).toEqual([
      'zebra',
      'alpha',
    ]);
  });

  it('keeps the category delete guard for categories still in use', async () => {
    await Category.create({ slug: 'consultations', name: 'Consultations', description: null });
    await Service.create({
      ...serviceBase,
      slug: 'in-use-service',
      name: 'In-use service',
      category: 'consultations',
    });

    const blocked = await request(app)
      .delete('/api/admin/categories/consultations')
      .set(bearer(token));

    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('CATEGORY_IN_USE');
  });
});
