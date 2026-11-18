import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { startTestServer } from '../test-bootstrap-mongo.js';
import { Admin } from '../../src/models/index.js';
import {
  createAdminPasswordHash,
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '../../src/lib/index.js';

describe('password hashing and session tokens', () => {
  let stop: () => Promise<void>;

  beforeAll(async () => {
    const server = await startTestServer();
    stop = server.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it('produces an Argon2id digest that never contains the plain text', async () => {
    const hash = await createAdminPasswordHash('Correct-Horse-9');

    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('Correct-Horse-9');
  });

  it('produces a different digest for the same password (unique salt)', async () => {
    const first = await createAdminPasswordHash('Correct-Horse-9');
    const second = await createAdminPasswordHash('Correct-Horse-9');

    expect(first).not.toBe(second);
  });

  it('verifies the correct password', async () => {
    const hash = await createAdminPasswordHash('Correct-Horse-9');

    await expect(verifyAdminPassword('Correct-Horse-9', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await createAdminPasswordHash('Correct-Horse-9');

    await expect(verifyAdminPassword('Wrong-Horse-9', hash)).resolves.toBe(false);
  });

  it('returns false for an empty or malformed digest instead of throwing', async () => {
    await expect(verifyAdminPassword('anything', '')).resolves.toBe(false);
    await expect(verifyAdminPassword('anything', 'not-a-digest')).resolves.toBe(false);
    await expect(verifyAdminPassword('', '$argon2id$v=19$m=65536,t=3,p=1$abc$def')).resolves.toBe(
      false,
    );
  });

  it('enforces password length and presence rules', async () => {
    await expect(createAdminPasswordHash('')).rejects.toThrow('A password is required');
    await expect(createAdminPasswordHash('a'.repeat(73))).rejects.toThrow(
      'Password must be 72 characters or fewer',
    );
  });

  it('refuses duplicate admin emails at the database level', async () => {
    const passwordHash = await createAdminPasswordHash('Duplicate-Check-1');

    await Admin.create({
      email: 'duplicate@bluemirror.io',
      passwordHash,
      role: 'superadmin',
      passwordUpdatedAt: new Date(),
      isActive: true,
    });

    await expect(
      Admin.create({
        email: 'duplicate@bluemirror.io',
        passwordHash,
        role: 'superadmin',
        passwordUpdatedAt: new Date(),
        isActive: true,
      }),
    ).rejects.toThrow();
  });

  it('round-trips a session token with the expected claims', async () => {
    const token = await createAdminSessionToken({
      id: '507f1f77bcf86cd799439011',
      email: 'admin@bluemirror.io',
      name: 'Blue Miror Admin',
      role: 'superadmin',
    });

    const payload = await verifyAdminSessionToken(token);

    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
    expect(payload.role).toBe('superadmin');
    expect(payload.email).toBe('admin@bluemirror.io');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('rejects a token whose payload was altered', async () => {
    const token = await createAdminSessionToken({
      id: '507f1f77bcf86cd799439011',
      email: 'admin@bluemirror.io',
      name: 'Blue Miror Admin',
      role: 'superadmin',
    });

    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'someone-else', role: 'superadmin', iss: 'blue-miror-api' }),
    ).toString('base64url');

    await expect(
      verifyAdminSessionToken(`${header}.${forgedPayload}.${signature}`),
    ).rejects.toThrow();
  });
});
