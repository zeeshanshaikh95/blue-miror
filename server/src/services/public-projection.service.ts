import { type ServiceFilters } from '../lib/validation.js';
import {
  findCategories,
  findFaqs,
  findGalleryItems,
  findServiceBySlug,
  findServices,
  findTeamMembers,
  findTestimonials,
  findWebsiteSettings,
  findRelatedServiceIds,
  type PublicServiceDetail,
} from './content.service.js';

export const isDemoFallback = false;

export async function getPublicSettings() {
  const settings = await findWebsiteSettings();
  if (!settings) {
    return {
      isDemo: true,
      site: {
        name: 'Blue Miror',
        category: 'Aesthetic Clinic',
        tagline: 'Aesthetic care, considered.',
        defaultDescription:
          'Blue Miror is a service-led aesthetic clinic, designed around considered care, clear communication and unhurried consultation.',
      },
      brand: {
        logoUrl: '/brand/blue-miror-logo.png',
        logoAlt: 'Blue Miror crest and wordmark',
      },
      contact: {
        phone: null,
        email: null,
        whatsappDisplay: null,
        address: null,
        mapsUrl: null,
        directionsUrl: null,
        hours: [],
      },
      whatsapp: {
        enabled: false,
        countryCode: null,
        number: null,
        defaultMessage: null,
        bookingMessageTemplate: null,
        serviceEnquiryTemplate: null,
        cta: {
          booking: 'Book a consultation',
          serviceEnquiry: 'Ask about this treatment',
          floating: 'Chat on WhatsApp',
        },
        showFloatingButton: true,
      },
      booking: {
        primaryChannel: 'whatsapp' as const,
        responseExpectation: null,
        note: 'Every appointment request is reviewed by the clinic before it is confirmed. Opening WhatsApp does not confirm an appointment.',
        enabled: true,
      },
      social: [],
      homepage: {
        heroHeading: null,
        heroDescription: null,
        heroImageUrl: null,
        heroCtaLabel: null,
        heroCtaHref: null,
        aboutHeading: null,
        aboutBody: null,
        showFeatured: true,
        showGallery: true,
        showFaqs: true,
      },
      seo: {
        defaultTitle: 'Blue Miror — Aesthetic Clinic',
        defaultDescription:
          'A considered, service-led aesthetic clinic experience. Preview content is awaiting clinic approval.',
        canonicalBaseUrl: null,
      },
      legal: {
        lastUpdated: null,
      },
    };
  }

  return settings;
}

export async function getPublicServiceList(filters: ServiceFilters = {}) {
  const { items, total, page, limit, totalPages } = await findServices(filters);
  const categories = await findCategories();

  return {
    isDemo: items.length === 0,
    items,
    categories,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getPublicService(
  slug: string,
): Promise<(PublicServiceDetail & { related: RelatedEntry[] }) | null> {
  const service = await findServiceBySlug(slug);
  if (!service) return null;

  const relatedIds = await findRelatedServiceIds(service.id, 3);
  const related = await Promise.all(
    relatedIds.map(async (item) => {
      const doc = await findServiceBySlug(item.slug);
      if (!doc) return null;
      return {
        id: doc.id,
        slug: doc.slug,
        name: doc.name,
        category: doc.category,
        categoryName: doc.categoryName,
        shortDescription: doc.shortDescription,
        isFeatured: doc.isFeatured,
        isPlaceholder: false as const,
        visual: doc.visual,
      };
    }),
  );

  const relatedFiltered = related.filter((item): item is RelatedEntry => item !== null);

  return {
    ...service,
    related: relatedFiltered,
  };
}

export async function getPublicGallery(category?: string) {
  const result = await findGalleryItems(category);
  return {
    isDemo: result.items.length === 0,
    items: result.items,
    categories: result.categories,
    total: result.total,
  };
}

export async function getPublicTestimonials() {
  const result = await findTestimonials();
  return {
    isDemo: result.items.length === 0,
    items: result.items,
    note:
      result.note ??
      'Verified client stories will be published only after consent and clinic approval.',
  };
}

export async function getPublicTeam() {
  const result = await findTeamMembers();
  return {
    isDemo: result.items.length === 0,
    items: result.items,
    note:
      result.note ??
      'Practitioner profiles are published only after names and credentials are verified.',
  };
}

export async function getPublicFaqs(category?: string) {
  const result = await findFaqs(category);
  return {
    isDemo: result.items.length === 0,
    items: result.items,
    categories: result.categories,
    total: result.total,
  };
}

type RelatedEntry = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  shortDescription: string;
  isFeatured: boolean;
  isPlaceholder: false;
  visual: 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';
};
