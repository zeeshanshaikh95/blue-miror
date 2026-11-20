import { useEffect, useState } from 'react';

import { BookingLink } from './BookingLink';
import { BrandVisual } from './BrandVisual';
import { ButtonLink } from './Button';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';
import { cn } from '@/utils/cn';

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

      <Container className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:py-24">
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
          className="group relative mx-auto w-full max-w-[31rem] lg:ml-auto"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-t-full border border-brand-gold/35 transition-colors duration-500 group-hover:border-brand-gold/60"
          />

          <div className="relative overflow-hidden rounded-t-full">
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.heading ?? 'Blue Miror clinic'}
                className="aspect-[4/5] w-full animate-[heroFade_900ms_ease-out] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <BrandVisual
                variant={variant}
                label="Editorial clinic portrait — photography pending"
                className="aspect-[4/5] w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-indigo-deep/25 via-transparent to-transparent"
            />
          </div>

          <div className="absolute bottom-8 -left-3 z-20 hidden max-w-[15rem] border border-brand-gold/50 bg-brand-porcelain/95 p-4 backdrop-blur-sm sm:block lg:-left-8">
            <p className="text-[0.625rem] tracking-[0.18em] text-brand-gold-deep uppercase">
              A considered beginning
            </p>
            <p className="mt-2 font-display text-xl leading-tight text-brand-indigo">
              Care that starts with your questions.
            </p>
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
                  itemIndex === index ? 'w-8 bg-brand-gold' : 'w-3 bg-brand-line hover:bg-brand-muted',
                )}
              />
            ))}
          </div>
        </Container>
      ) : null}
    </section>
  );
}
