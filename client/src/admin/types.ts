export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AdminSession = {
  token: string;
  expiresAt: string;
  admin: AdminUser;
};

export type VisualVariant = 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';

export const visualVariants: VisualVariant[] = [
  'arch',
  'orbit',
  'drape',
  'horizon',
  'bloom',
  'column',
];

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServiceImage = {
  url: string;
  publicId: string;
  alt: string;
};

/** Optional reference fields; every one may be absent on older records. */
export type ServiceDetails = {
  duration?: string | null;
  price?: string | null;
  seo?: { title: string | null; description: string | null };
  relatedSlugs?: string[];
  image?: ServiceImage | null;
  order?: number;
};

export type AdminService = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string[];
  steps: string[];
  benefits: string[];
  considerations: string[];
  faqs: ServiceFaq[];
  isFeatured: boolean;
  visual: VisualVariant;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
} & ServiceDetails;

export type ServiceInput = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string[];
  steps: string[];
  benefits: string[];
  considerations: string[];
  faqs: ServiceFaq[];
  isFeatured: boolean;
  visual: VisualVariant;
  publishedAt: string | null;
  duration?: string | null;
  price?: string | null;
  seo?: { title: string | null; description: string | null };
  relatedSlugs?: string[];
  image?: ServiceImage | null;
};

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  /** Server-side count of every service referencing this category. */
  serviceCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryInput = {
  slug: string;
  name: string;
  description: string | null;
};

export type AdminGalleryItem = {
  id: string;
  title: string;
  alt: string;
  category: string;
  cloudId: string;
  variant: VisualVariant;
  imageUrl?: string | null;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GalleryInput = {
  title: string;
  alt: string;
  category: string;
  cloudId: string;
  variant: VisualVariant;
  publishedAt: string | null;
};

export type AdminTeamMember = {
  id: string;
  name: string;
  designation: string;
  bio: string | null;
  cloudId: string | null;
  imageUrl?: string | null;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TeamInput = {
  name: string;
  designation: string;
  bio: string | null;
  cloudId: string | null;
  publishedAt: string | null;
};

export type AdminTestimonial = {
  id: string;
  name: string;
  treatment: string | null;
  quote: string;
  consentStoredAt: string | null;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TestimonialInput = {
  name: string;
  treatment: string | null;
  quote: string;
  consentStoredAt: string | null;
  publishedAt: string | null;
};

export type AdminFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FaqInput = {
  question: string;
  answer: string;
  category: string;
  publishedAt: string | null;
};

export type SettingsHoursEntry = { label: string; value: string };
export type SettingsSocialEntry = { label: string; url: string };

/** Homepage copy and section visibility; every field is optional in storage. */
export type AdminHomepage = {
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

export const emptyHomepage: AdminHomepage = {
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
};

export type AdminSettings = {
  id?: string;
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
    hours: SettingsHoursEntry[];
  };
  whatsapp: {
    enabled: boolean;
    countryCode: string | null;
    number: string | null;
    defaultMessage: string | null;
    bookingMessageTemplate: string | null;
    serviceEnquiryTemplate: string | null;
    showFloatingButton?: boolean;
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
    enabled?: boolean;
  };
  social: SettingsSocialEntry[];
  homepage?: AdminHomepage;
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    canonicalBaseUrl: string | null;
  };
  legal: {
    lastUpdated: string | null;
  };
};

/**
 * Blank working copy. Intentionally empty rather than pre-filled with preview
 * copy, so nothing that resembles approved clinic content reaches the database.
 */
export const emptySettings: AdminSettings = {
  site: { name: '', category: '', tagline: null, defaultDescription: '' },
  brand: { logoUrl: '', logoAlt: '' },
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
    cta: { booking: '', serviceEnquiry: '', floating: '' },
  },
  booking: { primaryChannel: 'whatsapp', responseExpectation: null, note: '', enabled: true },
  social: [],
  homepage: emptyHomepage,
  seo: { defaultTitle: '', defaultDescription: '', canonicalBaseUrl: null },
  legal: { lastUpdated: null },
};

export type ListResponse<T> = { items: T[]; total: number };

// ---------------------------------------------------------------------------
// Inbox (submissions)
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  'pending' | 'contacted' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: 'WhatsApp pending',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Mirrors the server rules so the UI only offers allowed moves. */
export const appointmentStatusTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['contacted', 'confirmed', 'cancelled'],
  contacted: ['confirmed', 'rescheduled', 'cancelled'],
  confirmed: ['completed', 'rescheduled', 'cancelled'],
  rescheduled: ['confirmed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export type AppointmentHistoryEntry = {
  status: AppointmentStatus;
  at: string;
  note: string | null;
};

export type AdminAppointment = {
  id: string;
  bookingRef: string;
  fullName: string;
  phone: string;
  email: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  preferredDate: string;
  preferredTime: string;
  message: string | null;
  status: AppointmentStatus;
  adminNotes: string | null;
  statusHistory: AppointmentHistoryEntry[];
  source?: string;
  createdAt: string;
  updatedAt?: string;
};

export type EnquiryStatus = 'new' | 'contacted' | 'closed';

export type AdminEnquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  message: string;
  status: EnquiryStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type ContactStatus = 'new' | 'in_progress' | 'closed';

export type AdminContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type TestimonialSubmission = {
  id: string;
  name: string;
  treatment: string | null;
  quote: string;
  consentStoredAt: string | null;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type InboxSummary = {
  pendingAppointments: number;
  newEnquiries: number;
  newContactMessages: number;
  pendingTestimonials: number;
  inboxTotal: number;
  generatedAt: string;
};

export type InboxQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
};
