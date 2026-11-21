import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageHero } from '@/components/ui/PageHero';
import { useGallery, useServices, useSiteSettings } from '@/hooks/use-public-content';
import { cn } from '@/utils/cn';

type Look = {
  id: string;
  title: string;
  category: string;
  alt: string;
  imageUrl?: string | null;
  variant: 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';
  to?: string;
};

export function GalleryPage() {
  const galleryQuery = useGallery();
  const servicesQuery = useServices({ limit: 9 });
  const settingsQuery = useSiteSettings();
  const [selectedCategory, setSelectedCategory] = useState('');

  const galleryItems = galleryQuery.data?.items ?? [];
  const serviceLooks = servicesQuery.data?.items ?? [];

  const looks: Look[] = [
    ...serviceLooks
      .filter((service) => service.imageUrl)
      .map((service) => ({
        id: `service-${service.id}`,
        title: service.name,
        category: service.categoryName,
        alt: `${service.name} at Blue Miror`,
        imageUrl: service.imageUrl,
        variant: service.visual,
        to: `/treatments/${service.slug}`,
      })),
    ...galleryItems.map((item) => ({
      id: `gallery-${item.id}`,
      title: item.title,
      category: item.category,
      alt: item.alt,
      imageUrl: item.imageUrl,
      variant: item.variant,
    })),
  ];

  const categories = [
    ...new Set([
      ...(galleryQuery.data?.categories ?? []),
      ...serviceLooks.map((service) => service.categoryName),
    ]),
  ];

  const filtered = selectedCategory
    ? looks.filter((look) => look.category === selectedCategory)
    : looks;

  const instagram =
    settingsQuery.data?.social.find((item) => /instagram/i.test(item.label))?.url ?? null;

  return (
    <>
      <Seo
        title="Gallery"
        description="A look inside Blue Miror in Mira Road — colour, nails, skin and makeup work from the salon chairs."
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {categories.length > 1 ? (
            <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-brand-line pb-5">
              <button
                type="button"
                aria-pressed={!selectedCategory}
                onClick={() => setSelectedCategory('')}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                  !selectedCategory
                    ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                    : 'border-brand-line text-brand-muted hover:border-brand-gold hover:text-brand-indigo',
                )}
              >
                All images
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-2 text-[0.6rem] font-medium tracking-[0.14em] uppercase transition-colors',
                    selectedCategory === category
                      ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                      : 'border-brand-line text-brand-muted hover:border-brand-gold hover:text-brand-indigo',
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-10">
            {galleryQuery.isPending ? <LoadingState label="Loading gallery" cards={4} /> : null}
            {galleryQuery.isError ? (
              <ErrorState
                title="The gallery could not be loaded"
                message="Clinic imagery is temporarily unavailable. Please try again."
                onRetry={() => void galleryQuery.refetch()}
              />
            ) : null}
            {galleryQuery.data && filtered.length === 0 ? (
              <EmptyState eyebrow="No images in this view" title="Nothing to show here yet">
                Choose another category or return to the full gallery.
              </EmptyState>
            ) : null}

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((look, index) => {
                  const media = look.imageUrl ? (
                    <img
                      src={look.imageUrl}
                      alt={look.alt}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        'w-full rounded-[1.75rem] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]',
                        index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square',
                      )}
                    />
                  ) : (
                    <BrandVisual
                      variant={look.variant}
                      label={look.alt}
                      className={cn(
                        'rounded-[1.75rem]',
                        index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square',
                      )}
                    />
                  );

                  const caption = (
                    <figcaption className="flex items-start justify-between gap-4 border-b border-brand-line py-4">
                      <div>
                        <p className="text-[0.625rem] tracking-[0.16em] text-brand-gold-deep uppercase">
                          {look.category}
                        </p>
                        <p className="mt-1 font-display text-xl text-brand-indigo">{look.title}</p>
                      </div>
                      {look.to ? (
                        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-brand-line text-brand-indigo">
                          <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.6} />
                        </span>
                      ) : null}
                    </figcaption>
                  );

                  return (
                    <figure key={look.id} className={index % 3 === 1 ? 'lg:mt-10' : undefined}>
                      {look.to ? (
                        <Link
                          to={look.to}
                          className="group block overflow-hidden rounded-[1.75rem]"
                        >
                          {media}
                        </Link>
                      ) : (
                        <div className="group overflow-hidden rounded-[1.75rem]">{media}</div>
                      )}
                      {caption}
                    </figure>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-14 grid gap-6 rounded-[2rem] border border-brand-gold/40 bg-brand-porcelain p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Eyebrow>Fresh from the salon</Eyebrow>
              <p className="mt-3 max-w-2xl font-display text-2xl leading-tight text-brand-indigo sm:text-3xl">
                New looks are added as the team finishes them.
              </p>
              <p className="mt-2 text-sm leading-7 text-brand-muted">
                Booking a colour, facial or set of nails? Send us a reference and we will tell you
                what is achievable for your hair or skin.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <BookingLink />
              {instagram ? (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-indigo/30 px-6 text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase transition-colors hover:border-brand-gold"
                >
                  Follow on Instagram
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-brand-line pt-12 sm:pt-16">
        <PageHero
          eyebrow="A glimpse"
          title={
            <>
              Space to feel
              <br /> <em className="text-brand-gold-deep">at ease</em>.
            </>
          }
          intro="Colour, length, nails and finish — a visual walk through the treatment rooms and the work that leaves them."
          aside={
            <div className="border-l border-brand-gold/60 pl-5">
              <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
                Before &amp; after
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                We publish comparison photos only with the client&rsquo;s written consent — never a
                simulated result.
              </p>
            </div>
          }
        />
      </section>
    </>
  );
}
