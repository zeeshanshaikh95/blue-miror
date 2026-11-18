import { TestimonialForm } from '@/components/forms/PublicForms';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useTestimonials } from '@/hooks/use-public-content';

const steps = [
  {
    number: '01',
    title: 'Verified',
    body: 'A real client experience is confirmed with the clinic. No review is written or paraphrased on a client’s behalf.',
  },
  {
    number: '02',
    title: 'Consented',
    body: 'The client agrees to publication and to how their name will be shown — full name, initials or anonymous.',
  },
  {
    number: '03',
    title: 'Approved',
    body: 'The clinic approves the final wording. New submissions enter a moderation queue and never publish automatically.',
  },
];

export function TestimonialsPage() {
  const testimonialsQuery = useTestimonials();
  const testimonials = testimonialsQuery.data?.items ?? [];

  return (
    <>
      <Seo
        title="Client stories"
        description="Verified Blue Miror client stories will appear here only after consent and clinic approval. No reviews have been invented."
        noindex
      />

      <PageHero
        eyebrow="Client stories"
        title={
          <>
            In their own
            <br /> <em className="text-brand-gold-deep">words</em>.
          </>
        }
        intro="A place for genuine, consented client experiences. This preview contains no testimonials, names, ratings or quotes because none have been supplied or verified."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
              Publication status
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Verified stories only. No review is invented, paraphrased or presented as a guarantee
              of results.
            </p>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {testimonialsQuery.isError ? (
            <ErrorState
              title="Client stories could not be loaded"
              message="Please try again. No review content has been substituted."
              onRetry={() => void testimonialsQuery.refetch()}
            />
          ) : null}

          {testimonialsQuery.isPending ? (
            <div
              role="status"
              aria-label="Loading client stories"
              className="grid gap-5 md:grid-cols-3"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse border border-brand-line bg-brand-line/40"
                />
              ))}
            </div>
          ) : null}

          {testimonials.length === 0 ? (
            <EmptyState
              eyebrow="Awaiting verified stories"
              title="No testimonials are published yet"
            >
              When the clinic has a genuine review with consent and approval, it will appear here.
              This page intentionally has no sample quotes or invented client names.
            </EmptyState>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.id}
                  className="border border-brand-line bg-brand-porcelain p-6"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-5xl leading-none text-brand-gold"
                  >
                    “
                  </span>
                  <p className="mt-3 font-display text-xl leading-relaxed text-brand-indigo">
                    {testimonial.quote}
                  </p>
                  <footer className="mt-5 border-t border-brand-line pt-4 text-xs text-brand-muted">
                    <cite className="not-italic">{testimonial.name}</cite>
                    {testimonial.treatment ? ` · ${testimonial.treatment}` : ''}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          <div className="mt-16 grid gap-10 border-t border-brand-line pt-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <Eyebrow>Our standard</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.5rem)] leading-[0.98] text-brand-indigo">
                Trust is earned in the detail.
              </h2>
            </div>
            <div className="border-t border-brand-line">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="grid gap-3 border-b border-brand-line py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-5"
                >
                  <span className="font-display text-lg text-brand-gold-deep">{step.number}</span>
                  <div>
                    <h3 className="font-display text-2xl text-brand-indigo">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-10 border-t border-brand-line pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <Eyebrow>Share your experience</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,3.1rem)] leading-[0.98] text-brand-indigo">
                If it helped, say so.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-brand-muted">
                Stories are submitted with consent, then reviewed by the clinic. Nothing publishes
                automatically, and a request to remove a story is always honoured.
              </p>
            </div>
            <div className="border border-brand-line bg-brand-porcelain p-6 sm:p-8">
              <TestimonialForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
