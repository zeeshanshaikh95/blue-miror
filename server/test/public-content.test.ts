import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';

import { startTestServer } from './test-bootstrap-mongo.js';

const settingsPayload = {
  site: {
    name: 'Blue Miror',
    category: 'Aesthetic Clinic',
    tagline: 'Aesthetic care, considered.',
    defaultDescription: 'A service-led aesthetic clinic.',
  },
  brand: { logoUrl: '/brand/blue-miror-logo.png', logoAlt: 'Blue Miror crest' },
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
    note: 'Requests are reviewed before confirmation.',
  },
  social: [],
  seo: {
    defaultTitle: 'Blue Miror',
    defaultDescription: 'A considered aesthetic clinic.',
    canonicalBaseUrl: null,
  },
  legal: { lastUpdated: null },
};

describe('public content fallback', () => {
  let app: Express;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    const server = await startTestServer();
    app = server.app;
    stop = server.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it('serves clearly labelled demo settings when nothing is stored yet', async () => {
    const response = await request(app).get('/api/public/settings');

    expect(response.status).toBe(200);
    expect(response.body.data.isDemo).toBe(true);
    expect(response.body.data.site.name).toBe('Blue Miror');
    expect(response.body.data.contact.phone).toBeNull();
    expect(response.body.data.whatsapp.enabled).toBe(false);
  });

  it('serves only what is stored once settings exist', async () => {
    const { WebsiteSettings } = await import('../src/models/index.js');
    await WebsiteSettings.create(settingsPayload);

    const response = await request(app).get('/api/public/settings');

    expect(response.status).toBe(200);
    expect(response.body.data.isDemo).toBe(false);
    expect(response.body.data.booking.note).toBe('Requests are reviewed before confirmation.');
  });

  it('exposes the admin-managed homepage block without internal fields', async () => {
    const { WebsiteSettings } = await import('../src/models/index.js');
    await WebsiteSettings.findOneAndUpdate(
      {},
      {
        $set: {
          ...settingsPayload,
          homepage: {
            heroHeading: 'A stored hero heading',
            showFeatured: true,
            showGallery: false,
            showFaqs: true,
          },
        },
      },
      { upsert: true, new: true },
    );

    const response = await request(app).get('/api/public/settings');

    expect(response.status).toBe(200);
    expect(response.body.data.homepage.heroHeading).toBe('A stored hero heading');
    expect(response.body.data.homepage.showGallery).toBe(false);
    // Internal bookkeeping never reaches the public projection.
    expect(response.body.data.__v).toBeUndefined();
    expect(response.body.data._id).toBeUndefined();
    expect(response.body.data.homepage._id).toBeUndefined();
  });

  it('marks empty public collections as demo data rather than inventing records', async () => {
    const gallery = await request(app).get('/api/public/gallery');
    expect(gallery.status).toBe(200);
    expect(gallery.body.data.isDemo).toBe(true);
    expect(gallery.body.data.items).toEqual([]);

    const testimonials = await request(app).get('/api/public/testimonials');
    expect(testimonials.body.data.items).toEqual([]);
    expect(typeof testimonials.body.data.note).toBe('string');
  });
});
