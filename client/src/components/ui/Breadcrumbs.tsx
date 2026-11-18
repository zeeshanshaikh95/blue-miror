import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-[0.625rem] tracking-[0.14em] text-brand-muted uppercase">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <ChevronRight aria-hidden="true" size={12} /> : null}
              {item.to && !current ? (
                <Link to={item.to} className="transition-colors hover:text-brand-gold-deep">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? 'page' : undefined} className="text-brand-indigo">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
