import { z } from 'zod';

import { apiRequest } from '@/lib/api-client';

const visualSchema = z.enum(['arch', 'orbit', 'drape', 'horizon', 'bloom', 'column']);

const categorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const serviceSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  categoryName: z.string(),
  shortDescription: z.string(),
  isFeatured: z.boolean(),
  isPlaceholder: z.boolean(),
  imageUrl: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  visual: visualSchema,
});

const serviceDetailSchema = serviceSummarySchema.extend({
  description: z.array(z.string()),
  steps: z.array(z.string()),
  benefits: z.array(z.string()),
  considerations: z.array(z.string()),
  faqs: z.array(faqSchema),
});

const serviceListSchema = z.object({
  isDemo: z.boolean(),
  items: z.array(serviceSummarySchema),
  categories: z.array(categorySchema),
  total: z.number(),
  page: z.number().optional(),
  limit: z.number().optional(),
  totalPages: z.number().optional(),
});

const serviceDetailResponseSchema = serviceDetailSchema.extend({
  related: z.array(serviceSummarySchema),
});

const siteSettingsSchema = z.object({
  isDemo: z.boolean(),
  site: z.object({
    name: z.string(),
    category: z.string(),
    // Stored as null until the clinic supplies an approved tagline.
    tagline: z.string().nullable(),
    defaultDescription: z.string(),
  }),
  brand: z.object({
    logoUrl: z.string(),
    logoAlt: z.string(),
  }),
  contact: z.object({
    phone: z.string().nullable(),
    email: z.string().nullable(),
    whatsappDisplay: z.string().nullable(),
    address: z.string().nullable(),
    mapsUrl: z.string().nullable(),
    directionsUrl: z.string().nullable(),
    hours: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  whatsapp: z.object({
    enabled: z.boolean(),
    countryCode: z.string().nullable(),
    number: z.string().nullable(),
    defaultMessage: z.string().nullable(),
    bookingMessageTemplate: z.string().nullable(),
    serviceEnquiryTemplate: z.string().nullable(),
    cta: z.object({
      booking: z.string(),
      serviceEnquiry: z.string(),
      floating: z.string(),
    }),
    showFloatingButton: z.boolean().optional(),
  }),
  booking: z.object({
    primaryChannel: z.enum(['whatsapp']),
    responseExpectation: z.string().nullable(),
    note: z.string(),
    enabled: z.boolean().optional(),
  }),
  social: z.array(z.object({ label: z.string(), url: z.string() })),
  homepage: z
    .object({
      heroHeading: z.string().nullable(),
      heroDescription: z.string().nullable(),
      heroImageUrl: z.string().nullable(),
      heroCtaLabel: z.string().nullable(),
      heroCtaHref: z.string().nullable(),
      aboutHeading: z.string().nullable(),
      aboutBody: z.string().nullable(),
      showFeatured: z.boolean(),
      showGallery: z.boolean(),
      showFaqs: z.boolean(),
    })
    .partial()
    .optional(),
  seo: z.object({
    defaultTitle: z.string(),
    defaultDescription: z.string(),
    canonicalBaseUrl: z.string().nullable(),
  }),
  legal: z.object({
    lastUpdated: z.string().nullable(),
  }),
});

const productSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string().nullable().optional(),
  category: z.string(),
  shortDescription: z.string(),
  price: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  isFeatured: z.boolean(),
  imageUrl: z.string().nullable().optional(),
  isPlaceholder: z.boolean().optional(),
});

const productDetailSchema = productSummarySchema.extend({
  description: z.array(z.string()),
  features: z.array(z.string()),
});

const productListSchema = z.object({
  isDemo: z.boolean(),
  items: z.array(productSummarySchema),
  categories: z.array(z.string()),
  total: z.number(),
  page: z.number().optional(),
  limit: z.number().optional(),
  totalPages: z.number().optional(),
});

export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type ProductListResponse = z.infer<typeof productListSchema>;

const galleryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  alt: z.string(),
  category: z.string(),
  variant: visualSchema,
  imageUrl: z.string().nullable().optional(),
  isPlaceholder: z.boolean(),
});

const galleryResponseSchema = z.object({
  isDemo: z.boolean(),
  items: z.array(galleryItemSchema),
  categories: z.array(z.string()),
  total: z.number(),
});

const faqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  isPlaceholder: z.boolean(),
});

const faqResponseSchema = z.object({
  isDemo: z.boolean(),
  items: z.array(faqItemSchema),
  categories: z.array(z.string()),
  total: z.number(),
});

const testimonialSchema = z.object({
  id: z.string(),
  name: z.string(),
  treatment: z.string().nullable(),
  quote: z.string(),
});

const testimonialsResponseSchema = z.object({
  isDemo: z.boolean(),
  items: z.array(testimonialSchema),
  note: z.string().optional(),
});

const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  bio: z.string().nullable(),
  imageUrl: z.string().nullable().optional(),
});

const teamResponseSchema = z.object({
  isDemo: z.boolean(),
  items: z.array(teamMemberSchema),
  note: z.string().optional(),
});

export type VisualVariant = z.infer<typeof visualSchema>;
export type PublicCategory = z.infer<typeof categorySchema>;
export type ServiceSummary = z.infer<typeof serviceSummarySchema>;
export type ServiceDetail = z.infer<typeof serviceDetailSchema>;
export type ServiceListResponse = z.infer<typeof serviceListSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type PublicGalleryItem = z.infer<typeof galleryItemSchema>;
export type PublicGalleryResponse = z.infer<typeof galleryResponseSchema>;
export type PublicFaq = z.infer<typeof faqItemSchema>;
export type PublicFaqResponse = z.infer<typeof faqResponseSchema>;
export type PublicTestimonial = z.infer<typeof testimonialSchema>;
export type PublicTestimonialsResponse = z.infer<typeof testimonialsResponseSchema>;
export type PublicTeamMember = z.infer<typeof teamMemberSchema>;
export type PublicTeamResponse = z.infer<typeof teamResponseSchema>;

export type ServiceFilters = {
  q?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
};

export type ProductFilters = {
  q?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
};

async function getValidated<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const data = await apiRequest<unknown>(path);
  return schema.parse(data);
}

export function getSiteSettings(): Promise<SiteSettings> {
  return getValidated('/public/settings', siteSettingsSchema);
}

export function getServices(filters: ServiceFilters = {}): Promise<ServiceListResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.featured) params.set('featured', 'true');
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return getValidated(`/public/services${query}`, serviceListSchema);
}

export function getService(slug: string): Promise<ServiceDetail & { related: ServiceSummary[] }> {
  return getValidated(`/public/services/${encodeURIComponent(slug)}`, serviceDetailResponseSchema);
}

export function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.featured) params.set('featured', 'true');
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return getValidated(`/public/products${query}`, productListSchema);
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return getValidated(`/public/products/${encodeURIComponent(slug)}`, productDetailSchema);
}

export function getGallery(): Promise<PublicGalleryResponse> {
  return getValidated('/public/gallery', galleryResponseSchema);
}

export function getFaqs(): Promise<PublicFaqResponse> {
  return getValidated('/public/faqs', faqResponseSchema);
}

export function getTestimonials(): Promise<PublicTestimonialsResponse> {
  return getValidated('/public/testimonials', testimonialsResponseSchema);
}

export function getTeam(): Promise<PublicTeamResponse> {
  return getValidated('/public/team', teamResponseSchema);
}
