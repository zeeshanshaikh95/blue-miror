import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '@/lib/api-client';

import { changePassword } from '../api';
import { useAdminAuth } from '../auth-context';
import { AdminButton, Alert, Field, PageHeader, Panel, TextInput } from '../components/AdminUI';
import { useToast } from '../toast';

const minimumLength = 12;

export function AccountPage() {
  const { admin, signOut } = useAdminAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: async (result) => {
      push({
        title: 'Password changed',
        description: `${result.sessionsRevoked} session${result.sessionsRevoked === 1 ? '' : 's'} signed out. Please sign in again.`,
        tone: 'success',
      });
      await signOut();
      navigate('/admin/login', { replace: true });
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The password could not be changed. Please try again.',
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < minimumLength) {
      setError(`Use at least ${minimumLength} characters for the new password.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Choose a password that differs from the current one.');
      return;
    }

    save.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Your admin account"
        description="Change the password used to sign in. Every other session is signed out immediately."
      />

      <Panel title="Account" description="Details stored for this admin account.">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[0.625rem] tracking-[0.16em] text-brand-muted uppercase">Email</dt>
            <dd className="mt-1 text-brand-indigo">{admin?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[0.625rem] tracking-[0.16em] text-brand-muted uppercase">Role</dt>
            <dd className="mt-1 text-brand-indigo">{admin?.role ?? '—'}</dd>
          </div>
        </dl>
      </Panel>

      <Panel
        title="Change password"
        description={`At least ${minimumLength} characters. Your current password is required.`}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Current password" htmlFor="account-current" required>
              <TextInput
                id="account-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </Field>
            <Field label="New password" htmlFor="account-new" required>
              <TextInput
                id="account-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </Field>
            <Field label="Confirm new password" htmlFor="account-confirm" required>
              <TextInput
                id="account-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </Field>
          </div>

          <AdminButton type="submit" busy={save.isPending}>
            Change password and sign out
          </AdminButton>
        </form>
      </Panel>
    </div>
  );
}
