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
import { ServiceCard } from '@/components/ui/ServiceCard';
import { useServices } from '@/hooks/use-public-content';
import { cn } from '@/utils/cn';

export function TreatmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = Math.max(1, Number(searchParams.get('p') ?? '1') || 1);
  const deferredSearch = useDeferredValue(search);

  const servicesQuery = useServices({
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

  const categories = servicesQuery.data?.categories ?? [];
  const hasFilters = Boolean(search || category);
  const totalPages = servicesQuery.data?.totalPages ?? 1;

  return (
    <>
      <Seo
        title="Salon Treatments & Price List in Mira Road East | Blue Miror"
        description="Browse 115+ salon and aesthetic treatments in Mira Road East — hair colour, haircuts, facials, waxing, threading, nails, makeup and advanced skin care, with published prices."
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="rounded-[2rem] border border-brand-line bg-brand-porcelain p-5 shadow-[0_24px_60px_-46px_rgba(38,37,75,0.5)] sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <label
                  htmlFor="treatment-search"
                  className="text-[0.6rem] font-medium tracking-[0.18em] text-brand-indigo uppercase"
                >
                  Search treatments
                </label>
                <div className="relative mt-2">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-brand-muted"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <input
                    id="treatment-search"
                    type="search"
                    value={search}
                    onChange={(event) => updateFilter('q', event.target.value)}
                    placeholder="Search by treatment or concern"
                    className="h-12 w-full rounded-full border border-brand-line bg-white pr-5 pl-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="lg:pb-1">
                <p
                  className="text-[0.6rem] tracking-[0.14em] text-brand-muted uppercase"
                  aria-live="polite"
                >
                  {servicesQuery.isPending
                    ? 'Loading treatments'
                    : servicesQuery.isFetching
                      ? 'Updating treatments'
                      : `${servicesQuery.data?.total ?? 0} treatment${servicesQuery.data?.total === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <div className="scrollbar-none flex snap-x gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    aria-pressed={!category}
                    onClick={() => updateFilter('category', '')}
                    className={cn(
                      'shrink-0 snap-start rounded-full border px-4 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                      !category
                        ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                        : 'border-brand-line bg-transparent text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
                    )}
                  >
                    All treatments
                  </button>

                  {categories.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      aria-pressed={category === item.slug}
                      onClick={() => updateFilter('category', item.slug)}
                      className={cn(
                        'shrink-0 snap-start rounded-full border px-4 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                        category === item.slug
                          ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                          : 'border-brand-line bg-transparent text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-brand-porcelain to-transparent"
                />
              </div>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2 py-2 text-[0.6rem] font-medium tracking-[0.14em] text-brand-gold-deep uppercase underline decoration-brand-gold/60 underline-offset-4"
                >
                  <X aria-hidden="true" size={13} />
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-10">
            {servicesQuery.isPending ? <LoadingState label="Loading treatments" /> : null}

            {servicesQuery.isError ? (
              <ErrorState
                title="The treatment menu could not be loaded"
                message="The content API is temporarily unavailable. Please try again."
                onRetry={() => void servicesQuery.refetch()}
              />
            ) : null}

            {!servicesQuery.isError &&
            servicesQuery.data &&
            servicesQuery.data.items.length === 0 ? (
              <EmptyState
                eyebrow="No matches"
                title="Nothing matches that search yet"
                action={
                  <Button onClick={clearFilters} variant="secondary">
                    Clear filters
                  </Button>
                }
              >
                Try a broader search, choose another category, or return to the full menu.
              </EmptyState>
            ) : null}

            {!servicesQuery.isError && servicesQuery.data && servicesQuery.data.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {servicesQuery.data.items.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : null}

            {totalPages > 1 ? (
              <nav
                aria-label="Treatment menu pages"
                className="mt-12 flex items-center justify-between gap-4 border-t border-brand-line pt-6"
              >
                <Button
                  variant="secondary"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || servicesQuery.isFetching}
                >
                  Previous
                </Button>
                <p className="text-[0.62rem] tracking-[0.14em] text-brand-muted uppercase">
                  Page {page} of {totalPages}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || servicesQuery.isFetching}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="border-t border-brand-line pt-12 sm:pt-16">
        <PageHero
          eyebrow="Treatments"
          title={
            <>
              A service menu built on
              <br /> <em className="text-brand-gold-deep">considered care</em>.
            </>
          }
          intro="Search the full menu or filter by category. Every treatment page is connected to the content API, so the menu stays current."
          aside={
            <div className="border-l border-brand-gold/60 pl-5">
              <ContentBadge>Beauty & hair menu</ContentBadge>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                Prices are published as supplied by the clinic and are confirmed at your
                appointment. Services may be adjusted for hair length, volume and product usage.
              </p>
            </div>
          }
        />
      </section>
    </>
  );
}

