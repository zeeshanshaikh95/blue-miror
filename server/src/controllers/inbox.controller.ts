import { Router } from 'express';
import mongoose, { isValidObjectId } from 'mongoose';

import { Appointment, ContactSubmission, Enquiry, Testimonial } from '../models/index.js';
import {
  AppointmentUpdateSchema,
  ContactUpdateSchema,
  EnquiryUpdateSchema,
  InboxListQuerySchema,
  TestimonialModerationSchema,
  appointmentStatuses,
  buildDateRange,
  canTransitionAppointment,
  contactStatuses,
  enquiryStatuses,
  escapeRegex,
  inboxProjection,
  parseStatusFilter,
  type AppointmentStatusValue,
} from '../lib/inbox-validation.js';
import { AppError } from '../utils/app-error.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const inboxRouter = Router();

/** Handled enquiries stay for a day; unread ones stay until they are handled. */
const HANDLED_ENQUIRY_RETENTION_MS = 24 * 60 * 60 * 1000;

function normaliseId(raw: unknown, code: string): string {
  const id = typeof raw === 'string' ? raw : '';
  if (!isValidObjectId(id)) {
    throw new AppError(400, code, 'That record identifier is not valid.');
  }
  return id;
}

function listQuery(query: unknown) {
  return InboxListQuerySchema.parse(query as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Appointment status enum now includes "contacted"; the model owns the truth.
// ---------------------------------------------------------------------------

inboxRouter.get('/admin/appointments', async (request, response) => {
  const query = listQuery(request.query);
  const status = parseStatusFilter(appointmentStatuses, query.status, ['all']);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const created = buildDateRange(query.from, query.to);
  // `trusted` preserves the range operators under the global sanitizeFilter.
  if (created) filter.createdAt = mongoose.trusted(created);

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [
      { bookingRef: pattern },
      { fullName: pattern },
      { phone: pattern },
      { serviceName: pattern },
      { email: pattern },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Appointment.find(filter, inboxProjection)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      items: items.map((item) => ({ ...item, id: item._id })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
    },
  });
});

inboxRouter.get('/admin/appointments/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_APPOINTMENT_ID');
  const appointment = await Appointment.findById(id, inboxProjection).lean();

  if (!appointment) {
    throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment request not found.');
  }

  response.json({ success: true, data: { ...appointment, id: appointment._id } });
});

inboxRouter.patch('/admin/appointments/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_APPOINTMENT_ID');
  const input = AppointmentUpdateSchema.parse(request.body);
  const appointment = await Appointment.findById(id).lean();

  if (!appointment) {
    throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment request not found.');
  }

  const changes: Record<string, unknown> = {};
  if (input.adminNotes !== undefined) changes.adminNotes = input.adminNotes;

  if (input.status && input.status !== appointment.status) {
    if (!canTransitionAppointment(appointment.status, input.status)) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        `An appointment cannot move from ${appointment.status} to ${input.status}.`,
        { status: 'Choose an allowed status for this appointment.' },
      );
    }

    changes.status = input.status;

    const updated = await Appointment.findOneAndUpdate(
      { _id: id, status: appointment.status },
      {
        $set: changes,
        $push: {
          statusHistory: {
            status: input.status,
            at: new Date(),
            note: input.note ?? null,
          },
        },
      },
      { new: true, projection: inboxProjection },
    ).lean();

    if (!updated) {
      throw new AppError(
        409,
        'APPOINTMENT_CHANGED',
        'This appointment changed while you were editing it. Reload and try again.',
      );
    }

    response.json({ success: true, data: { ...updated, id: updated._id } });
    return;
  }

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true, projection: inboxProjection },
  ).lean();

  if (!updated) {
    throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment request not found.');
  }

  response.json({ success: true, data: { ...updated, id: updated._id } });
});

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

inboxRouter.get('/admin/enquiries', async (request, response) => {
  const query = listQuery(request.query);
  const status = parseStatusFilter(enquiryStatuses, query.status, ['all']);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const created = buildDateRange(query.from, query.to);
  // `trusted` preserves the range operators under the global sanitizeFilter.
  if (created) filter.createdAt = mongoose.trusted(created);

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [
      { name: pattern },
      { phone: pattern },
      { email: pattern },
      { serviceName: pattern },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Enquiry.find(filter, inboxProjection)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Enquiry.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      items: items.map((item) => ({ ...item, id: item._id })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
    },
  });
});

inboxRouter.get('/admin/enquiries/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_ENQUIRY_ID');
  const enquiry = await Enquiry.findById(id, inboxProjection).lean();

  if (!enquiry) {
    throw new AppError(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found.');
  }

  response.json({ success: true, data: { ...enquiry, id: enquiry._id } });
});

inboxRouter.patch('/admin/enquiries/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_ENQUIRY_ID');
  const input = EnquiryUpdateSchema.parse(request.body);

  const updates: Record<string, unknown> = { ...input };

  if (input.status) {
    updates.purgeAt =
      input.status === 'new' ? null : new Date(Date.now() + HANDLED_ENQUIRY_RETENTION_MS);
  }

  const enquiry = await Enquiry.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, projection: inboxProjection, runValidators: true },
  ).lean();

  if (!enquiry) {
    throw new AppError(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found.');
  }

  response.json({ success: true, data: { ...enquiry, id: enquiry._id } });
});

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

inboxRouter.get('/admin/contact-submissions', async (request, response) => {
  const query = listQuery(request.query);
  const status = parseStatusFilter(contactStatuses, query.status, ['all']);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const created = buildDateRange(query.from, query.to);
  // `trusted` preserves the range operators under the global sanitizeFilter.
  if (created) filter.createdAt = mongoose.trusted(created);

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { subject: pattern }];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    ContactSubmission.find(filter, inboxProjection)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ContactSubmission.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      items: items.map((item) => ({ ...item, id: item._id })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
    },
  });
});

inboxRouter.get('/admin/contact-submissions/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_CONTACT_ID');
  const submission = await ContactSubmission.findById(id, inboxProjection).lean();

  if (!submission) {
    throw new AppError(404, 'CONTACT_NOT_FOUND', 'Contact message not found.');
  }

  response.json({ success: true, data: { ...submission, id: submission._id } });
});

inboxRouter.patch('/admin/contact-submissions/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_CONTACT_ID');
  const input = ContactUpdateSchema.parse(request.body);

  const submission = await ContactSubmission.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, projection: inboxProjection, runValidators: true },
  ).lean();

  if (!submission) {
    throw new AppError(404, 'CONTACT_NOT_FOUND', 'Contact message not found.');
  }

  response.json({ success: true, data: { ...submission, id: submission._id } });
});

// ---------------------------------------------------------------------------
// Testimonial submissions
// ---------------------------------------------------------------------------

inboxRouter.get('/admin/testimonial-submissions', async (request, response) => {
  const query = listQuery(request.query);
  const bucket = parseStatusFilter(['pending', 'published', 'archived'] as const, query.status, [
    'all',
  ]);

  const filter: Record<string, unknown> = {};

  if (bucket === 'pending') {
    filter.publishedAt = null;
    filter.isArchived = false;
  } else if (bucket === 'published') {
    filter.publishedAt = mongoose.trusted({ $ne: null });
    filter.isArchived = false;
  } else if (bucket === 'archived') {
    filter.isArchived = true;
  } else {
    filter.isArchived = false;
  }

  const created = buildDateRange(query.from, query.to);
  // `trusted` preserves the range operators under the global sanitizeFilter.
  if (created) filter.createdAt = mongoose.trusted(created);

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: pattern }, { treatment: pattern }, { quote: pattern }];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Testimonial.find(filter, inboxProjection)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Testimonial.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      items: items.map((item) => ({ ...item, id: item._id })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
    },
  });
});

inboxRouter.get('/admin/testimonial-submissions/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_TESTIMONIAL_ID');
  const testimonial = await Testimonial.findById(id, inboxProjection).lean();

  if (!testimonial) {
    throw new AppError(404, 'TESTIMONIAL_NOT_FOUND', 'Testimonial submission not found.');
  }

  response.json({ success: true, data: { ...testimonial, id: testimonial._id } });
});

inboxRouter.patch('/admin/testimonial-submissions/:id', async (request, response) => {
  const id = normaliseId(request.params.id, 'INVALID_TESTIMONIAL_ID');
  const { action } = TestimonialModerationSchema.parse(request.body);
  const testimonial = await Testimonial.findById(id).lean();

  if (!testimonial) {
    throw new AppError(404, 'TESTIMONIAL_NOT_FOUND', 'Testimonial submission not found.');
  }

  if (action === 'approve') {
    // Publication is only ever possible with a stored consent timestamp.
    if (!testimonial.consentStoredAt) {
      throw new AppError(
        409,
        'CONSENT_REQUIRED',
        'This story has no recorded consent and cannot be published.',
        { action: 'Record consent before publishing this story.' },
      );
    }

    const published = await Testimonial.findByIdAndUpdate(
      id,
      { $set: { publishedAt: testimonial.publishedAt ?? new Date(), isArchived: false } },
      { new: true, projection: inboxProjection },
    ).lean();

    response.json({ success: true, data: { ...published, id: published?._id } });
    return;
  }

  const archived = await Testimonial.findByIdAndUpdate(
    id,
    {
      $set: {
        publishedAt: null,
        ...(action === 'archive' ? { isArchived: true } : {}),
      },
    },
    { new: true, projection: inboxProjection },
  ).lean();

  response.json({ success: true, data: { ...archived, id: archived?._id } });
});

// ---------------------------------------------------------------------------
// Summary counters for the dashboard and the inbox badge
// ---------------------------------------------------------------------------

inboxRouter.get('/admin/inbox/summary', async (_request, response) => {
  const [pendingAppointments, newEnquiries, newContactMessages, pendingTestimonials] =
    await Promise.all([
      Appointment.countDocuments({ status: 'pending' as AppointmentStatusValue }),
      Enquiry.countDocuments({ status: 'new' }),
      ContactSubmission.countDocuments({ status: 'new' }),
      Testimonial.countDocuments({ publishedAt: null, isArchived: false }),
    ]);

  const admin = (_request as AuthenticatedRequest).user;

  response.json({
    success: true,
    data: {
      pendingAppointments,
      newEnquiries,
      newContactMessages,
      pendingTestimonials,
      inboxTotal: pendingAppointments + newEnquiries + newContactMessages + pendingTestimonials,
      generatedAt: new Date().toISOString(),
      requestedBy: admin?.email ?? null,
    },
  });
});
