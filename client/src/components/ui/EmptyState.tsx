import type { ReactNode } from 'react';

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ eyebrow, title, children, action }: EmptyStateProps) {
  return (
    <div className="border border-brand-line bg-brand-porcelain px-6 py-12 text-center sm:px-12 sm:py-16">
      <div className="mx-auto h-px w-10 bg-brand-gold" aria-hidden="true" />
      {eyebrow ? (
        <p className="mt-6 text-[0.625rem] font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-3 font-display text-3xl leading-tight text-brand-indigo">{title}</h3>
      <div className="mx-auto mt-4 max-w-lg text-sm leading-7 text-brand-muted">{children}</div>
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}
