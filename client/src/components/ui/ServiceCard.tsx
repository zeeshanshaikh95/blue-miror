import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ServiceSummary } from '@/services/public-content';

import { BrandVisual } from './BrandVisual';
import { ContentBadge } from './ContentBadge';

type ServiceCardProps = {
  service: ServiceSummary;
};

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link
      to={`/treatments/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-brand-line bg-brand-porcelain transition-all duration-500 hover:-translate-y-1 hover:border-brand-gold/60 hover:shadow-[0_30px_60px_-34px_rgba(38,37,75,0.4)]"
    >
      <div className="relative overflow-hidden">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={`${service.name} treatment`}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <BrandVisual
            variant={service.visual}
            label={`${service.name} visual`}
            className="aspect-[4/5] w-full"
          />
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-indigo-deep/55 via-transparent to-transparent opacity-80"
        />

        <span className="absolute top-4 left-4 rounded-full border border-brand-ivory/30 bg-brand-indigo-deep/45 px-3 py-1 text-[0.55rem] font-medium tracking-[0.16em] text-brand-ivory uppercase backdrop-blur">
          {service.categoryName}
        </span>

        {service.isPlaceholder ? (
          <span className="absolute top-4 right-4">
            <ContentBadge>Sample</ContentBadge>
          </span>
        ) : null}

        <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full border border-brand-ivory/35 bg-brand-ivory/15 text-brand-ivory backdrop-blur transition-all duration-300 group-hover:border-brand-gold group-hover:bg-brand-gold group-hover:text-brand-indigo-deep">
          <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.6} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-[1.65rem] leading-[1.08] text-brand-indigo sm:text-[1.8rem]">
          {service.name}
        </h3>
        <p className="mt-2.5 line-clamp-2 flex-1 text-sm leading-6 text-brand-muted">
          {service.shortDescription}
        </p>

        {service.price ? (
          <p className="mt-4 text-[0.7rem] font-medium tracking-[0.12em] text-brand-gold-deep uppercase">
            {service.price}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
