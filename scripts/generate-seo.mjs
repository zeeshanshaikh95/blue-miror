#!/usr/bin/env node
/**
 * Build-time SEO artefacts for the static GitHub Pages client.
 *
 * What this does (and does not do):
 *  - Writes `robots.txt` and `sitemap.xml`.
 *  - Writes a per-route HTML shell (`about/index.html`, `treatments/<slug>/index.html`, …)
 *    containing the correct <title>, description, canonical and Open Graph tags,
 *    so crawlers and social previews get meaningful metadata without JavaScript.
 *  - Copies `index.html` to `404.html` so deep links boot React Router on GitHub Pages.
 *
 * It does NOT prerender page bodies: the SPA still renders content in the browser.
 * The shell metadata is a metadata snapshot, not server-side rendering.
 *
 * Usage:
 *   VITE_SITE_URL="https://www.example.com" \
 *   VITE_API_BASE_URL="https://api.example.com/api" \
 *   VITE_ALLOW_INDEXING=false \
 *   node scripts/generate-seo.mjs
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'client', 'dist');
const siteUrl = (process.env.VITE_SITE_URL?.trim() || 'http://localhost:5173').replace(/\/+$/, '');
const apiBase = (process.env.VITE_API_BASE_URL?.trim() || '').replace(/\/+$/, '');
const allowIndexing = process.env.VITE_ALLOW_INDEXING === 'true';

/** Public routes with their metadata. Admin routes are deliberately absent. */
const routes = [
  {
    path: '/',
    title: 'Blue Miror Salon & Aesthetic Clinic | Mira Road East',
    h1: 'Blue Miror Salon & Aesthetic Clinic in Mira Road East',
    description:
      'Hair, facials, nails, makeup, waxing and aesthetic treatments in Mira Road East, Mumbai. See the full menu with prices and book on WhatsApp.',
    priority: '1.0',
    changeFrequency: 'weekly',
  },
  {
    path: '/about',
    title: 'About Blue Miror — Salon in Mira Road East',
    h1: 'About Blue Miror',
    description:
      'Meet the unisex salon and aesthetic clinic in Mira Road East: consultation-led care, clear pricing and hair, skin, nails and makeup under one roof.',
    priority: '0.7',
    changeFrequency: 'monthly',
  },
  {
    path: '/treatments',
    title: 'Salon Treatments & Price List in Mira Road East | Blue Miror',
    h1: 'Salon treatments and prices',
    description:
      'Browse 115+ treatments with published prices — hair colour, haircuts, facials, waxing, threading, nails, makeup and advanced skin care.',
    priority: '0.9',
    changeFrequency: 'weekly',
  },
  {
    path: '/products',
    title: 'Professional Salon Products in Mira Road East | Blue Miror',
    h1: 'Professional salon products',
    description:
      'Gel polish, cat-eye collections and professional care from Perfect Touch, Shills Professional and Venalisa — the lines used in the salon.',
    priority: '0.8',
    changeFrequency: 'weekly',
  },
  {
    path: '/gallery',
    title: 'Gallery — Blue Miror Salon in Mira Road East',
    h1: 'Blue Miror gallery',
    description:
      'A look at the salon, the treatment rooms and the hair, makeup and nail work created at Blue Miror in Mira Road East.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/testimonials',
    title: 'Client Reviews & Stories | Blue Miror Mira Road East',
    h1: 'Client stories',
    description:
      'Real client experiences from Blue Miror salon and aesthetic clinic in Mira Road East, shared with permission.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/team',
    title: 'Our Salon Team in Mira Road East | Blue Miror',
    h1: 'The Blue Miror team',
    description:
      'The stylists, therapists and makeup artists behind Blue Miror salon and aesthetic clinic in Mira Road East.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/contact',
    title: 'Contact Blue Miror — Mira Road East Salon & Clinic',
    h1: 'Visit Blue Miror in Mira Road East',
    description:
      'Shop No. 5, GH Society, Gokul Village 2, Shanti Park, Mira Road East, Maharashtra 401107. Call +91 79005 34005 or book on WhatsApp.',
    priority: '0.9',
    changeFrequency: 'monthly',
  },
  {
    path: '/faqs',
    title: 'Salon FAQs — Booking, Prices & Location | Blue Miror',
    h1: 'Frequently asked questions',
    description:
      'Answers about booking, prices, opening hours, location and treatments at Blue Miror salon and aesthetic clinic in Mira Road East.',
    priority: '0.7',
    changeFrequency: 'monthly',
  },
  {
    path: '/book',
    title: 'Book an Appointment on WhatsApp | Blue Miror Mira Road East',
    h1: 'Book an appointment',
    description:
      'Send your treatment and preferred time on WhatsApp. The Blue Miror team confirms every appointment personally.',
    priority: '0.9',
    changeFrequency: 'weekly',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy — Blue Miror',
    description: 'How Blue Miror handles personal information submitted through this website.',
    priority: '0.3',
    changeFrequency: 'yearly',
    indexable: false,
  },
  {
    path: '/terms',
    title: 'Terms of Use — Blue Miror',
    description: 'Terms governing the use of the Blue Miror website.',
    priority: '0.3',
    changeFrequency: 'yearly',
    indexable: false,
  },
  {
    path: '/medical-disclaimer',
    title: 'Medical Disclaimer — Blue Miror',
    description:
      'This website does not provide medical advice or diagnosis. Suitability is assessed in consultation.',
    priority: '0.3',
    changeFrequency: 'yearly',
    indexable: false,
  },
];

async function fetchPublishedServices() {
  if (!apiBase) return { items: [], total: 0, reason: 'VITE_API_BASE_URL is not set' };

  try {
    const response = await fetch(`${apiBase}/public/services?limit=48`);
    if (!response.ok) {
      return { items: [], total: 0, reason: `API responded ${response.status}` };
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];

    return {
      items: items.filter(
        (item) => typeof item?.slug === 'string' && item.slug && item.isPlaceholder !== true,
      ),
      total: Number(payload?.data?.total) || items.length,
      reason: null,
    };
  } catch (error) {
    return {
      items: [],
      total: 0,
      reason: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

async function fetchJson(pathname) {
  if (!apiBase) return null;

  try {
    const response = await fetch(`${apiBase}${pathname}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canonicalFor(pathname) {
  return `${siteUrl}${pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`}`;
}

function absoluteUrl(value) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

function socialImage(value) {
  const url = absoluteUrl(value);
  if (!url) return `${siteUrl}/brand/blue-miror-logo.png`;
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    return url.replace(
      '/image/upload/',
      '/image/upload/c_fill,w_1200,h_630,q_auto,f_auto/',
    );
  }
  return url;
}

function parseAddress(address) {
  const fallback =
    'Shop No. 5, GH Society, Gokul Village 2, Shanti Park, Mira Road East, Maharashtra 401107';

  const parts = String(address || fallback)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  let addressRegion = 'Maharashtra';
  let postalCode;

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

function to24Hour(value) {
  const match = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ?? '00';
  const period = match[3].toLowerCase();

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function openingHours(hours) {
  return (hours ?? []).flatMap((entry) => {
    const [openRaw, closeRaw] = String(entry.value ?? '').split('-');
    const opens = to24Hour(openRaw ?? '');
    const closes = to24Hour(closeRaw ?? '');
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

function urlEntry(loc, { priority = '0.5', changeFrequency = 'monthly', lastmod } = {}) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changeFrequency}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data: https://res.cloudinary.com",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://api.bluemiror.site",
  "form-action 'self'",
].join('; ');

function applyMetadata(
  template,
  { title, description, canonical, image, jsonLd, fallback, indexable = true },
) {
  const meta = [
    `    <link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `    <link rel="alternate" hreflang="en-IN" href="${escapeHtml(canonical)}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="Blue Miror" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `    <meta property="og:locale" content="en_IN" />`,
    `    <meta property="og:image" content="${escapeHtml(image)}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="Blue Miror salon and aesthetic clinic in Mira Road East" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `    <meta name="geo.region" content="IN-MH" />`,
    `    <meta name="geo.placename" content="Mira Road East, Maharashtra" />`,
    `    <meta name="robots" content="${
      allowIndexing && indexable !== false
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow'
    }" />`,
  ].join('\n');

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/\s*<link rel="canonical"[^>]*>/, '');

  // A meta CSP only governs resources parsed after it, so put it first in head.
  html = html.replace(
    /<head(\s[^>]*)?>/i,
    (match) =>
      `${match}\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />\n    <style>#seo-fallback{max-width:70rem;margin:0 auto;padding:3rem 1.25rem;font-family:Georgia,'Times New Roman',serif;line-height:1.65;color:#26254b}#seo-fallback .brand{font-family:system-ui,sans-serif;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:#8a6a2f}#seo-fallback h1{font-size:2.4rem;line-height:1.05;margin:.75rem 0 1rem}#seo-fallback p{max-width:46rem}#seo-fallback a{color:#424273;text-decoration:underline;text-underline-offset:3px}#seo-fallback nav{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1.5rem;font-family:system-ui,sans-serif;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}</style>`,
  );

  const jsonLdTags =
    Array.isArray(jsonLd) && jsonLd.length > 0
      ? jsonLd
          .map(
            (item) =>
              `    <script type="application/ld+json">${JSON.stringify(item).replace(
                /</g,
                '\\u003c',
              )}</script>`,
          )
          .join('\n')
      : '';

  if (fallback) {
    html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  }

  return html.replace('</head>', `${meta}\n${jsonLdTags}\n  </head>`);
}

async function writeShell(template, route, meta) {
  const html = applyMetadata(template, meta);
  const directory = route.path === '/' ? outDir : path.join(outDir, route.path.replace(/^\//, ''));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html, 'utf8');
}

const template = await readFile(path.join(outDir, 'index.html'), 'utf8');
const [servicesResult, settingsData, faqsData, productsData] = await Promise.all([
  fetchPublishedServices(),
  fetchJson('/public/settings'),
  fetchJson('/public/faqs?limit=48'),
  fetchJson('/public/products?limit=48'),
]);
const { items: services, total: serviceCount, reason } = servicesResult;
const today = new Date().toISOString().slice(0, 10);

const contact = settingsData?.contact ?? {};
const phone = contact.phone ?? '+91 79005 34005';
const email = contact.email ?? 'zs00483@gmail.com';
const addressText =
  contact.address ??
  'Shop No. 5, GH Society, Gokul Village 2, Shanti Park, Mira Road East, Maharashtra 401107';
const hours = Array.isArray(contact.hours) ? contact.hours : [];
const sameHours =
  hours.length > 1 && hours.every((entry) => entry.value === hours[0]?.value);
const hoursSummary =
  hours.length > 0
    ? sameHours
      ? `${hours[0].label} to ${hours.at(-1)?.label}, ${hours[0].value}`
      : `${hours[0].label} ${hours[0].value}`
    : 'Tuesday to Sunday, 9:00am-10:00pm';

const defaultImage = socialImage(
  settingsData?.homepage?.slides?.[0]?.imageUrl ??
    settingsData?.homepage?.heroImageUrl ??
    settingsData?.brand?.logoUrl,
);
const sameAs = (settingsData?.social ?? [])
  .map((item) => item.url)
  .filter((url) => /^https?:\/\//i.test(url));
const salonId = `${siteUrl}/#salon`;

const salonSchema = {
  '@context': 'https://schema.org',
  '@type': ['BeautySalon', 'HealthAndBeautyBusiness'],
  '@id': salonId,
  name: 'Blue Miror Unisex Salon and Academy',
  alternateName: 'Blue Miror Salon & Aesthetic Clinic',
  description:
    'Unisex salon and aesthetic clinic in Mira Road East, Mumbai offering hair, facials, nails, makeup, waxing, threading and advanced skin treatments.',
  url: `${siteUrl}/`,
  image: [defaultImage],
  ...(settingsData?.brand?.logoUrl
    ? { logo: absoluteUrl(settingsData.brand.logoUrl) }
    : {}),
  telephone: phone,
  email,
  address: parseAddress(addressText),
  ...(contact.mapsUrl
    ? { hasMap: /^https?:\/\//i.test(contact.mapsUrl) ? contact.mapsUrl : `https://${contact.mapsUrl}` }
    : {}),
  openingHoursSpecification: openingHours(hours),
  areaServed: ['Mira Road East', 'Mira Road', 'Mira Bhayandar', 'Dahisar East', 'Bhayandar'],
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  ...(sameAs.length > 0 ? { sameAs } : {}),
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  url: `${siteUrl}/`,
  name: 'Blue Miror',
  inLanguage: 'en-IN',
  publisher: { '@id': salonId },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/treatments?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

function clamp(value, max = 158) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function priceNumber(value) {
  return String(value ?? '').match(/₹\s?([\d,]+)/)?.[1]?.replace(/,/g, '');
}

const serviceRoutes = services.map((service) => ({
  path: `/treatments/${service.slug}`,
  type: 'service',
  service,
  title: `${service.name} in Mira Road East | Blue Miror`,
  h1: service.name,
  description: clamp(
    `${service.shortDescription ?? ''}${service.price ? ` ${service.price}.` : ''} Book at Blue Miror, Mira Road East.`,
  ),
  image: socialImage(service.imageUrl),
  schemaImage: absoluteUrl(service.imageUrl),
  priority: '0.75',
  changeFrequency: 'monthly',
  crumbs: [
    { name: 'Home', path: '/' },
    { name: 'Treatments', path: '/treatments' },
    { name: service.name, path: `/treatments/${service.slug}` },
  ],
}));

const productRoutes = (productsData?.items ?? [])
  .filter((product) => typeof product?.slug === 'string' && product.slug)
  .map((product) => ({
    path: `/products/${product.slug}`,
    type: 'product',
    product,
    title: `${product.name} — ${product.brand ?? 'Professional product'} | Blue Miror`,
    h1: product.name,
    description: clamp(
      `${product.shortDescription ?? product.name}. Available at Blue Miror, Mira Road East.`,
    ),
    image: socialImage(product.imageUrl),
    schemaImage: absoluteUrl(product.imageUrl),
    priority: '0.65',
    changeFrequency: 'monthly',
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
      { name: product.name, path: `/products/${product.slug}` },
    ],
  }));

const allRoutes = [...routes, ...serviceRoutes, ...productRoutes];

function breadcrumbSchema(route) {
  const crumbs =
    route.crumbs ??
    (route.path === '/'
      ? []
      : [
          { name: 'Home', path: '/' },
          { name: route.h1 ?? route.title, path: route.path },
        ]);

  if (crumbs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalFor(crumbs.at(-1)?.path ?? route.path)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: canonicalFor(crumb.path),
    })),
  };
}

function routeSchema(route) {
  if (route.type === 'service') {
    const service = route.service;
    const price = priceNumber(service.price);
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${canonicalFor(route.path)}#service`,
      name: service.name,
      serviceType: service.categoryName,
      description: service.shortDescription,
      url: canonicalFor(route.path),
      provider: { '@id': salonId },
      areaServed: 'Mira Road East, Maharashtra',
      ...(route.schemaImage ? { image: route.schemaImage } : {}),
      ...(price
        ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price,
              url: canonicalFor(route.path),
            },
          }
        : {}),
    };
  }

  if (route.type === 'product') {
    const product = route.product;
    const price = priceNumber(product.price);
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${canonicalFor(route.path)}#product`,
      name: product.name,
      ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
      category: product.category,
      description: product.shortDescription,
      url: canonicalFor(route.path),
      ...(route.schemaImage ? { image: [route.schemaImage] } : {}),
      ...(price
        ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price,
              availability: 'https://schema.org/InStock',
              url: canonicalFor(route.path),
            },
          }
        : {}),
    };
  }

  if (route.path === '/faqs' && (faqsData?.items ?? []).length > 0) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${canonicalFor(route.path)}#faq`,
      mainEntity: faqsData.items.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    };
  }

  return null;
}

function fallbackHtml(route) {
  const nav = [
    ['About', '/about'],
    ['Treatments', '/treatments'],
    ['Products', '/products'],
    ['Gallery', '/gallery'],
    ['Contact', '/contact'],
    ['FAQs', '/faqs'],
  ]
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join('');

  const extra =
    route.type === 'service'
      ? `<p><strong>${escapeHtml(route.service.categoryName ?? '')}</strong>${
          route.service.price ? ` · ${escapeHtml(route.service.price)}` : ''
        }</p>`
      : route.type === 'product'
        ? `<p><strong>${escapeHtml(route.product.brand ?? 'Professional product')}</strong>${
            route.product.price ? ` · ${escapeHtml(route.product.price)}` : ''
          }</p>`
        : '';

  return `<div id="seo-fallback"><p class="brand">Blue Miror · Mira Road East</p><h1>${escapeHtml(
    route.h1 ?? route.title,
  )}</h1><p>${escapeHtml(route.description)}</p>${extra}<p>${escapeHtml(
    addressText,
  )}<br>${escapeHtml(phone)} · ${escapeHtml(
    hoursSummary,
  )}</p><nav>${nav}</nav><p><a href="/book">Book an appointment on WhatsApp</a></p></div>`;
}

for (const route of allRoutes) {
  const schemas = [
    salonSchema,
    websiteSchema,
    breadcrumbSchema(route),
    routeSchema(route),
  ].filter(Boolean);

  await writeShell(template, route, {
    title: route.title,
    description: route.description,
    canonical: canonicalFor(route.path),
    image: route.image ?? defaultImage,
    jsonLd: schemas,
    fallback: fallbackHtml(route),
    indexable: route.indexable !== false,
  });
}

const sitemapRoutes = allRoutes.filter((route) => route.indexable !== false);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes
  .map((route) =>
    urlEntry(canonicalFor(route.path), {
      priority: route.priority,
      changeFrequency: route.changeFrequency,
      lastmod: today,
    }),
  )
  .join('\n')}\n</urlset>\n`;

const llmsTxt = [
  '# Blue Miror Unisex Salon and Academy',
  '',
  '> Salon and aesthetic clinic in Mira Road East, Mumbai offering hair, facials, nails, makeup, waxing, threading and advanced skin treatments. Booking is confirmed personally on WhatsApp.',
  '',
  '## Contact',
  `- Address: ${addressText}`,
  `- Phone: ${phone}`,
  `- Email: ${email}`,
  `- Hours: ${hoursSummary}`,
  ...(sameAs.length > 0 ? [`- Instagram: ${sameAs.join(', ')}`] : []),
  `- Booking: ${siteUrl}/book/`,
  '',
  '## Pages',
  `- [Treatments](${siteUrl}/treatments/): ${serviceCount}+ services with published prices.`,
  `- [Products](${siteUrl}/products/): professional gel polish and salon care lines.`,
  `- [Gallery](${siteUrl}/gallery/): salon and treatment imagery.`,
  `- [About](${siteUrl}/about/): consultation-led approach in Mira Road East.`,
  `- [Contact](${siteUrl}/contact/): address, map links and opening hours.`,
  `- [FAQs](${siteUrl}/faqs/): booking, pricing, location and treatment questions.`,
  '',
  '## Common questions',
  ...(faqsData?.items ?? []).map((faq) => `- **${faq.question}** ${faq.answer}`),
  '',
].join('\n');

const robots = allowIndexing
  ? [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/',
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n')
  : [
      'User-agent: *',
      'Disallow: /',
      '',
      '# Indexing is disabled until approved clinic content is live.',
      '',
    ].join('\n');

await writeFile(path.join(outDir, 'sitemap.xml'), sitemapXml, 'utf8');
await writeFile(path.join(outDir, 'robots.txt'), robots, 'utf8');
await writeFile(path.join(outDir, 'llms.txt'), llmsTxt, 'utf8');

// GitHub Pages has no rewrite rule: serving the SPA shell as 404.html lets deep
// links boot React Router instead of returning GitHub's 404 page.
await copyFile(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));
const notFoundPath = path.join(outDir, '404.html');
const notFoundHtml = (await readFile(notFoundPath, 'utf8')).replace(
  /<meta name="robots"[^>]*>/,
  '<meta name="robots" content="noindex, nofollow" />',
);
await writeFile(notFoundPath, notFoundHtml, 'utf8');

if (reason) {
  console.warn(
    `[seo] shells written without treatment pages (${reason}). Set VITE_API_BASE_URL to include published services.`,
  );
} else {
  console.log(`[seo] ${serviceRoutes.length} treatment shell(s) written.`);
}
console.log(
  `[seo] ${allRoutes.length} metadata shells, sitemap, robots and llms.txt written; indexing ${
    allowIndexing ? 'enabled' : 'disabled'
  }.`,
);
