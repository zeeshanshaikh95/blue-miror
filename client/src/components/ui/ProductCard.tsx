import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ProductSummary } from '@/services/public-content';

import { ContentBadge } from './ContentBadge';
import { Eyebrow } from './Eyebrow';

type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex h-full flex-col border border-brand-line bg-brand-porcelain transition-colors duration-300 hover:border-brand-gold/70"
    >
      {product.imageUrl ? (
        <div className="overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.brand ? `${product.name} by ${product.brand}` : product.name}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full border-b border-brand-line object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="grid aspect-[4/5] w-full place-items-center border-b border-brand-line bg-brand-indigo-deep/90"
        >
          <span className="font-display text-2xl text-brand-gold">{product.name.charAt(0)}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>{product.brand ?? product.category}</Eyebrow>
          {product.isFeatured ? <ContentBadge>Popular</ContentBadge> : null}
        </div>

        <h3 className="mt-4 font-display text-[1.8rem] leading-[1.05] text-brand-indigo">
          {product.name}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-brand-muted">{product.shortDescription}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          {product.price ? (
            <p className="text-[0.72rem] font-medium tracking-[0.14em] text-brand-gold-deep uppercase">
              {product.price}
            </p>
          ) : (
            <p className="text-[0.72rem] tracking-[0.14em] text-brand-muted uppercase">
              Ask for price
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-medium tracking-[0.16em] text-brand-indigo uppercase">
            Details
            <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
