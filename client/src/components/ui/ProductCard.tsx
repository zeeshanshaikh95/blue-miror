import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ProductSummary } from '@/services/public-content';

import { ContentBadge } from './ContentBadge';

type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-brand-line bg-brand-porcelain transition-all duration-500 hover:-translate-y-1 hover:border-brand-gold/60 hover:shadow-[0_30px_60px_-34px_rgba(38,37,75,0.45)]"
    >
      <div className="relative overflow-hidden bg-brand-champagne">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.brand ? `${product.name} by ${product.brand}` : product.name}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid aspect-square w-full place-items-center bg-brand-indigo-deep/90"
          >
            <span className="font-display text-3xl text-brand-gold">{product.name.charAt(0)}</span>
          </div>
        )}

        {product.isFeatured ? (
          <span className="absolute top-4 left-4">
            <ContentBadge>Popular</ContentBadge>
          </span>
        ) : null}

        <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full border border-brand-ivory/40 bg-brand-indigo-deep/50 text-brand-ivory backdrop-blur transition-all duration-300 group-hover:border-brand-gold group-hover:bg-brand-gold group-hover:text-brand-indigo-deep">
          <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.6} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.58rem] font-medium tracking-[0.18em] text-brand-gold-deep uppercase">
          {product.brand ?? product.category}
        </p>
        <h3 className="mt-2 font-display text-[1.5rem] leading-[1.1] text-brand-indigo">
          {product.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {product.price ? (
            <p className="text-[0.7rem] font-medium tracking-[0.12em] text-brand-gold-deep uppercase">
              {product.price}
            </p>
          ) : (
            <p className="text-[0.62rem] tracking-[0.14em] text-brand-muted uppercase">
              In-salon product
            </p>
          )}
          <span className="text-[0.62rem] font-medium tracking-[0.16em] text-brand-indigo uppercase">
            Details
          </span>
        </div>
      </div>
    </Link>
  );
}
