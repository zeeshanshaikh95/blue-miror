import type { ReactNode } from 'react';

import { useSiteSettings } from '@/hooks/use-public-content';
import { buildBookingWhatsAppUrl, buildServiceEnquiryUrl } from '@/utils/whatsapp';

import { ButtonAnchor, ButtonLink } from './Button';
import type { ButtonVariant } from './button-styles';

type BookingLinkProps = {
  children?: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  serviceName?: string;
  serviceSlug?: string;
  label?: string;
};

export function BookingLink({
  children,
  variant = 'primary',
  className,
  serviceName,
  serviceSlug,
  label,
}: BookingLinkProps) {
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;
  const href = serviceName
    ? buildServiceEnquiryUrl(settings, serviceName)
    : buildBookingWhatsAppUrl(settings);

  const resolvedLabel =
    label ??
    (serviceName
      ? (settings?.whatsapp.cta.serviceEnquiry ?? 'Ask about this treatment')
      : (settings?.whatsapp.cta.booking ?? 'Book a consultation'));

  const content = children ?? resolvedLabel;

  if (href) {
    return (
      <ButtonAnchor href={href} variant={variant} className={className} external>
        {content}
      </ButtonAnchor>
    );
  }

  const params = serviceSlug ? `?service=${encodeURIComponent(serviceSlug)}` : '';

  return (
    <ButtonLink to={`/book${params}`} variant={variant} className={className}>
      {content}
    </ButtonLink>
  );
}
