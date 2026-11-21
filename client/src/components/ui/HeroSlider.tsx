import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/utils/cn';

import { BookingLink } from './BookingLink';
import { BrandVisual } from './BrandVisual';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';

export type HeroSliderSlide = {
  id: string;
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
};

export type HeroHighlight = {
  label: string;
  value: string;
};

const visualVariants = ['arch', 'orbit', 'drape', 'horizon', 'bloom', 'column'] as const;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

/** Primary CTA used over the dark hero, whether it points in or out of the app. */
function HeroCta({ label, href }: { label: string; href: string }) {
  const classes =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-brand-gold bg-brand-gold px-7 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] text-brand-indigo-deep uppercase shadow-[0_18px_40px_-18px_rgba(192,153,77,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-ivory hover:bg-brand-ivory sm:w-auto';

  if (/^https?:/i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={classes}>
      {label}
    </Link>
  );
}

export function HeroSlider({
  slides,
  highlights = [],
}: {
  slides: HeroSliderSlide[];
  highlights?: HeroHighlight[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [count, paused, reducedMotion]);

  if (count === 0) return null;

  // Keep the active slide valid if the slide list shrinks between renders.
  const activeIndex = index % count;
  const slide = slides[activeIndex];
  const cta =
    slide.ctaLabel && slide.ctaHref ? { label: slide.ctaLabel, href: slide.ctaHref } : null;
  const caption = slide.eyebrow ?? 'Blue Miror · Salon & Aesthetic Clinic';

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Phone layout: copy first, then a full-width landscape photo, so    */}
      {/* the image is never squeezed through a narrow portrait crop.         */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative overflow-hidden bg-brand-indigo-deep lg:hidden"
        aria-roledescription="carousel"
        aria-label="Clinic highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Container className="pt-8">
          <div key={`mobile-copy-${slide.id}`} className="animate-[heroRise_600ms_ease-out]">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-brand-gold" />
              <Eyebrow tone="ivory" className="text-[0.55rem] tracking-[0.16em]">
                {caption}
              </Eyebrow>
            </div>

            <h1 className="mt-4 font-display text-[clamp(2.15rem,9.4vw,2.9rem)] leading-[0.96] tracking-[-0.02em] text-brand-ivory">
              {slide.heading ?? 'Considered care, guided by conversation.'}
            </h1>

            <p className="mt-4 text-[0.95rem] leading-7 text-brand-ivory/75">
              {slide.description ??
                'A calm, considered salon experience — shaped around listening first, explaining clearly and helping you make an informed choice.'}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {cta ? <HeroCta label={cta.label} href={cta.href} /> : <BookingLink variant="light" />}
              <Link
                to="/treatments"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-brand-ivory/35 px-7 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] text-brand-ivory uppercase transition-colors hover:border-brand-ivory hover:bg-brand-ivory/10"
              >
                Explore the menu
              </Link>
            </div>
          </div>
        </Container>

        <div className="relative mt-7 aspect-[16/10] max-h-[44svh] w-full overflow-hidden bg-brand-indigo-deep">
          {slides.map((item, itemIndex) => (
            <div
              key={`mobile-${item.id}`}
              className={cn(
                'absolute inset-0 transition-opacity duration-700 ease-out',
                itemIndex === activeIndex ? 'opacity-100' : 'opacity-0',
              )}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  fetchPriority={itemIndex === 0 ? 'high' : 'auto'}
                  className="size-full object-cover object-center"
                />
              ) : (
                <BrandVisual
                  variant={visualVariants[itemIndex % visualVariants.length]}
                  label="Salon photography pending"
                  className="size-full"
                />
              )}
            </div>
          ))}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgba(18,17,36,0.85),transparent)]"
          />

          {count > 1 ? (
            <div
              className="absolute right-4 bottom-4 flex items-center gap-2"
              role="tablist"
              aria-label="Choose a slide"
            >
              {slides.map((item, itemIndex) => (
                <button
                  key={`mobile-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === activeIndex}
                  aria-label={`Slide ${itemIndex + 1}`}
                  onClick={() => setIndex(itemIndex)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    itemIndex === activeIndex
                      ? 'w-8 bg-brand-gold'
                      : 'w-3 bg-brand-ivory/40 hover:bg-brand-ivory/70',
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        {highlights.length > 0 ? (
          <Container className="py-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-3xl border border-brand-ivory/15 bg-brand-ivory/5 px-5 py-5 backdrop-blur">
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt className="text-[0.5rem] tracking-[0.18em] text-brand-gold uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-display text-base leading-tight text-brand-ivory">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        ) : (
          <div className="pb-8" />
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout: the full-bleed editorial hero.                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative isolate hidden overflow-hidden bg-brand-indigo-deep lg:block"
        aria-roledescription="carousel"
        aria-label="Clinic highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="absolute inset-0" aria-hidden="true">
          {slides.map((item, itemIndex) => (
            <div
              key={item.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-1000 ease-out',
                itemIndex === activeIndex ? 'opacity-100' : 'opacity-0',
              )}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  fetchPriority={itemIndex === 0 ? 'high' : 'auto'}
                  className="size-full object-cover object-center"
                />
              ) : (
                <BrandVisual
                  variant={visualVariants[itemIndex % visualVariants.length]}
                  label="Editorial salon photography — pending"
                  className="size-full"
                />
              )}
            </div>
          ))}
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(100deg,rgba(18,17,36,0.93)_0%,rgba(18,17,36,0.82)_42%,rgba(18,17,36,0.45)_74%,rgba(18,17,36,0.35)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-3/4 bg-[linear-gradient(0deg,rgba(18,17,36,0.92),rgba(18,17,36,0.3)_55%,transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-24 right-[-8%] hidden size-[30rem] rounded-full border border-brand-gold/20 lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-40 right-[2%] hidden size-[20rem] rounded-full border border-brand-ivory/10 lg:block"
        />

        <Container className="relative flex min-h-[88svh] flex-col justify-center pt-20 pb-44">
          <div key={slide.id} className="max-w-[48rem] animate-[heroRise_700ms_ease-out]">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-14 bg-brand-gold" />
              <Eyebrow tone="ivory" className="tracking-[0.28em]">
                {caption}
              </Eyebrow>
            </div>

            <h1 className="mt-6 max-w-[46rem] font-display text-[clamp(2.9rem,6.4vw,5.9rem)] leading-[0.94] font-normal tracking-[-0.03em] text-brand-ivory">
              {slide.heading ?? 'Considered care, guided by conversation.'}
            </h1>

            <p className="mt-6 max-w-xl text-[1rem] leading-8 text-brand-ivory/78 sm:text-lg">
              {slide.description ??
                'A calm, considered salon experience — shaped around listening first, explaining clearly and helping you make an informed choice.'}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {cta ? <HeroCta label={cta.label} href={cta.href} /> : <BookingLink variant="light" />}
              <Link
                to="/treatments"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-ivory/35 px-7 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] text-brand-ivory uppercase transition-colors hover:border-brand-ivory hover:bg-brand-ivory/10"
              >
                Explore the menu
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.58rem] tracking-[0.18em] text-brand-ivory/65 uppercase">
              <span>Consultation-led</span>
              <span aria-hidden="true" className="size-1 rotate-45 bg-brand-gold" />
              <span>Premium products</span>
              <span aria-hidden="true" className="size-1 rotate-45 bg-brand-gold" />
              <span>WhatsApp booking</span>
            </div>
          </div>
        </Container>

        <div className="absolute inset-x-0 bottom-0">
          <Container className="pb-8">
            <div className="flex items-center justify-between gap-5 rounded-3xl border border-brand-ivory/15 bg-brand-indigo-deep/55 px-6 py-4 backdrop-blur-md">
              {highlights.length > 0 ? (
                <dl className="grid flex-1 grid-cols-3 gap-6">
                  {highlights.map((item) => (
                    <div key={item.label}>
                      <dt className="text-[0.52rem] tracking-[0.2em] text-brand-gold uppercase">
                        {item.label}
                      </dt>
                      <dd className="mt-1 font-display text-xl leading-tight text-brand-ivory">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="flex-1 font-display text-lg text-brand-ivory/85">
                  A quieter kind of salon, in the heart of Mira Road.
                </p>
              )}

              {count > 1 ? (
                <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
                  {slides.map((item, itemIndex) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={itemIndex === activeIndex}
                      aria-label={`Slide ${itemIndex + 1}`}
                      onClick={() => setIndex(itemIndex)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        itemIndex === activeIndex
                          ? 'w-9 bg-brand-gold'
                          : 'w-3 bg-brand-ivory/35 hover:bg-brand-ivory/70',
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </div>
      </section>
    </>
  );
}
