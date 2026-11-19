import { Search, X } from 'lucide-react';
import { useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageHero } from '@/components/ui/PageHero';
import { ProductCard } from '@/components/ui/ProductCard';
import { useProducts } from '@/hooks/use-public-content';
import { cn } from '@/utils/cn';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = Math.max(1, Number(searchParams.get('p') ?? '1') || 1);
  const deferredSearch = useDeferredValue(search);

  const productsQuery = useProducts({
    q: deferredSearch.trim() || undefined,
    category: category || undefined,
    limit: 24,
    page,
  });

  function updateFilter(key: 'q' | 'category', value: string) {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    // Any filter change returns to the first page of results.
    next.delete('p');
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      next.delete('p');
    } else {
      next.set('p', String(nextPage));
    }

    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const categories = productsQuery.data?.categories ?? [];
  const hasFilters = Boolean(search || category);
  const totalPages = productsQuery.data?.totalPages ?? 1;

  return (
    <>
      <Seo
        title="Products"
        description="The professional nail and beauty products used and available at Blue Miror, from gel polish and cat-eye collections to nail essentials."
      />

      <PageHero
        eyebrow="The product shelf"
        title={
          <>
            Professional products,
            <br /> <em className="text-brand-gold-deep">used in the salon</em>.
          </>
        }
        intro="The brands and products we work with every day, from gel polish and cat-eye collections to nail essentials. Ask us in the salon for shades, availability and pricing."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <ContentBadge>Salon product shelf</ContentBadge>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              Availability and pricing are confirmed in the salon. Product imagery shows the items
              used and stocked by Blue Miror.
            </p>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="border border-brand-line bg-brand-porcelain p-5 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <label
                  htmlFor="product-search"
                  className="text-[0.6rem] font-medium tracking-[0.18em] text-brand-indigo uppercase"
                >
                  Search products
                </label>
                <div className="relative mt-2">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-brand-muted"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <input
                    id="product-search"
                    type="search"
                    value={search}
                    onChange={(event) => updateFilter('q', event.target.value)}
                    placeholder="Search by product or brand"
                    className="h-12 w-full border border-brand-line bg-white pr-4 pl-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-azure focus:outline-none"
                  />
                </div>
              </div>

              <div className="lg:pb-1">
                <p
                  className="text-[0.6rem] tracking-[0.14em] text-brand-muted uppercase"
                  aria-live="polite"
                >
                  {productsQuery.isPending
                    ? 'Loading products'
                    : productsQuery.isFetching
                      ? 'Updating products'
                      : `${productsQuery.data?.total ?? 0} product${productsQuery.data?.total === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={!category}
                onClick={() => updateFilter('category', '')}
                className={cn(
                  'border px-3 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                  !category
                    ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                    : 'border-brand-line bg-transparent text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
                )}
              >
                All products
              </button>

              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => updateFilter('category', item)}
                  className={cn(
                    'border px-3 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                    category === item
                      ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                      : 'border-brand-line bg-transparent text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
                  )}
                >
                  {item}
                </button>
              ))}

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-[0.6rem] font-medium tracking-[0.14em] text-brand-gold-deep uppercase underline decoration-brand-gold/60 underline-offset-4"
                >
                  <X aria-hidden="true" size={13} />
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-10">
            {productsQuery.isPending ? <LoadingState label="Loading products" /> : null}

            {productsQuery.isError ? (
              <ErrorState
                title="The product shelf could not be loaded"
                message="The content API is temporarily unavailable. Please try again."
                onRetry={() => void productsQuery.refetch()}
              />
            ) : null}

            {!productsQuery.isError &&
            productsQuery.data &&
            productsQuery.data.items.length === 0 ? (
              <EmptyState
                eyebrow="No matches"
                title="Nothing matches that search yet"
                action={
                  <Button onClick={clearFilters} variant="secondary">
                    Clear filters
                  </Button>
                }
              >
                Try a broader search or choose another category to see the full product shelf.
              </EmptyState>
            ) : null}

            {!productsQuery.isError &&
            productsQuery.data &&
            productsQuery.data.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {productsQuery.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : null}

            {totalPages > 1 ? (
              <nav
                aria-label="Product shelf pages"
                className="mt-12 flex items-center justify-between gap-4 border-t border-brand-line pt-6"
              >
                <Button
                  variant="secondary"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || productsQuery.isFetching}
                >
                  Previous
                </Button>
                <p className="text-[0.62rem] tracking-[0.14em] text-brand-muted uppercase">
                  Page {page} of {totalPages}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || productsQuery.isFetching}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}
