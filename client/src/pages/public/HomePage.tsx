import { ArrowRight, ArrowUpRight, Clock, MapPin, Phone } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
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
  useGallery,
  useProducts,
  useServices,
  useSiteSettings,
  useTestimonials,
} from '@/hooks/use-public-content';
import { formatHoursLabel, phoneHref, shortAddress } from '@/utils/clinic-info';
import { cn } from '@/utils/cn';

const principles = [
  {
    title: 'A proper consultation',
    body: 'Your visit begins with a conversation about your hair, skin and the look you want — never a rushed upsell.',
  },
  {
    title: 'Professional products',
    body: 'The colour, care and nail lines used on the floor are the same professional brands on our shelf.',
  },
  {
    title: 'Clear, published pricing',
    body: 'The full menu is online with prices, so you can plan your visit before you sit in the chair.',
  },
];

export function HomePage() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const homepage = settings?.homepage;
  const slides = homepage?.slides ?? [];
  const heroCta =
    homepage?.heroCtaLabel && homepage?.heroCtaHref
      ? { label: homepage.heroCtaLabel, href: homepage.heroCtaHref }
      : null;

  const featuredQuery = useServices({ featured: true, limit: 6 });
  const catalogueQuery = useServices({ limit: 8 });
  const productsQuery = useProducts({ limit: 4 });
  const galleryQuery = useGallery();
  const testimonialsQuery = useTestimonials();

  const categories = catalogueQuery.data?.categories ?? featuredQuery.data?.categories ?? [];
  const servicesTotal = catalogueQuery.data?.total ?? 0;
  const productsTotal = productsQuery.data?.total ?? 0;
  const galleryItems = galleryQuery.data?.items ?? [];
  const testimonials = testimonialsQuery.data?.items ?? [];
  const products = productsQuery.data?.items ?? [];

  const signatureServices = useMemo(() => {
    const merged = [...(featuredQuery.data?.items ?? []), ...(catalogueQuery.data?.items ?? [])];

    return merged
      .filter((service, index, list) => list.findIndex((item) => item.id === service.id) === index)
      .slice(0, 6);
  }, [featuredQuery.data, catalogueQuery.data]);

  const hours = settings?.contact.hours ?? [];
  const hoursLabel = formatHoursLabel(hours);
  const tel = phoneHref(settings?.contact.phone);
  const area = shortAddress(settings?.contact.address);

  const highlights = [
    servicesTotal > 0 ? { label: 'Treatments', value: `${servicesTotal}+` } : null,
    hoursLabel ? { label: 'Open', value: hoursLabel } : null,
    area ? { label: 'Find us', value: area } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  // Lead with the salon floor rather than a single client photo: the interior
  // and the product wall set the tone before any close-up work.
  const introPrimary =
    slides[1]?.imageUrl ?? slides[0]?.imageUrl ?? galleryItems[0]?.imageUrl ?? null;
  const introSecondary =
    galleryItems[1]?.imageUrl ?? slides[2]?.imageUrl ?? signatureServices[1]?.imageUrl ?? null;
  const menuImage =
    signatureServices[4]?.imageUrl ?? slides[2]?.imageUrl ?? slides[1]?.imageUrl ?? null;

  // The lookbook uses the clinic's own gallery uploads only — not treatment
  // imagery, which belongs on the treatment cards themselves.
  const lookbook = useMemo(() => {
    const seen = new Set<string>();

    return (galleryQuery.data?.items ?? [])
      .filter((item) => item.imageUrl)
      .map((item) => ({
        id: `gallery-${item.id}`,
        url: item.imageUrl as string,
        title: item.title,
        to: '/gallery',
      }))
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      })
      .slice(0, 4);
  }, [galleryQuery.data]);

  return (
    <>
      <Seo description="Blue Miror is a salon and aesthetic clinic in Mira Road — facials, hair, nails, makeup and advanced skin care, with a full published menu and WhatsApp booking." />

      {slides.length > 0 ? (
        <HeroSlider slides={slides} highlights={highlights} />
      ) : (
        <section className="relative isolate overflow-hidden bg-brand-indigo-deep">
          <div className="absolute inset-0" aria-hidden="true">
            {introPrimary ? (
              <img
                src={introPrimary}
                alt=""
                className="size-full object-cover"
                fetchPriority="high"
              />
            ) : (
              <BrandVisual
                variant="bloom"
                label="Salon photography pending"
                className="size-full"
              />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,19,39,0.94)_0%,rgba(20,19,39,0.78)_45%,rgba(20,19,39,0.35)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(0deg,rgba(20,19,39,0.9),transparent)]" />
          </div>

          <Container className="relative flex min-h-[80svh] flex-col justify-center py-20">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-12 bg-brand-gold" />
              <Eyebrow tone="ivory">Blue Miror · Salon &amp; Aesthetic Clinic</Eyebrow>
            </div>
            <h1 className="mt-6 max-w-[46rem] font-display text-[clamp(2.9rem,6.4vw,5.9rem)] leading-[0.94] text-brand-ivory">
              {homepage?.heroHeading ?? (
                <>
                  Considered care,
                  <br /> guided by <em className="text-brand-gold">conversation</em>.
                </>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-brand-ivory/75 sm:text-lg">
              {homepage?.heroDescription ??
                'A calm, considered salon experience — shaped around listening first, explaining clearly and helping you make an informed choice.'}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {heroCta ? (
                <ButtonLink to={heroCta.href} variant="light">
                  {heroCta.label}
                </ButtonLink>
              ) : (
                <BookingLink variant="light" />
              )}
              <ButtonLink
                to="/treatments"
                variant="secondary"
                className="border-brand-ivory/40 text-brand-ivory hover:border-brand-ivory hover:bg-brand-ivory/10"
              >
                Explore the menu
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {categories.length > 0 ? (
        <div className="overflow-hidden border-y border-brand-gold/25 bg-brand-indigo-deep py-3.5">
          <div className="ticker-track flex w-max items-center">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
                {categories.map((category) => (
                  <span
                    key={`${copy}-${category.slug}`}
                    className="flex items-center gap-6 px-6 text-[0.65rem] font-medium tracking-[0.22em] text-brand-ivory/80 uppercase"
                  >
                    {category.name}
                    <span aria-hidden="true" className="size-1 rotate-45 bg-brand-gold" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <section className="salon-texture relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <Container className="grid gap-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
          <Reveal className="relative">
            <div className="overflow-hidden rounded-[2.5rem] rounded-tl-[7rem] border border-brand-line bg-brand-champagne shadow-[0_40px_80px_-50px_rgba(38,37,75,0.55)]">
              {introPrimary ? (
                <img
                  src={introPrimary}
                  alt="Inside the Blue Miror salon"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <BrandVisual
                  variant="arch"
                  label="Salon interior photography pending"
                  className="aspect-[4/5] w-full"
                />
              )}
            </div>

            {introSecondary ? (
              <div className="absolute -right-2 -bottom-10 w-[48%] overflow-hidden rounded-[1.75rem] border-[6px] border-brand-ivory shadow-[0_30px_60px_-30px_rgba(38,37,75,0.5)] sm:-right-6">
                <img
                  src={introSecondary}
                  alt={galleryItems[1]?.title ?? 'A moment at Blue Miror'}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </div>
            ) : null}

            <div className="absolute -top-5 -left-3 rounded-full border border-brand-gold/60 bg-brand-porcelain px-5 py-2.5 shadow-sm sm:-left-6">
              <p className="text-[0.58rem] font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
                Mira Road · Salon &amp; clinic
              </p>
            </div>
          </Reveal>

          <div>
            <Eyebrow>The Blue Miror experience</Eyebrow>
            <h2 className="mt-4 max-w-xl font-display text-[clamp(2.5rem,4.8vw,4.2rem)] leading-[0.98] tracking-[-0.02em] text-brand-indigo">
              {homepage?.aboutHeading ?? (
                <>
                  An unhurried kind of <em className="text-brand-gold-deep">beauty</em>.
                </>
              )}
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-brand-muted">
              {homepage?.aboutBody ??
                'Blue Miror is built around the consultation, not the quick sale. Warm light, a quiet chair and a team that explains every step — from a first facial to a full bridal look.'}
            </p>
            <p className="mt-4 max-w-xl text-base leading-8 text-brand-muted">
              Hair, skin, nails and makeup sit under one roof, so your routine fits into one calm
              visit instead of five different appointments.
            </p>

            <dl className="mt-9 grid grid-cols-3 gap-4 border-y border-brand-line py-6">
              {servicesTotal > 0 ? (
                <div>
                  <dt className="text-[0.55rem] tracking-[0.18em] text-brand-muted uppercase">
                    Treatments
                  </dt>
                  <dd className="mt-1 font-display text-4xl text-brand-indigo">
                    {servicesTotal}+
                  </dd>
                </div>
              ) : null}
              {categories.length > 0 ? (
                <div>
                  <dt className="text-[0.55rem] tracking-[0.18em] text-brand-muted uppercase">
                    Categories
                  </dt>
                  <dd className="mt-1 font-display text-4xl text-brand-indigo">
                    {categories.length}
                  </dd>
                </div>
              ) : null}
              {productsTotal > 0 ? (
                <div>
                  <dt className="text-[0.55rem] tracking-[0.18em] text-brand-muted uppercase">
                    Salon products
                  </dt>
                  <dd className="mt-1 font-display text-4xl text-brand-indigo">{productsTotal}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <ButtonLink to="/about" variant="secondary">
                Our story
              </ButtonLink>
              <Link
                to="/team"
                className="inline-flex items-center gap-2 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                Meet the team
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {homepage?.showFeatured === false ? null : (
        <section className="bg-brand-porcelain py-16 sm:py-24 lg:py-28">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Signature treatments"
                title={
                  <>
                    The treatments clients
                    <br /> <em className="text-brand-gold-deep">come back for</em>.
                  </>
                }
                intro="A short edit from the full menu — the looks, colours and care rituals our chairs are known for."
              />
              <Link
                to="/treatments"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                View all treatments
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            {categories.length > 0 ? (
              <div className="scrollbar-none mt-8 flex gap-2 overflow-x-auto pb-2">
                <Link
                  to="/treatments"
                  className="shrink-0 rounded-full bg-brand-indigo px-4 py-2 text-[0.6rem] font-medium tracking-[0.14em] text-brand-ivory uppercase"
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/treatments?category=${encodeURIComponent(category.slug)}`}
                    className="shrink-0 rounded-full border border-brand-line bg-brand-ivory px-4 py-2 text-[0.6rem] font-medium tracking-[0.14em] text-brand-muted uppercase transition-colors hover:border-brand-gold hover:text-brand-indigo"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-8">
              {featuredQuery.isPending && catalogueQuery.isPending ? (
                <LoadingState label="Loading signature treatments" />
              ) : null}
              {featuredQuery.isError && catalogueQuery.isError ? (
                <ErrorState
                  title="Treatments could not be loaded"
                  message="The service menu is temporarily unavailable. Please try again."
                  onRetry={() => {
                    void featuredQuery.refetch();
                    void catalogueQuery.refetch();
                  }}
                />
              ) : null}
              {!featuredQuery.isPending && signatureServices.length === 0 ? (
                <EmptyState title="Treatment content is being prepared">
                  The clinic&rsquo;s service menu will appear here once it is published.
                </EmptyState>
              ) : null}

              {signatureServices.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {signatureServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      )}

      {categories.length > 0 ? (
        <section className="border-y border-brand-line bg-brand-ivory py-16 sm:py-24">
          <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
            <Reveal className="relative">
              <div className="overflow-hidden rounded-[2.5rem] border border-brand-line">
                {menuImage ? (
                  <img
                    src={menuImage}
                    alt="A Blue Miror treatment in progress"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <BrandVisual
                    variant="orbit"
                    label="Treatment menu photography"
                    className="aspect-[4/5] w-full"
                  />
                )}
              </div>
              <div className="absolute right-4 bottom-5 rounded-2xl border border-brand-gold/40 bg-brand-porcelain/95 px-5 py-4 shadow-lg backdrop-blur">
                <p className="font-display text-3xl text-brand-indigo">
                  {servicesTotal > 0 ? `${servicesTotal}+` : '100+'}
                </p>
                <p className="mt-0.5 text-[0.55rem] tracking-[0.18em] text-brand-muted uppercase">
                  Treatments on the menu
                </p>
              </div>
            </Reveal>

            <div>
              <Eyebrow>The full menu</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4rem)] leading-[0.98] text-brand-indigo">
                Find your treatment.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-brand-muted">
                Every service and price is listed online. Browse by category, or search the menu for
                exactly what you have in mind.
              </p>

              <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      to={`/treatments?category=${encodeURIComponent(category.slug)}`}
                      className="group flex items-center justify-between gap-4 border-b border-brand-line py-3.5 transition-colors hover:border-brand-gold"
                    >
                      <span className="font-display text-xl leading-tight text-brand-indigo">
                        {category.name}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        size={16}
                        strokeWidth={1.5}
                        className="shrink-0 text-brand-gold-deep transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </Link>
                  </li>
                ))}
              </ul>

              <ButtonLink to="/treatments" className="mt-8">
                Browse the full menu
              </ButtonLink>
            </div>
          </Container>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section className="relative overflow-hidden bg-brand-indigo-deep py-16 text-brand-ivory sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-20 size-[26rem] rounded-full border border-brand-gold/20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-10rem] left-[-6rem] size-[22rem] rounded-full border border-brand-ivory/10"
          />

          <Container className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="The product shelf"
                tone="light"
                title={
                  <>
                    The professional
                    <br /> <em className="text-brand-gold">lines we use</em>.
                  </>
                }
                intro="Gel polish, cat-eye collections and professional care — the same products used on the salon floor."
              />
              <Link
                to="/products"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold/70 pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-ivory uppercase transition-colors hover:text-brand-gold"
              >
                View all products
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {homepage?.showGallery === false || lookbook.length === 0 ? null : (
        <section className="py-16 sm:py-24 lg:py-28">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="The lookbook"
                title={
                  <>
                    A little inspiration
                    <br /> for your <em className="text-brand-gold-deep">next visit</em>.
                  </>
                }
                intro="Real moments from the Blue Miror chairs, uploaded by the salon — no treatment stock imagery."
              />
              <Link
                to="/gallery"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                View the gallery
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            <div
              className={cn(
                'mt-10 grid gap-3',
                lookbook.length === 1
                  ? 'grid-cols-1'
                  : lookbook.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-2 md:grid-cols-4 md:grid-rows-2',
              )}
            >
              {lookbook.map((item, index) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className={cn(
                    'group relative overflow-hidden rounded-[1.5rem]',
                    lookbook.length >= 3 && index === 0 && 'col-span-2 row-span-2',
                  )}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      'w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]',
                      lookbook.length >= 3 && index === 0
                        ? 'aspect-square md:h-full'
                        : lookbook.length === 2
                          ? 'aspect-[4/5]'
                          : 'aspect-square',
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-indigo-deep/70 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90"
                  />
                  <span className="absolute inset-x-4 bottom-4 text-[0.62rem] font-medium tracking-[0.16em] text-brand-ivory uppercase">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {homepage?.showFaqs === false || testimonials.length === 0 ? null : (
        <section className="border-y border-brand-line bg-brand-blush/45 py-16 sm:py-24">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Eyebrow>Client stories</Eyebrow>
                <h2 className="mt-4 font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-indigo">
                  Kind words, <em className="text-brand-gold-deep">shared</em>.
                </h2>
              </div>
              <Link
                to="/testimonials"
                className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                All stories
                <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>

            <TestimonialMarquee testimonials={testimonials} showHeader={false} />
          </Container>
        </section>
      )}

      <section className="py-16 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-indigo-deep px-6 py-12 text-brand-ivory sm:px-10 sm:py-14 lg:px-14">
            {slides[1]?.imageUrl ?? slides[0]?.imageUrl ? (
              <img
                src={(slides[1]?.imageUrl ?? slides[0]?.imageUrl) as string}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full object-cover opacity-30"
              />
            ) : null}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(105deg,rgba(20,19,39,0.97)_0%,rgba(20,19,39,0.9)_50%,rgba(20,19,39,0.68)_100%)]"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-px w-10 bg-brand-gold" />
                  <Eyebrow tone="ivory">Reserve your visit</Eyebrow>
                </div>
                <h2 className="mt-5 max-w-xl font-display text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.94] text-brand-ivory">
                  Your chair is <em className="text-brand-gold">waiting</em>.
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-brand-ivory/70 sm:text-base">
                  Send a WhatsApp with the treatment you have in mind and a time that suits you. The
                  clinic confirms every appointment personally.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <BookingLink variant="light" />
                  {tel ? (
                    <a
                      href={tel}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-ivory/35 px-7 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] text-brand-ivory uppercase transition-colors hover:border-brand-ivory hover:bg-brand-ivory/10"
                    >
                      <Phone aria-hidden="true" size={15} strokeWidth={1.6} />
                      {settings?.contact.phone}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-ivory/15 bg-brand-ivory/5 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-brand-gold">
                  <Clock aria-hidden="true" size={15} strokeWidth={1.6} />
                  <p className="text-[0.58rem] tracking-[0.2em] uppercase">Opening hours</p>
                </div>

                {hours.length > 0 ? (
                  <dl className="mt-4 space-y-1.5 text-sm">
                    {hours.map((entry) => (
                      <div
                        key={entry.label}
                        className="flex items-baseline justify-between gap-4 border-b border-brand-ivory/10 pb-1.5 last:border-0"
                      >
                        <dt className="text-brand-ivory/65">{entry.label}</dt>
                        <dd className="text-brand-ivory">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {area ? (
                  <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-brand-ivory/65">
                    <MapPin aria-hidden="true" size={14} strokeWidth={1.6} className="mt-0.5" />
                    {settings?.contact.address}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-brand-line bg-brand-porcelain py-14">
        <Container className="grid gap-8 sm:grid-cols-3">
          {principles.map((principle, index) => (
            <div key={principle.title} className="flex gap-4">
              <span className="font-display text-2xl text-brand-gold-deep">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-2xl leading-tight text-brand-indigo">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">{principle.body}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
