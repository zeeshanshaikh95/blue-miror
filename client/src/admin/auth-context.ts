import { createContext, useContext } from 'react';

import type { AdminUser } from './types';

/** Inactivity window after which the dashboard signs itself out. */
export const ADMIN_IDLE_TIMEOUT_MINUTES = 20;

export type AdminSignOutReason = 'expired' | 'revoked' | 'signed-out' | 'idle';

export type AdminAuthState = {
  status: 'loading' | 'authenticated' | 'anonymous';
  admin: AdminUser | null;
  expiresAt: string | null;
  reason: AdminSignOutReason | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (reason?: Extract<AdminSignOutReason, 'signed-out' | 'idle'>) => Promise<void>;
};

export const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider.');
  }

  return context;
}
