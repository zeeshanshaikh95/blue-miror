import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteSettings, useTeam } from '@/hooks/use-public-content';
import { formatHoursLabel, phoneHref } from '@/utils/clinic-info';

const standards = [
  {
    title: 'The consultation comes first',
    body: 'We ask about your hair, skin and routine before recommending anything — so the result suits the life you go back to.',
  },
  {
    title: 'Clarity over pressure',
    body: 'Prices are published, options are explained in plain language, and you decide at your own pace.',
  },
  {
    title: 'A service-led experience',
    body: 'Hair, skin, nails and makeup under one roof — built around treatments and care, never a checkout.',
  },
];

export function AboutPage() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const teamQuery = useTeam();
  const hasTeam = (teamQuery.data?.items.length ?? 0) > 0;
  const slides = settings?.homepage?.slides ?? [];
  const heroImage = slides[1]?.imageUrl ?? slides[0]?.imageUrl ?? settings?.homepage?.heroImageUrl;
  const tel = phoneHref(settings?.contact.phone);
  const hoursLabel = formatHoursLabel(settings?.contact.hours);

  return (
    <>
      <Seo
        title="About Blue Miror in Mira Road East"
        description="Blue Miror is a unisex salon and aesthetic clinic in Mira Road East — hair, skin, nails and makeup under one roof, with a consultation-led approach."
      />

      <section className="salon-texture py-16 sm:py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-[2.5rem] border border-brand-gold/35"
            />
            <div className="overflow-hidden rounded-[2.5rem] rounded-tl-[7rem] shadow-[0_40px_80px_-50px_rgba(38,37,75,0.55)]">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt="Inside the Blue Miror salon"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <BrandVisual
                  variant="drape"
                  label="Salon interior — photography pending"
                  className="aspect-[4/5] w-full"
                />
              )}
            </div>
            {hoursLabel ? (
              <div className="absolute -right-2 -bottom-6 rounded-2xl border border-brand-gold/40 bg-brand-porcelain px-5 py-4 shadow-lg sm:-right-5">
                <p className="text-[0.55rem] tracking-[0.18em] text-brand-muted uppercase">Open</p>
                <p className="mt-1 font-display text-xl text-brand-indigo">{hoursLabel}</p>
              </div>
            ) : null}
          </div>

          <div>
            <Eyebrow>Our point of view</Eyebrow>
            <h2 className="mt-5 font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-indigo">
              Beauty, without the noise.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-brand-muted">
              <p>
                Blue Miror is a unisex salon and aesthetic clinic in Mira Road East. Hair, skin,
                nails and makeup sit under one roof, so your routine fits into one calm visit
                instead of five different appointments.
              </p>
              <p>
                Every visit starts with a conversation: what you want, what suits your hair or skin,
                and how much upkeep you are happy with. We explain the options, the price and the
                aftercare before we begin — no pressure and no guesswork.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <BookingLink />
              <Link
                to="/treatments"
                className="inline-flex items-center gap-2 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
              >
                See the menu
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-brand-line bg-brand-porcelain py-16 sm:py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="What we stand for"
            title="The standard is the experience."
            intro="Three simple promises that shape every appointment, from a quick threading to a full bridal morning."
          />

          <div className="mt-12 grid gap-0 border-t border-brand-line md:grid-cols-3 md:border-l">
            {standards.map((standard, index) => (
              <div
                key={standard.title}
                className="border-b border-brand-line py-7 md:border-r md:border-b-0 md:px-7 lg:px-9"
              >
                <span className="font-display text-lg text-brand-gold-deep">0{index + 1}</span>
                <h3 className="mt-3 font-display text-2xl leading-tight text-brand-indigo">
                  {standard.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-brand-muted">{standard.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Eyebrow>The people</Eyebrow>
            <h2 className="mt-5 max-w-xl font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-indigo">
              The people behind the chair.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-brand-muted">
              Stylists, therapists and makeup artists who work with you rather than at you. Ask for
              the same face next time and we will remember what worked.
            </p>
            <Link
              to="/team"
              className="mt-7 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
            >
              Meet the team
              <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
            </Link>
          </div>

          <div>
            {hasTeam && teamQuery.data ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {teamQuery.data.items.map((member) => (
                  <article
                    key={member.id}
                    className="rounded-[1.5rem] border border-brand-line bg-brand-porcelain p-5"
                  >
                    <Eyebrow>{member.designation}</Eyebrow>
                    <h3 className="mt-3 font-display text-2xl text-brand-indigo">{member.name}</h3>
                    {member.bio ? (
                      <p className="mt-3 text-sm leading-6 text-brand-muted">{member.bio}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-brand-line bg-brand-porcelain p-8">
                <p className="font-display text-3xl leading-tight text-brand-indigo">
                  Come and meet us in the salon.
                </p>
                <p className="mt-3 text-sm leading-7 text-brand-muted">
                  Our team profiles are being updated here. In the meantime, message the clinic and
                  we will match you with the right stylist or therapist for your treatment.
                </p>
                <div className="mt-5">
                  <BookingLink />
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <div className="grid gap-8 rounded-[2rem] border border-brand-gold/40 bg-brand-porcelain p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Eyebrow>Next step</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.1rem,4vw,3.3rem)] leading-[0.98] text-brand-indigo">
                A considered place to begin.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-brand-muted">
                Find the treatment you have in mind, or send us a message and we will help you choose.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <BookingLink />
              <ButtonLink to="/treatments" variant="secondary">
                Explore treatments
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-brand-line pt-12 sm:pt-16">
        <PageHero
          eyebrow="About Blue Miror"
          title={
            <>
              A calm corner of
              <br /> <em className="text-brand-gold-deep">Mira Road</em>.
            </>
          }
          intro="Hair, skin, nails and makeup under one roof — a neighbourhood salon with a considered, consultation-led approach."
          aside={
            <div className="space-y-3 border-l border-brand-gold/60 pl-5 text-sm leading-6 text-brand-muted">
              {settings?.contact.address ? (
                <p className="flex gap-2.5">
                  <MapPin aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
                  {settings.contact.address}
                </p>
              ) : null}
              {hoursLabel ? (
                <p className="flex gap-2.5">
                  <Clock aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
                  {hoursLabel}
                </p>
              ) : null}
              {tel ? (
                <a href={tel} className="flex gap-2.5 transition-colors hover:text-brand-gold-deep">
                  <Phone aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
                  {settings?.contact.phone}
                </a>
              ) : null}
            </div>
          }
        />
      </section>
    </>
  );
}
