import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'light' | 'quiet';

const baseClasses =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-brand-indigo bg-brand-indigo text-brand-ivory shadow-[0_14px_30px_-18px_rgba(38,37,75,0.9)] hover:-translate-y-0.5 hover:border-brand-indigo-deep hover:bg-brand-indigo-deep',
  secondary:
    'border-brand-indigo/30 bg-transparent text-brand-indigo hover:-translate-y-0.5 hover:border-brand-indigo hover:bg-brand-porcelain',
  light:
    'border-brand-gold bg-brand-gold text-brand-indigo-deep shadow-[0_14px_34px_-16px_rgba(192,153,77,0.8)] hover:-translate-y-0.5 hover:border-brand-ivory hover:bg-brand-ivory',
  quiet:
    'border-transparent bg-transparent px-0 text-brand-indigo hover:border-brand-gold-deep hover:text-brand-gold-deep',
};

export function buttonClasses(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(baseClasses, variantClasses[variant], className);
}
