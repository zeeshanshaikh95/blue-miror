import { MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/use-public-content';
import { phoneHref } from '@/utils/clinic-info';
import { buildBookingWhatsAppUrl } from '@/utils/whatsapp';

/**
 * Compact action bar for phones. Keeps booking one thumb-tap away without
 * covering the page on larger screens.
 */
export function MobileBookingBar() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;

  if (!settings) return null;

  const bookingHref = buildBookingWhatsAppUrl(settings);
  const tel = phoneHref(settings.contact.phone);
  const label = settings.whatsapp.cta.booking;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-gold/35 bg-brand-indigo-deep/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {tel ? (
          <a
            href={tel}
            aria-label="Call the salon"
            className="grid size-12 shrink-0 place-items-center rounded-full border border-brand-ivory/25 text-brand-ivory transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            <Phone aria-hidden="true" size={18} strokeWidth={1.6} />
          </a>
        ) : null}

        {bookingHref ? (
          <a
            href={bookingHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-gold px-5 text-[0.65rem] font-medium tracking-[0.14em] text-brand-indigo-deep uppercase transition-colors hover:bg-brand-ivory"
          >
            <MessageCircle aria-hidden="true" size={17} strokeWidth={1.7} />
            {label}
          </a>
        ) : (
          <Link
            to="/book/"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-gold px-5 text-[0.65rem] font-medium tracking-[0.14em] text-brand-indigo-deep uppercase"
          >
            Book a consultation
          </Link>
        )}
      </div>
    </div>
  );
}
