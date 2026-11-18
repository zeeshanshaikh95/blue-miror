import type { AdminSession } from './types';

/**
 * Admin sessions live in `sessionStorage`, never `localStorage`.
 *
 * The backend issues a short-lived bearer token (default 60 minutes) and has no
 * cookie/refresh flow, so the token has to be readable by this client. Scoping it
 * to the tab's session keeps it out of persistent storage and clears it when the
 * browser session ends. The server remains the only authority: every request is
 * re-authorized against the session store, and a revoked token fails with 401.
 */
export const ADMIN_SESSION_KEY = 'blue-miror:admin-session';

export function readSession(): AdminSession | null {
  try {
    const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AdminSession>;

    if (
      typeof parsed.token !== 'string' ||
      !parsed.token ||
      typeof parsed.expiresAt !== 'string' ||
      !parsed.admin ||
      typeof parsed.admin.email !== 'string'
    ) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    if (Number.isNaN(Date.parse(parsed.expiresAt)) || Date.parse(parsed.expiresAt) <= Date.now()) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return parsed as AdminSession;
  } catch {
    return null;
  }
}

export function writeSession(session: AdminSession): void {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getSessionToken(): string | null {
  return readSession()?.token ?? null;
}
