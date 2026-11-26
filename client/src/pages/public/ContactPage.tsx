import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';

import { ContactForm } from '@/components/forms/PublicForms';
import { JsonLd } from '@/components/seo/JsonLd';
import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useSiteSettings } from '@/hooks/use-public-content';
import { buildBookingWhatsAppUrl } from '@/utils/whatsapp';

const siteUrl = (import.meta.env.VITE_SITE_URL?.trim() || 'http://localhost:5173').replace(
  /\/+$/,
  '',
);

export function ContactPage() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const contact = settings?.contact;
  const whatsappHref = buildBookingWhatsAppUrl(settings);

  const fullAddress = contact?.address ?? 'Shop No. 5, GH Society, Gokul Village 2, Shanti Park, Mira Road East, Maharashtra 401107';
  const locationQuery = encodeURIComponent(`Blue Miror Unisex Salon and Academy, ${fullAddress}`);
  const mapsHref = contact?.mapsUrl?.startsWith('http')
    ? contact.mapsUrl
    : `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
  const directionsHref = contact?.directionsUrl?.startsWith('http')
    ? contact.directionsUrl
    : `https://www.google.com/maps/dir/?api=1&destination=${locationQuery}`;

  const hours = contact?.hours ?? [];
  const sameHours = hours.length > 1 && hours.every((entry) => entry.value === hours[0]?.value);
  const hoursSummary =
    hours.length > 0
      ? sameHours
        ? `${hours[0].label} to ${hours.at(-1)?.label}, ${hours[0].value}`
        : `${hours[0].label}, ${hours[0].value}`
      : 'Message the clinic to confirm today’s hours.';

  const faqs = [
    {
      question: 'Where is Blue Miror located?',
      answer: `Blue Miror is at ${fullAddress}, close to Shanti Park in Mira Road East.`,
    },
    {
      question: 'What are the salon opening hours?',
      answer: `The published hours are ${hoursSummary}. Message the clinic on WhatsApp to confirm availability on a particular day.`,
    },
    {
      question: 'How do I book an appointment?',
      answer:
        'Send the treatment you have in mind and a preferred date or time on WhatsApp, or use the booking form on this website. The clinic confirms every appointment personally.',
    },
    {
      question: 'Are treatment prices listed online?',
      answer:
        'Yes. The full menu is published with prices. Final pricing can vary with hair length, volume or the products used, and is confirmed before the service begins.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteUrl}/contact/#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteUrl}/contact/` },
    ],
  };

  return (
    <>
      <Seo
        title="Contact Blue Miror — Mira Road East Salon & Clinic"
        description={`Visit Blue Miror at ${fullAddress}. Open ${hoursSummary}. Call ${contact?.phone ?? 'the clinic'} or book on WhatsApp.`}
      />
      <JsonLd data={[faqSchema, breadcrumbSchema]} />

      <PageHero
        eyebrow="Visit us"
        title={
          <>
            Blue Miror in
            <br /> <em className="text-brand-gold-deep">Mira Road East</em>.
          </>
        }
        intro="Hair, skin, nails and makeup under one roof, minutes from Shanti Park. Walk in for a chat or message ahead to reserve your slot."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
              Opening hours
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">{hoursSummary}</p>
            {contact?.phone ? (
              <a
                href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-brand-indigo transition-colors hover:text-brand-gold-deep"
              >
                <Phone aria-hidden="true" size={14} />
                {contact.phone}
              </a>
            ) : null}
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {settingsQuery.isError ? (
            <div className="mb-8">
              <ErrorState
                title="Clinic contact settings could not be loaded"
                message="Please try again in a moment."
                onRetry={() => void settingsQuery.refetch()}
              />
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-[1.5rem] border border-brand-gold/50 bg-brand-porcelain p-6">
              <MessageCircle
                aria-hidden="true"
                size={22}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-5">Book</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-brand-indigo">WhatsApp</h2>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                Send the treatment and preferred time. The clinic confirms every appointment
                personally.
              </p>
              <div className="mt-6">
                {whatsappHref ? (
                  <ButtonAnchor href={whatsappHref} external className="w-full">
                    {settings?.whatsapp.cta.booking ?? 'Book on WhatsApp'}
                  </ButtonAnchor>
                ) : (
                  <ButtonLink to="/book/" variant="secondary" className="w-full">
                    Request an appointment
                  </ButtonLink>
                )}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-brand-line bg-brand-porcelain p-6">
              <MapPin
                aria-hidden="true"
                size={22}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-5">Visit</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-brand-indigo">The salon</h2>
              <p className="mt-3 text-sm leading-6 text-brand-muted">{fullAddress}</p>
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[0.62rem] font-medium tracking-[0.15em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
                >
                  <Navigation aria-hidden="true" size={13} />
                  Get directions
                </a>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[0.62rem] font-medium tracking-[0.15em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
                >
                  <ExternalLink aria-hidden="true" size={13} />
                  Open in Google Maps
                </a>
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-brand-line bg-brand-porcelain p-6">
              <Clock
                aria-hidden="true"
                size={22}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-5">Hours</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-brand-indigo">Opening times</h2>
              {hours.length > 0 ? (
                <dl className="mt-4 space-y-2">
                  {hours.map((entry) => (
                    <div key={entry.label} className="flex justify-between gap-4 text-sm">
                      <dt className="text-brand-muted">{entry.label}</dt>
                      <dd className="text-brand-indigo">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-6 text-brand-muted">{hoursSummary}</p>
              )}
            </article>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-brand-line p-6">
              <Phone
                aria-hidden="true"
                size={20}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-4">Call</Eyebrow>
              {contact?.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                  className="mt-2 block font-display text-2xl text-brand-indigo transition-colors hover:text-brand-gold-deep"
                >
                  {contact.phone}
                </a>
              ) : (
                <p className="mt-2 text-sm leading-6 text-brand-muted">Call the salon directly.</p>
              )}
            </article>

            <article className="rounded-[1.5rem] border border-brand-line p-6">
              <Mail
                aria-hidden="true"
                size={20}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-4">Email</Eyebrow>
              {contact?.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="mt-2 block font-display text-2xl text-brand-indigo transition-colors hover:text-brand-gold-deep"
                >
                  {contact.email}
                </a>
              ) : (
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Send a message using the form below.
                </p>
              )}
            </article>
          </div>

          <div className="mt-12 grid gap-8 rounded-[2rem] border border-brand-line bg-brand-porcelain p-7 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <Eyebrow>A calm first step</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2rem,3.8vw,3.2rem)] leading-[0.98] text-brand-indigo">
                Write to the clinic.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-brand-muted">
                Ask about a treatment, suitability or availability. A message is not an appointment
                request — use the booking form when you are ready to choose a date.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <BookingLink />
                <ButtonLink to="/book/" variant="secondary">
                  Request an appointment
                </ButtonLink>
              </div>
            </div>
            <div>
              <ContactForm />
            </div>
          </div>

          <div className="mt-12">
            <Eyebrow>Before you visit</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(2rem,3.8vw,3rem)] leading-[0.98] text-brand-indigo">
              Common questions.
            </h2>
            <dl className="mt-6 grid gap-6 border-t border-brand-line pt-6 sm:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-display text-xl leading-tight text-brand-indigo">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-7 text-brand-muted">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>
    </>
  );
}
