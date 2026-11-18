import type { SiteSettings } from '@/services/public-content';

export function formatMessageTemplate(
  template: string | null,
  values: Record<string, string> = {},
): string | null {
  if (!template) return null;

  return template.replace(/\{([a-z][a-z0-9_]*)\}/gi, (match, key: string) => {
    return values[key] ?? match;
  });
}

export function buildWhatsAppUrl(
  settings: SiteSettings | undefined,
  message?: string | null,
): string | null {
  if (!settings?.whatsapp.enabled) return null;

  const digits = `${settings.whatsapp.countryCode ?? ''}${settings.whatsapp.number ?? ''}`.replace(
    /\D/g,
    '',
  );

  if (digits.length < 7 || digits.length > 15) return null;

  const text = message?.trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function buildBookingWhatsAppUrl(settings: SiteSettings | undefined): string | null {
  return buildWhatsAppUrl(settings, settings?.whatsapp.defaultMessage);
}

export function buildServiceEnquiryUrl(
  settings: SiteSettings | undefined,
  serviceName: string,
): string | null {
  const template =
    settings?.whatsapp.serviceEnquiryTemplate ?? settings?.whatsapp.defaultMessage ?? null;
  const message = formatMessageTemplate(template, { service: serviceName });

  return buildWhatsAppUrl(settings, message);
}
