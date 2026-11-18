import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';

import {
  startTestServer,
  seedAdmin,
  testAdminEmail,
  testAdminPassword,
} from '../test-bootstrap-mongo.js';
import { resetLoginThrottleState } from '../../src/middleware/login-throttle.middleware.js';

// vitest.config.ts sets: MAX_ATTEMPTS=3, IP_MAX=10, LOCKOUT=1s.
const maxAttempts = 3;
const lockoutMs = 1000;

function login(app: Express, email: string, password: string) {
  return request(app).post('/api/admin/login').send({ email, password });
}

async function exhaustAttempts(app: Express, email: string): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await login(app, email, 'definitely-the-wrong-password');
  }
}

describe('admin login throttling', () => {
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

  beforeEach(() => {
    resetLoginThrottleState();
  });

  it('limits repeated failed attempts for an account', async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await login(app, testAdminEmail, 'wrong-password');
      statuses.push(response.status);
    }

    expect(statuses).toEqual(Array(maxAttempts).fill(401));

    const limited = await login(app, testAdminEmail, 'wrong-password');
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMITED',
        message: 'Too many sign-in attempts. Please wait and try again.',
      },
    });
  });

  it('returns a cooldown hint without leaking internal state', async () => {
    await exhaustAttempts(app, testAdminEmail);

    const limited = await login(app, testAdminEmail, 'wrong-password');

    expect(limited.status).toBe(429);
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
    const serialized = JSON.stringify(limited.body);
    expect(serialized).not.toContain('bucket');
    expect(serialized).not.toContain('lockout');
    expect(serialized).not.toContain(testAdminEmail);
  });

  it('blocks even a correct password while the lockout is active', async () => {
    await exhaustAttempts(app, testAdminEmail);

    const response = await login(app, testAdminEmail, testAdminPassword);

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('AUTH_RATE_LIMITED');
  });

  it('resets the failure counter after a successful sign-in', async () => {
    await login(app, testAdminEmail, 'wrong-password');
    await login(app, testAdminEmail, 'wrong-password');

    const success = await login(app, testAdminEmail, testAdminPassword);
    expect(success.status).toBe(200);

    // A reset means the next two failures must still be ordinary 401s.
    const firstAfterReset = await login(app, testAdminEmail, 'wrong-password');
    const secondAfterReset = await login(app, testAdminEmail, 'wrong-password');

    expect(firstAfterReset.status).toBe(401);
    expect(secondAfterReset.status).toBe(401);

    // ...and the correct password is still accepted.
    await expect(login(app, testAdminEmail, testAdminPassword)).resolves.toMatchObject({
      status: 200,
    });
  });

  it('allows a legitimate sign-in after the cooldown expires', async () => {
    await exhaustAttempts(app, testAdminEmail);
    expect((await login(app, testAdminEmail, testAdminPassword)).status).toBe(429);

    await new Promise((resolve) => setTimeout(resolve, lockoutMs + 250));

    const afterCooldown = await login(app, testAdminEmail, testAdminPassword);

    expect(afterCooldown.status).toBe(200);
    expect(typeof afterCooldown.body.data.token).toBe('string');
  });

  it('does not leak whether an account exists', async () => {
    const unknown = await login(app, 'nobody@bluemirror.io', 'some-password');
    const wrongPassword = await login(app, testAdminEmail, 'some-password');

    expect(unknown.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    // Bodies differ only by the per-request tracing id.
    expect(unknown.body.error).toEqual(wrongPassword.body.error);
    expect(unknown.body.error.code).toBe('ADMIN_INVALID_CREDENTIALS');
    expect(JSON.stringify(unknown.body.error)).not.toMatch(/unknown|not found|no such/i);
  });

  it('rejects malformed payloads without consuming an attempt', async () => {
    for (let attempt = 0; attempt < maxAttempts + 2; attempt += 1) {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'not-an-email', password: '' });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }

    const valid = await login(app, testAdminEmail, testAdminPassword);
    expect(valid.status).toBe(200);
  });

  it('does not rate-limit public website endpoints', async () => {
    await exhaustAttempts(app, testAdminEmail);
    expect((await login(app, testAdminEmail, 'wrong-password')).status).toBe(429);

    const publicServices = await request(app).get('/api/public/services');
    const publicSettings = await request(app).get('/api/public/settings');
    const health = await request(app).get('/api/health');

    expect(publicServices.status).toBe(200);
    expect(publicSettings.status).toBe(200);
    expect(health.status).toBe(200);
  });
});
