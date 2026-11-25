import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import {
  startTestServer,
  resetDatabase,
  bearer,
  loginAsAdmin,
  seedAdmin,
} from '../test-bootstrap-mongo.js';
import {
  Appointment,
  ContactSubmission,
  Enquiry,
  Service,
  Testimonial,
  WebsiteSettings,
} from '../../src/models/index.js';
import {
  pruneCompletedAppointments,
  pruneEnquiries,
} from '../../src/services/submission.service.js';

let app: Express;
let stop: () => Promise<void>;
let token: string;

const startedAt = () => Date.now() - 5000;

const futureDate = (days = 21) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

const appointmentBody = (overrides: Record<string, unknown> = {}) => ({
  fullName: 'Ayesha Khan',
  phone: '+44 7700 900123',
  email: 'ayesha@example.com',
  serviceSlug: 'skin-consultation',
  preferredDate: futureDate(),
  preferredTime: '14:30',
  message: 'I would like to discuss my skin.',
  consentAccepted: true,
  company: '',
  formStartedAt: startedAt(),
  ...overrides,
});

const enquiryBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Sara Ali',
  phone: '07700900999',
  message: 'Do you offer a consultation for sensitive skin?',
  consentAccepted: true,
  company: '',
  formStartedAt: startedAt(),
  ...overrides,
});

const contactBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Nadia Rehman',
  email: 'nadia@example.com',
  subject: 'Opening hours',
  message: 'Could you confirm your weekend opening hours please?',
  consentAccepted: true,
  company: '',
  formStartedAt: startedAt(),
  ...overrides,
});

const settingsFixture = {
  site: {
    name: 'Blue Miror',
    category: 'Aesthetic Clinic',
    tagline: 'Aesthetic care, considered.',
    defaultDescription: 'A considered aesthetic clinic.',
  },
  brand: { logoUrl: '/brand/logo.png', logoAlt: 'Blue Miror' },
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
    enabled: true,
    countryCode: '44',
    number: '7700900123',
    defaultMessage: 'Hello Blue Miror',
    bookingMessageTemplate:
      'Hello, booking {reference} for {name} — {service} on {date} at {time}.',
    serviceEnquiryTemplate: 'I have a question about {service}.',
    cta: { booking: 'Book', serviceEnquiry: 'Ask', floating: 'Chat' },
  },
  booking: {
    primaryChannel: 'whatsapp' as const,
    responseExpectation: 'Within one working day',
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

beforeAll(async () => {
  const server = await startTestServer();
  app = server.app;
  stop = server.stop;
  await resetDatabase();
  await seedAdmin();
  token = await loginAsAdmin(app);
});

afterAll(async () => {
  await stop();
});

beforeEach(async () => {
  await resetDatabase();
  await Service.create({
    slug: 'skin-consultation',
    name: 'Skin Consultation',
    category: 'skin',
    shortDescription: 'A considered skin consultation.',
    description: ['Consultation overview.'],
    steps: ['Step one.'],
    benefits: ['Benefit one.'],
    considerations: ['Consideration one.'],
    faqs: [{ question: 'Question?', answer: 'Answer.' }],
    publishedAt: new Date(),
    isArchived: false,
  });
  await WebsiteSettings.create(settingsFixture);
});

describe('POST /api/appointments', () => {
  it('stores a pending request and returns a reference', async () => {
    const response = await request(app).post('/api/appointments').send(appointmentBody());

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('pending');
    expect(response.body.data.reference).toMatch(/^BM-\d{6}-[A-Z0-9]{4}$/);
    expect(response.body.data.serviceName).toBe('Skin Consultation');

    const stored = await Appointment.findOne({ bookingRef: response.body.data.reference }).lean();
    expect(stored?.status).toBe('pending');
    expect(stored?.phone).toBe('+447700900123');
    expect(stored?.serviceName).toBe('Skin Consultation');
    expect(stored?.statusHistory).toHaveLength(1);
    expect(stored?.consentAccepted).toBe(true);
  });

  it('returns a WhatsApp deep link built from the admin-configured settings', async () => {
    const response = await request(app).post('/api/appointments').send(appointmentBody());

    const url = new URL(response.body.data.whatsappUrl as string);
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/447700900123');

    const message = url.searchParams.get('text') ?? '';
    expect(message).toContain(response.body.data.reference);
    expect(message).toContain('Skin Consultation');
    expect(message).toContain(futureDate());
  });

  it('rejects a second request from the same number inside the duplicate window', async () => {
    await request(app).post('/api/appointments').send(appointmentBody());
    const duplicate = await request(app).post('/api/appointments').send(appointmentBody());

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_REQUEST');
    expect(await Appointment.countDocuments()).toBe(1);
  });

  it('requires recorded consent', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send(appointmentBody({ consentAccepted: false }));

    expect(response.status).toBe(422);
    expect(response.body.error.fields.consentAccepted).toBeDefined();
    expect(await Appointment.countDocuments()).toBe(0);
  });

  it('rejects an unpublished treatment slug', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send(appointmentBody({ serviceSlug: 'not-a-treatment' }));

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('UNKNOWN_SERVICE');
  });

  it('rejects a honeypot submission', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send(appointmentBody({ company: 'spam-bot' }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SUBMISSION_REJECTED');
    expect(await Appointment.countDocuments()).toBe(0);
  });
});

describe('POST /api/enquiries', () => {
  it('stores a new enquiry with the treatment snapshot', async () => {
    const response = await request(app)
      .post('/api/enquiries')
      .send(enquiryBody({ serviceSlug: 'skin-consultation' }));

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('new');

    const stored = await Enquiry.findOne().lean();
    expect(stored?.serviceName).toBe('Skin Consultation');
    expect(stored?.status).toBe('new');
  });

  it('validates the message length', async () => {
    const response = await request(app)
      .post('/api/enquiries')
      .send(enquiryBody({ message: 'Hi' }));

    expect(response.status).toBe(422);
    expect(await Enquiry.countDocuments()).toBe(0);
  });
});

describe('POST /api/contact', () => {
  it('stores a contact message', async () => {
    const response = await request(app).post('/api/contact').send(contactBody());

    expect(response.status).toBe(201);
    const stored = await ContactSubmission.findOne().lean();
    expect(stored?.email).toBe('nadia@example.com');
    expect(stored?.status).toBe('new');
  });

  it('rejects an invalid email address', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send(contactBody({ email: 'not-an-email' }));

    expect(response.status).toBe(422);
    expect(response.body.error.fields.email).toBeDefined();
  });
});

describe('POST /api/testimonials/submit', () => {
  it('stores the story as pending and keeps it off the public site', async () => {
    const response = await request(app).post('/api/testimonials/submit').send({
      name: 'Hana Yusuf',
      treatment: 'Skin Consultation',
      quote: 'The consultation was calm, clear and genuinely unhurried.',
      consentAccepted: true,
      company: '',
      formStartedAt: startedAt(),
    });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('pending');

    const stored = await Testimonial.findOne().lean();
    expect(stored?.publishedAt).toBeNull();
    expect(stored?.consentStoredAt).toBeInstanceOf(Date);

    const publicResponse = await request(app).get('/api/public/testimonials');
    expect(publicResponse.body.data.items).toHaveLength(0);
  });
});
describe('inbox date filtering integration', () => {
  type AppointmentItem = { id: string; status: string; createdAt: string };
  type AppointmentListBody = {
    success: boolean;
    data: {
      items: AppointmentItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };

  const base = new Date('2026-01-10T00:00:00Z');
  const atDay = (day: number, hour = 0, minute = 0) =>
    new Date(base.getTime() + day * 86_400_000 + hour * 3_600_000 + minute * 60_000);

  async function seedAppointments(
    entries: Array<{ createdAt: Date; status?: 'pending' | 'contacted' | 'confirmed' }>,
  ) {
    for (const [index, entry] of entries.entries()) {
      const status = entry.status ?? 'pending';
      await Appointment.create({
        bookingRef: `BM-260110-${String(index + 1).padStart(4, '0')}`,
        fullName: `Guest ${index + 1}`,
        phone: `0770090${String(1000 + index)}`,
        email: 'test@example.com',
        serviceSlug: 'skin-consultation',
        serviceName: 'Skin consultation',
        preferredDate: '2026-02-01',
        preferredTime: '10:00',
        message: 'Please advise on availability.',
        consentAccepted: true,
        status,
        statusHistory: [{ status, at: base, note: null }],
        ipHash: 'hash',
        userAgent: 'agent',
        createdAt: entry.createdAt,
      });
    }
  }

  async function listAppointments(queryString: string) {
    const response = await request(app)
      .get(`/api/admin/appointments?${queryString}`)
      .set(bearer(token));

    expect(response.status).toBe(200);
    return response.body as AppointmentListBody;
  }

  const createdTimes = (body: AppointmentListBody) =>
    body.data.items.map((item) => new Date(item.createdAt).toISOString());

  beforeEach(async () => {
    // The outer beforeEach wipes every collection, so the admin is reseeded here
    // before the inbox routes are exercised.
    await resetDatabase();
    await seedAdmin();
    token = await loginAsAdmin(app);
  });

  it('applies a from-only filter, newest first', async () => {
    await seedAppointments([
      { createdAt: atDay(0) },
      { createdAt: atDay(1) },
      { createdAt: atDay(2) },
    ]);

    const body = await listAppointments('from=2026-01-11&limit=20');

    expect(body.data.total).toBe(2);
    expect(createdTimes(body)).toEqual(['2026-01-12T00:00:00.000Z', '2026-01-11T00:00:00.000Z']);
  });

  it('applies a to-only filter and treats the day as inclusive', async () => {
    await seedAppointments([
      { createdAt: atDay(0) },
      { createdAt: atDay(1) },
      { createdAt: atDay(2) },
    ]);

    const body = await listAppointments('to=2026-01-11&limit=20');

    expect(body.data.total).toBe(2);
    expect(createdTimes(body)).toEqual(['2026-01-11T00:00:00.000Z', '2026-01-10T00:00:00.000Z']);
  });

  it('applies from and to together as an inclusive day range', async () => {
    await seedAppointments([
      { createdAt: atDay(0) },
      { createdAt: atDay(1) },
      { createdAt: atDay(2) },
      { createdAt: atDay(3) },
    ]);

    const body = await listAppointments('from=2026-01-11&to=2026-01-12&limit=20');

    expect(body.data.total).toBe(2);
    expect(createdTimes(body)).toEqual(['2026-01-12T00:00:00.000Z', '2026-01-11T00:00:00.000Z']);
  });

  it('includes records exactly on the boundaries and excludes the day after to', async () => {
    await seedAppointments([
      { createdAt: new Date('2026-01-10T23:59:59.999Z') },
      { createdAt: new Date('2026-01-11T00:00:00.000Z') },
      { createdAt: new Date('2026-01-13T00:00:00.000Z') },
      { createdAt: new Date('2026-01-13T23:59:59.999Z') },
      { createdAt: new Date('2026-01-14T00:00:00.000Z') },
    ]);

    const body = await listAppointments('from=2026-01-11&to=2026-01-13&limit=20');

    expect(body.data.total).toBe(3);
    expect(createdTimes(body)).toEqual([
      '2026-01-13T23:59:59.999Z',
      '2026-01-13T00:00:00.000Z',
      '2026-01-11T00:00:00.000Z',
    ]);
  });

  it('returns nothing when no record falls inside the requested range', async () => {
    await seedAppointments([{ createdAt: atDay(0) }, { createdAt: atDay(1) }]);

    const body = await listAppointments('from=2026-03-01&to=2026-03-05&limit=20');

    expect(body.data.total).toBe(0);
    expect(body.data.items).toHaveLength(0);
    expect(body.data.totalPages).toBe(0);
  });

  it('rejects invalid from and to values with 422', async () => {
    await seedAppointments([{ createdAt: atDay(1) }]);

    for (const queryString of ['from=bad', 'to=bad', 'from=2026-1-1', 'from=bad&to=bad']) {
      const response = await request(app)
        .get(`/api/admin/appointments?${queryString}`)
        .set(bearer(token));

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('combines the date range with a status filter and pagination', async () => {
    await seedAppointments([
      { createdAt: atDay(1), status: 'pending' },
      { createdAt: atDay(2), status: 'pending' },
      { createdAt: atDay(2, 6), status: 'contacted' },
      { createdAt: atDay(3), status: 'pending' },
      { createdAt: atDay(4), status: 'pending' },
      { createdAt: atDay(5), status: 'pending' },
      { createdAt: atDay(6), status: 'pending' },
      { createdAt: atDay(7), status: 'pending' },
    ]);

    const first = await listAppointments(
      'status=pending&from=2026-01-12&to=2026-01-16&limit=2&page=1',
    );
    const second = await listAppointments(
      'status=pending&from=2026-01-12&to=2026-01-16&limit=2&page=2',
    );

    // Days 2..6 are in range and pending: 5 records, so 3 pages of 2.
    expect(first.data.total).toBe(5);
    expect(first.data.page).toBe(1);
    expect(first.data.limit).toBe(2);
    expect(first.data.totalPages).toBe(3);
    expect(first.data.items).toHaveLength(2);
    expect(createdTimes(first)).toEqual(['2026-01-16T00:00:00.000Z', '2026-01-15T00:00:00.000Z']);

    expect(second.data.total).toBe(5);
    expect(second.data.page).toBe(2);
    expect(second.data.items).toHaveLength(2);
    expect(createdTimes(second)).toEqual(['2026-01-14T00:00:00.000Z', '2026-01-13T00:00:00.000Z']);

    const seen = new Set([...first.data.items, ...second.data.items].map((item) => item.id));
    expect(seen.size).toBe(4);
    for (const item of [...first.data.items, ...second.data.items]) {
      expect(item.status).toBe('pending');
    }
  });

  it('keeps unread enquiries and caps only the handled ones', async () => {
    const now = Date.now();

    // 55 handled enquiries: only the newest 50 should survive.
    await Enquiry.collection.insertMany(
      Array.from({ length: 55 }, (_, index) => ({
        name: `Handled ${index}`,
        phone: `90000000${String(index).padStart(2, '0')}`,
        message: 'A handled enquiry.',
        status: 'closed',
        createdAt: new Date(now - (55 - index) * 1000),
        updatedAt: new Date(now - (55 - index) * 1000),
      })),
    );

    await Enquiry.collection.insertMany([
      {
        name: 'Old handled',
        phone: '9111111111',
        message: 'Handled more than a day ago.',
        status: 'closed',
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Old unread',
        phone: '9222222222',
        message: 'Unread and more than a day old.',
        status: 'new',
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Second unread',
        phone: '9333333333',
        message: 'Another unread enquiry.',
        status: 'new',
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
    ]);

    const removed = await pruneEnquiries();
    const remaining = await Enquiry.find({}).lean<Array<{ name: string }>>();

    expect(removed).toBe(6);
    expect(remaining).toHaveLength(52);
    expect(remaining.some((entry) => entry.name === 'Old handled')).toBe(false);
    expect(remaining.some((entry) => entry.name === 'Handled 0')).toBe(false);
    expect(remaining.some((entry) => entry.name === 'Handled 54')).toBe(true);
    expect(remaining.some((entry) => entry.name === 'Old unread')).toBe(true);
    expect(remaining.some((entry) => entry.name === 'Second unread')).toBe(true);
  });

  it('removes completed appointments after three days but keeps open ones', async () => {
    const now = Date.now();

    await Appointment.collection.insertMany([
      {
        bookingRef: 'BM-OLD-COMPLETED',
        fullName: 'Completed old',
        phone: '90000000001',
        preferredDate: '2026-11-01',
        preferredTime: '10:00',
        status: 'completed',
        consentAccepted: true,
        statusHistory: [],
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
      {
        bookingRef: 'BM-NEW-COMPLETED',
        fullName: 'Completed recent',
        phone: '90000000002',
        preferredDate: '2026-11-25',
        preferredTime: '10:00',
        status: 'completed',
        consentAccepted: true,
        statusHistory: [],
        createdAt: new Date(now - 60 * 1000),
        updatedAt: new Date(now - 60 * 1000),
      },
      {
        bookingRef: 'BM-OLD-CONFIRMED',
        fullName: 'Confirmed old',
        phone: '90000000003',
        preferredDate: '2026-11-01',
        preferredTime: '11:00',
        status: 'confirmed',
        consentAccepted: true,
        statusHistory: [],
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
    ]);

    const removed = await pruneCompletedAppointments();
    const remaining = await Appointment.find({}).lean<Array<{ bookingRef: string }>>();

    expect(removed).toBe(1);
    expect(remaining).toHaveLength(2);
    expect(remaining.some((entry) => entry.bookingRef === 'BM-OLD-COMPLETED')).toBe(false);
    expect(remaining.some((entry) => entry.bookingRef === 'BM-NEW-COMPLETED')).toBe(true);
    expect(remaining.some((entry) => entry.bookingRef === 'BM-OLD-CONFIRMED')).toBe(true);
  });
});
