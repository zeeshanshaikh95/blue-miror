import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';

import { clearSession, getSessionToken, writeSession } from './session';
import { adminCredentials, adminSessionExpiry, mockAdminApi } from './test/admin-api-mock';

function renderAccount() {
  const mock = mockAdminApi();
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
  window.history.pushState({}, '', '/admin/account');
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  return mock;
}

function patchCalls(fetchMock: ReturnType<typeof mockAdminApi>['fetchMock']) {
  return fetchMock.mock.calls.filter(
    ([, init]) => (init as { method?: string } | undefined)?.method === 'PATCH',
  );
}

async function fillForm(current: string, next: string, confirm: string) {
  fireEvent.change(await screen.findByLabelText(/current password/i), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: next } });
  fireEvent.change(screen.getByLabelText(/confirm new password/i), {
    target: { value: confirm },
  });
}

describe('admin account password change', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    clearSession();
    vi.unstubAllGlobals();
  });

  it('rejects a password below the minimum length before calling the API', async () => {
    const { fetchMock } = renderAccount();

    await fillForm(adminCredentials.password, 'short', 'short');
    fireEvent.click(screen.getByRole('button', { name: /change password and sign out/i }));

    const messages = await screen.findAllByText(/at least 12 characters/i);
    expect(messages.length).toBeGreaterThan(0);
    expect(patchCalls(fetchMock)).toHaveLength(0);
  });

  it('rejects a confirmation that does not match', async () => {
    const { fetchMock } = renderAccount();

    await fillForm(adminCredentials.password, 'LongEnoughPassword-1', 'LongEnoughPassword-2');
    fireEvent.click(screen.getByRole('button', { name: /change password and sign out/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(patchCalls(fetchMock)).toHaveLength(0);
  });

  it('rejects reusing the current password', async () => {
    const { fetchMock } = renderAccount();

    await fillForm(adminCredentials.password, adminCredentials.password, adminCredentials.password);
    fireEvent.click(screen.getByRole('button', { name: /change password and sign out/i }));

    expect(await screen.findByText(/differs from the current one/i)).toBeInTheDocument();
    expect(patchCalls(fetchMock)).toHaveLength(0);
  });

  it('surfaces a wrong current password from the API', async () => {
    const { fetchMock } = renderAccount();

    await fillForm('not-the-current-password', 'LongEnoughPassword-1', 'LongEnoughPassword-1');
    fireEvent.click(screen.getByRole('button', { name: /change password and sign out/i }));

    expect(await screen.findByText(/current password is not correct/i)).toBeInTheDocument();
    expect(patchCalls(fetchMock)).toHaveLength(1);
    // A failed change must not sign the admin out.
    expect(getSessionToken()).toBe('test-session-token');
    expect(window.location.pathname).toBe('/admin/account');
  });

  it('changes the password, clears the session and returns to sign in', async () => {
    const { fetchMock } = renderAccount();

    await fillForm(adminCredentials.password, 'LongEnoughPassword-1', 'LongEnoughPassword-1');
    fireEvent.click(screen.getByRole('button', { name: /change password and sign out/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/admin/login'));
    expect(getSessionToken()).toBeNull();

    const [call] = patchCalls(fetchMock);
    const body = JSON.parse((call?.[1] as { body?: string }).body ?? '{}') as {
      currentPassword: string;
      newPassword: string;
    };
    expect(body.currentPassword).toBe(adminCredentials.password);
    expect(body.newPassword).toBe('LongEnoughPassword-1');

    expect(
      await screen.findByRole('heading', { name: /^sign in$/i }, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });
});
