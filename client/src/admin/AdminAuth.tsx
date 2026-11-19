import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AdminAuthContext, useAdminAuth, type AdminAuthState } from './auth-context';
import { adminUnauthorizedEvent, ADMIN_UNAUTHORIZED_EVENT, login, logout } from './api';
import { AdminThemeProvider } from './theme';
import { clearSession, readSession, writeSession } from './session';
import { Spinner } from './components/AdminUI';

type InternalState = {
  status: AdminAuthState['status'];
  admin: AdminAuthState['admin'];
  expiresAt: string | null;
  reason: AdminAuthState['reason'];
};

function initialState(): InternalState {
  const session = readSession();

  if (!session) {
    return { status: 'anonymous', admin: null, expiresAt: null, reason: null };
  }

  return {
    status: 'authenticated',
    admin: session.admin,
    expiresAt: session.expiresAt,
    reason: null,
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(initialState);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await login(email, password);
    writeSession(session);
    setState({
      status: 'authenticated',
      admin: session.admin,
      expiresAt: session.expiresAt,
      reason: null,
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // A local sign-out must succeed even when the API call fails.
    }

    clearSession();
    setState({ status: 'anonymous', admin: null, expiresAt: null, reason: 'signed-out' });
  }, []);

  // Expire the local session exactly when the server-issued token does.
  useEffect(() => {
    if (state.status !== 'authenticated' || !state.expiresAt) return;

    // Already-expired tokens are rejected by readSession() at mount, so this
    // only needs to schedule the transition, never set state synchronously.
    const remaining = Math.max(0, Date.parse(state.expiresAt) - Date.now());

    const timer = window.setTimeout(() => {
      clearSession();
      setState({ status: 'anonymous', admin: null, expiresAt: null, reason: 'expired' });
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [state.status, state.expiresAt]);

  // The API layer clears storage on 401; mirror that in React state.
  useEffect(() => {
    const onUnauthorized = () => {
      setState({ status: 'anonymous', admin: null, expiresAt: null, reason: 'revoked' });
    };

    adminUnauthorizedEvent.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      adminUnauthorizedEvent.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      status: state.status,
      admin: state.admin,
      expiresAt: state.expiresAt,
      reason: state.reason,
      signIn,
      signOut,
    }),
    [state, signIn, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

/** Route element that scopes the auth provider to /admin only. */
export function AdminAuthBoundary() {
  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <Outlet />
      </AdminAuthProvider>
    </AdminThemeProvider>
  );
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brand-ivory">
        <Spinner label="Checking your session" />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
