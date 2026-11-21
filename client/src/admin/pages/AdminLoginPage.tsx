import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';

import { ApiError } from '@/lib/api-client';

import { ADMIN_IDLE_TIMEOUT_MINUTES, useAdminAuth } from '../auth-context';
import { AdminButton, Alert, Field, TextInput } from '../components/AdminUI';

type FieldErrors = { email?: string; password?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminLoginPage() {
  const { status, reason, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/admin" replace />;
  }

  const redirectTo = (location.state as { from?: string } | null)?.from?.startsWith('/admin')
    ? (location.state as { from: string }).from
    : '/admin';

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!email.trim()) {
      next.email = 'Enter the admin email address.';
    } else if (!emailPattern.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (!password) {
      next.password = 'Enter your password.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      await signIn(email.trim().toLowerCase(), password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          setFormError('Too many sign-in attempts. Please wait a few minutes and try again.');
        } else if (error.status === 401) {
          setFormError('Those credentials were not recognised.');
        } else if (error.status === 403) {
          setFormError('This account is not permitted to access the dashboard.');
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('The sign-in request could not be completed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const reasonMessage =
    reason === 'idle'
      ? `You were signed out after ${ADMIN_IDLE_TIMEOUT_MINUTES} minutes of inactivity.`
      : reason === 'expired'
        ? 'Your session expired. Sign in again to continue.'
        : reason === 'revoked'
          ? 'Your session was signed out or is no longer valid. Sign in again to continue.'
          : reason === 'signed-out'
            ? 'You have been signed out.'
            : null;

  return (
    <div className="grid min-h-dvh bg-brand-ivory lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-indigo-deep px-12 py-12 text-brand-ivory lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(7,124,179,0.28),transparent_55%),linear-gradient(155deg,#26254B_0%,#424273_70%,#1B1A38_100%)]"
        />
        <div className="relative">
          <p className="font-display text-3xl text-brand-ivory">Blue Miror</p>
          <p className="mt-2 text-[0.625rem] tracking-[0.26em] text-brand-gold uppercase">
            Aesthetic clinic
          </p>
        </div>
        <div className="relative max-w-md">
          <div className="h-px w-12 bg-brand-gold" aria-hidden="true" />
          <h1 className="mt-6 font-display text-4xl leading-tight text-brand-ivory">
            The admin studio for a considered clinic presence.
          </h1>
          <p className="mt-4 text-sm leading-7 text-brand-ivory/70">
            Manage treatments, categories, gallery imagery, practitioner profiles, client stories,
            questions and website configuration from one place.
          </p>
        </div>
        <p className="relative text-xs leading-6 text-brand-ivory/50">
          Authorised staff only. Every action is authorised by the Blue Miror API.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <p className="font-display text-2xl text-brand-indigo">Blue Miror</p>
            <p className="mt-1 text-[0.5625rem] tracking-[0.24em] text-brand-gold-deep uppercase">
              Admin studio
            </p>
          </div>

          <div className="mt-8 lg:mt-0">
            <Lock aria-hidden="true" className="text-brand-gold-deep" size={20} strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-3xl text-brand-indigo">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Use the credentials issued by the clinic. There is no public admin registration.
            </p>
          </div>

          {reasonMessage && !formError ? (
            <div className="mt-5">
              <Alert tone="info">{reasonMessage}</Alert>
            </div>
          ) : null}

          {formError ? (
            <div className="mt-5">
              <Alert tone="error">{formError}</Alert>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <Field label="Email" htmlFor="admin-email" required error={errors.email}>
              <TextInput
                id="admin-email"
                name="email"
                autoFocus
                type="email"
                autoComplete="username"
                value={email}
                invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby={errors.email ? 'admin-email-error' : undefined}
              />
            </Field>

            <Field label="Password" htmlFor="admin-password" required error={errors.password}>
              <div className="relative">
                <TextInput
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  invalid={Boolean(errors.password)}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-describedby={errors.password ? 'admin-password-error' : undefined}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-muted hover:text-brand-indigo"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={16} />
                  ) : (
                    <Eye aria-hidden="true" size={16} />
                  )}
                </button>
              </div>
            </Field>

            <AdminButton type="submit" busy={submitting} className="w-full">
              {submitting ? 'Signing in' : 'Sign in'}
            </AdminButton>
          </form>

          <p className="mt-6 text-xs leading-6 text-brand-muted">
            <Link
              to="/"
              className="text-brand-indigo underline underline-offset-4 hover:text-brand-gold-deep"
            >
              Return to the public website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
