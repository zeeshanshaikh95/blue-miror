import { MessageCircle } from 'lucide-react';

import { useSiteSettings } from '@/hooks/use-public-content';
import { buildBookingWhatsAppUrl } from '@/utils/whatsapp';

export function WhatsAppFab() {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const href = buildBookingWhatsAppUrl(settings);

  if (!href || !settings) return null;
  if (settings.whatsapp.showFloatingButton === false) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={settings.whatsapp.cta.floating}
      title={settings.whatsapp.cta.floating}
      className="fixed right-5 bottom-5 z-30 flex size-13 items-center justify-center rounded-full border border-brand-gold bg-brand-indigo text-brand-ivory shadow-[0_12px_30px_rgba(38,37,75,0.24)] transition-colors hover:bg-brand-indigo-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-azure sm:right-7 sm:bottom-7"
    >
      <MessageCircle aria-hidden="true" size={22} strokeWidth={1.5} />
      <span className="sr-only">{settings.whatsapp.cta.floating}</span>
    </a>
  );
}
