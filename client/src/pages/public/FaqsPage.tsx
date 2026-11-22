import { Seo } from '@/components/seo/Seo';
import { Accordion } from '@/components/ui/Accordion';
import { BookingLink } from '@/components/ui/BookingLink';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useFaqs } from '@/hooks/use-public-content';

export function FaqsPage() {
  const faqsQuery = useFaqs();
  const faqs = faqsQuery.data?.items ?? [];
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <>
      <Seo
        title="Salon FAQs — Booking, Prices & Location"
        description="Answers about booking, prices, opening hours, location and treatments at Blue Miror salon and aesthetic clinic in Mira Road East, Mumbai."
      />
      <PageHero
        eyebrow="Questions"
        title={
          <>
            A little more
            <br /> <em className="text-brand-gold-deep">clarity</em>.
          </>
        }
        intro="Booking, pricing, parking and treatment questions — answered plainly. If something is missing, WhatsApp the clinic and ask."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
              Still unsure?
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Send the treatment you have in mind and we will tell you what is realistic for your
              hair or skin.
            </p>
            <div className="mt-4">
              <BookingLink variant="secondary" />
            </div>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {faqsQuery.isPending ? (
            <div
              role="status"
              aria-label="Loading frequently asked questions"
              className="space-y-5"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse border-b border-brand-line bg-brand-line/40"
                />
              ))}
            </div>
          ) : null}

          {faqsQuery.isError ? (
            <ErrorState
              title="FAQs could not be loaded"
              message="Please try again. No answers have been substituted."
              onRetry={() => void faqsQuery.refetch()}
            />
          ) : null}

          {faqsQuery.data && faqs.length === 0 ? (
            <EmptyState eyebrow="No answers yet" title="FAQs are being prepared">
              The clinic’s approved questions and answers will appear here when they are ready.
            </EmptyState>
          ) : null}

          {categories.length > 0 ? (
            <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
              <div>
                <Eyebrow>By topic</Eyebrow>
                <ul className="mt-5 space-y-2 border-t border-brand-line pt-4">
                  {categories.map((category) => (
                    <li key={category} className="text-sm text-brand-muted">
                      {category}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border border-brand-line bg-brand-porcelain p-5">
                  <p className="text-[0.6rem] tracking-[0.16em] text-brand-gold-deep uppercase">
                    Still unsure?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">
                    Begin with a conversation. The clinic can answer questions specific to your
                    circumstances.
                  </p>
                  <div className="mt-5">
                    <BookingLink className="w-full" />
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                {categories.map((category) => {
                  const items = faqs
                    .filter((faq) => faq.category === category)
                    .map((faq) => ({
                      id: faq.id,
                      question: faq.question,
                      answer: faq.answer,
                    }));

                  return (
                    <section key={category} aria-labelledby={`faq-${category}`}>
                      <h2
                        id={`faq-${category}`}
                        className="font-display text-3xl leading-tight text-brand-indigo"
                      >
                        {category}
                      </h2>
                      <div className="mt-5">
                        <Accordion items={items} />
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
