import { z } from 'zod';

const visualEnum = z.enum(['arch', 'orbit', 'drape', 'horizon', 'bloom', 'column']);

const isoDateToDate = z
  .string()
  .datetime()
  .nullable()
  .optional()
  .transform((value) => (value ? new Date(value) : null));

const slugPart = z
  .string()
  .min(1)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase letters, numbers and hyphens only.',
  });
const slugMax150 = z
  .string()
  .min(1)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase letters, numbers and hyphens only.',
  });

export const Slug = slugMax150.transform((value) => value.toLowerCase().trim());
export const ShortSlug = slugPart.transform((value) => value.toLowerCase().trim());

export const CategorySchema = z.object({
  slug: Slug,
  name: z.string().trim().min(1).max(90),
  description: z.string().trim().max(180).nullable(),
  order: z.number().int().min(0).max(10_000).optional(),
  isPublished: z.boolean().optional(),
});

export const CategoryUpsertSchema = CategorySchema.strict();

export const ServiceCreateSchema = z
  .object({
    slug: Slug,
    name: z.string().trim().min(1).max(120),
    category: Slug,
    shortDescription: z.string().trim().min(1).max(240),
    description: z.array(z.string().trim().min(1).max(1200)).min(1),
    steps: z.array(z.string().trim().min(1).max(400)).min(1).max(12),
    benefits: z.array(z.string().trim().min(1).max(320)).min(1).max(12),
    considerations: z.array(z.string().trim().min(1).max(320)).min(1).max(12),
    faqs: z
      .array(
        z.object({
          question: z.string().trim().min(1).max(320),
          answer: z.string().trim().min(1).max(1200),
        }),
      )
      .min(1)
      .max(12),
    isFeatured: z.boolean().optional(),
    visual: visualEnum.optional(),
    publishedAt: isoDateToDate,
    order: z.number().int().min(0).max(10_000).optional(),
    // Optional commercial/reference details. Left null when the clinic has not
    // supplied them so nothing invented is ever displayed.
    duration: z.string().trim().max(80).nullable().optional(),
    price: z.string().trim().max(80).nullable().optional(),
    seo: z
      .object({
        title: z.string().trim().max(90).nullable(),
        description: z.string().trim().max(320).nullable(),
      })
      .strict()
      .optional(),
    relatedSlugs: z.array(Slug).max(6).optional(),
    image: z
      .object({
        url: z.string().trim().url().max(500),
        publicId: z.string().trim().min(1).max(300),
        alt: z.string().trim().max(220),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

export const ServiceUpdateSchema = ServiceCreateSchema.partial()
  .extend({
    category: Slug.optional(),
  })
  .strict();

export const GalleryCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    alt: z.string().trim().min(1).max(220),
    category: z.string().trim().min(1).max(80),
    cloudId: z.string().trim().min(1).max(200),
    variant: visualEnum,
    publishedAt: isoDateToDate,
  })
  .strict();

export const GalleryUpdateSchema = GalleryCreateSchema.partial().strict();

export const TeamCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    designation: z.string().trim().min(1).max(120),
    bio: z.string().trim().max(1200).nullable(),
    cloudId: z.string().trim().min(1).max(200).nullable(),
    publishedAt: isoDateToDate,
  })
  .strict();

export const TeamUpdateSchema = TeamCreateSchema.partial().strict();

export const TestimonialCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    treatment: z.string().trim().max(120).nullable(),
    quote: z.string().trim().min(1).max(1200),
    consentStoredAt: isoDateToDate,
    publishedAt: isoDateToDate,
  })
  .strict();

export const TestimonialUpdateSchema = TestimonialCreateSchema.partial().strict();

export const FaqCreateSchema = z
  .object({
    question: z.string().trim().min(1).max(320),
    answer: z.string().trim().min(1).max(1200),
    category: z.string().trim().min(1).max(80),
    publishedAt: isoDateToDate,
  })
  .strict();

export const FaqUpdateSchema = FaqCreateSchema.partial()
  .extend({
    category: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const AdminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Use a valid admin email address.'),
  password: z.string().trim().min(1, 'Password is required.'),
});

export const SettingsSchema = z
  .object({
    site: z
      .object({
        name: z.string().trim().min(1).max(90),
        category: z.string().trim().min(1).max(90),
        tagline: z.string().trim().max(120).nullable(),
        defaultDescription: z.string().trim().min(1).max(320),
      })
      .strict(),
    brand: z
      .object({
        logoUrl: z.string().trim().min(1).max(500),
        logoAlt: z.string().trim().min(1).max(200),
      })
      .strict(),
    contact: z
      .object({
        phone: z.string().trim().max(60).nullable(),
        email: z.string().trim().max(254).nullable(),
        whatsappDisplay: z.string().trim().max(120).nullable(),
        address: z.string().trim().max(320).nullable(),
        mapsUrl: z.string().trim().max(500).nullable(),
        directionsUrl: z.string().trim().max(500).nullable(),
        hours: z
          .array(
            z.object({
              label: z.string().trim().min(1).max(60),
              value: z.string().trim().max(120),
            }),
          )
          .max(20),
      })
      .strict(),
    whatsapp: z
      .object({
        enabled: z.boolean(),
        countryCode: z.string().trim().max(10).nullable(),
        number: z.string().trim().max(20).nullable(),
        defaultMessage: z.string().trim().min(1).max(1000).nullable(),
        bookingMessageTemplate: z.string().trim().max(2000).nullable(),
        serviceEnquiryTemplate: z.string().trim().max(2000).nullable(),
        cta: z
          .object({
            booking: z.string().trim().min(1).max(80),
            serviceEnquiry: z.string().trim().min(1).max(80),
            floating: z.string().trim().min(1).max(80),
          })
          .strict(),
        showFloatingButton: z.boolean().optional(),
      })
      .strict(),
    booking: z
      .object({
        primaryChannel: z.enum(['whatsapp']),
        responseExpectation: z.string().trim().max(240).nullable(),
        note: z.string().trim().min(1).max(600),
        // Lets the clinic pause new requests without deleting the form.
        enabled: z.boolean().optional(),
      })
      .strict(),
    social: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(60),
          url: z.string().trim().min(1).max(500),
        }),
      )
      .max(20),
    seo: z
      .object({
        defaultTitle: z.string().trim().min(1).max(90),
        defaultDescription: z.string().trim().min(1).max(320),
        canonicalBaseUrl: z.string().trim().max(500).nullable(),
      })
      .strict(),
    legal: z
      .object({
        lastUpdated: isoDateToDate,
      })
      .strict(),
    // Homepage copy and section visibility. Every field is optional so older
    // settings documents stay valid and partial updates never wipe a section.
    homepage: z
      .object({
        heroHeading: z.string().trim().max(160).nullable().optional(),
        heroDescription: z.string().trim().max(400).nullable().optional(),
        heroImageUrl: z.string().trim().max(500).nullable().optional(),
        heroCtaLabel: z.string().trim().max(80).nullable().optional(),
        heroCtaHref: z.string().trim().max(300).nullable().optional(),
        aboutHeading: z.string().trim().max(160).nullable().optional(),
        aboutBody: z.string().trim().max(1200).nullable().optional(),
        showFeatured: z.boolean().optional(),
        showGallery: z.boolean().optional(),
        showFaqs: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const AdminPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12, 'Use at least 12 characters.').max(72),
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'Choose a password that differs from the current one.',
    path: ['newPassword'],
  });

export function buildPaginated<T>(items: T[], page: number, limit: number, total: number) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.max(1, Math.ceil(total / limit)) : 0,
  };
}

export type PaginatedResponse<T> = ReturnType<typeof buildPaginated<T>>;
export type ServiceFilters = {
  q?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
};
