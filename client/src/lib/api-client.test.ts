import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_BASE_URL, getHealth } from './api-client';

describe('getHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the health endpoint and returns a validated response', async () => {
    const payload = {
      status: 'ok' as const,
      checks: { database: 'up' as const },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(getHealth()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/health`,
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      }),
    );
  });

  it('rejects an unexpected health payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'unknown' }),
      }),
    );

    await expect(getHealth()).rejects.toThrow();
  });
});
