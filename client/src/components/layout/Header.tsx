import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/use-public-content';
import { publicAssetUrl } from '@/utils/asset-url';
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
  const logoUrl = settingsQuery.data?.brand.logoUrl ?? '/brand/blue-miror-logo.png';
  const logoAlt = settingsQuery.data?.brand.logoAlt ?? 'Blue Miror crest and wordmark';

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line/80 bg-brand-ivory/95 backdrop-blur">
      <Container className="flex h-[78px] items-center justify-between gap-5 lg:h-[104px]">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Blue Miror home" className="flex shrink-0 items-center py-1">
            <img
              src={publicAssetUrl(logoUrl)}
              alt={logoAlt}
              width="484"
              height="612"
              className="h-[58px] w-auto lg:h-[82px]"
            />
          </Link>
          <span aria-hidden="true" className="hidden h-9 w-px bg-brand-line sm:block" />
          <span className="hidden max-w-[7rem] text-[0.625rem] leading-4 tracking-[0.18em] text-brand-muted uppercase sm:block">
            Aesthetic
            <br /> Clinic
          </span>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative py-2 text-[0.65rem] font-medium tracking-[0.16em] uppercase transition-colors hover:text-brand-gold-deep',
                  isActive
                    ? 'text-brand-indigo after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-brand-gold'
                    : 'text-brand-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <BookingLink />
        </div>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-11 items-center justify-center border border-brand-line text-brand-indigo transition-colors hover:border-brand-gold-deep lg:hidden"
        >
          {menuOpen ? (
            <X aria-hidden="true" size={21} strokeWidth={1.5} />
          ) : (
            <Menu aria-hidden="true" size={21} strokeWidth={1.5} />
          )}
        </button>
      </Container>

      {menuOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-brand-line bg-brand-porcelain lg:hidden"
        >
          <Container className="py-5">
            <nav aria-label="Mobile primary">
              <ul className="divide-y divide-brand-line border-b border-brand-line">
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

            <div className="mt-6" onClick={() => setMenuOpen(false)}>
              <BookingLink className="w-full" />
            </div>
            <p className="mt-4 text-center text-[0.6rem] tracking-[0.12em] text-brand-muted uppercase">
              Service-led aesthetic care
            </p>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
