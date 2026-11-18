import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';

import {
  startTestServer,
  seedAdmin,
  testAdminEmail,
  testAdminPassword,
  bearer,
} from '../test-bootstrap-mongo.js';
import { createAdminSessionToken } from '../../src/lib/auth.js';

describe('admin authentication', () => {
  let app: Express;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    const server = await startTestServer();
    app = server.app;
    stop = server.stop;
    await seedAdmin();
  });

  afterAll(async () => {
    await stop();
  });

  it('accepts valid credentials and returns a session token', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: testAdminPassword });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.token.split('.')).toHaveLength(3);
    expect(response.body.data.admin).toMatchObject({
      email: testAdminEmail,
      role: 'superadmin',
    });
    expect(response.body.data.admin).not.toHaveProperty('passwordHash');
  });

  it('rejects an invalid password with a generic message', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: 'definitely-wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_INVALID_CREDENTIALS' },
    });
  });

  it('rejects an unknown email with the same generic error', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: 'nobody@bluemirror.io', password: 'some-password' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('ADMIN_INVALID_CREDENTIALS');
  });

  it('rejects a malformed login payload', async () => {
    const response = await request(app).post('/api/admin/login').send({ email: 'not-an-email' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects protected routes without a bearer token', async () => {
    const response = await request(app).get('/api/admin/services');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('allows protected routes with a valid token', async () => {
    const login = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: testAdminPassword });

    const response = await request(app)
      .get('/api/admin/services')
      .set(bearer(login.body.data.token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('rejects an expired token', async () => {
    const login = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: testAdminPassword });

    const admin = login.body.data.admin;
    const expiredToken = await createAdminSessionToken(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      new Date(Date.now() - 2 * 60 * 60 * 1000),
    );

    const response = await request(app).get('/api/admin/services').set(bearer(expiredToken));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_INVALID');
  });

  it('rejects a tampered token', async () => {
    const login = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: testAdminPassword });

    const token = login.body.data.token as string;
    const tampered = `${token.slice(0, -4)}beef`;

    const response = await request(app).get('/api/admin/services').set(bearer(tampered));

    expect(response.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const response = await request(app)
      .get('/api/admin/services')
      .set(bearer('eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXJhZG1pbiJ9.invalid'));

    expect(response.status).toBe(401);
  });
});
