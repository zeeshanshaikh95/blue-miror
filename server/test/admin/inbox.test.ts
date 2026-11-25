import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import {
  bearer,
  loginAsAdmin,
  resetDatabase,
  seedAdmin,
  startTestServer,
} from '../test-bootstrap-mongo.js';
import {
  Appointment,
  Category,
  ContactSubmission,
  Enquiry,
  Service,
  Testimonial,
} from '../../src/models/index.js';

let app: Express;
let stop: () => Promise<void>;
let token: string;

const phone = '07700900123';

function appointment(overrides: Record<string, unknown> = {}) {
  return {
    bookingRef: `BM-261120-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    fullName: 'Ayesha Khan',
    phone,
    email: 'ayesha@example.com',
    serviceSlug: 'skin-consultation',
    serviceName: 'Skin consultation',
    preferredDate: '2026-12-01',
    preferredTime: '14:30',
    message: 'Please advise on availability.',
    status: 'pending',
    adminNotes: null,
    statusHistory: [{ status: 'pending', at: new Date(), note: null }],
    source: 'website',
    consentAccepted: true,
    ipHash: 'deadbeef',
    userAgent: 'test-agent',
    ...overrides,
  };
}

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
  // Keep the seeded admin and the login throttle untouched between cases.
  await Promise.all([
    Appointment.deleteMany({}),
    Enquiry.deleteMany({}),
    ContactSubmission.deleteMany({}),
    Testimonial.deleteMany({}),
    Category.deleteMany({}),
    Service.deleteMany({}),
  ]);
});

describe('inbox authentication', () => {
  it('rejects every inbox route without a bearer token', async () => {
    const paths = [
      '/api/admin/appointments',
      '/api/admin/enquiries',
      '/api/admin/contact-submissions',
      '/api/admin/testimonial-submissions',
      '/api/admin/inbox/summary',
    ];

    for (const path of paths) {
      const response = await request(app).get(path);
      expect(response.status, path).toBe(401);
    }
  });

  it('rejects a status change without a token', async () => {
    const created = await Appointment.create(appointment());
    const response = await request(app)
      .patch(`/api/admin/appointments/${created._id.toString()}`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(401);
    expect((await Appointment.findById(created._id))?.status).toBe('pending');
  });
});

describe('appointments inbox', () => {
  it('lists newest first with pagination and never exposes security metadata', async () => {
    await Appointment.create(appointment({ fullName: 'Older request' }));
    await Appointment.create(appointment({ fullName: 'Newer request', phone: '07700900999' }));

    const response = await request(app)
      .get('/api/admin/appointments?limit=1&page=1')
      .set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].fullName).toBe('Newer request');
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.totalPages).toBe(2);

    const record = response.body.data.items[0];
    expect(record.ipHash).toBeUndefined();
    expect(record.userAgent).toBeUndefined();
    expect(record.consentAccepted).toBeUndefined();
  });

  it('creates a clinic appointment and toggles it between done and open', async () => {
    const created = await request(app)
      .post('/api/admin/appointments')
      .set(bearer(token))
      .send({
        fullName: 'Walk-in Reminder',
        phone: '07700900123',
        serviceName: 'Hydra Facial',
        preferredDate: '2026-12-01',
        preferredTime: '16:00',
        notes: 'Requested a reminder call.',
        done: false,
      });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      fullName: 'Walk-in Reminder',
      serviceName: 'Hydra Facial',
      preferredDate: '2026-12-01',
      preferredTime: '16:00',
      status: 'confirmed',
      source: 'admin',
    });

    const id = created.body.data.id as string;

    const done = await request(app)
      .patch(`/api/admin/appointments/${id}/done`)
      .set(bearer(token))
      .send({ done: true });
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('completed');

    const reopened = await request(app)
      .patch(`/api/admin/appointments/${id}/done`)
      .set(bearer(token))
      .send({ done: false });
    expect(reopened.body.data.status).toBe('confirmed');

    const unauthenticated = await request(app).post('/api/admin/appointments').send({});
    expect(unauthenticated.status).toBe(401);
  });

  it('filters by status, searches by reference and rejects unknown statuses', async () => {
    await Appointment.create(appointment({ status: 'confirmed', bookingRef: 'BM-261120-AAAA' }));
    await Appointment.create(appointment({ status: 'pending', bookingRef: 'BM-261120-BBBB' }));

    const confirmed = await request(app)
      .get('/api/admin/appointments?status=confirmed')
      .set(bearer(token));
    expect(confirmed.body.data.items).toHaveLength(1);
    expect(confirmed.body.data.items[0].bookingRef).toBe('BM-261120-AAAA');

    const searched = await request(app).get('/api/admin/appointments?q=BBBB').set(bearer(token));
    expect(searched.body.data.items).toHaveLength(1);
    expect(searched.body.data.items[0].bookingRef).toBe('BM-261120-BBBB');

    const invalid = await request(app)
      .get('/api/admin/appointments?status=teleported')
      .set(bearer(token));
    expect(invalid.status).toBe(200);
    expect(invalid.body.data.total).toBe(2);
  });

  it('returns one appointment and rejects invalid or unknown identifiers', async () => {
    const created = await Appointment.create(appointment());

    const detail = await request(app)
      .get(`/api/admin/appointments/${created._id.toString()}`)
      .set(bearer(token));
    expect(detail.status).toBe(200);
    expect(detail.body.data.phone).toBe(phone);
    expect(detail.body.data.statusHistory).toHaveLength(1);

    const invalid = await request(app).get('/api/admin/appointments/not-an-id').set(bearer(token));
    expect(invalid.status).toBe(400);

    const missing = await request(app)
      .get('/api/admin/appointments/64b7f0f0f0f0f0f0f0f0f0f0')
      .set(bearer(token));
    expect(missing.status).toBe(404);
  });

  it('records status history and rejects an invalid transition', async () => {
    const created = await Appointment.create(appointment());

    const contacted = await request(app)
      .patch(`/api/admin/appointments/${created._id.toString()}`)
      .set(bearer(token))
      .send({ status: 'contacted', note: 'Called the customer' });

    expect(contacted.status).toBe(200);
    expect(contacted.body.data.status).toBe('contacted');
    expect(contacted.body.data.statusHistory).toHaveLength(2);
    expect(contacted.body.data.statusHistory[1].status).toBe('contacted');
    expect(contacted.body.data.statusHistory[1].note).toBe('Called the customer');

    const stored = await Appointment.findById(created._id).lean();
    expect(stored?.statusHistory).toHaveLength(2);

    // completed is not reachable directly from contacted
    const skipped = await request(app)
      .patch(`/api/admin/appointments/${created._id.toString()}`)
      .set(bearer(token))
      .send({ status: 'completed' });

    expect(skipped.status).toBe(409);
    expect(skipped.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    // history survives the rejected update
    expect((await Appointment.findById(created._id).lean())?.statusHistory).toHaveLength(2);
  });

  it('never confirms an appointment implicitly', async () => {
    const created = await Appointment.create(appointment());

    const notesOnly = await request(app)
      .patch(`/api/admin/appointments/${created._id.toString()}`)
      .set(bearer(token))
      .send({ adminNotes: 'Customer asked for a morning slot.' });

    expect(notesOnly.status).toBe(200);
    expect(notesOnly.body.data.status).toBe('pending');
    expect(notesOnly.body.data.statusHistory).toHaveLength(1);
  });

  it('rejects an empty or malformed status payload', async () => {
    const created = await Appointment.create(appointment());
    const id = created._id.toString();

    const empty = await request(app)
      .patch(`/api/admin/appointments/${id}`)
      .set(bearer(token))
      .send({});
    expect(empty.status).toBe(422);

    const unknownField = await request(app)
      .patch(`/api/admin/appointments/${id}`)
      .set(bearer(token))
      .send({ status: 'pending', ipHash: 'overwrite' });
    expect(unknownField.status).toBe(422);
  });
});

describe('enquiries and contact messages', () => {
  it('lists and filters enquiries', async () => {
    await Enquiry.create({
      name: 'Sara Ali',
      phone,
      message: 'Do you treat sensitive skin?',
      serviceSlug: 'skin-consultation',
      serviceName: 'Skin consultation',
      status: 'new',
      ipHash: 'abc',
    });
    await Enquiry.create({
      name: 'Closed lead',
      phone: '07700900777',
      message: 'Already handled.',
      status: 'closed',
      ipHash: 'abc',
    });

    const all = await request(app).get('/api/admin/enquiries').set(bearer(token));
    expect(all.body.data.total).toBe(2);
    expect(all.body.data.items[0].ipHash).toBeUndefined();

    const open = await request(app).get('/api/admin/enquiries?status=new').set(bearer(token));
    expect(open.body.data.items).toHaveLength(1);
    expect(open.body.data.items[0].name).toBe('Sara Ali');

    const searched = await request(app).get('/api/admin/enquiries?q=Sara').set(bearer(token));
    expect(searched.body.data.total).toBe(1);
  });

  it('updates an enquiry status and rejects an invalid one', async () => {
    const enquiry = await Enquiry.create({
      name: 'Sara Ali',
      phone,
      message: 'Question about pricing.',
      status: 'new',
    });

    const updated = await request(app)
      .patch(`/api/admin/enquiries/${enquiry._id.toString()}`)
      .set(bearer(token))
      .send({ status: 'contacted', adminNotes: 'Emailed back.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('contacted');
    expect(updated.body.data.adminNotes).toBe('Emailed back.');

    const invalid = await request(app)
      .patch(`/api/admin/enquiries/${enquiry._id.toString()}`)
      .set(bearer(token))
      .send({ status: 'archived' });
    expect(invalid.status).toBe(422);
  });

  it('lists contact messages and returns a single message', async () => {
    const created = await ContactSubmission.create({
      name: 'Nadia Rehman',
      email: 'nadia@example.com',
      subject: 'Opening hours',
      message: 'Could you confirm weekend hours?',
      status: 'new',
    });
    await ContactSubmission.create({
      name: 'Old message',
      email: 'old@example.com',
      subject: 'Parking',
      message: 'Is parking available on site?',
      status: 'closed',
    });

    const list = await request(app).get('/api/admin/contact-submissions').set(bearer(token));
    expect(list.body.data.total).toBe(2);

    const open = await request(app)
      .get('/api/admin/contact-submissions?status=new')
      .set(bearer(token));
    expect(open.body.data.items).toHaveLength(1);

    const detail = await request(app)
      .get(`/api/admin/contact-submissions/${created._id.toString()}`)
      .set(bearer(token));
    expect(detail.body.data.email).toBe('nadia@example.com');

    const invalidId = await request(app)
      .get('/api/admin/contact-submissions/1234')
      .set(bearer(token));
    expect(invalidId.status).toBe(400);
  });
});

describe('testimonial moderation', () => {
  it('refuses to publish a story without recorded consent', async () => {
    const testimonial = await Testimonial.create({
      name: 'No consent',
      quote: 'A story without a stored consent timestamp.',
      consentStoredAt: null,
      publishedAt: null,
    });

    const response = await request(app)
      .patch(`/api/admin/testimonial-submissions/${testimonial._id.toString()}`)
      .set(bearer(token))
      .send({ action: 'approve' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONSENT_REQUIRED');
    expect((await Testimonial.findById(testimonial._id).lean())?.publishedAt).toBeNull();
  });

  it('publishes an approved story and removes it again on archive', async () => {
    const testimonial = await Testimonial.create({
      name: 'Hana Y.',
      treatment: 'Skin consultation',
      quote: 'The consultation was calm, clear and genuinely unhurried.',
      consentStoredAt: new Date(),
      publishedAt: null,
    });
    const id = testimonial._id.toString();

    const pendingList = await request(app)
      .get('/api/admin/testimonial-submissions?status=pending')
      .set(bearer(token));
    expect(pendingList.body.data.items).toHaveLength(1);
    expect(pendingList.body.data.items[0].consentStoredAt).toBeTruthy();

    const hidden = await request(app).get('/api/public/testimonials');
    expect(hidden.body.data.items).toHaveLength(0);

    const approved = await request(app)
      .patch(`/api/admin/testimonial-submissions/${id}`)
      .set(bearer(token))
      .send({ action: 'approve' });
    expect(approved.status).toBe(200);
    expect(approved.body.data.publishedAt).toBeTruthy();

    const visible = await request(app).get('/api/public/testimonials');
    expect(visible.body.data.items).toHaveLength(1);
    expect(visible.body.data.items[0].name).toBe('Hana Y.');

    const archived = await request(app)
      .patch(`/api/admin/testimonial-submissions/${id}`)
      .set(bearer(token))
      .send({ action: 'archive' });
    expect(archived.status).toBe(200);
    expect(archived.body.data.isArchived).toBe(true);
    expect(archived.body.data.publishedAt).toBeNull();

    const afterArchive = await request(app).get('/api/public/testimonials');
    expect(afterArchive.body.data.items).toHaveLength(0);
  });

  it('rejects an unknown moderation action', async () => {
    const testimonial = await Testimonial.create({
      name: 'Hana Y.',
      quote: 'A considered experience, described in the client’s own words.',
      consentStoredAt: new Date(),
    });

    const response = await request(app)
      .patch(`/api/admin/testimonial-submissions/${testimonial._id.toString()}`)
      .set(bearer(token))
      .send({ action: 'delete-forever' });

    expect(response.status).toBe(422);
  });
});

describe('inbox summary', () => {
  it('counts only genuinely pending records', async () => {
    await Appointment.create(appointment({ status: 'pending' }));
    await Appointment.create(appointment({ status: 'confirmed', phone: '07700900888' }));
    await Enquiry.create({ name: 'New', phone, message: 'Fresh enquiry.', status: 'new' });
    await Enquiry.create({ name: 'Old', phone, message: 'Closed enquiry.', status: 'closed' });
    await ContactSubmission.create({
      name: 'New message',
      email: 'a@example.com',
      subject: 'Hello',
      message: 'A contact message.',
      status: 'new',
    });
    await Testimonial.create({
      name: 'Pending story',
      quote: 'Pending moderation with consent stored.',
      consentStoredAt: new Date(),
    });

    const response = await request(app).get('/api/admin/inbox/summary').set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      pendingAppointments: 1,
      newEnquiries: 1,
      newContactMessages: 1,
      pendingTestimonials: 1,
      inboxTotal: 4,
    });
    expect(response.body.data.requestedBy).toBe('admin@bluemirror.io');
  });
});

describe('category archive guard', () => {
  it('counts every referencing service, not just the first page', async () => {
    await Category.create({ slug: 'skin', name: 'Skin', description: null });

    const services = Array.from({ length: 55 }, (_, index) => ({
      slug: `service-${index}`,
      name: `Service ${index}`,
      category: 'skin',
      shortDescription: 'Short description.',
      description: ['Overview.'],
      steps: ['Step.'],
      benefits: ['Benefit.'],
      considerations: ['Consideration.'],
      faqs: [{ question: 'Question?', answer: 'Answer.' }],
    }));
    await Service.insertMany(services);

    const usage = await request(app).get('/api/admin/categories').set(bearer(token));
    expect(usage.body.data.items[0].serviceCount).toBe(55);

    const blocked = await request(app).delete('/api/admin/categories/skin').set(bearer(token));
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('CATEGORY_IN_USE');
    expect(blocked.body.error.message).toContain('55 services');

    const stillThere = await Category.findOne({ slug: 'skin' }).lean();
    expect(stillThere?.isArchived).toBe(false);
  });

  it('archives an unused category', async () => {
    await Category.create({ slug: 'empty', name: 'Empty', description: null });

    const response = await request(app).delete('/api/admin/categories/empty').set(bearer(token));
    expect(response.status).toBe(200);
    expect((await Category.findOne({ slug: 'empty' }).lean())?.isArchived).toBe(true);
  });
});
