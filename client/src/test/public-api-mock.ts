import { vi } from 'vitest';

import type { SiteSettings } from '@/services/public-content';

const serviceSummary = {
  id: 'demo-consultation',
  slug: 'skin-consultation',
  name: 'Skin consultation',
  category: 'consultations',
  categoryName: 'Consultations',
  shortDescription: 'A private conversation about your concerns and priorities.',
  isFeatured: true,
  isPlaceholder: true,
  visual: 'orbit' as const,
};

const serviceDetail = {
  ...serviceSummary,
  description: ['Sample treatment overview.', 'A second sample paragraph.'],
  steps: ['Discuss your concerns.', 'Review suitability in person.', 'Agree next steps.'],
  benefits: ['Sample benefit wording, not a guarantee.'],
  considerations: ['Suitability and risks require a consultation.'],
  faqs: [{ question: 'Does this commit me?', answer: 'Sample answer pending clinic approval.' }],
};

const secondService = {
  ...serviceSummary,
  id: 'demo-facial',
  slug: 'facial-treatment',
  name: 'Facial treatment',
  category: 'facial-care',
  categoryName: 'Facial care',
  shortDescription: 'Placeholder facial treatment information.',
  visual: 'arch' as const,
};

const thirdService = {
  ...serviceSummary,
  id: 'demo-skin',
  slug: 'skin-treatment',
  name: 'Skin treatment',
  category: 'skin',
  categoryName: 'Skin',
  shortDescription: 'Placeholder skin treatment information.',
  isFeatured: false,
  visual: 'bloom' as const,
};

export const testServices = [serviceSummary, secondService, thirdService];

export const testSettings: SiteSettings = {
  isDemo: true,
  site: {
    name: 'Blue Miror',
    category: 'Aesthetic Clinic',
    tagline: 'Aesthetic care, considered.',
    defaultDescription: 'A service-led aesthetic clinic experience.',
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
  },
  booking: {
    primaryChannel: 'whatsapp' as const,
    responseExpectation: null,
    note: 'Every appointment request is reviewed before confirmation.',
  },
  social: [],
  seo: {
    defaultTitle: 'Blue Miror — Aesthetic Clinic',
    defaultDescription: 'A service-led aesthetic clinic experience.',
    canonicalBaseUrl: null,
  },
  legal: { lastUpdated: null },
};

export const testGallery = [
  {
    id: 'gallery-01',
    title: 'Reception study',
    alt: 'Placeholder for the clinic reception',
    category: 'Clinic spaces',
    variant: 'arch' as const,
    isPlaceholder: true,
  },
  {
    id: 'gallery-02',
    title: 'Material detail',
    alt: 'Placeholder for clinic materials',
    category: 'Details',
    variant: 'drape' as const,
    isPlaceholder: true,
  },
];

export const testFaqs = [
  {
    id: 'faq-booking',
    question: 'How will booking work?',
    answer: 'Sample booking answer.',
    category: 'Booking',
    isPlaceholder: true,
  },
  {
    id: 'faq-prices',
    question: 'Are prices shown?',
    answer: 'Sample pricing answer.',
    category: 'Treatments',
    isPlaceholder: true,
  },
];

type MockOptions = {
  servicesError?: boolean;
  servicesPending?: boolean;
  settingsOverrides?: Partial<SiteSettings>;
};

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function errorResponse(status: number) {
  return jsonResponse(
    {
      success: false,
      error: { code: 'SERVICE_NOT_FOUND', message: 'This treatment could not be found.' },
      requestId: 'test-request',
    },
    status,
  );
}

export function mockPublicApi(options: MockOptions = {}) {
  const settings = { ...testSettings, ...options.settingsOverrides };

  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const raw =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(raw);
    const path = url.pathname.replace(/^\/api/, '');

    if (path === '/public/settings') return jsonResponse({ success: true, data: settings });

    if (path === '/public/services') {
      if (options.servicesError) {
        return jsonResponse(
          {
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'The service menu could not be loaded.' },
          },
          503,
        );
      }

      if (options.servicesPending) {
        return new Promise(() => undefined);
      }

      const q = url.searchParams.get('q')?.toLowerCase();
      const category = url.searchParams.get('category');
      const featured = url.searchParams.get('featured') === 'true';
      const items = testServices
        .filter((service) => !category || service.category === category)
        .filter((service) => !featured || service.isFeatured)
        .filter((service) => !q || service.name.toLowerCase().includes(q));

      return jsonResponse({
        success: true,
        data: {
          isDemo: true,
          items,
          categories: [
            { slug: 'consultations', name: 'Consultations', description: 'Consultations' },
            { slug: 'facial-care', name: 'Facial care', description: 'Facial care' },
            { slug: 'skin', name: 'Skin', description: 'Skin' },
          ],
          total: items.length,
        },
        meta: { page: 1, limit: 24, total: items.length, totalPages: items.length > 0 ? 1 : 0 },
      });
    }

    if (path.startsWith('/public/services/')) {
      const slug = decodeURIComponent(path.replace('/public/services/', ''));

      if (slug === 'skin-consultation') {
        return jsonResponse({
          success: true,
          data: { ...serviceDetail, related: [secondService, thirdService] },
        });
      }

      return errorResponse(404);
    }

    if (path === '/public/gallery') {
      return jsonResponse({
        success: true,
        data: {
          isDemo: true,
          items: testGallery,
          categories: ['Clinic spaces', 'Details'],
          total: testGallery.length,
        },
      });
    }

    if (path === '/public/faqs') {
      return jsonResponse({
        success: true,
        data: {
          isDemo: true,
          items: testFaqs,
          categories: ['Booking', 'Treatments'],
          total: testFaqs.length,
        },
      });
    }

    if (path === '/public/testimonials') {
      return jsonResponse({
        success: true,
        data: { isDemo: true, items: [], note: 'Verified stories only.' },
      });
    }

    if (path === '/public/team') {
      return jsonResponse({
        success: true,
        data: { isDemo: true, items: [], note: 'Verified profiles only.' },
      });
    }

    return jsonResponse(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
      },
      404,
    );
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
