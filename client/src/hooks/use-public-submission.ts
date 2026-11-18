import { useEffect, useRef, useState } from 'react';
import type { ZodType } from 'zod';

import { ApiError } from '@/lib/api-client';
import { collectFieldErrors, zodFieldErrors, type FieldErrors } from '@/services/submissions';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Options<TValues, TResult> = {
  schema: ZodType<TValues>;
  submit: (values: TValues, meta: { company: string; formStartedAt: number }) => Promise<TResult>;
};

/**
 * Shared state machine for the public forms: client validation, server field
 * errors, a single submit at a time and an anti-spam timing stamp.
 */
export function usePublicSubmission<TValues extends Record<string, unknown>, TResult>({
  schema,
  submit,
}: Options<TValues, TResult>) {
  const startedAt = useRef(0);
  const honeypot = useRef('');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  // Stamped after mount so the server can reject implausibly fast submissions.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function handleSubmit(values: TValues) {
    if (status === 'submitting') return;

    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      setFormError('Please check the highlighted fields.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrors({});
    setFormError(null);

    try {
      const response = await submit(parsed.data, {
        company: honeypot.current,
        formStartedAt: startedAt.current,
      });
      setResult(response);
      setStatus('success');
    } catch (error) {
      const fieldErrors = collectFieldErrors(error);
      setErrors(fieldErrors);
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'The request could not be sent. Please try again.',
      );
      setStatus('error');
    }
  }

  function reset() {
    startedAt.current = Date.now();
    setStatus('idle');
    setErrors({});
    setFormError(null);
    setResult(null);
  }

  return {
    status,
    errors,
    formError,
    result,
    handleSubmit,
    reset,
    honeypotRef: honeypot,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
  };
}
