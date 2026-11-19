import { Link } from 'react-router-dom';

import type { PublicTestimonial } from '@/services/public-content';

type TestimonialMarqueeProps = {
  testimonials: PublicTestimonial[];
  /** When false the internal heading row is hidden; the parent supplies one. */
  showHeader?: boolean;
};

/**
 * Continuously scrolling strip of published client stories. The list is
 * duplicated so the loop is seamless; the duplicate is hidden from assistive
 * technology. Hovering pauses the animation, and reduced-motion users get a
 * static row.
 */
export function TestimonialMarquee({ testimonials, showHeader = true }: TestimonialMarqueeProps) {
  if (testimonials.length === 0) return null;

  // Repeat the set so the track is always wider than the viewport, then double
  // it so the -50% translation loops seamlessly.
  const repeat = Math.max(2, Math.ceil(6 / testimonials.length));
  const half = Array.from({ length: repeat }, () => testimonials).flat();
  const loop = [...half, ...half];

  return (
    <div className={showHeader ? 'mt-10' : 'mt-12'}>
      {showHeader ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.62rem] tracking-[0.18em] text-brand-gold-deep uppercase">
            Client stories
          </p>
          <Link
            to="/testimonials"
            className="text-[0.6rem] font-medium tracking-[0.14em] text-brand-indigo uppercase underline decoration-brand-gold/60 underline-offset-4 transition-colors hover:text-brand-gold-deep"
          >
            All stories
          </Link>
        </div>
      ) : null}

      <div
        className={`relative overflow-hidden border-y border-brand-line py-4 ${
          showHeader ? 'mt-4' : ''
        }`}
      >
        <div className="marquee-track flex w-max gap-4">
          {loop.map((testimonial, index) => (
            <figure
              key={`${testimonial.id}-${index}`}
              aria-hidden={index >= half.length}
              className="w-72 shrink-0 border border-brand-line bg-brand-porcelain p-5"
            >
              <blockquote className="font-display text-lg leading-snug text-brand-indigo">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-4 text-[0.6rem] tracking-[0.14em] text-brand-muted uppercase">
                {testimonial.name}
                {testimonial.treatment ? ` · ${testimonial.treatment}` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
