import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';

import { ADMIN_UNAUTHORIZED_EVENT, adminUnauthorizedEvent, listServices, login } from './api';
import { ADMIN_SESSION_KEY, clearSession, readSession, writeSession } from './session';
import { adminCredentials, mockAdminApi } from './test/admin-api-mock';

describe('admin session storage', () => {
  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('stores sessions in sessionStorage rather than localStorage', () => {
    writeSession({
      token: 'token-value',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      admin: { id: '1', email: 'admin@bluemirror.io', name: 'Admin', role: 'superadmin' },
    });

    expect(window.sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
    expect(readSession()?.token).toBe('token-value');
  });

  it('ignores an expired stored session', () => {
    writeSession({
      token: 'token-value',
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      admin: { id: '1', email: 'admin@bluemirror.io', name: 'Admin', role: 'superadmin' },
    });

    expect(readSession()).toBeNull();
    expect(window.sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });
});

describe('admin api client', () => {
  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('sends the bearer token on authenticated requests', async () => {
    const { fetchMock } = mockAdminApi();
    const session = await login(adminCredentials.email, adminCredentials.password);
    writeSession(session);

    await listServices({ page: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/services?page=1'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-session-token' }),
      }),
    );
  });

  it('clears the stored session and broadcasts when the server rejects it', async () => {
    mockAdminApi({ unauthorized: true });
    const session = await login(adminCredentials.email, adminCredentials.password);
    writeSession(session);

    const listener = vi.fn();
    adminUnauthorizedEvent.addEventListener(ADMIN_UNAUTHORIZED_EVENT, listener);

    await expect(listServices()).rejects.toBeInstanceOf(ApiError);
    expect(window.sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    adminUnauthorizedEvent.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, listener);
  });

  it('surfaces the server error code for invalid credentials', async () => {
    mockAdminApi();

    await expect(login('admin@bluemirror.io', 'wrong')).rejects.toMatchObject({
      status: 401,
      code: 'ADMIN_INVALID_CREDENTIALS',
    });
  });
});
