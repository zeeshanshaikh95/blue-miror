import mongoose from 'mongoose';

import { buildCloudinaryImageUrl } from '../config/cloudinary.js';
import { type ServiceFilters } from '../lib/validation.js';
import {
  Category,
  Faq,
  Gallery,
  Product,
  Service,
  Team,
  Testimonial,
  WebsiteSettings,
  type CategoryDocument,
  type FaqDocument,
  type GalleryDocument,
  type ProductDocument,
  type ServiceDocument,
  type TeamDocument,
  type TestimonialDocument,
  type WebsiteSettingsDocument,
} from '../models/index.js';
import { AppError } from '../utils/app-error.js';

export type PublicServiceSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  shortDescription: string;
  isFeatured: boolean;
  isPlaceholder: false;
  /** Delivery URL for the uploaded treatment image, null when none is set. */
  imageUrl: string | null;
  /** Published price line, null when the clinic has not supplied one. */
  price: string | null;
  visual: 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';
};

export type PublicServiceDetail = PublicServiceSummary & {
  description: string[];
  steps: string[];
  benefits: string[];
  considerations: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export type PublicCategorySummary = {
  slug: string;
  name: string;
  description: string;
};

export type PublicProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  shortDescription: string;
  price: string | null;
  size: string | null;
  isFeatured: boolean;
  /** Delivery URL for the product image, null when none is set. */
  imageUrl: string | null;
  isPlaceholder: false;
};

export type PublicProductDetail = PublicProductSummary & {
  description: string[];
  features: string[];
};

export type PublicGalleryItem = {
  id: string;
  title: string;
  alt: string;
  category: string;
  variant: 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';
  /** Delivery URL for the uploaded image, null while only a placeholder exists. */
  imageUrl: string | null;
  isPlaceholder: false;
};

export type PublicFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPlaceholder: false;
};

export type PublicTeamMember = {
  id: string;
  name: string;
  designation: string;
  bio: string | null;
  /** Delivery URL for the uploaded portrait, null when no image is set. */
  imageUrl: string | null;
  isPlaceholder: false;
};

export type PublicTestimonial = {
  id: string;
  name: string;
  treatment: string | null;
  quote: string;
  isPlaceholder: false;
};

export type PublicSettings = {
  isDemo: false;
  /** Admin-managed homepage copy and section visibility, optional. */
  homepage?: {
    heroHeading: string | null;
    heroDescription: string | null;
    heroImageUrl: string | null;
    heroCtaLabel: string | null;
    heroCtaHref: string | null;
    aboutHeading: string | null;
    aboutBody: string | null;
    showFeatured: boolean;
    showGallery: boolean;
    showFaqs: boolean;
  };
  site: {
    name: string;
    category: string;
    tagline: string | null;
    defaultDescription: string;
  };
  brand: {
    logoUrl: string;
    logoAlt: string;
  };
  contact: {
    phone: string | null;
    email: string | null;
    whatsappDisplay: string | null;
    address: string | null;
    mapsUrl: string | null;
    directionsUrl: string | null;
    hours: Array<{ label: string; value: string }>;
  };
  whatsapp: {
    enabled: boolean;
    countryCode: string | null;
    number: string | null;
    defaultMessage: string | null;
    bookingMessageTemplate: string | null;
    serviceEnquiryTemplate: string | null;
    cta: {
      booking: string;
      serviceEnquiry: string;
      floating: string;
    };
  };
  booking: {
    primaryChannel: 'whatsapp';
    responseExpectation: string | null;
    note: string;
  };
  social: Array<{ label: string; url: string }>;
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    canonicalBaseUrl: string | null;
  };
  legal: {
    lastUpdated: string | null;
  };
};

export function toDbDate(value: string | Date | null): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function findCategories(): Promise<PublicCategorySummary[]> {
  const docs = await Category.find({ isArchived: false })
    .sort({ name: 1 })
    .lean<CategoryDocument[]>();
  return docs.map((doc) => ({
    slug: doc.slug,
    name: doc.name,
    description: doc.description ?? '',
  }));
}

export async function findServices(filters: ServiceFilters = {}): Promise<{
  items: PublicServiceSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const limit = Math.max(1, Math.min(48, Number(filters.limit ?? 24)));
  const page = Math.max(1, Number(filters.page ?? 1));
  const skip = (page - 1) * limit;
  const normalizedQuery = (filters.q ?? '').trim().toLocaleLowerCase();
  const normalizedCategory = (filters.category ?? '').trim().toLocaleLowerCase();

  // Only published records are public; drafts stay visible in the admin only.
  const baseFilter: Record<string, unknown> = {
    isArchived: false,
    publishedAt: mongoose.trusted({ $ne: null }),
  };
  if (normalizedCategory) baseFilter.category = normalizedCategory;
  if (filters.featured === true) baseFilter.isFeatured = true;

  const match = buildSearchMatch(baseFilter, normalizedQuery);
  const [rows, total] = await Promise.all([
    Service.aggregate<PublicServiceSummary & { imagePublicId: string | null }>([
      { $match: match },
      { $sort: { isFeatured: -1, name: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: 'slug',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          slug: 1,
          name: 1,
          category: 1,
          categoryName: { $ifNull: ['$categoryDoc.name', '$category'] },
          shortDescription: 1,
          isFeatured: 1,
          isPlaceholder: { $literal: false },
          visual: 1,
          price: { $ifNull: ['$price', null] },
          imageUrl: { $ifNull: ['$image.url', null] },
          imagePublicId: '$image.publicId',
        },
      },
    ]),
    Service.countDocuments(match),
  ]);

  const items: PublicServiceSummary[] = rows.map(({ imagePublicId, ...row }) => ({
    ...row,
    imageUrl: buildCloudinaryImageUrl(imagePublicId, { width: 900 }) ?? row.imageUrl ?? null,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.max(1, Math.ceil(total / limit)) : 0,
  };
}

function buildSearchMatch(
  baseFilter: Record<string, unknown>,
  query: string,
): Record<string, unknown> {
  if (!query) return baseFilter;

  // A RegExp value (rather than a `$regex` operator object) is unaffected by
  // the global `sanitizeFilter`, which would otherwise cast the operator object.
  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  return {
    ...baseFilter,
    $or: [{ name: pattern }, { shortDescription: pattern }, { category: pattern }],
  };
}

export async function findServiceBySlug(slug: string): Promise<PublicServiceDetail | null> {
  const doc = await Service.findOne({
    slug: slug.trim().toLowerCase(),
    isArchived: false,
  }).lean<ServiceDocument>();
  if (!doc) return null;

  const categoryDoc = await Category.findOne({
    slug: doc.category,
    isArchived: false,
  }).lean<CategoryDocument>();
  const categoryName = categoryDoc?.name ?? doc.category;

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    categoryName,
    shortDescription: doc.shortDescription,
    isFeatured: doc.isFeatured,
    isPlaceholder: false,
    visual: doc.visual,
    imageUrl:
      buildCloudinaryImageUrl(doc.image?.publicId, { width: 1200 }) ?? doc.image?.url ?? null,
    price: doc.price ?? null,
    description: doc.description,
    steps: doc.steps,
    benefits: doc.benefits,
    considerations: doc.considerations,
    faqs: doc.faqs,
  };
}

export async function findRelatedServiceIds(
  serviceId: string,
  limit = 3,
): Promise<Array<{ id: string; slug: string; name: string }>> {
  const doc = await Service.findById(serviceId).lean<ServiceDocument>();
  if (!doc) return [];

  const ids = await Service.aggregate<{ _id: string; slug: string; name: string }>([
    { $match: { isArchived: false, _id: { $ne: doc._id }, isFeatured: true } },
    { $sort: { name: 1 } },
    { $limit: limit },
    { $project: { _id: { $toString: '$_id' }, slug: 1, name: 1 } },
  ]);

  return ids.map((item) => ({ id: item._id, slug: item.slug, name: item.name }));
}

function toPublicProductSummary(doc: ProductDocument): PublicProductSummary {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    brand: doc.brand,
    category: doc.category,
    shortDescription: doc.shortDescription,
    price: doc.price,
    size: doc.size,
    isFeatured: doc.isFeatured,
    imageUrl: buildCloudinaryImageUrl(doc.image?.publicId, { width: 900 }) ?? doc.image?.url ?? null,
    isPlaceholder: false,
  };
}

export async function findProducts(filters: {
  category?: string;
  q?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
} = {}): Promise<{
  items: PublicProductSummary[];
  categories: string[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const limit = Math.max(1, Math.min(48, Number(filters.limit ?? 24)));
  const page = Math.max(1, Number(filters.page ?? 1));
  const skip = (page - 1) * limit;
  const normalizedCategory = (filters.category ?? '').trim();
  const normalizedQuery = (filters.q ?? '').trim();

  const match: Record<string, unknown> = {
    isArchived: false,
    publishedAt: mongoose.trusted({ $ne: null }),
  };
  if (normalizedCategory) match.category = normalizedCategory;
  if (filters.featured === true) match.isFeatured = true;

  if (normalizedQuery) {
    const pattern = new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [
      { name: pattern },
      { brand: pattern },
      { category: pattern },
      { shortDescription: pattern },
    ];
  }

  const published = { isArchived: false, publishedAt: mongoose.trusted({ $ne: null }) };
  const [docs, categories, total] = await Promise.all([
    Product.find(match)
      .sort({ isFeatured: -1, order: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean<ProductDocument[]>(),
    Product.distinct('category', published),
    Product.countDocuments(match),
  ]);

  return {
    items: docs.map(toPublicProductSummary),
    categories: categories.filter(Boolean).sort(),
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
}

export async function findProductBySlug(slug: string): Promise<PublicProductDetail | null> {
  const doc = await Product.findOne({
    slug: slug.trim().toLowerCase(),
    isArchived: false,
  }).lean<ProductDocument>();

  if (!doc) return null;

  return {
    ...toPublicProductSummary(doc),
    description: doc.description,
    features: doc.features,
  };
}

export async function findGalleryItems(
  category?: string,
): Promise<{ items: PublicGalleryItem[]; categories: string[]; total: number }> {
  const normalizedCategory = (category ?? '').trim();
  const match = normalizedCategory
    ? { isArchived: false, category: normalizedCategory }
    : { isArchived: false };
  const published = { isArchived: false, publishedAt: mongoose.trusted({ $ne: null }) };

  const [items, categories] = await Promise.all([
    Gallery.find({ ...match, ...published })
      .sort({ publishedAt: -1, createdAt: 1 })
      .limit(48)
      .lean<GalleryDocument[]>(),
    Gallery.distinct('category', published),
  ]);

  return {
    items: items.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      alt: doc.alt,
      category: doc.category,
      variant: doc.variant,
      imageUrl: buildCloudinaryImageUrl(doc.cloudId, { width: 900 }),
      isPlaceholder: false,
    })),
    categories: categories.filter(Boolean).sort(),
    total: items.length,
  };
}

export async function findTestimonials(): Promise<{ items: PublicTestimonial[]; note?: string }> {
  const docs = await Testimonial.find({
    isArchived: false,
    publishedAt: mongoose.trusted({ $ne: null }),
  })
    .sort({ publishedAt: -1, createdAt: 1 })
    .lean<TestimonialDocument[]>();

  if (docs.length === 0) {
    return {
      items: [],
      note: 'Verified client stories will be published only after consent and clinic approval.',
    };
  }

  return {
    items: docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      treatment: doc.treatment,
      quote: doc.quote,
      isPlaceholder: false,
    })),
  };
}

export async function findTeamMembers(): Promise<{ items: PublicTeamMember[]; note?: string }> {
  const docs = await Team.find({
    isArchived: false,
    publishedAt: mongoose.trusted({ $ne: null }),
  })
    .sort({ publishedAt: -1, createdAt: 1 })
    .lean<TeamDocument[]>();

  if (docs.length === 0) {
    return {
      items: [],
      note: 'Practitioner profiles are published only after names and credentials are verified.',
    };
  }

  return {
    items: docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      designation: doc.designation,
      bio: doc.bio,
      imageUrl: buildCloudinaryImageUrl(doc.cloudId, { width: 700 }),
      isPlaceholder: false,
    })),
  };
}

export async function findFaqs(
  category?: string,
): Promise<{ items: PublicFaqItem[]; categories: string[]; total: number }> {
  const normalizedCategory = (category ?? '').trim();
  const match = normalizedCategory
    ? { isArchived: false, category: normalizedCategory }
    : { isArchived: false };
  const published = { isArchived: false, publishedAt: mongoose.trusted({ $ne: null }) };

  const [items, categories] = await Promise.all([
    Faq.find({ ...match, ...published })
      .sort({ publishedAt: -1, createdAt: 1 })
      .lean<FaqDocument[]>(),
    Faq.distinct('category', published),
  ]);

  return {
    items: items.map((doc) => ({
      id: doc._id.toString(),
      question: doc.question,
      answer: doc.answer,
      category: doc.category,
      isPlaceholder: false,
    })),
    categories: categories.filter(Boolean).sort(),
    total: items.length,
  };
}

export async function findWebsiteSettings(): Promise<PublicSettings | null> {
  const doc = await WebsiteSettings.findOne().lean<WebsiteSettingsDocument>();
  if (!doc) return null;

  return {
    isDemo: false,
    site: doc.site,
    brand: doc.brand,
    contact: doc.contact,
    whatsapp: doc.whatsapp,
    booking: doc.booking,
    social: doc.social ?? [],
    homepage: doc.homepage,
    seo: doc.seo,
    legal: { lastUpdated: doc.legal.lastUpdated ? doc.legal.lastUpdated.toISOString() : null },
  };
}

export async function requireWebsiteSettings(): Promise<PublicSettings> {
  const settings = await findWebsiteSettings();
  if (!settings) {
    throw new AppError(503, 'SETTINGS_UNAVAILABLE', 'Website settings are not yet configured.');
  }
  return settings;
}

export async function upsertWebsiteSettings(
  payload: Partial<WebsiteSettingsDocument>,
): Promise<WebsiteSettingsDocument> {
  return WebsiteSettings.findOneAndUpdate(
    {},
    { $set: { ...payload, updatedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<WebsiteSettingsDocument>();
}
