import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/use-public-content';
import { cloudinaryImage } from '@/utils/asset-url';

type SeoProps = {
  title?: string;
  description?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
};

const siteUrl = (import.meta.env.VITE_SITE_URL?.trim() || 'http://localhost:5173').replace(
  /\/+$/,
  '',
);
const indexingEnabled = import.meta.env.VITE_ALLOW_INDEXING === 'true';

const defaultTitle = 'Blue Miror Salon & Aesthetic Clinic | Mira Road East';
const defaultDescription =
  'Blue Miror Unisex Salon and Academy in Mira Road East, Mumbai — hair, facials, nails, makeup and aesthetic treatments. View the full menu with prices and book on WhatsApp.';

export function Seo({ title, description, noindex = false, type = 'website' }: SeoProps) {
  const location = useLocation();
  const settings = useSiteSettings().data;

  const pageTitle = title
    ? /blue miror/i.test(title)
      ? title
      : `${title} | Blue Miror`
    : defaultTitle;
  const pageDescription = description ?? defaultDescription;

  // GitHub Pages serves directory routes with a trailing slash; keep the
  // canonical and Open Graph URL on that same form.
  const path =
    location.pathname === '/' ? '/' : `${location.pathname.replace(/\/+$/, '')}/`;
  const canonicalUrl = `${siteUrl}${path}`;

  const configuredImage =
    settings?.homepage?.slides?.[0]?.imageUrl ??
    settings?.homepage?.heroImageUrl ??
    null;
  const socialImage = configuredImage
    ? cloudinaryImage(configuredImage, 'c_fill,w_1200,h_630,q_auto:eco,f_auto')
    : `${siteUrl}/brand/blue-miror-logo.png`;
  const imageUrl = /^https?:\/\//i.test(socialImage) ? socialImage : `${siteUrl}${socialImage}`;

  const shouldNoindex = noindex || !indexingEnabled;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {shouldNoindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      <meta name="geo.region" content="IN-MH" />
      <meta name="geo.placename" content="Mira Road East, Maharashtra" />

      <meta property="og:site_name" content="Blue Miror" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Blue Miror salon and aesthetic clinic in Mira Road East" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
