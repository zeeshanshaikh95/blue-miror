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
    title: 'Blue Miror — Aesthetic Clinic',
    description:
      'A considered, service-led aesthetic clinic experience. Appointment requests are reviewed by the clinic before they are confirmed.',
    priority: '1.0',
    changeFrequency: 'weekly',
  },
  {
    path: '/about',
    title: 'About Blue Miror — Aesthetic Clinic',
    description:
      'The Blue Miror approach: consultation-led, service-only aesthetic care with clear communication and no pressure.',
    priority: '0.7',
    changeFrequency: 'monthly',
  },
  {
    path: '/treatments',
    title: 'Treatments — Blue Miror',
    description:
      'The Blue Miror treatment menu. Suitability, risks, aftercare and costs are explained before any decision.',
    priority: '0.9',
    changeFrequency: 'weekly',
  },
  {
    path: '/products',
    title: 'Products - Blue Miror',
    description: 'Professional nail and beauty products used and available at Blue Miror.',
    priority: '0.8',
    changeFrequency: 'weekly',
  },
  {
    path: '/gallery',
    title: 'Gallery — Blue Miror',
    description: 'A first look at the Blue Miror clinic visual direction.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/testimonials',
    title: 'Client Stories — Blue Miror',
    description:
      'Client stories are published only after consent and clinic approval. No results are guaranteed.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/team',
    title: 'Our Team — Blue Miror',
    description:
      'Practitioner profiles are published only after names and credentials are verified.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/contact',
    title: 'Contact — Blue Miror',
    description:
      'Contact the Blue Miror clinic. Verified contact details are published only once the clinic approves them.',
    priority: '0.7',
    changeFrequency: 'monthly',
  },
  {
    path: '/faqs',
    title: 'Frequently Asked Questions — Blue Miror',
    description: 'Answers to the questions we expect to shape a first visit to Blue Miror.',
    priority: '0.6',
    changeFrequency: 'monthly',
  },
  {
    path: '/book',
    title: 'Book a Consultation — Blue Miror',
    description:
      'How booking works at Blue Miror: a request is reviewed by the clinic before any appointment is confirmed.',
    priority: '0.9',
    changeFrequency: 'weekly',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy — Blue Miror',
    description: 'How Blue Miror handles personal information submitted through this website.',
    priority: '0.3',
    changeFrequency: 'yearly',
  },
  {
    path: '/terms',
    title: 'Terms of Use — Blue Miror',
    description: 'Terms governing the use of the Blue Miror website.',
    priority: '0.3',
    changeFrequency: 'yearly',
  },
  {
    path: '/medical-disclaimer',
    title: 'Medical Disclaimer — Blue Miror',
    description:
      'This website does not provide medical advice or diagnosis. Suitability is assessed in consultation.',
    priority: '0.3',
    changeFrequency: 'yearly',
  },
];

async function fetchPublishedServices() {
  if (!apiBase) return { items: [], reason: 'VITE_API_BASE_URL is not set' };

  try {
    const response = await fetch(`${apiBase}/public/services?limit=48`);
    if (!response.ok) return { items: [], reason: `API responded ${response.status}` };

    const payload = await response.json();
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];

    return {
      items: items.filter((item) => typeof item?.slug === 'string' && item.slug),
      reason: null,
    };
  } catch (error) {
    return { items: [], reason: error instanceof Error ? error.message : 'unknown error' };
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function applyMetadata(template, { title, description, canonical }) {
  const meta = [
    `    <link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="Blue Miror" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `    <meta name="robots" content="${allowIndexing ? 'index,follow' : 'noindex,nofollow'}" />`,
  ].join('\n');

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/\s*<link rel="canonical"[^>]*>/, '');

  // A meta CSP only governs resources parsed after it, so put it first in head.
  html = html.replace(
    /<head(\s[^>]*)?>/i,
    (match) => `${match}\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`,
  );

  return html.replace('</head>', `${meta}\n  </head>`);
}

async function writeShell(template, route, meta) {
  const html = applyMetadata(template, meta);
  const directory = route.path === '/' ? outDir : path.join(outDir, route.path.replace(/^\//, ''));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html, 'utf8');
}

const template = await readFile(path.join(outDir, 'index.html'), 'utf8');
const { items: services, reason } = await fetchPublishedServices();
const today = new Date().toISOString().slice(0, 10);

const serviceRoutes = services.map((service) => ({
  path: `/treatments/${service.slug}`,
  title: `${service.name} — Blue Miror`,
  description:
    service.shortDescription ||
    'Treatment information from Blue Miror. Suitability is assessed in consultation.',
  priority: '0.8',
  changeFrequency: 'monthly',
}));

for (const route of [...routes, ...serviceRoutes]) {
  await writeShell(template, route, {
    title: route.title,
    description: route.description,
    canonical: `${siteUrl}${route.path === '/' ? '' : route.path}`,
  });
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
  ...routes.map((route) =>
    urlEntry(`${siteUrl}${route.path === '/' ? '/' : route.path}`, {
      priority: route.priority,
      changeFrequency: route.changeFrequency,
      lastmod: today,
    }),
  ),
  ...serviceRoutes.map((route) =>
    urlEntry(`${siteUrl}${route.path}`, {
      priority: route.priority,
      changeFrequency: route.changeFrequency,
      lastmod: today,
    }),
  ),
].join('\n')}\n</urlset>\n`;

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

// GitHub Pages has no rewrite rule: serving the SPA shell as 404.html lets deep
// links boot React Router instead of returning GitHub's 404 page.
await copyFile(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));

if (reason) {
  console.warn(
    `[seo] shells written without treatment pages (${reason}). Set VITE_API_BASE_URL to include published services.`,
  );
} else {
  console.log(`[seo] ${serviceRoutes.length} treatment shell(s) written.`);
}
console.log(
  `[seo] ${routes.length + serviceRoutes.length} metadata shells, sitemap and robots written; indexing ${
    allowIndexing ? 'enabled' : 'disabled'
  }.`,
);
