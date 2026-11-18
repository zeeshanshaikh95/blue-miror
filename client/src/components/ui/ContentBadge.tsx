import { cn } from '@/utils/cn';

type ContentBadgeProps = {
  children?: string;
  className?: string;
};

export function ContentBadge({ children = 'Sample content', className }: ContentBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center border border-brand-gold/60 bg-brand-gold/10 px-2 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand-gold-800',
        className,
      )}
    >
      {children}
    </span>
  );
}
