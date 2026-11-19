import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/use-public-content';
import { publicAssetUrl } from '@/utils/asset-url';

import { BookingLink } from '../ui/BookingLink';
import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Eyebrow';

const exploreLinks = [
  { label: 'About', to: '/about' },
  { label: 'Treatments', to: '/treatments' },
  { label: 'Products', to: '/products' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Team', to: '/team' },
];

const informationLinks = [
  { label: 'Testimonials', to: '/testimonials' },
  { label: 'FAQs', to: '/faqs' },
  { label: 'Contact', to: '/contact' },
  { label: 'Book a consultation', to: '/book' },
];

const legalLinks = [
  { label: 'Privacy policy', to: '/privacy-policy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Medical disclaimer', to: '/medical-disclaimer' },
];

export function Footer() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const contact = settings?.contact;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-indigo-deep text-brand-ivory">
      <div className="h-px bg-brand-gold/60" aria-hidden="true" />

      <Container className="py-14 sm:py-18 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr_0.65fr_1fr]">
          <div>
            <div className="w-fit bg-brand-porcelain p-3">
              <img
                src={publicAssetUrl(settings?.brand.logoUrl ?? '/brand/blue-miror-logo.png')}
                alt={settings?.brand.logoAlt ?? 'Blue Miror crest and wordmark'}
                width="484"
                height="612"
                className="h-24 w-auto"
              />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-brand-ivory/65">
              A service-led aesthetic clinic shaped around considered care, clear communication and
              unhurried consultation.
            </p>
            <p className="mt-4 max-w-sm text-[0.65rem] leading-5 tracking-[0.1em] text-brand-ivory/65 uppercase">
              Preview content. Clinic details, photography and approved treatment information are
              pending.
            </p>
          </div>

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
            <Eyebrow tone="ivory">Clinic</Eyebrow>
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
                <p className="text-brand-ivory/65">
                  Contact details are not published until the clinic’s verified information is
                  supplied.
                </p>
              ) : null}

              {settings?.social.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 transition-colors hover:text-brand-gold"
                >
                  <Globe aria-hidden="true" size={15} />
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-7">
              <BookingLink variant="light" className="w-full text-center" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-brand-ivory/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.65rem] tracking-[0.1em] text-brand-ivory/65 uppercase">
            © {currentYear} Blue Miror. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-[0.65rem] tracking-[0.08em] text-brand-ivory/65 uppercase transition-colors hover:text-brand-gold"
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
