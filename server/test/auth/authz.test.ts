import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import { SignJWT } from 'jose';

import { startTestServer, seedAdmin, bearer } from '../test-bootstrap-mongo.js';
import { Admin } from '../../src/models/index.js';
import { createAdminPasswordHash } from '../../src/lib/auth.js';
import { env } from '../../src/config/env.js';

async function forgeToken(role: string, secret: string = env.JWT_SECRET): Promise<string> {
  return new SignJWT({ role, email: 'forged@bluemirror.io', name: 'Forged' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject('000000000000000000000000')
    .setJti('forged-token-id')
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
}

describe('role-based authorization', () => {
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

  it('forbids an authenticated admin without the superadmin role', async () => {
    const password = 'Viewer-Pass-1';
    const passwordHash = await createAdminPasswordHash(password);

    // Inserted through the driver so the stricter schema enum is bypassed: the
    // point is to prove authorization comes from the stored role, not the claim.
    await Admin.collection.insertOne({
      email: 'viewer@bluemirror.io',
      passwordHash,
      role: 'viewer',
      passwordUpdatedAt: new Date(Date.now() - 60_000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const login = await request(app)
      .post('/api/admin/login')
      .send({ email: 'viewer@bluemirror.io', password });

    expect(login.status).toBe(200);

    const response = await request(app)
      .get('/api/admin/services')
      .set(bearer(login.body.data.token));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_FORBIDDEN');
  });

  it('rejects a correctly signed token that has no persisted session', async () => {
    const token = await forgeToken('superadmin');

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_INVALID');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = await forgeToken('superadmin', 'attacker-secret-that-is-long-enough-000000');

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
  });

  it('rejects a token issued for a different audience', async () => {
    const token = await new SignJWT({ role: 'superadmin' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject('000000000000000000000000')
      .setJti('forged-token-id')
      .setIssuer(env.JWT_ISSUER)
      .setAudience('some-other-audience')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(env.JWT_SECRET));

    const response = await request(app).get('/api/admin/services').set(bearer(token));

    expect(response.status).toBe(401);
  });

  it('keeps the public surface readable without a token', async () => {
    const response = await request(app).get('/api/public/services');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
