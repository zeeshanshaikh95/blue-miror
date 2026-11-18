import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';

import { startTestServer, seedAdmin, bearer } from '../test-bootstrap-mongo.js';
import { Admin, AdminSession } from '../../src/models/index.js';
import { revokeAllSessionsForAdmin } from '../../src/services/session.service.js';

let adminCounter = 0;

async function createAdmin(prefix: string, password = 'VerifyMe123-') {
  adminCounter += 1;
  const email = `${prefix}-${adminCounter}@bluemirror.io`;
  const admin = await seedAdmin(email, password);
  return { admin, email, password };
}

async function login(app: Express, email: string, password: string): Promise<string> {
  const response = await request(app).post('/api/admin/login').send({ email, password });
  expect(response.status).toBe(200);
  return response.body.data.token as string;
}

describe('admin session lifecycle', () => {
  let app: Express;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    const server = await startTestServer();
    app = server.app;
    stop = server.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it('accepts an active, persisted session', async () => {
    const { email, password } = await createAdmin('active');
    const token = await login(app, email, password);

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(200);
  });

  it('rejects a signed token that has no session record', async () => {
    const { email, password } = await createAdmin('no-session');
    const token = await login(app, email, password);

    // Drop the backing session row, leaving a cryptographically valid token.
    await AdminSession.deleteMany({});
    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_INVALID');
  });

  it('logs out and immediately rejects the revoked token', async () => {
    const { email, password } = await createAdmin('logout');
    const token = await login(app, email, password);

    const logout = await request(app).post('/api/admin/logout').set(bearer(token));
    expect(logout.status).toBe(200);
    expect(logout.body).toEqual({ success: true, data: { revoked: true } });

    const afterLogout = await request(app).get('/api/admin/services').set(bearer(token));
    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body.error.code).toBe('SESSION_REVOKED');
  });

  it('requires authentication to log out', async () => {
    const response = await request(app).post('/api/admin/logout');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('cannot revoke another admin session through logout', async () => {
    const first = await createAdmin('first');
    const second = await createAdmin('second');

    const firstToken = await login(app, first.email, first.password);
    const secondToken = await login(app, second.email, second.password);

    const logout = await request(app).post('/api/admin/logout').set(bearer(firstToken));
    expect(logout.status).toBe(200);

    expect((await request(app).get('/api/admin/services').set(bearer(firstToken))).status).toBe(
      401,
    );

    const otherAdmin = await request(app).get('/api/admin/services').set(bearer(secondToken));
    expect(otherAdmin.status).toBe(200);
  });

  it('rejects a deactivated admin token immediately', async () => {
    const { admin, email, password } = await createAdmin('deactivated');
    const token = await login(app, email, password);

    await Admin.updateOne({ _id: admin._id }, { $set: { isActive: false } });

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_INVALID');
  });

  it('rejects a deleted admin token immediately', async () => {
    const { admin, email, password } = await createAdmin('deleted');
    const token = await login(app, email, password);

    await Admin.deleteOne({ _id: admin._id });

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_INVALID');
  });

  it('invalidates existing sessions when the password changes', async () => {
    const { admin, email, password } = await createAdmin('password-change');
    const token = await login(app, email, password);

    expect((await request(app).get('/api/admin/services').set(bearer(token))).status).toBe(200);

    // Simulate a completed password change: new hash and bumped timestamp.
    await Admin.updateOne(
      { _id: admin._id },
      { $set: { passwordUpdatedAt: new Date(Date.now() + 5_000) } },
    );

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_REVOKED');

    const sessions = await AdminSession.find({ adminId: admin._id }).lean();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);
  });

  it('rejects a session revoked outside the request path', async () => {
    const { admin, email, password } = await createAdmin('revoked');
    const token = await login(app, email, password);

    const revoked = await revokeAllSessionsForAdmin(admin._id.toString());
    expect(revoked).toBeGreaterThan(0);

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_REVOKED');
  });

  it('rejects an expired session row even while the token is still valid', async () => {
    const { admin, email, password } = await createAdmin('expired-row');
    const token = await login(app, email, password);

    await AdminSession.updateOne(
      { adminId: admin._id, revokedAt: null },
      { $set: { expiresAt: new Date(Date.now() - 1_000) } },
    );

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_EXPIRED');
  });

  it('does not revoke a session merely because a token failed verification', async () => {
    const { admin, email, password } = await createAdmin('failed-verification');
    const token = await login(app, email, password);

    await request(app).get('/api/admin/services').set(bearer('not-a-valid-token'));

    const sessions = await AdminSession.find({ adminId: admin._id }).lean();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.revokedAt).toBeNull();

    expect((await request(app).get('/api/admin/services').set(bearer(token))).status).toBe(200);
  });
});
