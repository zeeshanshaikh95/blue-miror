import { Clock, Globe, Camera, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/use-public-content';
import { publicAssetUrl } from '@/utils/asset-url';
import { formatHoursLabel, phoneHref } from '@/utils/clinic-info';

import { BookingLink } from '../ui/BookingLink';
import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Eyebrow';

const exploreLinks = [
  { label: 'About', to: '/about/' },
  { label: 'Treatments', to: '/treatments/' },
  { label: 'Products', to: '/products/' },
  { label: 'Gallery', to: '/gallery/' },
  { label: 'Team', to: '/team/' },
  // Staff entrance. The link only opens the sign-in screen; every admin route
  // and API call is still guarded server-side.
  { label: 'Admin', to: '/admin/login' },
];

const informationLinks = [
  { label: 'Testimonials', to: '/testimonials/' },
  { label: 'FAQs', to: '/faqs/' },
  { label: 'Contact', to: '/contact/' },
  { label: 'Book a consultation', to: '/book/' },
];

const legalLinks = [
  { label: 'Privacy policy', to: '/privacy-policy/' },
  { label: 'Terms', to: '/terms/' },
  { label: 'Medical disclaimer', to: '/medical-disclaimer/' },
];

export function Footer() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const contact = settings?.contact;
  const currentYear = new Date().getFullYear();
  const tel = phoneHref(contact?.phone);
  const hoursLabel = formatHoursLabel(contact?.hours);
  const instagram = settings?.social.find((item) => /instagram/i.test(item.label))?.url ?? null;

  return (
    <footer className="bg-brand-indigo-deep pb-20 text-brand-ivory lg:pb-0">
      <div className="h-px bg-brand-gold/60" aria-hidden="true" />

      <Container className="pt-14 pb-10 sm:pt-16">
        <div className="flex flex-col gap-8 border-b border-brand-ivory/12 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="w-fit shrink-0 rounded-2xl bg-brand-porcelain p-2.5">
              <img
                src={publicAssetUrl(settings?.brand.logoUrl ?? '/brand/blue-miror-logo.png')}
                alt={settings?.brand.logoAlt ?? 'Blue Miror crest and wordmark'}
                width="484"
                height="612"
                className="h-20 w-auto"
              />
            </div>
            <div>
              <p className="max-w-xs font-display text-2xl leading-tight text-brand-ivory">
                Salon, hair &amp; aesthetic care in Mira Road.
              </p>
              <p className="mt-2 max-w-sm text-[0.65rem] leading-5 tracking-[0.12em] text-brand-ivory/60 uppercase">
                Mira Road East · Hair, skin, nails &amp; makeup
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BookingLink variant="light" />
            {tel ? (
              <a
                href={tel}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-ivory/30 px-6 text-[0.6875rem] font-medium tracking-[0.14em] text-brand-ivory uppercase transition-colors hover:border-brand-gold hover:text-brand-gold"
              >
                <Phone aria-hidden="true" size={14} strokeWidth={1.6} />
                Call the salon
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_0.9fr_1fr]">
          <div>
            <Eyebrow tone="ivory">Explore</Eyebrow>
            <ul className="mt-5 space-y-3 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-brand-ivory/70 transition-colors hover:text-brand-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Eyebrow tone="ivory">Information</Eyebrow>
            <ul className="mt-5 space-y-3 text-sm">
              {informationLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-brand-ivory/70 transition-colors hover:text-brand-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Eyebrow tone="ivory">Visit</Eyebrow>
            <div className="mt-5 space-y-3 text-sm text-brand-ivory/70">
              {contact?.address ? (
                <p className="flex gap-2.5">
                  <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
                  {contact.address}
                </p>
              ) : null}
              {contact?.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex gap-2.5 transition-colors hover:text-brand-gold"
                >
                  <Phone aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
                  {contact.phone}
                </a>
              ) : null}
              {contact?.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex gap-2.5 transition-colors hover:text-brand-gold"
                >
                  <Mail aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
                  {contact.email}
                </a>
              ) : null}
              {!contact?.address && !contact?.phone && !contact?.email ? (
                <p className="text-brand-ivory/60">
                  Contact details are not published until the clinic&rsquo;s verified information is
                  supplied.
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex items-center gap-3">
              {instagram ? (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Blue Miror on Instagram"
                  className="grid size-10 place-items-center rounded-full border border-brand-ivory/20 text-brand-ivory/80 transition-colors hover:border-brand-gold hover:text-brand-gold"
                >
                  <Camera aria-hidden="true" size={17} strokeWidth={1.6} />
                </a>
              ) : null}
              {settings?.social
                .filter((item) => !/instagram/i.test(item.label))
                .map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-ivory/20 px-3.5 py-2 text-[0.6rem] tracking-[0.12em] text-brand-ivory/80 uppercase transition-colors hover:border-brand-gold hover:text-brand-gold"
                  >
                    <Globe aria-hidden="true" size={13} />
                    {item.label}
                  </a>
                ))}
            </div>
          </div>

          <div>
            <Eyebrow tone="ivory">Opening hours</Eyebrow>
            <div className="mt-5 flex items-center gap-2 text-[0.58rem] tracking-[0.18em] text-brand-gold uppercase">
              <Clock aria-hidden="true" size={13} strokeWidth={1.6} />
              {hoursLabel ?? 'By appointment'}
            </div>

            {contact?.hours.length ? (
              <dl className="mt-4 space-y-1.5 text-sm">
                {contact.hours.map((entry) => (
                  <div key={entry.label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-brand-ivory/60">{entry.label}</dt>
                    <dd className="text-brand-ivory/85">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-brand-ivory/60">
                Please message the clinic to confirm today&rsquo;s hours.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-brand-ivory/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.65rem] tracking-[0.1em] text-brand-ivory/60 uppercase">
            © {currentYear} Blue Miror. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-[0.6rem] tracking-[0.08em] text-brand-ivory/60 uppercase transition-colors hover:text-brand-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
