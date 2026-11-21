import { Clock, Camera, MapPin, Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/use-public-content';
import { publicAssetUrl } from '@/utils/asset-url';
import { formatHoursLabel, phoneHref } from '@/utils/clinic-info';
import { cn } from '@/utils/cn';

import { BookingLink } from '../ui/BookingLink';
import { Container } from '../ui/Container';

const navigation = [
  { label: 'About', to: '/about' },
  { label: 'Treatments', to: '/treatments' },
  { label: 'Products', to: '/products' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Team', to: '/team' },
  { label: 'Contact', to: '/contact' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const logoUrl = settings?.brand.logoUrl ?? '/brand/blue-miror-logo.png';
  const logoAlt = settings?.brand.logoAlt ?? 'Blue Miror crest and wordmark';

  const phone = settings?.contact.phone ?? null;
  const tel = phoneHref(phone);
  const hoursLabel = formatHoursLabel(settings?.contact.hours);
  const instagram = settings?.social.find((item) => /instagram/i.test(item.label))?.url ?? null;

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-brand-indigo-deep text-brand-ivory md:block">
        <Container className="flex h-9 items-center justify-between gap-6 text-[0.6rem] font-medium tracking-[0.16em] uppercase">
          <span className="flex items-center gap-2 text-brand-ivory/75">
            <MapPin aria-hidden="true" size={12} strokeWidth={1.6} className="text-brand-gold" />
            {settings?.contact.address ?? 'Mira Road East'}
          </span>
          <div className="flex items-center gap-6 text-brand-ivory/75">
            {hoursLabel ? (
              <span className="flex items-center gap-2">
                <Clock aria-hidden="true" size={12} strokeWidth={1.6} className="text-brand-gold" />
                {hoursLabel}
              </span>
            ) : null}
            {phone ? (
              <a
                href={tel ?? '#'}
                className="flex items-center gap-2 transition-colors hover:text-brand-gold"
              >
                <Phone aria-hidden="true" size={12} strokeWidth={1.6} className="text-brand-gold" />
                {phone}
              </a>
            ) : null}
            {instagram ? (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Blue Miror on Instagram"
                className="transition-colors hover:text-brand-gold"
              >
                <Camera aria-hidden="true" size={14} strokeWidth={1.6} />
              </a>
            ) : null}
          </div>
        </Container>
      </div>

      <div className="border-b border-brand-line/70 bg-brand-ivory/95 shadow-[0_10px_30px_-24px_rgba(38,37,75,0.5)] backdrop-blur-md">
        <Container className="flex h-[76px] items-center justify-between gap-5 lg:h-[92px]">
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Blue Miror home" className="flex shrink-0 items-center py-1">
              <img
                src={publicAssetUrl(logoUrl)}
                alt={logoAlt}
                width="484"
                height="612"
                className="h-[56px] w-auto lg:h-[70px]"
              />
            </Link>
            <span aria-hidden="true" className="hidden h-9 w-px bg-brand-line sm:block" />
            <span className="hidden max-w-[7.5rem] text-[0.6rem] leading-4 tracking-[0.2em] text-brand-muted uppercase sm:block">
              Salon
              <br /> &amp; Aesthetic Clinic
            </span>
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative py-2 text-[0.65rem] font-medium tracking-[0.16em] uppercase transition-colors',
                    isActive
                      ? 'text-brand-indigo'
                      : 'text-brand-muted hover:text-brand-indigo-deep',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-brand-gold transition-transform duration-300',
                        isActive
                          ? 'scale-x-100'
                          : 'scale-x-0 group-hover:scale-x-100',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <BookingLink />
            </div>

            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-11 items-center justify-center rounded-full border border-brand-line text-brand-indigo transition-colors hover:border-brand-gold hover:text-brand-gold-deep lg:hidden"
            >
              {menuOpen ? (
                <X aria-hidden="true" size={21} strokeWidth={1.5} />
              ) : (
                <Menu aria-hidden="true" size={21} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </Container>
      </div>

      {menuOpen ? (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100dvh-76px)] overflow-y-auto border-b border-brand-line bg-brand-porcelain lg:hidden"
        >
          <Container className="py-5">
            <nav aria-label="Mobile primary">
              <ul className="divide-y divide-brand-line border-y border-brand-line">
                {navigation.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between py-4 font-display text-2xl transition-colors',
                          isActive ? 'text-brand-gold-deep' : 'text-brand-indigo',
                        )
                      }
                    >
                      {item.label}
                      <span aria-hidden="true" className="text-brand-gold">
                        /
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 space-y-3">
              <div onClick={() => setMenuOpen(false)}>
                <BookingLink className="w-full" />
              </div>
              {phone ? (
                <a
                  href={tel ?? '#'}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-indigo/30 text-[0.65rem] tracking-[0.16em] text-brand-indigo uppercase"
                >
                  <Phone aria-hidden="true" size={14} strokeWidth={1.6} />
                  Call the salon
                </a>
              ) : null}
            </div>
            <p className="mt-4 text-center text-[0.6rem] tracking-[0.12em] text-brand-muted uppercase">
              {hoursLabel ?? 'Salon & aesthetic care'}
            </p>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
