import { defineConfig } from 'vitest/config';

const testJwtSecret = 'test-only-jwt-secret-that-is-long-enough-for-validation-000000000000';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    clearMocks: true,
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000,
    env: {
      NODE_ENV: 'test',
      PORT: '4001',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/blue-miror-test',
      JWT_SECRET: testJwtSecret,
      JWT_ISSUER: 'blue-miror-api',
      JWT_AUDIENCE: 'blue-miror-admin',
      CORS_ORIGINS: 'http://localhost:5173,http://localhost:4173',
      ADMIN_BOOTSTRAP_SECRET: 'test-only-bootstrap-secret-that-is-long-enough',
      ADMIN_LOGIN_MAX_ATTEMPTS: '3',
      ADMIN_LOGIN_IP_MAX_ATTEMPTS: '10',
      ADMIN_LOGIN_WINDOW_SECONDS: '900',
      ADMIN_LOGIN_LOCKOUT_SECONDS: '1',
      ADMIN_SESSION_TTL_MINUTES: '60',
      LOG_LEVEL: 'silent',
      TRUST_PROXY: '0',
    },
  },
});
