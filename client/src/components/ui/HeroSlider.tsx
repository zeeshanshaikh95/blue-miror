import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

import { BookingLink } from './BookingLink';
import { BrandVisual } from './BrandVisual';
import { ButtonLink } from './Button';
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

export function HeroSlider({ slides }: { slides: HeroSliderSlide[] }) {
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

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  const slide = slides[index];
  const cta =
    slide.ctaLabel && slide.ctaHref ? { label: slide.ctaLabel, href: slide.ctaHref } : null;
  const variant = visualVariants[index % visualVariants.length];
  const caption = slide.eyebrow ?? 'Blue Miror · Aesthetic Clinic';

  return (
    <section
      className="relative overflow-hidden bg-brand-ivory"
      aria-roledescription="carousel"
      aria-label="Clinic highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-1/4 h-full w-px bg-linear-to-b from-transparent via-brand-gold/25 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-6%] size-[36rem] rounded-full border border-brand-gold/15"
      />

      <Container className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20 lg:py-24">
        <div key={slide.id} className="animate-[heroRise_700ms_ease-out]">
          <Eyebrow>{slide.eyebrow ?? 'Blue Miror · Aesthetic Clinic'}</Eyebrow>
          <h1 className="mt-6 max-w-2xl font-display text-[clamp(3.2rem,6.7vw,6rem)] leading-[0.92] font-normal tracking-[-0.035em] text-brand-indigo">
            {slide.heading ?? 'Considered care, guided by conversation.'}
          </h1>

          <p className="mt-7 max-w-xl text-[1.02rem] leading-8 text-brand-muted sm:text-lg">
            {slide.description ??
              'A calm, considered aesthetic clinic experience — shaped around listening first, explaining clearly and helping you make an informed choice.'}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {cta ? <ButtonLink to={cta.href}>{cta.label}</ButtonLink> : <BookingLink />}
            {!cta || cta.href !== '/treatments' ? (
              <ButtonLink to="/treatments" variant="secondary">
                Explore treatments
              </ButtonLink>
            ) : null}
          </div>

          <p className="mt-5 text-xs leading-6 text-brand-muted">
            Appointment requests are reviewed by the clinic before they are confirmed.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-brand-line pt-5 text-[0.6rem] tracking-[0.16em] text-brand-muted uppercase">
            <span>Consultation-led</span>
            <span aria-hidden="true" className="size-1 rotate-45 bg-brand-gold" />
            <span>Service-only</span>
            <span aria-hidden="true" className="size-1 rotate-45 bg-brand-gold" />
            <span>No online diagnosis</span>
          </div>
        </div>

        <div
          key={`${slide.id}-visual`}
          className="group relative mx-auto w-full max-w-[38rem] lg:ml-auto"
        >
          {/* Offset hairline frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 -right-3 bottom-3 left-3 border border-brand-gold/45 transition-colors duration-500 group-hover:border-brand-gold/75"
          />

          <div className="relative bg-brand-porcelain p-2.5 shadow-[0_30px_70px_-40px_rgba(38,37,75,0.45)]">
            <div className="relative overflow-hidden bg-brand-ivory">
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.heading ?? 'Blue Miror clinic'}
                  className="aspect-[4/3] w-full animate-[heroFade_900ms_ease-out] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <BrandVisual
                  variant={variant}
                  label="Editorial clinic portrait — photography pending"
                  className="aspect-[4/3] w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              )}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-brand-ivory/25"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-10 bg-brand-gold" />
            <p className="text-[0.58rem] tracking-[0.2em] text-brand-muted uppercase">{caption}</p>
          </div>
        </div>
      </Container>

      {count > 1 ? (
        <Container className="relative pb-8">
          <div
            className="flex items-center justify-center gap-2 border-t border-brand-line pt-5"
            role="tablist"
            aria-label="Choose a slide"
          >
            {slides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={`Slide ${itemIndex + 1}`}
                onClick={() => setIndex(itemIndex)}
                className={cn(
                  'h-1.5 transition-all',
                  itemIndex === index
                    ? 'w-8 bg-brand-gold'
                    : 'w-3 bg-brand-line hover:bg-brand-muted',
                )}
              />
            ))}
          </div>
        </Container>
      ) : null}
    </section>
  );
}
