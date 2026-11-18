/**
 * Phase 3 public content contract.
 *
 * This is deliberately a read-only, demo-only source. It lets the public
 * experience be built and tested against an HTTP API before the MongoDB models
 * and admin CRUD exist in Phase 4. Every record is marked as placeholder data.
 * No clinic facts, prices, contact details, team credentials or testimonials
 * are invented here.
 */

export type PublicCategory = {
  slug: string;
  name: string;
  description: string;
};

export type PublicService = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  shortDescription: string;
  description: string[];
  steps: string[];
  benefits: string[];
  considerations: string[];
  faqs: Array<{ question: string; answer: string }>;
  isFeatured: boolean;
  isPlaceholder: true;
  visual: 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';
};

export type PublicGalleryItem = {
  id: string;
  title: string;
  alt: string;
  category: string;
  variant: 'arch' | 'orbit' | 'drape' | 'horizon' | 'bloom' | 'column';
  isPlaceholder: true;
};

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPlaceholder: true;
};

export const publicCategories: PublicCategory[] = [
  {
    slug: 'consultations',
    name: 'Consultations',
    description: 'Private conversations about your concerns, priorities and next steps.',
  },
  {
    slug: 'facial-care',
    name: 'Facial care',
    description: 'Placeholder category for clinic-approved facial treatment content.',
  },
  {
    slug: 'skin',
    name: 'Skin',
    description: 'Placeholder category for clinic-approved skin treatment content.',
  },
  {
    slug: 'body',
    name: 'Body',
    description: 'Placeholder category for clinic-approved body treatment content.',
  },
];

export const publicServices: PublicService[] = [
  {
    id: 'demo-consultation',
    slug: 'skin-consultation',
    name: 'Skin consultation',
    category: 'consultations',
    categoryName: 'Consultations',
    shortDescription:
      'A private conversation about your concerns, priorities and the questions that matter to you.',
    description: [
      'This is placeholder service copy. The final consultation description, duration and format will be supplied and reviewed by Blue Miror before publication.',
      'The page is structured to put the consultation first: an opportunity to discuss your concerns, ask questions and understand whether a treatment pathway is appropriate. No outcome is promised and no treatment is recommended online.',
    ],
    steps: [
      'Discuss your concerns, priorities and any questions.',
      'Review relevant history and suitability in person with the clinic.',
      'Agree clear next steps — which may include no treatment at all.',
    ],
    benefits: [
      'Sample structure only. Potential benefits will be described with clinic-approved, non-guaranteed wording.',
    ],
    considerations: [
      'Suitability, risks, aftercare and costs must be discussed directly with the clinic.',
      'This preview does not provide medical advice or a diagnosis.',
    ],
    faqs: [
      {
        question: 'Does a consultation commit me to treatment?',
        answer:
          'Placeholder answer. The clinic will confirm its consultation policy before this page is published.',
      },
    ],
    isFeatured: true,
    isPlaceholder: true,
    visual: 'orbit',
  },
  {
    id: 'demo-facial',
    slug: 'facial-treatment',
    name: 'Facial treatment',
    category: 'facial-care',
    categoryName: 'Facial care',
    shortDescription:
      'A placeholder for the clinic’s considered facial treatment information and aftercare guidance.',
    description: [
      'This is placeholder service copy. Final treatment details, suitability information and aftercare instructions require clinic and medical review.',
      'The finished page will explain what a visit may involve, how to prepare and what to expect afterwards — without guarantees or implied outcomes.',
    ],
    steps: [
      'Begin with a conversation about your concerns and priorities.',
      'Discuss suitability and the proposed approach in person.',
      'Receive clear aftercare guidance from the clinic.',
    ],
    benefits: [
      'Sample structure only. Benefits must be written as possibilities, never guarantees.',
    ],
    considerations: [
      'Every treatment carries risks and not every treatment is suitable for everyone.',
      'The clinic will provide approved suitability, risk and aftercare information before publication.',
    ],
    faqs: [
      {
        question: 'Can I choose a treatment without a consultation?',
        answer:
          'Placeholder answer. The clinic’s actual booking and consultation policy will be added after approval.',
      },
    ],
    isFeatured: true,
    isPlaceholder: true,
    visual: 'arch',
  },
  {
    id: 'demo-skin',
    slug: 'skin-treatment',
    name: 'Skin treatment',
    category: 'skin',
    categoryName: 'Skin',
    shortDescription:
      'A placeholder structure for skin treatment information, clearly separated from medical advice.',
    description: [
      'This is placeholder service copy. Blue Miror must supply the approved treatment description, suitability criteria and aftercare before this page is published.',
      'The final experience will prioritise a considered consultation, realistic expectations and plain-language safety information.',
    ],
    steps: [
      'Share your concerns and what you would like to understand better.',
      'Discuss your history, suitability and realistic expectations in person.',
      'Agree a plan with clear aftercare and follow-up guidance.',
    ],
    benefits: [
      'Sample structure only. No treatment result is promised or implied by this preview.',
    ],
    considerations: [
      'Medical history, current medications and previous treatments may affect suitability.',
      'Risks, downtime and aftercare must be explained by the clinic before treatment.',
    ],
    faqs: [
      {
        question: 'Is the information on this page medical advice?',
        answer:
          'No. This is placeholder website copy, not medical advice. Suitability and risks must be discussed in a consultation with the clinic.',
      },
    ],
    isFeatured: true,
    isPlaceholder: true,
    visual: 'bloom',
  },
  {
    id: 'demo-body',
    slug: 'body-treatment',
    name: 'Body treatment',
    category: 'body',
    categoryName: 'Body',
    shortDescription:
      'A placeholder for body treatment content, designed around consultation and informed choice.',
    description: [
      'This is placeholder service copy for the body treatment section of the clinic menu.',
      'Final treatment names, descriptions, suitability notes and aftercare are pending clinic approval. No treatment outcome is described or promised here.',
    ],
    steps: [
      'Discuss your concerns and priorities in a private consultation.',
      'Review suitability, risks and realistic expectations with the clinic.',
      'Agree next steps and aftercare in writing where appropriate.',
    ],
    benefits: ['Sample structure only, pending clinic-approved wording.'],
    considerations: [
      'The clinic must supply verified suitability and risk information before publication.',
      'This preview is not a substitute for a professional consultation.',
    ],
    faqs: [
      {
        question: 'How do I know whether this treatment is suitable for me?',
        answer:
          'Suitability can only be assessed in a consultation with the clinic. No assessment is made through this website.',
      },
    ],
    isFeatured: false,
    isPlaceholder: true,
    visual: 'horizon',
  },
  {
    id: 'demo-review',
    slug: 'treatment-review',
    name: 'Treatment review',
    category: 'consultations',
    categoryName: 'Consultations',
    shortDescription:
      'A placeholder follow-up service for reviewing progress, questions and aftercare with the clinic.',
    description: [
      'This is placeholder service copy for a follow-up or treatment review. The clinic will confirm whether this service forms part of its pathway.',
      'The final page will describe the purpose of a review without making claims about results or recovery timelines.',
    ],
    steps: [
      'Share what has changed since your last visit.',
      'Discuss questions, aftercare and any concerns with the clinic.',
      'Agree whether further support is appropriate.',
    ],
    benefits: ['Sample structure only, pending clinic-approved wording.'],
    considerations: [
      'The clinic must confirm the review process and any associated costs.',
      'Urgent medical concerns should be directed to the appropriate healthcare service, not this website.',
    ],
    faqs: [],
    isFeatured: false,
    isPlaceholder: true,
    visual: 'drape',
  },
  {
    id: 'demo-guidance',
    slug: 'skincare-guidance',
    name: 'Skincare guidance',
    category: 'skin',
    categoryName: 'Skin',
    shortDescription:
      'A placeholder information page for clinic-approved skincare guidance and daily care conversations.',
    description: [
      'This is placeholder service copy. No product range, brand, prescription or routine is being promoted.',
      'The final page will be service-led and may discuss general skincare guidance only after the clinic supplies and approves the wording.',
    ],
    steps: [
      'Discuss your current routine, concerns and questions.',
      'Receive guidance appropriate to your consultation and the clinic’s approved approach.',
      'Clarify when to follow up or seek further advice.',
    ],
    benefits: ['Sample structure only, pending clinic-approved wording.'],
    considerations: [
      'Skincare guidance is not a substitute for medical assessment.',
      'The clinic will confirm what this service includes before publication.',
    ],
    faqs: [],
    isFeatured: false,
    isPlaceholder: true,
    visual: 'column',
  },
];

export const publicGallery: PublicGalleryItem[] = [
  {
    id: 'gallery-01',
    title: 'Reception study',
    alt: 'Placeholder for a photograph of the clinic reception',
    category: 'Clinic spaces',
    variant: 'arch',
    isPlaceholder: true,
  },
  {
    id: 'gallery-02',
    title: 'Consultation room',
    alt: 'Placeholder for a photograph of a private consultation room',
    category: 'Clinic spaces',
    variant: 'column',
    isPlaceholder: true,
  },
  {
    id: 'gallery-03',
    title: 'Material detail',
    alt: 'Placeholder for a close-up photograph of natural clinic materials',
    category: 'Details',
    variant: 'drape',
    isPlaceholder: true,
  },
  {
    id: 'gallery-04',
    title: 'Quiet light',
    alt: 'Placeholder for a photograph of soft natural light in the clinic',
    category: 'Details',
    variant: 'horizon',
    isPlaceholder: true,
  },
  {
    id: 'gallery-05',
    title: 'Care in practice',
    alt: 'Placeholder for a photograph of a considered treatment setup',
    category: 'Care',
    variant: 'bloom',
    isPlaceholder: true,
  },
  {
    id: 'gallery-06',
    title: 'A private pause',
    alt: 'Placeholder for a photograph of a calm waiting area',
    category: 'Clinic spaces',
    variant: 'orbit',
    isPlaceholder: true,
  },
  {
    id: 'gallery-07',
    title: 'Detail in gold',
    alt: 'Placeholder for a detail photograph using the clinic’s gold accent',
    category: 'Details',
    variant: 'arch',
    isPlaceholder: true,
  },
  {
    id: 'gallery-08',
    title: 'The treatment journey',
    alt: 'Placeholder for a photograph representing the treatment journey',
    category: 'Care',
    variant: 'drape',
    isPlaceholder: true,
  },
];

export const publicFaqs: PublicFaq[] = [
  {
    id: 'faq-booking',
    question: 'How will booking work?',
    answer:
      'WhatsApp will be the primary booking channel once the clinic’s verified number and approved message are configured. Until then, no number is shown and no booking request can be submitted. Opening WhatsApp will never confirm an appointment.',
    category: 'Booking',
    isPlaceholder: true,
  },
  {
    id: 'faq-request',
    question: 'Will an online request confirm my appointment?',
    answer:
      'No. An appointment request will be stored for the clinic to review. It is not confirmed until the clinic explicitly confirms it. This preview does not yet accept booking requests.',
    category: 'Booking',
    isPlaceholder: true,
  },
  {
    id: 'faq-prices',
    question: 'Are treatment prices shown online?',
    answer:
      'No prices are published in this preview. Pricing will be added only if Blue Miror supplies an approved pricing policy. No price has been invented.',
    category: 'Treatments',
    isPlaceholder: true,
  },
  {
    id: 'faq-suitability',
    question: 'How do I know whether a treatment is suitable for me?',
    answer:
      'Suitability, risks and aftercare must be discussed in a consultation with the clinic. This website does not provide a diagnosis or medical advice.',
    category: 'Treatments',
    isPlaceholder: true,
  },
  {
    id: 'faq-testimonials',
    question: 'How are client stories published?',
    answer:
      'Testimonials are published only after verification and consent. No reviews, names or quotes have been invented for this preview.',
    category: 'Reviews',
    isPlaceholder: true,
  },
  {
    id: 'faq-location',
    question: 'Where is the clinic located?',
    answer:
      'The verified address, opening hours and map will appear here once supplied by the clinic. The preview does not display a placeholder address or map pin.',
    category: 'Visiting',
    isPlaceholder: true,
  },
];

export const publicSettings = {
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
    hours: [] as Array<{ label: string; value: string }>,
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
    note: 'Every appointment request is reviewed by the clinic before it is confirmed. Opening WhatsApp does not confirm an appointment.',
  },
  social: [] as Array<{ label: string; url: string }>,
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

export function getPublicService(slug: string): PublicService | undefined {
  return publicServices.find((service) => service.slug === slug);
}
