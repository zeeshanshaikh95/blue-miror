import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { HeroSlider } from '@/components/ui/HeroSlider';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProductCard } from '@/components/ui/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { TestimonialMarquee } from '@/components/ui/TestimonialMarquee';
import {
  useFaqs,
  useGallery,
  useProducts,
  useServices,
  useSiteSettings,
  useTestimonials,
} from '@/hooks/use-public-content';
import { cn } from '@/utils/cn';

const principles = [
  {
    number: '01',
    title: 'Consultation first',
    body: 'Every journey begins with a private conversation about your concerns, priorities and questions.',
  },
  {
    number: '02',
    title: 'Clarity, always',
    body: 'Recommendations, suitability and aftercare are explained in plain language, with room for your questions.',
  },
  {
    number: '03',
    title: 'A service-led experience',
    body: 'No products, no cart, no pressure — a considered clinic experience built around treatments and care.',
  },
];

export function HomePage() {
  const servicesQuery = useServices({ featured: true, limit: 3 });
  const productsQuery = useProducts({ featured: true, limit: 3 });
  const galleryQuery = useGallery();
  const faqsQuery = useFaqs();
  const testimonialsQuery = useTestimonials();
  const galleryItems = galleryQuery.data?.items.slice(0, 4) ?? [];
  const faqs = faqsQuery.data?.items.slice(0, 4) ?? [];
  const testimonials = testimonialsQuery.data?.items ?? [];
  const settingsQuery = useSiteSettings();
  const homepage = settingsQuery.data?.homepage;
  const slides = homepage?.slides ?? [];
  const heroCta =
    homepage?.heroCtaLabel && homepage?.heroCtaHref
      ? { label: homepage.heroCtaLabel, href: homepage.heroCtaHref }
      : null;

  return (
    <>
      <Seo description="Blue Miror is a service-led aesthetic clinic designed around considered care, clear communication and unhurried consultation." />

      {slides.length > 0 ? (
        <HeroSlider slides={slides} />
      ) : (
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-1/4 h-full w-px bg-linear-to-b from-transparent via-brand-gold/25 to-transparent"
        />

        <Container className="relative grid gap-14 py-14 sm:py-20 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <Eyebrow>Blue Miror · Aesthetic Clinic</Eyebrow>
            <h1 className="mt-6 max-w-2xl font-display text-[clamp(3.2rem,6.7vw,6rem)] leading-[0.92] font-normal tracking-[-0.035em] text-brand-indigo">
              {homepage?.heroHeading ? (
                homepage.heroHeading
              ) : (
                <>
                  Considered care,
                  <br /> guided by <em className="text-brand-gold-deep">conversation</em>.
                </>
              )}
            </h1>

            <p className="mt-7 max-w-xl text-[1.02rem] leading-8 text-brand-muted sm:text-lg">
              {homepage?.heroDescription ??
                'A calm, considered aesthetic clinic experience — shaped around listening first, explaining clearly and helping you make an informed choice.'}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {heroCta ? (
                <ButtonLink to={heroCta.href}>{heroCta.label}</ButtonLink>
              ) : (
                <BookingLink />
              )}
              <ButtonLink to="/treatments" variant="secondary">
                Explore treatments
              </ButtonLink>
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

          <div className="relative mx-auto w-full max-w-[31rem] lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-t-full border border-brand-gold/35"
            />
            {homepage?.heroImageUrl ? (
              <img
                src={homepage.heroImageUrl}
                alt=""
                width={760}
                height={950}
                className="aspect-[4/5] w-full rounded-t-full object-cover"
              />
            ) : (
              <BrandVisual
                variant="arch"
                label="Editorial clinic portrait — photography pending"
                className="aspect-[4/5] w-full rounded-t-full"
              />
            )}

            <div className="absolute bottom-8 -left-3 z-20 hidden max-w-[15rem] border border-brand-gold/50 bg-brand-porcelain p-4 sm:block lg:-left-8">
              <p className="text-[0.625rem] tracking-[0.18em] text-brand-gold-deep uppercase">
                A considered beginning
              </p>
              <p className="mt-2 font-display text-xl leading-tight text-brand-indigo">
                Care that starts with your questions.
              </p>
            </div>
          </div>
        </Container>
      </section>
      )}

      <section className="border-y border-brand-line bg-brand-porcelain py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Eyebrow>The Blue Miror approach</Eyebrow>
              <h2 className="mt-5 max-w-lg font-display text-[clamp(2.5rem,4.8vw,4.2rem)] leading-[0.96] text-brand-indigo">
                {homepage?.aboutHeading ?? 'An aesthetic experience with room to think.'}
              </h2>
            </div>

            <div className="lg:pt-10">
              <p className="max-w-xl text-base leading-8 text-brand-muted">
                {homepage?.aboutBody ??
                  'Blue Miror is built around the consultation, not the quick sale. The experience is intentionally quiet and editorial: considered typography, warm neutrals and space to ask the questions that matter.'}
              </p>
              <p className="mt-5 max-w-xl text-base leading-8 text-brand-muted">
                Final clinic photography, treatment descriptions and practitioner information will
                replace the sample content in this preview after approval.
              </p>
              <Link
                to="/about"
                className="mt-7 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                Discover our approach
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-0 border-t border-brand-line sm:grid-cols-3 sm:border-l">
            {principles.map((principle) => (
              <div
                key={principle.number}
                className="border-b border-brand-line py-7 sm:border-r sm:border-b-0 sm:px-6 lg:px-8"
              >
                <span className="font-display text-lg text-brand-gold-deep">
                  {principle.number}
                </span>
                <h3 className="mt-3 font-display text-2xl leading-tight text-brand-indigo">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-brand-muted">{principle.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {homepage?.showFeatured === false ? null : (
        <section className="py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Treatments"
                title={
                  <>
                    A menu shaped by
                    <br /> <em className="text-brand-gold-deep">conversation</em>.
                  </>
                }
                intro="Explore the service structure. Final treatment names, suitability information and aftercare will be supplied and approved by the clinic."
              />
              <Link
                to="/treatments"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                View all treatments
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="mt-10">
              {servicesQuery.isPending ? (
                <LoadingState label="Loading featured treatments" />
              ) : null}
              {servicesQuery.isError ? (
                <ErrorState
                  title="Treatments could not be loaded"
                  message="The service menu is temporarily unavailable. Please try again."
                  onRetry={() => void servicesQuery.refetch()}
                />
              ) : null}
              {servicesQuery.data && servicesQuery.data.items.length === 0 ? (
                <EmptyState title="Treatment content is being prepared">
                  The clinic’s service menu will appear here once it has been approved for
                  publication.
                </EmptyState>
              ) : null}
              {servicesQuery.data && servicesQuery.data.items.length > 0 ? (
                <>
                  <div className="mb-4 flex justify-end">
                    <ContentBadge>Sample service menu</ContentBadge>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {servicesQuery.data.items.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </Container>
        </section>
      )}

      {productsQuery.data && productsQuery.data.items.length > 0 ? (
        <section className="border-t border-brand-line bg-brand-porcelain py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="The product shelf"
                title={
                  <>
                    Products we use
                    <br /> <em className="text-brand-gold-deep">every day</em>.
                  </>
                }
                intro="The professional brands behind our nail and beauty services, from gel polish to cat-eye collections."
              />
              <Link
                to="/products"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                View all products
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            <Reveal className="mt-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {productsQuery.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Reveal>
          </Container>
        </section>
      ) : null}

      <section className="bg-brand-indigo-deep text-brand-ivory">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-24">
          <div>
            <Eyebrow tone="ivory">The standard</Eyebrow>
            <h2 className="mt-5 max-w-xl font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-ivory">
              A quieter kind of clinic.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-brand-ivory/65 sm:text-base">
              Premium does not need to be loud. Blue Miror is designed to feel private, considered
              and clear — with the clinic’s real story, team and standards to follow.
            </p>
          </div>

          <div className="border-t border-brand-ivory/15">
            {[
              [
                'Private by design',
                'A calm, editorial environment with space for a proper conversation.',
              ],
              [
                'Clear next steps',
                'Suitability, risks, aftercare and costs explained before you decide.',
              ],
              [
                'No pressure',
                'A service-led experience. There is no product store, cart or checkout.',
              ],
            ].map(([title, body], index) => (
              <div
                key={title}
                className="grid gap-3 border-b border-brand-ivory/15 py-5 sm:grid-cols-[2rem_1fr] sm:gap-5"
              >
                <span className="font-display text-lg text-brand-gold">0{index + 1}</span>
                <div>
                  <h3 className="font-display text-2xl leading-tight text-brand-ivory">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-ivory/60">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {homepage?.showGallery === false ? null : (
        <section className="border-b border-brand-line py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="A glimpse"
                title="Space to feel at ease."
                intro="A first look at the visual direction. Final photography will be licensed clinic imagery, not simulated results."
              />
              <Link
                to="/gallery"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                View the gallery
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
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
              {galleryItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {galleryItems.map((item, index) => (
                    <Link
                      key={item.id}
                      to="/gallery"
                      className={
                        index === 1 ? 'group mt-8 overflow-hidden sm:mt-12' : 'group overflow-hidden'
                      }
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.alt}
                          loading="lazy"
                          decoding="async"
                          className={cn(
                            'w-full border border-brand-line object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]',
                            index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square',
                          )}
                        />
                      ) : (
                        <BrandVisual
                          variant={item.variant}
                          label={item.title}
                          className={cn(
                            'transition-transform duration-700 ease-out group-hover:scale-[1.05]',
                            index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square',
                          )}
                        />
                      )}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      )}

      {homepage?.showFaqs === false ? null : (
        <section className="py-16 sm:py-20 lg:py-24">
          <Container className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
            <div>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mt-5 max-w-md font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-indigo">
                A little more clarity.
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-brand-muted">
                The questions we expect to shape the visit. Every answer will be reviewed by the
                clinic before the website goes live.
              </p>
              <Link
                to="/faqs"
                className="mt-6 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                All FAQs
                <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            <div>
              {faqsQuery.isPending ? (
                <div
                  className="space-y-4"
                  role="status"
                  aria-label="Loading frequently asked questions"
                >
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-14 animate-pulse border-b border-brand-line bg-brand-line/40"
                    />
                  ))}
                </div>
              ) : null}
              {faqsQuery.isError ? (
                <ErrorState
                  title="FAQs could not be loaded"
                  message="Please try again or explore the contact page."
                  onRetry={() => void faqsQuery.refetch()}
                />
              ) : null}
              {faqs.length > 0 ? (
                <div className="border-t border-brand-line">
                  {faqs.map((faq) => (
                    <Link
                      key={faq.id}
                      to="/faqs"
                      className="group flex items-start justify-between gap-6 border-b border-brand-line py-5"
                    >
                      <span className="font-display text-xl leading-snug text-brand-indigo transition-colors group-hover:text-brand-gold-deep sm:text-2xl">
                        {faq.question}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-gold-deep"
                        size={17}
                        strokeWidth={1.5}
                      />
                    </Link>
                  ))}
                </div>
              ) : null}

              <TestimonialMarquee testimonials={testimonials} />
            </div>
          </Container>
        </section>
      )}

      <section className="pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <div className="relative overflow-hidden border border-brand-gold/45 bg-brand-porcelain px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-20 size-64 rounded-full border border-brand-gold/25"
            />
            <div
              aria-hidden="true"
              className="absolute -top-12 -right-8 size-44 rounded-full border border-brand-gold/20"
            />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <Eyebrow>Begin</Eyebrow>
                <h2 className="mt-4 max-w-2xl font-display text-[clamp(2.7rem,5vw,4.4rem)] leading-[0.94] text-brand-indigo">
                  Start with a conversation.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-brand-muted sm:text-base">
                  Booking will be handled through the clinic’s verified WhatsApp channel. The number
                  is not displayed until it has been supplied and approved.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <BookingLink />
                <ButtonLink to="/contact" variant="secondary">
                  Contact the clinic
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
