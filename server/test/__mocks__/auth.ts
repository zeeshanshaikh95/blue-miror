import { vi } from 'vitest';

const mockAuth = {
  authenticateAdmin: vi.fn(async (email: string, password: string) => {
    if (email === 'admin@example.com' && password === 'password') {
      return {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'superadmin',
      };
    }
    throw new Error('Invalid credentials');
  }),

  createAdminSession: vi.fn(async (admin: { id: string; role: string }) => {
    return `mock-jwt-token-${admin.id}`;
  }),

  parseAdminSession: vi.fn(async (token: string) => {
    if (token.startsWith('mock-jwt-token-')) {
      const id = token.slice('mock-jwt-token-'.length);
      return { id, role: 'superadmin' };
    }
    throw new Error('Invalid token');
  }),

  getAuthenticatedAdmin: vi.fn(async (payload: { id: string; role: string }) => {
    return {
      id: payload.id,
      email: 'admin@example.com',
      name: 'Admin',
      role: payload.role as 'superadmin',
    };
  }),

  createDefaultAdminPassword: vi.fn(async (password: string) => {
    if (password.length === 0) {
      throw new Error('PASSWORD_MISSING');
    }
    if (password.length > 72) {
      throw new Error('PASSWORD_TOO_LONG');
    }
    return `mock-hash-${password}`;
  }),
};

export default mockAuth;
export { vi };
