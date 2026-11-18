import mongoose, { Schema, type Types } from 'mongoose';

export type VisualVariant = 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';

export type ServiceDocument = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string[];
  steps: string[];
  benefits: string[];
  considerations: string[];
  faqs: Array<{ question: string; answer: string }>;
  isFeatured: boolean;
  visual: VisualVariant;
  publishedAt: Date | null;
  isArchived: boolean;
  order: number;
  duration: string | null;
  price: string | null;
  seo: { title: string | null; description: string | null };
  relatedSlugs: string[];
  previousSlugs: string[];
  image: {
    url: string;
    publicId: string;
    alt: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryDocument = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GalleryDocument = {
  _id: Types.ObjectId;
  title: string;
  alt: string;
  category: string;
  cloudId: string;
  variant: VisualVariant;
  publishedAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamDocument = {
  _id: Types.ObjectId;
  name: string;
  designation: string;
  bio: string | null;
  cloudId: string | null;
  publishedAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TestimonialDocument = {
  _id: Types.ObjectId;
  name: string;
  treatment: string | null;
  quote: string;
  consentStoredAt: Date | null;
  publishedAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FaqDocument = {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  category: string;
  publishedAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WebsiteSettingsDocument = {
  _id: Types.ObjectId;
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
    showFloatingButton: boolean;
  };
  booking: {
    primaryChannel: 'whatsapp';
    responseExpectation: string | null;
    note: string;
    enabled: boolean;
  };
  social: Array<{ label: string; url: string }>;
  homepage: {
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
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    canonicalBaseUrl: string | null;
  };
  legal: {
    lastUpdated: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

const variantEnum: VisualVariant[] = ['arch', 'orbit', 'drape', 'horizon', 'bloom', 'column'];

const faqEntrySchema = new Schema(
  {
    question: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'faqs.question is required'],
    },
    answer: { type: String, trim: true, minlength: 1, required: [true, 'faqs.answer is required'] },
  },
  { _id: false },
);

const hoursEntrySchema = new Schema(
  {
    label: { type: String, trim: true, minlength: 1, required: [true, 'label is required'] },
    value: { type: String, trim: true, minlength: 1, required: [true, 'value is required'] },
  },
  { _id: false },
);

const socialEntrySchema = new Schema(
  {
    label: { type: String, trim: true, minlength: 1, required: [true, 'social.label is required'] },
    url: { type: String, trim: true, minlength: 1, required: [true, 'social.url is required'] },
  },
  { _id: false },
);

const ctaSchema = new Schema(
  {
    booking: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'cta.booking is required'],
    },
    serviceEnquiry: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'cta.serviceEnquiry is required'],
    },
    floating: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'cta.floating is required'],
    },
  },
  { _id: false },
);

const siteSchema = new Schema(
  {
    name: { type: String, trim: true, minlength: 1, required: [true, 'site.name is required'] },
    category: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'site.category is required'],
    },
    tagline: { type: String, trim: true, maxlength: 120, default: null },
    defaultDescription: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'site.defaultDescription is required'],
    },
  },
  { _id: false },
);

const brandSchema = new Schema(
  {
    logoUrl: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'brand.logoUrl is required'],
    },
    logoAlt: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'brand.logoAlt is required'],
    },
  },
  { _id: false },
);

const contactSchema = new Schema(
  {
    phone: { type: String, trim: true, maxlength: 60, default: null },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: null,
      validate: {
        validator: (value: string | null) =>
          value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'contact.email must be a valid address.',
      },
    },
    whatsappDisplay: { type: String, trim: true, maxlength: 120, default: null },
    address: { type: String, trim: true, maxlength: 320, default: null },
    mapsUrl: { type: String, trim: true, maxlength: 500, default: null },
    directionsUrl: { type: String, trim: true, maxlength: 500, default: null },
    hours: { type: [hoursEntrySchema], default: [] },
  },
  { _id: false },
);

const whatsappSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    countryCode: { type: String, trim: true, maxlength: 10, default: null },
    number: { type: String, trim: true, maxlength: 20, default: null },
    defaultMessage: { type: String, trim: true, maxlength: 1000, default: null },
    bookingMessageTemplate: { type: String, trim: true, maxlength: 2000, default: null },
    serviceEnquiryTemplate: { type: String, trim: true, maxlength: 2000, default: null },
    cta: { type: ctaSchema, required: [true, 'whatsapp.cta is required'] },
    showFloatingButton: { type: Boolean, default: true },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    primaryChannel: { type: String, enum: ['whatsapp'], default: 'whatsapp' },
    responseExpectation: { type: String, trim: true, maxlength: 240, default: null },
    note: { type: String, trim: true, minlength: 1, required: [true, 'booking.note is required'] },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const seoSchema = new Schema(
  {
    defaultTitle: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'seo.defaultTitle is required'],
    },
    defaultDescription: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'seo.defaultDescription is required'],
    },
    canonicalBaseUrl: { type: String, trim: true, maxlength: 500, default: null },
  },
  { _id: false },
);

const legalSchema = new Schema(
  {
    lastUpdated: { type: Date, default: null },
  },
  { _id: false },
);

const serviceImageSchema = new Schema(
  {
    url: { type: String, trim: true, required: [true, 'image.url is required'] },
    publicId: { type: String, trim: true, required: [true, 'image.publicId is required'] },
    alt: { type: String, trim: true, maxlength: 220, default: '' },
  },
  { _id: false },
);

const serviceSeoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 90, default: null },
    description: { type: String, trim: true, maxlength: 320, default: null },
  },
  { _id: false },
);

const homepageSchema = new Schema(
  {
    heroHeading: { type: String, trim: true, maxlength: 160, default: null },
    heroDescription: { type: String, trim: true, maxlength: 400, default: null },
    heroImageUrl: { type: String, trim: true, maxlength: 500, default: null },
    heroCtaLabel: { type: String, trim: true, maxlength: 80, default: null },
    heroCtaHref: { type: String, trim: true, maxlength: 300, default: null },
    aboutHeading: { type: String, trim: true, maxlength: 160, default: null },
    aboutBody: { type: String, trim: true, maxlength: 1200, default: null },
    showFeatured: { type: Boolean, default: true },
    showGallery: { type: Boolean, default: true },
    showFaqs: { type: Boolean, default: true },
  },
  { _id: false },
);

const serviceSchema = new Schema(
  {
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'slug is required'],
      unique: true,
      index: true,
    },
    name: { type: String, trim: true, minlength: 1, required: [true, 'name is required'] },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'category is required'],
    },
    shortDescription: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 240,
      required: [true, 'shortDescription is required'],
    },
    description: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    considerations: { type: [String], default: [] },
    faqs: { type: [faqEntrySchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    visual: { type: String, enum: variantEnum, default: 'column' },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 0, min: 0 },
    duration: { type: String, trim: true, maxlength: 80, default: null },
    price: { type: String, trim: true, maxlength: 80, default: null },
    seo: { type: serviceSeoSchema, default: () => ({}) },
    relatedSlugs: { type: [String], default: [] },
    previousSlugs: { type: [String], default: [] },
    image: { type: serviceImageSchema, default: null },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const categorySchema = new Schema(
  {
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'slug is required'],
      unique: true,
      index: true,
    },
    name: { type: String, trim: true, minlength: 1, required: [true, 'name is required'] },
    description: { type: String, trim: true, maxlength: 180, default: null },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 0, min: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const gallerySchema = new Schema(
  {
    title: { type: String, trim: true, minlength: 1, required: [true, 'title is required'] },
    alt: { type: String, trim: true, minlength: 1, required: [true, 'alt is required'] },
    category: { type: String, trim: true, minlength: 1, required: [true, 'category is required'] },
    cloudId: { type: String, trim: true, minlength: 1, required: [true, 'cloudId is required'] },
    variant: { type: String, enum: variantEnum, required: [true, 'variant is required'] },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const teamSchema = new Schema(
  {
    name: { type: String, trim: true, minlength: 1, required: [true, 'name is required'] },
    designation: {
      type: String,
      trim: true,
      minlength: 1,
      required: [true, 'designation is required'],
    },
    bio: { type: String, trim: true, maxlength: 1200, default: null },
    cloudId: { type: String, trim: true, default: null },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const testimonialSchema = new Schema(
  {
    name: { type: String, trim: true, minlength: 1, required: [true, 'name is required'] },
    treatment: { type: String, trim: true, maxlength: 120, default: null },
    quote: { type: String, trim: true, minlength: 1, required: [true, 'quote is required'] },
    consentStoredAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const faqSchema = new Schema(
  {
    question: { type: String, trim: true, minlength: 1, required: [true, 'question is required'] },
    answer: { type: String, trim: true, minlength: 1, required: [true, 'answer is required'] },
    category: { type: String, trim: true, minlength: 1, required: [true, 'category is required'] },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const websiteSettingsSchema = new Schema(
  {
    site: { type: siteSchema, required: [true, 'site is required'] },
    brand: { type: brandSchema, required: [true, 'brand is required'] },
    contact: { type: contactSchema, required: [true, 'contact is required'] },
    whatsapp: { type: whatsappSchema, required: [true, 'whatsapp is required'] },
    booking: { type: bookingSchema, required: [true, 'booking is required'] },
    social: { type: [socialEntrySchema], default: [] },
    homepage: { type: homepageSchema, default: () => ({}) },
    seo: { type: seoSchema, required: [true, 'seo is required'] },
    legal: { type: legalSchema, required: [true, 'legal is required'] },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

export const Service = mongoose.model('Service', serviceSchema);
export const Category = mongoose.model('Category', categorySchema);
export const Gallery = mongoose.model('Gallery', gallerySchema);
export const Team = mongoose.model('Team', teamSchema);
export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export const Faq = mongoose.model('Faq', faqSchema);
export const WebsiteSettings = mongoose.model('WebsiteSettings', websiteSettingsSchema);

export function lookupServiceBySlug(slug: string) {
  return Service.findOne({
    slug: slug.trim().toLowerCase(),
    isArchived: false,
  }).lean<ServiceDocument>();
}

export function lookupCategoryBySlug(slug: string) {
  return Category.findOne({
    slug: slug.trim().toLowerCase(),
    isArchived: false,
  }).lean<CategoryDocument>();
}

export function lookupGalleryByCloudId(cloudId: string) {
  return Gallery.findOne({ cloudId: cloudId.trim() }).lean<GalleryDocument>();
}

export function lookupTeamByCloudId(cloudId: string) {
  return Team.findOne({ cloudId: cloudId.trim() }).lean<TeamDocument>();
}
