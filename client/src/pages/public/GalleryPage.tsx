import { useState } from 'react';

import { Seo } from '@/components/seo/Seo';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageHero } from '@/components/ui/PageHero';
import { useGallery } from '@/hooks/use-public-content';
import { cn } from '@/utils/cn';

export function GalleryPage() {
  const galleryQuery = useGallery();
  const [activeCategory, setActiveCategory] = useState('');
  const categories = galleryQuery.data?.categories ?? [];
  const items =
    galleryQuery.data?.items.filter(
      (item) => !activeCategory || item.category === activeCategory,
    ) ?? [];

  return (
    <>
      <Seo
        title="Gallery"
        description="A visual direction for Blue Miror. Final gallery photography is pending, with no simulated treatment results."
      />

      <PageHero
        eyebrow="A glimpse"
        title={
          <>
            Space to feel
            <br /> <em className="text-brand-gold-deep">at ease</em>.
          </>
        }
        intro="A first look at the visual language of the clinic. Images published here have been supplied and approved by the clinic; anything still pending is shown as a clearly marked placeholder."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <ContentBadge>Photography pending</ContentBadge>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              No before/after results, stock clinic images or simulated outcomes are used in this
              preview.
            </p>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="flex flex-wrap gap-2 border-b border-brand-line pb-6">
            <button
              type="button"
              aria-pressed={!activeCategory}
              onClick={() => setActiveCategory('')}
              className={cn(
                'border px-3 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                !activeCategory
                  ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                  : 'border-brand-line text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
              )}
            >
              All images
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'border px-3 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                  activeCategory === category
                    ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                    : 'border-brand-line text-brand-muted hover:border-brand-indigo hover:text-brand-indigo',
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-10">
            {galleryQuery.isPending ? <LoadingState label="Loading gallery" cards={4} /> : null}
            {galleryQuery.isError ? (
              <ErrorState
                title="The gallery could not be loaded"
                message="Clinic imagery is temporarily unavailable. Please try again."
                onRetry={() => void galleryQuery.refetch()}
              />
            ) : null}
            {galleryQuery.data && items.length === 0 ? (
              <EmptyState eyebrow="No images in this view" title="Nothing to show here yet">
                Choose another category or return to the full gallery. Final photography will be
                published after the clinic approves it.
              </EmptyState>
            ) : null}
            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                  <figure key={item.id} className={index % 3 === 1 ? 'lg:mt-10' : undefined}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          'w-full border border-brand-line object-cover',
                          index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square',
                        )}
                      />
                    ) : (
                      <BrandVisual
                        variant={item.variant}
                        label={item.alt}
                        className={index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square'}
                      />
                    )}
                    <figcaption className="flex items-start justify-between gap-4 border-b border-brand-line py-4">
                      <div>
                        <p className="text-[0.625rem] tracking-[0.16em] text-brand-gold-deep uppercase">
                          {item.category}
                        </p>
                        <p className="mt-1 font-display text-xl text-brand-indigo">{item.title}</p>
                      </div>
                      <span className="pt-1 text-[0.625rem] tracking-[0.12em] text-brand-muted uppercase">
                        {item.imageUrl ? 'Published' : 'Pending'}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-14 border border-brand-line bg-brand-porcelain p-6 sm:p-8">
            <Eyebrow>Before &amp; after</Eyebrow>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-muted">
              This section is deliberately absent. Before/after imagery will only be considered with
              genuine photographs, explicit written client consent and clinic approval in the
              relevant jurisdiction. No comparison image has been simulated.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
