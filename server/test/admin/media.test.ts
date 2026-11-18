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

let app: Express;
let stop: () => Promise<void>;
let token: string;

/** Smallest byte sequences that still pass the server's signature checks. */
const pngBytes = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const jpegBytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);

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

beforeEach(async () => {
  await resetDatabase();
  await seedAdmin();
  token = await loginAsAdmin(app);
});

describe('admin media uploads', () => {
  it('requires an authenticated admin', async () => {
    const response = await request(app)
      .post('/api/admin/uploads')
      .attach('file', pngBytes, { filename: 'photo.png', contentType: 'image/png' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('rejects a request without a file', async () => {
    const response = await request(app)
      .post('/api/admin/uploads')
      .set(bearer(token))
      .field('folder', 'gallery');

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('MEDIA_FILE_REQUIRED');
  });

  it('rejects a file whose bytes are not an allowed image', async () => {
    const response = await request(app)
      .post('/api/admin/uploads')
      .set(bearer(token))
      .field('folder', 'gallery')
      .attach('file', Buffer.from('<svg onload="alert(1)"></svg>'), {
        filename: 'logo.svg',
        contentType: 'image/svg+xml',
      });

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('MEDIA_TYPE_UNSUPPORTED');
  });

  it('rejects an unknown folder before touching Cloudinary', async () => {
    const response = await request(app)
      .post('/api/admin/uploads')
      .set(bearer(token))
      .field('folder', 'somewhere-else')
      .attach('file', jpegBytes, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('MEDIA_FOLDER_INVALID');
  });

  it('reports uploads as unavailable when Cloudinary is not configured', async () => {
    const response = await request(app)
      .post('/api/admin/uploads')
      .set(bearer(token))
      .field('folder', 'services')
      .attach('file', pngBytes, { filename: 'photo.png', contentType: 'image/png' });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('MEDIA_UNAVAILABLE');
  });

  it('refuses to delete an asset outside the project folder', async () => {
    const response = await request(app)
      .delete('/api/admin/uploads')
      .set(bearer(token))
      .send({ publicId: 'glow-by-parveen/services/other-project' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('MEDIA_PUBLIC_ID_INVALID');
  });

  it('refuses a delete request without a public id', async () => {
    const response = await request(app).delete('/api/admin/uploads').set(bearer(token)).send({});

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('MEDIA_PUBLIC_ID_REQUIRED');
  });

  it('requires authentication to delete media', async () => {
    const response = await request(app)
      .delete('/api/admin/uploads')
      .send({ publicId: 'blue-miror/gallery/example' });

    expect(response.status).toBe(401);
  });
});
