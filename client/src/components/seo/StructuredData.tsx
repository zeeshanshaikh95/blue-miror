import { Helmet } from 'react-helmet-async';

import { useSiteSettings } from '@/hooks/use-public-content';
import { publicAssetUrl } from '@/utils/asset-url';

const siteUrl = (import.meta.env.VITE_SITE_URL?.trim() || 'http://localhost:5173').replace(
  /\/+$/,
  '',
);

type HoursEntry = { label: string; value: string };

function absoluteUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `${siteUrl}${publicAssetUrl(value).startsWith('/') ? '' : '/'}${publicAssetUrl(value)}`;
}

function mapUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
}

function to24Hour(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ?? '00';
  const period = match[3].toLowerCase();

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function openingHoursSpecification(hours: HoursEntry[]) {
  return hours.flatMap((entry) => {
    const [openRaw, closeRaw] = entry.value.split('-');
    const opens = openRaw ? to24Hour(openRaw) : null;
    const closes = closeRaw ? to24Hour(closeRaw) : null;

    if (!opens || !closes) return [];

    return [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: entry.label,
        opens,
        closes,
      },
    ];
  });
}

function postalAddress(address: string | null | undefined) {
  if (!address) return undefined;

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  let addressRegion = 'Maharashtra';
  let postalCode: string | undefined;

  const last = parts.at(-1);
  const regionAndPostal = last?.match(/^(.+?)\s+(\d{6})$/);
  if (regionAndPostal) {
    addressRegion = regionAndPostal[1];
    postalCode = regionAndPostal[2];
    parts.pop();
  }

  const addressLocality = parts.pop() ?? 'Mira Road East';

  return {
    '@type': 'PostalAddress',
    ...(parts.length > 0 ? { streetAddress: parts.join(', ') } : {}),
    addressLocality,
    addressRegion,
    ...(postalCode ? { postalCode } : {}),
    addressCountry: 'IN',
  };
}

/** LocalBusiness + WebSite structured data for search and answer engines. */
export function StructuredData() {
  const settings = useSiteSettings().data;
  if (!settings) return null;

  const contact = settings.contact;
  const image = absoluteUrl(
    settings.homepage?.slides?.[0]?.imageUrl ??
      settings.homepage?.heroImageUrl ??
      settings.brand.logoUrl,
  );
  const logo = absoluteUrl(settings.brand.logoUrl);
  const sameAs = settings.social
    .map((item) => item.url)
    .filter((url) => /^https?:\/\//i.test(url));

  const salon = {
    '@context': 'https://schema.org',
    '@type': ['BeautySalon', 'HealthAndBeautyBusiness'],
    '@id': `${siteUrl}/#salon`,
    name: 'Blue Miror Unisex Salon and Academy',
    alternateName: 'Blue Miror Salon & Aesthetic Clinic',
    description:
      'Unisex salon and aesthetic clinic in Mira Road East, Mumbai offering hair, facials, nails, makeup, waxing, threading and advanced skin treatments.',
    url: `${siteUrl}/`,
    ...(image ? { image: [image] } : {}),
    ...(logo ? { logo } : {}),
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(postalAddress(contact?.address) ? { address: postalAddress(contact?.address) } : {}),
    ...(mapUrl(contact?.mapsUrl) ? { hasMap: mapUrl(contact?.mapsUrl) } : {}),
    ...(contact?.hours?.length
      ? { openingHoursSpecification: openingHoursSpecification(contact.hours) }
      : {}),
    areaServed: ['Mira Road East', 'Mira Road', 'Mira Bhayandar', 'Dahisar East', 'Bhayandar'],
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: 'Blue Miror',
    inLanguage: 'en-IN',
    publisher: { '@id': `${siteUrl}/#salon` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/treatments?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const payload = JSON.stringify([salon, website]).replace(/</g, '\\u003c');

  return (
    <Helmet>
      <script type="application/ld+json">{payload}</script>
    </Helmet>
  );
}
