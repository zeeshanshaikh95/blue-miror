import { createContext, useContext } from 'react';

import type { AdminUser } from './types';

export type AdminAuthState = {
  status: 'loading' | 'authenticated' | 'anonymous';
  admin: AdminUser | null;
  expiresAt: string | null;
  reason: 'expired' | 'revoked' | 'signed-out' | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider.');
  }

  return context;
}
