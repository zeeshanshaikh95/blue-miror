import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  tone?: 'gold' | 'azure' | 'ivory';
};

const toneClasses = {
  gold: 'text-brand-gold-deep',
  azure: 'text-brand-azure-deep',
  ivory: 'text-brand-gold',
};

export function Eyebrow({ children, className, tone = 'gold' }: EyebrowProps) {
  return (
    <p
      className={cn(
        'text-[0.6875rem] font-medium uppercase tracking-[0.22em]',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
