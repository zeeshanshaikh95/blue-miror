import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import {
  startTestServer,
  resetDatabase,
  seedAdmin,
  loginAsAdmin,
  bearer,
  testAdminEmail,
  testAdminPassword,
} from '../test-bootstrap-mongo.js';

const newPassword = 'FreshPassphrase-2026';

let app: Express;
let stop: () => Promise<void>;
let token: string;

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

describe('PATCH /api/admin/password', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .patch('/api/admin/password')
      .send({ currentPassword: testAdminPassword, newPassword });

    expect(response.status).toBe(401);
  });

  it('rejects a wrong current password without changing anything', async () => {
    const response = await request(app)
      .patch('/api/admin/password')
      .set(bearer(token))
      .send({ currentPassword: 'not-the-current-password', newPassword });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('PASSWORD_CURRENT_INVALID');

    const login = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: testAdminPassword });
    expect(login.status).toBe(200);
  });

  it('rejects weak or unchanged new passwords', async () => {
    const tooShort = await request(app)
      .patch('/api/admin/password')
      .set(bearer(token))
      .send({ currentPassword: testAdminPassword, newPassword: 'short' });
    expect(tooShort.status).toBe(422);
    expect(tooShort.body.error.code).toBe('VALIDATION_ERROR');

    const unchanged = await request(app)
      .patch('/api/admin/password')
      .set(bearer(token))
      .send({ currentPassword: testAdminPassword, newPassword: testAdminPassword });
    expect(unchanged.status).toBe(422);
    expect(unchanged.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('changes the password, revokes sessions and accepts the new credential', async () => {
    const changed = await request(app)
      .patch('/api/admin/password')
      .set(bearer(token))
      .send({ currentPassword: testAdminPassword, newPassword });

    expect(changed.status).toBe(200);
    expect(changed.body.data.changed).toBe(true);

    // The token used for the change is revoked along with every other session.
    const reused = await request(app).get('/api/admin/services').set(bearer(token));
    expect(reused.status).toBe(401);

    const oldLogin = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: testAdminPassword });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/admin/login')
      .send({ email: testAdminEmail, password: newPassword });
    expect(newLogin.status).toBe(200);
    expect(typeof newLogin.body.data.token).toBe('string');
  });
});
