import { describe, expect, it } from 'vitest';

import { createEnv } from '../src/config/env.js';

const productionEnv = {
  NODE_ENV: 'production',
  PORT: '4000',
  MONGODB_URI: 'mongodb+srv://cluster0.mongodb.net/blue-miror',
  JWT_SECRET: 'a'.repeat(64),
  JWT_ISSUER: 'blue-miror-api',
  JWT_AUDIENCE: 'blue-miror-admin',
  CORS_ORIGINS: 'https://www.blue-miror.test',
  CLOUDINARY_CLOUD_NAME: 'blue-miror-cloud',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: 'cloudinary-secret-value',
  CLOUDINARY_FOLDER_PREFIX: 'blue-miror',
  ADMIN_BOOTSTRAP_SECRET: 'b'.repeat(48),
  LOG_LEVEL: 'info',
  TRUST_PROXY: '1',
  REQUEST_BODY_LIMIT: '100kb',
};

describe('environment validation', () => {
  it('accepts a complete production configuration', () => {
    const parsed = createEnv(productionEnv);

    expect(parsed.NODE_ENV).toBe('production');
    expect(parsed.IS_PRODUCTION).toBe(true);
    expect(parsed.IS_CLOUDINARY_CONFIGURED).toBe(true);
    expect(parsed.TRUST_PROXY).toBe(true);
    expect(parsed.CORS_ORIGINS).toEqual(['https://www.blue-miror.test']);
  });

  it('rejects a short production JWT secret', () => {
    expect(() => createEnv({ ...productionEnv, JWT_SECRET: 'short-secret' })).toThrow(
      /JWT_SECRET must be at least 64/,
    );
  });

  it('rejects placeholder secrets without echoing them', () => {
    const placeholderSecret = `${'replace-me-'.repeat(8)}`;

    let message = '';
    try {
      createEnv({ ...productionEnv, JWT_SECRET: placeholderSecret });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toMatch(/placeholder/);
    expect(message).not.toContain(placeholderSecret);
  });

  it('requires all Cloudinary values in production', () => {
    expect(() =>
      createEnv({
        ...productionEnv,
        CLOUDINARY_CLOUD_NAME: '',
        CLOUDINARY_API_KEY: '',
        CLOUDINARY_API_SECRET: '',
      }),
    ).toThrow(/CLOUDINARY_CLOUD_NAME is required/);
  });

  it('rejects wildcard CORS origins', () => {
    expect(() => createEnv({ ...productionEnv, CORS_ORIGINS: '*' })).toThrow(/wildcard/);
  });

  it('rejects localhost MongoDB in production', () => {
    expect(() =>
      createEnv({
        ...productionEnv,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/blue-miror',
      }),
    ).toThrow(/must not point to localhost/);
  });

  it('applies safe defaults for admin login protection and session lifetime', () => {
    const parsed = createEnv(productionEnv);

    expect(parsed.ADMIN_LOGIN_MAX_ATTEMPTS).toBe(5);
    expect(parsed.ADMIN_LOGIN_IP_MAX_ATTEMPTS).toBe(20);
    expect(parsed.ADMIN_LOGIN_WINDOW_SECONDS).toBe(900);
    expect(parsed.ADMIN_LOGIN_LOCKOUT_SECONDS).toBe(900);
    expect(parsed.ADMIN_SESSION_TTL_MINUTES).toBe(60);
  });

  it('rejects invalid admin login protection values', () => {
    expect(() => createEnv({ ...productionEnv, ADMIN_LOGIN_MAX_ATTEMPTS: '0' })).toThrow(
      /ADMIN_LOGIN_MAX_ATTEMPTS/,
    );
    expect(() => createEnv({ ...productionEnv, ADMIN_SESSION_TTL_MINUTES: '5000' })).toThrow(
      /ADMIN_SESSION_TTL_MINUTES/,
    );
  });

  it('allows Cloudinary to be unconfigured in development', () => {
    const parsed = createEnv({
      ...productionEnv,
      NODE_ENV: 'development',
      JWT_SECRET: 'c'.repeat(32),
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      CORS_ORIGINS: 'http://localhost:5173',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/blue-miror',
      ADMIN_BOOTSTRAP_SECRET: '',
    });

    expect(parsed.IS_PRODUCTION).toBe(false);
    expect(parsed.IS_CLOUDINARY_CONFIGURED).toBe(false);
    expect(parsed.CORS_ORIGINS).toEqual(['http://localhost:5173']);
  });
});
