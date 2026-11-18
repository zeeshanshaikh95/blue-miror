import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'light' | 'quiet';

const baseClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 border px-6 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-brand-indigo bg-brand-indigo text-brand-ivory hover:border-brand-indigo-deep hover:bg-brand-indigo-deep',
  secondary:
    'border-brand-indigo/35 bg-transparent text-brand-indigo hover:border-brand-indigo hover:bg-brand-porcelain',
  light:
    'border-brand-gold bg-brand-gold text-brand-indigo-deep hover:border-brand-ivory hover:bg-brand-ivory',
  quiet:
    'border-transparent bg-transparent px-0 text-brand-indigo hover:border-brand-gold-deep hover:text-brand-gold-deep',
};

export function buttonClasses(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(baseClasses, variantClasses[variant], className);
}
