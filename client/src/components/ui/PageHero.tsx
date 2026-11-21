import type { ReactNode } from 'react';

import { Container } from './Container';
import { Eyebrow } from './Eyebrow';

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  breadcrumbs?: ReactNode;
};

export function PageHero({ eyebrow, title, intro, aside, breadcrumbs }: PageHeroProps) {
  return (
    <section className="salon-texture relative overflow-hidden border-b border-brand-line bg-brand-porcelain">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-8%] size-[34rem] rounded-full border border-brand-gold/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-4%] size-[24rem] rounded-full border border-brand-gold/20"
      />

      <Container className="relative py-14 sm:py-20 lg:py-24">
        {breadcrumbs ? <div className="mb-8">{breadcrumbs}</div> : null}

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.65fr] lg:items-end">
          <div>
            {eyebrow ? (
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-10 bg-brand-gold" />
                <Eyebrow>{eyebrow}</Eyebrow>
              </div>
            ) : null}
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.9rem,6.2vw,5.4rem)] leading-[0.94] font-normal tracking-[-0.025em] text-brand-indigo">
              {title}
            </h1>
            {intro ? (
              <div className="mt-7 max-w-2xl text-[0.98rem] leading-8 text-brand-muted sm:text-lg">
                {intro}
              </div>
            ) : null}
          </div>

          {aside ? <div className="lg:pb-2">{aside}</div> : null}
        </div>
      </Container>
    </section>
  );
}
