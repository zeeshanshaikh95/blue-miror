#!/usr/bin/env node
/**
 * Seed the product shelf through the admin API, using frames extracted from the
 * client's videos as product imagery.
 *
 * Usage:
 *   BM_API=https://blue-miror-api.onrender.com/api \
 *   BM_EMAIL=admin@example.com \
 *   BM_PASSWORD=... \
 *   node scripts/seed-products.mjs
 */
import { readFileSync } from 'node:fs';

const API = (process.env.BM_API || 'http://localhost:4000/api').replace(/\/+$/, '');
const EMAIL = process.env.BM_EMAIL;
const PASSWORD = process.env.BM_PASSWORD;
const FRAMES = process.env.BM_FRAMES || 'C:/Users/Zeeshan/AppData/Local/Temp/bm-video-frames';

if (!EMAIL || !PASSWORD) {
  console.error('Set BM_EMAIL and BM_PASSWORD (and optionally BM_API, BM_FRAMES).');
  process.exit(1);
}

const publishedAt = new Date().toISOString();

const products = [
  {
    slug: 'perfect-touch-gel-polish',
    name: 'Perfect Touch Gel Polish',
    brand: 'Perfect Touch',
    category: 'Gel Polish',
    shortDescription: 'A versatile gel polish range in a wide palette of shades, designed for long-lasting, glossy colour.',
    description: [
      'Perfect Touch gel polish is formulated for a smooth, even application and a glossy finish that cures under UV or LED light.',
      'The range covers classic nudes, bold reds and cool blues, so there is a shade for every look and season.',
      'Used in the salon for manicures, pedicures and extensions, and available to take home where stock allows.',
    ],
    features: [
      'Wide shade range across nudes, reds, blues and pinks.',
      'Long-lasting, high-gloss gel finish.',
      'Suitable for natural nails, gel and extensions.',
    ],
    price: null,
    size: '15 ml',
    isFeatured: true,
    imageFile: `${FRAMES}/1-9.jpg`,
    imageAlt: 'Perfect Touch gel polish bottles in a range of shades.',
  },
  {
    slug: 'venalisa-professional-nail-gel-polish',
    name: 'Venalisa Professional Nail Gel Polish',
    brand: 'Venalisa Professional',
    category: 'Gel Polish',
    shortDescription: 'Professional gel polish with rich, even colour payoff for a salon-grade finish.',
    description: [
      'Venalisa Professional gel polish delivers rich, even colour with a durable, glossy finish.',
      'Available in classic and fashion shades, including deep tones such as Burgundy Wine.',
      'Used and stocked in the salon. Ask us about shade availability before your visit.',
    ],
    features: [
      'Rich, even colour payoff.',
      'Durable, high-gloss gel finish.',
      'Suitable for natural nails and extensions.',
    ],
    price: null,
    size: null,
    isFeatured: false,
    imageFile: `${FRAMES}/2-17.jpg`,
    imageAlt: 'Venalisa Professional nail gel polish bottle.',
  },
  {
    slug: 'shills-crystal-moonlight-cat-eye-gel-polish',
    name: 'Shills Professional Crystal Moonlight Cat Eye Gel Polish',
    brand: 'Shills Professional',
    category: 'Cat Eye Gel Polish',
    shortDescription: 'A cat-eye gel polish that creates a shifting, magnetic shimmer effect on the nail.',
    description: [
      'Crystal Moonlight is a cat-eye gel polish that builds a magnetic shimmer effect using a magnet during application.',
      'Formulated HEMA and TPO free. Supplied in a 10 ml bottle.',
      'Used in the salon for cat-eye manicures; ask about the full colour card when you book.',
    ],
    features: [
      'Cat-eye magnetic shimmer effect.',
      'HEMA and TPO free formulation.',
      '10 ml bottle.',
    ],
    price: null,
    size: '10 ml',
    isFeatured: true,
    imageFile: `${FRAMES}/3-5.jpg`,
    imageAlt: 'Shills Crystal Moonlight cat eye gel polish with colour card.',
  },
  {
    slug: 'shills-glimmering-moon-cat-eye-gel-polish',
    name: 'Shills Professional Glimmering Moon Cat Eye Gel Polish',
    brand: 'Shills Professional',
    category: 'Cat Eye Gel Polish',
    shortDescription: 'A glimmering cat-eye gel polish with a deeper, richer shimmer for statement nails.',
    description: [
      'Glimmering Moon is a deeper, richer cat-eye gel polish for a statement magnetic shimmer.',
      'Formulated HEMA and TPO free. Supplied in a 10 ml bottle.',
      'Used in the salon for cat-eye manicures; ask about the full colour card when you book.',
    ],
    features: [
      'Deeper cat-eye magnetic shimmer effect.',
      'HEMA and TPO free formulation.',
      '10 ml bottle.',
    ],
    price: null,
    size: '10 ml',
    isFeatured: false,
    imageFile: `${FRAMES}/4-9.jpg`,
    imageAlt: 'Shills Glimmering Moon cat eye gel polish with colour card.',
  },
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    const message = body?.error?.message ?? `${response.status}`;
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${message}`);
  }

  return body?.data;
}

async function login() {
  const data = await api('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  return data.token;
}

async function uploadImage(token, filePath, alt) {
  const buffer = readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'product.jpg');
  form.append('folder', 'gallery');
  form.append('alt', alt);

  const response = await fetch(`${API}/admin/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    const message = body?.error?.message ?? `${response.status}`;
    throw new Error(`upload ${filePath} failed: ${message}`);
  }

  return body.data;
}

async function main() {
  console.log(`Seeding products against ${API}`);
  const token = await login();
  console.log('Logged in');

  const existing = await api('/admin/products?limit=48', { token });
  const existingSlugs = new Set(existing.items.map((item) => item.slug));

  let created = 0;
  for (const product of products) {
    if (existingSlugs.has(product.slug)) {
      console.log(`skip product ${product.slug}`);
      continue;
    }

    const asset = await uploadImage(token, product.imageFile, product.imageAlt);
    console.log(`uploaded ${product.slug} -> ${asset.publicId}`);

    const payload = {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      shortDescription: product.shortDescription,
      description: product.description,
      features: product.features,
      price: product.price,
      size: product.size,
      isFeatured: product.isFeatured,
      publishedAt,
      seo: {
        title: `${product.name} | Blue Miror`,
        description: product.shortDescription.slice(0, 155),
      },
      image: {
        publicId: asset.publicId,
        url: asset.url,
        alt: product.imageAlt,
      },
    };

    await api('/admin/products', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    created += 1;
    console.log(`created product ${product.slug}`);
  }

  console.log(`Done. Products created: ${created}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
