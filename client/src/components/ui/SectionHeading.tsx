import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { Eyebrow } from './Eyebrow';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div className={cn(centered ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl', className)}>
      {eyebrow ? <Eyebrow tone={tone === 'light' ? 'ivory' : 'gold'}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          'mt-4 font-display text-[clamp(2.25rem,4.6vw,3.7rem)] leading-[0.98] font-normal tracking-[-0.02em]',
          tone === 'light' ? 'text-brand-ivory' : 'text-brand-indigo',
        )}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={cn(
            'mt-6 max-w-xl text-[0.95rem] leading-7 sm:text-base',
            centered && 'mx-auto',
            tone === 'light' ? 'text-brand-ivory/70' : 'text-brand-muted',
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}
