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
  const deferredSearch = useDeferredValue(search);

  const servicesQuery = useServices({
    q: deferredSearch.trim() || undefined,
    category: category || undefined,
    limit: 24,
  });

  function updateFilter(key: 'q' | 'category', value: string) {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const categories = servicesQuery.data?.categories ?? [];
  const hasFilters = Boolean(search || category);

  return (
    <>
      <Seo
        title="Treatments"
        description="Explore the Blue Miror treatment structure. Final treatment names, suitability information and aftercare are awaiting clinic approval."
      />

      <PageHero
        eyebrow="Treatments"
        title={
          <>
            A service menu built on
            <br /> <em className="text-brand-gold-deep">considered care</em>.
          </>
        }
        intro="Search the current structure or filter by category. Every treatment page is connected to the content API; the final menu requires clinic approval."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <ContentBadge>Sample service menu</ContentBadge>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              No prices or treatment outcomes are published. No service has been presented as
              verified clinic information.
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
                    className="h-12 w-full border border-brand-line bg-white pr-4 pl-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-azure focus:outline-none"
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
                All treatments
              </button>

              {categories.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={category === item.slug}
                  onClick={() => updateFilter('category', item.slug)}
                  className={cn(
                    'border px-3 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                    category === item.slug
                      ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                      : 'border-brand-line bg-transparent text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
                  )}
                >
                  {item.name}
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
                Try a broader search, choose another category, or return to the full sample service
                menu.
              </EmptyState>
            ) : null}

            {!servicesQuery.isError && servicesQuery.data && servicesQuery.data.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {servicesQuery.data.items.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}
