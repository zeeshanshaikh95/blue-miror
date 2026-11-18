import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ServiceSummary } from '@/services/public-content';

import { BrandVisual } from './BrandVisual';
import { ContentBadge } from './ContentBadge';
import { Eyebrow } from './Eyebrow';

type ServiceCardProps = {
  service: ServiceSummary;
};

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link
      to={`/treatments/${service.slug}`}
      className="group flex h-full flex-col border border-brand-line bg-brand-porcelain transition-colors duration-300 hover:border-brand-gold/70"
    >
      <BrandVisual
        variant={service.visual}
        label={`${service.name} visual`}
        className="aspect-[4/5] w-full"
      />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>{service.categoryName}</Eyebrow>
          {service.isPlaceholder ? <ContentBadge>Sample</ContentBadge> : null}
        </div>

        <h3 className="mt-4 font-display text-[1.8rem] leading-[1.05] text-brand-indigo">
          {service.name}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-brand-muted">{service.shortDescription}</p>

        <span className="mt-6 inline-flex items-center gap-2 text-[0.66rem] font-medium tracking-[0.16em] text-brand-indigo uppercase">
          Explore treatment
          <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  );
}
