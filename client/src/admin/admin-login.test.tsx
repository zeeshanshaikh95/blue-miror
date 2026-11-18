import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';

import { ADMIN_SESSION_KEY, clearSession, writeSession } from './session';
import { adminCredentials, adminSessionExpiry, mockAdminApi } from './test/admin-api-mock';

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

async function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
}

describe('admin authentication', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    clearSession();
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated visitors to the login page', async () => {
    mockAdminApi();
    renderAt('/admin');

    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/login');
  });

  it('shows validation messages before contacting the API', async () => {
    const { fetchMock } = mockAdminApi();
    renderAt('/admin/login');

    fireEvent.click(await screen.findByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/enter the admin email address/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports invalid credentials without revealing which field failed', async () => {
    mockAdminApi();
    renderAt('/admin/login');

    await screen.findByLabelText(/^email/i);
    await fillAndSubmit(adminCredentials.email, 'not-the-password');

    expect(await screen.findByText(/credentials were not recognised/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });

  it('signs in and opens the dashboard overview', async () => {
    mockAdminApi();
    renderAt('/admin/login');

    await screen.findByLabelText(/^email/i);
    await fillAndSubmit(adminCredentials.email, adminCredentials.password);

    expect(await screen.findByRole('heading', { name: /content overview/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin');
    expect(screen.getByText(adminCredentials.email)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeTruthy();
  });

  it('keeps a signed-in administrator out of the login page', async () => {
    mockAdminApi();
    writeSession({
      token: 'test-session-token',
      expiresAt: adminSessionExpiry(),
      admin: {
        id: 'admin-1',
        email: adminCredentials.email,
        name: adminCredentials.email,
        role: 'superadmin',
      },
    });

    renderAt('/admin/login');

    expect(await screen.findByRole('heading', { name: /content overview/i })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/admin'));
  });

  it('signs out and returns to the login page', async () => {
    mockAdminApi();
    writeSession({
      token: 'test-session-token',
      expiresAt: adminSessionExpiry(),
      admin: {
        id: 'admin-1',
        email: adminCredentials.email,
        name: adminCredentials.email,
        role: 'superadmin',
      },
    });

    renderAt('/admin');
    await screen.findByRole('heading', { name: /content overview/i });

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });
});
