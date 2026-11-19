import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { EnquiryForm } from '@/components/forms/PublicForms';
import { Seo } from '@/components/seo/Seo';
import { Accordion } from '@/components/ui/Accordion';
import { BookingLink } from '@/components/ui/BookingLink';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { useService } from '@/hooks/use-public-content';
import { ApiError } from '@/lib/api-client';

function TreatmentSkeleton() {
  return (
    <div role="status" aria-label="Loading treatment" className="animate-pulse">
      <div className="border-b border-brand-line bg-brand-porcelain">
        <Container className="py-16 lg:py-24">
          <div className="h-3 w-32 bg-brand-line" />
          <div className="mt-7 h-16 w-3/4 bg-brand-line/80 sm:h-20" />
          <div className="mt-5 h-4 w-1/2 bg-brand-line" />
        </Container>
      </div>
      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <div className="h-4 w-full bg-brand-line" />
          <div className="h-4 w-11/12 bg-brand-line" />
          <div className="h-4 w-4/5 bg-brand-line" />
        </div>
        <div className="h-64 border border-brand-line bg-brand-porcelain" />
      </Container>
    </div>
  );
}

export function TreatmentDetailPage() {
  const { slug = '' } = useParams();
  const treatmentQuery = useService(slug);

  if (treatmentQuery.isPending) {
    return (
      <>
        <Seo title="Loading treatment" noindex />
        <TreatmentSkeleton />
      </>
    );
  }

  if (treatmentQuery.isError) {
    const notFound =
      treatmentQuery.error instanceof ApiError && treatmentQuery.error.status === 404;

    return (
      <>
        <Seo title={notFound ? 'Treatment not found' : 'Treatment unavailable'} noindex />
        <section className="py-20 sm:py-28">
          <Container>
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Treatments', to: '/treatments' },
                { label: 'Not found' },
              ]}
            />
            <div className="mt-10">
              {notFound ? (
                <EmptyState
                  eyebrow="Treatment not found"
                  title="This treatment is not available"
                  action={
                    <ButtonLink to="/treatments" variant="secondary">
                      View all treatments
                    </ButtonLink>
                  }
                >
                  The page may have moved, or the treatment may not yet be published. The current
                  service menu is the best place to continue.
                </EmptyState>
              ) : (
                <ErrorState
                  title="This treatment could not be loaded"
                  message="The treatment page is temporarily unavailable. Please try again."
                  onRetry={() => void treatmentQuery.refetch()}
                />
              )}
            </div>
          </Container>
        </section>
      </>
    );
  }

  const service = treatmentQuery.data;
  const faqItems = service.faqs.map((faq, index) => ({
    id: `${service.slug}-faq-${index}`,
    question: faq.question,
    answer: faq.answer,
  }));

  return (
    <>
      <Seo
        title={service.name}
        description={service.shortDescription}
        noindex={service.isPlaceholder}
      />

      <PageHero
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Treatments', to: '/treatments' },
              { label: service.name },
            ]}
          />
        }
        eyebrow={service.categoryName}
        title={service.name}
        intro={service.shortDescription}
        aside={
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-t-full border border-brand-gold/25"
            />
            <div className="relative">
              {service.price ? (
                <p className="mb-3 text-[0.72rem] font-medium tracking-[0.16em] text-brand-gold-deep uppercase">
                  {service.price}
                </p>
              ) : null}
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={`${service.name} treatment`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[5/4] w-full rounded-t-full border border-brand-line object-cover sm:aspect-[4/3]"
                />
              ) : (
                <BrandVisual
                  variant={service.visual}
                  label={`${service.name} visual`}
                  className="aspect-[5/4] rounded-t-full sm:aspect-[4/3]"
                />
              )}
              {service.isPlaceholder ? (
                <div className="mt-3 flex justify-end">
                  <ContentBadge>Sample treatment content</ContentBadge>
                </div>
              ) : null}
            </div>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {service.isPlaceholder ? (
            <div className="mb-10 border border-brand-gold/50 bg-brand-gold/8 px-5 py-5 sm:flex sm:items-start sm:gap-5">
              <ContentBadge className="shrink-0">Draft content</ContentBadge>
              <p className="mt-3 text-sm leading-6 text-brand-muted sm:mt-0">
                This treatment name, description, suitability information and aftercare are
                placeholders. They must be replaced with clinic-approved copy and reviewed before
                publication.
              </p>
            </div>
          ) : null}

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
            <div>
              <section aria-labelledby="overview-heading">
                <Eyebrow>Overview</Eyebrow>
                <h2
                  id="overview-heading"
                  className="mt-4 font-display text-[clamp(2.1rem,4vw,3.3rem)] leading-[0.99] text-brand-indigo"
                >
                  A considered place to begin.
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-brand-muted">
                  {service.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section
                aria-labelledby="visit-heading"
                className="mt-14 border-t border-brand-line pt-10"
              >
                <Eyebrow>What a visit may involve</Eyebrow>
                <h2
                  id="visit-heading"
                  className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                >
                  The shape of the conversation.
                </h2>
                <ol className="mt-7 space-y-0 border-t border-brand-line">
                  {service.steps.map((step, index) => (
                    <li
                      key={step}
                      className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-brand-line py-5"
                    >
                      <span className="font-display text-xl text-brand-gold-deep">
                        0{index + 1}
                      </span>
                      <span className="text-sm leading-7 text-brand-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section
                aria-labelledby="benefits-heading"
                className="mt-14 border-t border-brand-line pt-10"
              >
                <Eyebrow>Potential benefits</Eyebrow>
                <h2
                  id="benefits-heading"
                  className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                >
                  A clear, non-guaranteed view.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
                  Benefits are described as possibilities, never guarantees. The clinic will confirm
                  the approved wording before publication.
                </p>
                <ul className="mt-6 space-y-3">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3 text-sm leading-7 text-brand-muted">
                      <Check
                        aria-hidden="true"
                        className="mt-1.5 shrink-0 text-brand-gold-deep"
                        size={16}
                        strokeWidth={1.5}
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="safety-heading"
                className="mt-14 border-t border-brand-line pt-10"
              >
                <Eyebrow>Suitability &amp; safety</Eyebrow>
                <h2
                  id="safety-heading"
                  className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                >
                  Informed care, in person.
                </h2>
                <div className="mt-6 border border-brand-line bg-brand-porcelain p-5 sm:p-7">
                  <div className="flex gap-3">
                    <ShieldCheck
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-brand-gold-deep"
                      size={22}
                      strokeWidth={1.3}
                    />
                    <div>
                      <p className="text-sm leading-7 text-brand-muted">
                        Suitability and risks should be discussed in a consultation. This page is
                        educational structure only and is not medical advice.
                      </p>
                      <ul className="mt-4 space-y-3">
                        {service.considerations.map((consideration) => (
                          <li
                            key={consideration}
                            className="flex gap-3 text-sm leading-6 text-brand-muted"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 size-1 shrink-0 rotate-45 bg-brand-gold"
                            />
                            {consideration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="enquiry-heading"
                className="mt-14 border-t border-brand-line pt-10"
              >
                <Eyebrow>Ask a question</Eyebrow>
                <h2
                  id="enquiry-heading"
                  className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                >
                  Not ready to request a date?
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
                  Send the clinic a question about {service.name}. A member of the team will reply
                  using the details you provide. No medical history is collected online.
                </p>
                <div className="mt-7 border border-brand-line bg-brand-porcelain p-5 sm:p-8">
                  <EnquiryForm serviceSlug={service.slug} serviceName={service.name} />
                </div>
              </section>

              {faqItems.length > 0 ? (
                <section
                  aria-labelledby="treatment-faq-heading"
                  className="mt-14 border-t border-brand-line pt-10"
                >
                  <Eyebrow>Questions</Eyebrow>
                  <h2
                    id="treatment-faq-heading"
                    className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                  >
                    Before you decide.
                  </h2>
                  <div className="mt-7">
                    <Accordion items={faqItems} />
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-brand-gold/50 bg-brand-porcelain p-6">
                <Eyebrow>Next step</Eyebrow>
                <h2 className="mt-3 font-display text-3xl leading-tight text-brand-indigo">
                  Speak with the clinic.
                </h2>
                <p className="mt-4 text-sm leading-6 text-brand-muted">
                  Ask a question or begin a consultation request. Booking is reviewed by the clinic
                  before it is confirmed.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <BookingLink
                    serviceName={service.name}
                    serviceSlug={service.slug}
                    className="w-full"
                  />
                  <ButtonLink to="/contact" variant="secondary" className="w-full">
                    Contact details
                  </ButtonLink>
                </div>
                <p className="mt-5 border-t border-brand-line pt-4 text-[0.6rem] leading-5 tracking-[0.08em] text-brand-muted uppercase">
                  Pricing is not published until the clinic supplies and approves it.
                </p>
              </div>

              <div className="mt-4 border border-brand-line p-5">
                <p className="text-[0.6rem] tracking-[0.16em] text-brand-gold-deep uppercase">
                  A note on language
                </p>
                <p className="mt-2 text-xs leading-6 text-brand-muted">
                  No result, recovery time or outcome is promised. Every treatment page will be
                  reviewed by the clinic before it is published.
                </p>
              </div>
            </aside>
          </div>

          {service.related.length > 0 ? (
            <section className="mt-20 border-t border-brand-line pt-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Eyebrow>Continue exploring</Eyebrow>
                  <h2 className="mt-4 font-display text-3xl text-brand-indigo sm:text-4xl">
                    Related treatments.
                  </h2>
                </div>
                <ButtonLink to="/treatments" variant="secondary">
                  View all treatments
                </ButtonLink>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {service.related.map((related) => (
                  <ServiceCard key={related.id} service={related} />
                ))}
              </div>
              <div className="mt-8 sm:hidden">
                <ButtonLink to="/treatments" variant="secondary" className="w-full">
                  View all treatments
                  <ArrowRight aria-hidden="true" size={15} />
                </ButtonLink>
              </div>
            </section>
          ) : null}
        </Container>
      </section>
    </>
  );
}
