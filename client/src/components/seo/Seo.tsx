import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

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

export function Seo({ title, description, noindex = false, type = 'website' }: SeoProps) {
  const location = useLocation();
  const pageTitle = title ? `${title} — Blue Miror` : 'Blue Miror — Aesthetic Clinic';
  const pageDescription =
    description ??
    'A considered, service-led aesthetic clinic experience. Preview content is awaiting clinic approval.';
  const canonicalUrl = `${siteUrl}${location.pathname}`;
  const shouldNoindex = noindex || !indexingEnabled;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {shouldNoindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:site_name" content="Blue Miror" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
    </Helmet>
  );
}
