import { AlertCircle } from 'lucide-react';

import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'We could not load this content',
  message = 'Please try again. If the problem continues, the clinic will be able to help directly.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border border-brand-line bg-brand-porcelain px-6 py-10 text-center sm:px-10"
    >
      <AlertCircle
        aria-hidden="true"
        className="mx-auto text-brand-gold-deep"
        size={28}
        strokeWidth={1.25}
      />
      <h3 className="mt-4 font-display text-2xl text-brand-indigo">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brand-muted">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="secondary" className="mt-6">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
