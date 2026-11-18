import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

import { ContactForm } from '@/components/forms/PublicForms';
import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useSiteSettings } from '@/hooks/use-public-content';
import { buildBookingWhatsAppUrl } from '@/utils/whatsapp';

export function ContactPage() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const contact = settings?.contact;
  const whatsappHref = buildBookingWhatsAppUrl(settings);

  return (
    <>
      <Seo
        title="Contact"
        description="Contact Blue Miror. Verified clinic details will be published only when supplied; WhatsApp is the planned primary booking channel."
        noindex
      />

      <PageHero
        eyebrow="Contact"
        title={
          <>
            Start a
            <br /> <em className="text-brand-gold-deep">conversation</em>.
          </>
        }
        intro="The clinic’s verified address, phone number and opening hours will appear here when supplied. No contact detail has been invented for this preview."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <ContentBadge>Details awaiting verification</ContentBadge>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              WhatsApp will be the primary booking channel once the clinic configures its number and
              approved message centrally.
            </p>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {settingsQuery.isError ? (
            <div className="mb-8">
              <ErrorState
                title="Clinic contact settings could not be loaded"
                message="Please try again. No contact details have been substituted."
                onRetry={() => void settingsQuery.refetch()}
              />
            </div>
          ) : null}

          {settingsQuery.isPending ? (
            <p
              role="status"
              aria-label="Loading clinic contact settings"
              className="mb-8 text-xs tracking-[0.12em] text-brand-muted uppercase"
            >
              Checking clinic details…
            </p>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <article className="border border-brand-gold/50 bg-brand-porcelain p-6">
              <MessageCircle
                aria-hidden="true"
                size={22}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-5">Booking</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-brand-indigo">WhatsApp</h2>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                {whatsappHref
                  ? 'Begin a booking request through the clinic’s verified WhatsApp channel.'
                  : 'The verified WhatsApp number is not yet configured. No placeholder number is displayed.'}
              </p>
              <div className="mt-6">
                {whatsappHref ? (
                  <ButtonAnchor href={whatsappHref} external className="w-full">
                    {settings?.whatsapp.cta.booking ?? 'Book a consultation'}
                  </ButtonAnchor>
                ) : (
                  <ButtonLink to="/book" variant="secondary" className="w-full">
                    How booking works
                  </ButtonLink>
                )}
              </div>
            </article>

            <article className="border border-brand-line bg-brand-porcelain p-6">
              <MapPin
                aria-hidden="true"
                size={22}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-5">Visit</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-brand-indigo">The clinic</h2>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                {contact?.address ??
                  'The verified address and directions will be published here after clinic approval.'}
              </p>
              {contact?.mapsUrl ? (
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-[0.62rem] font-medium tracking-[0.15em] text-brand-indigo uppercase"
                >
                  Open map
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              ) : null}
            </article>

            <article className="border border-brand-line bg-brand-porcelain p-6">
              <Clock
                aria-hidden="true"
                size={22}
                strokeWidth={1.3}
                className="text-brand-gold-deep"
              />
              <Eyebrow className="mt-5">Hours</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-brand-indigo">Opening times</h2>
              {contact?.hours.length ? (
                <dl className="mt-4 space-y-2">
                  {contact.hours.map((entry) => (
                    <div key={entry.label} className="flex justify-between gap-4 text-sm">
                      <dt className="text-brand-muted">{entry.label}</dt>
                      <dd className="text-brand-indigo">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-6 text-brand-muted">
                  Opening hours will be published once the clinic confirms them.
                </p>
              )}
            </article>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="border border-brand-line p-6">
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
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Phone number pending verification.
                </p>
              )}
            </article>

            <article className="border border-brand-line p-6">
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
                  Email address pending verification.
                </p>
              )}
            </article>
          </div>

          <div className="mt-12 grid gap-8 border border-brand-line bg-brand-porcelain p-7 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <Eyebrow>A calm first step</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2rem,3.8vw,3.2rem)] leading-[0.98] text-brand-indigo">
                Write to the clinic.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-brand-muted">
                Send a short message and the clinic will reply to the address you provide. A message
                is not an appointment request — use the booking form when you are ready to ask for a
                date.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <BookingLink />
                <ButtonLink to="/book" variant="secondary">
                  Request an appointment
                </ButtonLink>
              </div>
            </div>
            <div>
              <ContactForm />
            </div>
          </div>

          <div className="mt-6 border border-brand-line bg-brand-porcelain p-7 sm:p-9">
            <Eyebrow>Map</Eyebrow>
            <div className="mt-4 flex min-h-44 flex-col items-center justify-center border border-dashed border-brand-gold/50 bg-brand-ivory px-6 text-center">
              <MapPin
                aria-hidden="true"
                size={24}
                strokeWidth={1.2}
                className="text-brand-gold-deep"
              />
              <p className="mt-3 max-w-md text-sm leading-6 text-brand-muted">
                A map will load only after the clinic supplies a verified location. No placeholder
                pin or approximate address is shown.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
