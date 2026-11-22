import { ArrowRight, CalendarDays, Check, MessageCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { BookingForm } from '@/components/forms/PublicForms';
import { Seo } from '@/components/seo/Seo';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useService, useSiteSettings } from '@/hooks/use-public-content';
import type { ServiceDetail } from '@/services/public-content';
import { buildBookingWhatsAppUrl, buildServiceEnquiryUrl } from '@/utils/whatsapp';

const bookingSteps = [
  {
    number: '01',
    title: 'Start the conversation',
    body: 'Message the salon on WhatsApp with the treatment you have in mind and a date or time that suits you.',
  },
  {
    number: '02',
    title: 'The clinic reviews the request',
    body: 'A request is not a confirmed appointment. The clinic checks availability and any preparation your treatment needs.',
  },
  {
    number: '03',
    title: 'Receive confirmation',
    body: 'Only the clinic’s explicit confirmation makes an appointment confirmed. Opening WhatsApp never changes the status.',
  },
];

export function BookPage() {
  const [searchParams] = useSearchParams();
  const serviceSlug = searchParams.get('service') ?? '';
  const settingsQuery = useSiteSettings();
  const serviceQuery = useService(serviceSlug);
  const settings = settingsQuery.data;
  const selectedService = serviceSlug
    ? (serviceQuery.data as ServiceDetail | undefined)
    : undefined;
  const whatsappHref = selectedService
    ? buildServiceEnquiryUrl(settings, selectedService.name)
    : buildBookingWhatsAppUrl(settings);

  const hours = settings?.contact.hours ?? [];
  const sameDailyHours = hours.length > 1 && hours.every((entry) => entry.value === hours[0]?.value);
  const hoursLabel =
    hours.length > 0
      ? sameDailyHours
        ? `${hours[0].label} to ${hours.at(-1)?.label}, ${hours[0].value}`
        : `${hours[0].label}, ${hours[0].value}`
      : null;

  return (
    <>
      <Seo
        title="Book an Appointment — WhatsApp Booking"
        description="Book hair, skin, nails or makeup at Blue Miror in Mira Road East. Send your treatment and preferred time on WhatsApp; the clinic confirms every appointment personally."
      />

      <PageHero
        eyebrow="Appointments"
        title={
          <>
            Begin with a
            <br /> <em className="text-brand-gold-deep">conversation</em>.
          </>
        }
        intro="Send the treatment you have in mind and a time that suits you on WhatsApp. The clinic checks availability and confirms every appointment personally."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
              Booking
            </p>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              {settings?.contact.phone
                ? `Call or WhatsApp ${settings.contact.phone}.`
                : 'Message the clinic to request a date.'}
            </p>
            {hoursLabel ? (
              <p className="mt-2 text-sm leading-6 text-brand-muted">Open {hoursLabel}.</p>
            ) : null}
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4.2vw,3.7rem)] leading-[0.97] text-brand-indigo">
                A request, not an instant booking.
              </h2>

              <div className="mt-8 border-t border-brand-line">
                {bookingSteps.map((step) => (
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

              <div className="mt-8 border border-brand-gold/50 bg-brand-porcelain p-5">
                <div className="flex items-start gap-3">
                  <MessageCircle
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-brand-gold-deep"
                    size={20}
                    strokeWidth={1.4}
                  />
                  <div>
                    <p className="text-[0.62rem] font-medium tracking-[0.15em] text-brand-indigo uppercase">
                      WhatsApp booking
                    </p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      {whatsappHref
                        ? `Send a message to ${settings?.contact.phone ?? 'the clinic'} and the team will confirm your slot.`
                        : 'Call the salon to request a date and time.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {whatsappHref ? (
                    <ButtonAnchor href={whatsappHref} external>
                      Continue on WhatsApp
                    </ButtonAnchor>
                  ) : (
                    <ButtonLink to="/treatments" variant="secondary">
                      Explore treatments
                    </ButtonLink>
                  )}
                  <ButtonLink to="/contact" variant="secondary">
                    Contact details
                  </ButtonLink>
                </div>
              </div>
            </div>

            <div>
              {selectedService ? (
                <div className="border border-brand-line bg-brand-porcelain p-6">
                  <div className="flex items-start justify-between gap-4">
                    <ContentBadge>Selected treatment</ContentBadge>
                    <ButtonLink
                      to={`/treatments/${selectedService.slug}`}
                      variant="quiet"
                      className="min-h-0 px-0 py-0 text-[0.625rem]"
                    >
                      View page
                      <ArrowRight aria-hidden="true" size={13} />
                    </ButtonLink>
                  </div>
                  <div className="mt-5">
                    <BrandVisual
                      variant={selectedService.visual}
                      label={`${selectedService.name} visual`}
                      className="aspect-[3/2]"
                    />
                  </div>
                  <h2 className="mt-5 font-display text-3xl leading-tight text-brand-indigo">
                    {selectedService.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-brand-muted">
                    {selectedService.shortDescription}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-brand-line pt-4">
                    <li className="flex gap-2 text-xs leading-5 text-brand-muted">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-brand-gold-deep"
                        size={14}
                      />
                      Suitability is discussed in consultation.
                    </li>
                    <li className="flex gap-2 text-xs leading-5 text-brand-muted">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-brand-gold-deep"
                        size={14}
                      />
                      Pricing is confirmed by the clinic.
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="border border-brand-line bg-brand-porcelain p-7">
                  <CalendarDays
                    aria-hidden="true"
                    size={26}
                    strokeWidth={1.2}
                    className="text-brand-gold-deep"
                  />
                  <h2 className="mt-5 font-display text-3xl leading-tight text-brand-indigo">
                    What to prepare.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-brand-muted">
                    When the request form is connected, it will ask only for the details needed to
                    contact you and understand which treatment you are interested in. No sensitive
                    medical history is collected online.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      'Your preferred treatment, if you have one',
                      'A preferred day or time window',
                      'A brief note about what you would like to discuss',
                    ].map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-6 text-brand-muted">
                        <Check
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-brand-gold-deep"
                          size={15}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 border border-brand-line p-5">
                <p className="text-[0.6rem] tracking-[0.15em] text-brand-gold-deep uppercase">
                  A note on confirmation
                </p>
                <p className="mt-2 text-xs leading-6 text-brand-muted">
                  {settings?.booking.note ??
                    'Every appointment request is reviewed before it is confirmed. Opening WhatsApp does not confirm an appointment.'}
                </p>
              </div>
            </div>
          </div>

          {serviceQuery.isError && serviceSlug ? (
            <p className="mt-8 text-sm text-brand-muted">
              The selected treatment could not be loaded.{' '}
              <ButtonLink to="/treatments" variant="quiet" className="min-h-0 px-0 py-0">
                Browse the service menu
              </ButtonLink>
            </p>
          ) : null}
          <div className="mt-16 border-t border-brand-line pt-12">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div>
                <Eyebrow>Request an appointment</Eyebrow>
                <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,3.1rem)] leading-[0.98] text-brand-indigo">
                  Tell the clinic what you need.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-brand-muted">
                  Your request is stored securely and reviewed by the clinic. Nothing is confirmed
                  until the clinic replies, and suitability is always discussed in consultation.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Only the details needed to contact you',
                    'No medical history collected online',
                    'A reference you can quote when the clinic replies',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-6 text-brand-muted">
                      <Check
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-gold-deep"
                        size={15}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-brand-line bg-brand-porcelain p-6 sm:p-8">
                {settings?.booking.enabled === false ? (
                  <div role="status" className="space-y-3">
                    <p className="font-display text-2xl leading-tight text-brand-indigo">
                      Online requests are paused.
                    </p>
                    <p className="text-sm leading-7 text-brand-muted">
                      The clinic is not accepting new appointment requests through the website right
                      now. Existing requests remain with the clinic, and no appointment is confirmed
                      until the clinic says so.
                    </p>
                    <ButtonLink to="/contact" variant="secondary">
                      Contact the clinic
                    </ButtonLink>
                  </div>
                ) : (
                  <BookingForm
                    serviceSlug={selectedService?.slug}
                    serviceName={selectedService?.name}
                  />
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
