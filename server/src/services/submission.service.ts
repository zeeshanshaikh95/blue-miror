import { randomInt } from 'node:crypto';

import mongoose from 'mongoose';

import { Appointment, Enquiry, ContactSubmission, Service, Testimonial } from '../models/index.js';
import type {
  AppointmentCreateInput,
  ContactCreateInput,
  EnquiryCreateInput,
  RequestContext,
  TestimonialSubmitInput,
} from '../lib/submission-validation.js';
import { normalizePhone } from '../lib/submission-validation.js';
import { findWebsiteSettings } from './content.service.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import type { PublicSettings } from './content.service.js';

const duplicateWindowMs = 10 * 60 * 1000;
const bookingReferenceAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Unread enquiries are kept indefinitely; handled ones expire after a day. */
const ENQUIRY_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_HANDLED_ENQUIRIES = 50;

export type SubmissionAcknowledgement = {
  reference: string;
  status: string;
  whatsappUrl: string | null;
};

function createBookingReference(now = new Date()): string {
  const stamp = [
    String(now.getUTCFullYear()).slice(2),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');
  const suffix = Array.from(
    { length: 4 },
    () => bookingReferenceAlphabet[randomInt(0, bookingReferenceAlphabet.length)],
  ).join('');

  return `BM-${stamp}-${suffix}`;
}

function formatMessageTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-z][a-z0-9_]*)\}/gi, (match, key: string) => values[key] ?? match);
}

function buildWhatsAppUrl(settings: PublicSettings | null, message: string): string | null {
  if (!settings?.whatsapp.enabled) return null;

  const digits = `${settings.whatsapp.countryCode ?? ''}${settings.whatsapp.number ?? ''}`.replace(
    /\D/g,
    '',
  );

  if (digits.length < 7 || digits.length > 15) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`;
}

function buildAppointmentMessage(
  settings: PublicSettings | null,
  values: Record<string, string>,
): string {
  const template =
    settings?.whatsapp.bookingMessageTemplate ?? settings?.whatsapp.defaultMessage ?? null;

  if (template) return formatMessageTemplate(template, values);

  return [
    'Hello, I would like to request an appointment.',
    `Reference: ${values.reference}`,
    `Name: ${values.name}`,
    values.service !== 'Not selected' ? `Treatment: ${values.service}` : null,
    `Preferred: ${values.date} at ${values.time}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function resolveServiceName(slug: string | null | undefined): Promise<string | null> {
  if (!slug) return null;

  const service = await Service.findOne({ slug: slug.trim().toLowerCase(), isArchived: false })
    .select({ name: 1 })
    .lean<{ name: string } | null>();

  if (!service) {
    throw new AppError(422, 'UNKNOWN_SERVICE', 'That treatment is not available.', {
      serviceSlug: 'Choose a treatment from the published menu.',
    });
  }

  return service.name;
}

export async function createAppointmentRequest(
  input: AppointmentCreateInput,
  context: RequestContext,
): Promise<SubmissionAcknowledgement & { serviceName: string | null }> {
  const phone = normalizePhone(input.phone);
  const serviceName = await resolveServiceName(input.serviceSlug);

  // `trusted` keeps the comparison operator intact while `sanitizeFilter` is
  // enabled globally; without it Mongoose would cast the operator object as a date.
  const duplicate = await Appointment.findOne({
    phone,
    createdAt: mongoose.trusted({ $gte: new Date(Date.now() - duplicateWindowMs) }),
  })
    .select({ bookingRef: 1 })
    .lean<{ bookingRef: string } | null>();

  if (duplicate) {
    throw new AppError(
      409,
      'DUPLICATE_REQUEST',
      'A request from this number was just received. Please wait for the clinic to respond.',
      { bookingRef: `Reference ${duplicate.bookingRef}` },
    );
  }

  const settings = await findWebsiteSettings();
  const now = new Date();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const bookingRef = createBookingReference(now);

    try {
      await Appointment.create({
        bookingRef,
        fullName: input.fullName,
        phone,
        email: input.email ?? null,
        serviceSlug: input.serviceSlug ?? null,
        serviceName,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        message: input.message ?? null,
        status: 'pending',
        adminNotes: null,
        statusHistory: [{ status: 'pending', at: now, note: null }],
        source: 'website',
        consentAccepted: true,
        ipHash: context.ipHash,
        userAgent: context.userAgent,
      });

      const whatsappUrl = buildWhatsAppUrl(
        settings,
        buildAppointmentMessage(settings, {
          reference: bookingRef,
          name: input.fullName,
          service: serviceName ?? 'Not selected',
          date: input.preferredDate,
          time: input.preferredTime,
        }),
      );

      return { reference: bookingRef, status: 'pending', whatsappUrl, serviceName };
    } catch (error) {
      const isDuplicateKey =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 11000;

      if (!isDuplicateKey || attempt === 2) throw error;
    }
  }

  throw new AppError(500, 'REFERENCE_UNAVAILABLE', 'The request could not be stored.');
}

/**
 * Unread enquiries are never removed automatically. A handled enquiry
 * (contacted/closed) expires 24 hours after it was last updated, and at most
 * the newest 50 handled enquiries are kept.
 */
export async function pruneEnquiries(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ENQUIRY_RETENTION_MS);

  const expired = await Enquiry.deleteMany({
    status: mongoose.trusted({ $ne: 'new' }),
    updatedAt: mongoose.trusted({ $lt: cutoff }),
  });

  const overflow = await Enquiry.find({ status: mongoose.trusted({ $ne: 'new' }) })
    .sort({ _id: -1 })
    .skip(MAX_HANDLED_ENQUIRIES)
    .select({ _id: 1 })
    .lean<Array<{ _id: mongoose.Types.ObjectId }>>();

  let overflowRemoved = 0;

  if (overflow.length > 0) {
    const result = await Enquiry.deleteMany({
      _id: mongoose.trusted({ $in: overflow.map((entry) => entry._id) }),
    });
    overflowRemoved = result.deletedCount ?? 0;
  }

  return (expired.deletedCount ?? 0) + overflowRemoved;
}

export async function createEnquiry(
  input: EnquiryCreateInput,
  context: RequestContext,
): Promise<SubmissionAcknowledgement> {
  const serviceName = await resolveServiceName(input.serviceSlug);

  const enquiry = await Enquiry.create({
    name: input.name,
    phone: normalizePhone(input.phone),
    email: input.email ?? null,
    serviceSlug: input.serviceSlug ?? null,
    serviceName,
    message: input.message,
    status: 'new',
    adminNotes: null,
    source: 'website',
    ipHash: context.ipHash,
    userAgent: context.userAgent,
    purgeAt: null,
  });

  try {
    await pruneEnquiries();
  } catch (error) {
    logger.warn({ err: error }, 'Enquiry retention cleanup failed');
  }

  return {
    reference: enquiry._id.toString(),
    status: enquiry.status,
    whatsappUrl: null,
  };
}

export async function createContactSubmission(
  input: ContactCreateInput,
  context: RequestContext,
): Promise<SubmissionAcknowledgement> {
  const submission = await ContactSubmission.create({
    name: input.name,
    email: input.email,
    phone: input.phone ? normalizePhone(input.phone) : null,
    subject: input.subject,
    message: input.message,
    status: 'new',
    adminNotes: null,
    ipHash: context.ipHash,
    userAgent: context.userAgent,
  });

  return {
    reference: submission._id.toString(),
    status: submission.status,
    whatsappUrl: null,
  };
}

export async function createTestimonialSubmission(
  input: TestimonialSubmitInput,
  _context: RequestContext,
): Promise<SubmissionAcknowledgement> {
  const testimonial = await Testimonial.create({
    name: input.name,
    treatment: input.treatment ?? null,
    quote: input.quote,
    consentStoredAt: new Date(),
    publishedAt: null,
    isArchived: false,
  });

  return {
    reference: testimonial._id.toString(),
    // Submitted stories always wait for clinic moderation before publication.
    status: 'pending',
    whatsappUrl: null,
  };
}

export type { RequestContext as SubmissionContext };
