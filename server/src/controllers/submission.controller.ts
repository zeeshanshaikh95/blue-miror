import { createHash } from 'node:crypto';

import { Router, type Request } from 'express';
import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';
import {
  AppointmentCreateSchema,
  ContactCreateSchema,
  EnquiryCreateSchema,
  TestimonialSubmitSchema,
  type RequestContext,
} from '../lib/submission-validation.js';
import {
  createAppointmentRequest,
  createContactSubmission,
  createEnquiry,
  createTestimonialSubmission,
} from '../services/submission.service.js';
import { AppError } from '../utils/app-error.js';

export const publicSubmissionRouter = Router();

function submissionLimiter(limit: number) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    // The integration suite exercises many submissions from one address; the
    // production budget stays in force everywhere except the test environment.
    limit: env.NODE_ENV === 'test' ? 1000 : limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => {
      const requestId =
        typeof response.locals.requestId === 'string' ? response.locals.requestId : undefined;

      response.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many submissions from this connection. Please try again later.',
        },
        ...(requestId ? { requestId } : {}),
      });
    },
  });
}

// Public writes are rate limited per IP well below the general API budget.
const appointmentLimiter = submissionLimiter(5);
const enquiryLimiter = submissionLimiter(10);
const contactLimiter = submissionLimiter(5);
const testimonialLimiter = submissionLimiter(3);

function requestContext(request: Request): RequestContext {
  const ip = typeof request.ip === 'string' ? request.ip : '';
  const userAgent = request.get('user-agent') ?? null;

  return {
    // Salted hash: enough to group abusive submissions without storing an address.
    ipHash: ip
      ? createHash('sha256').update(`ip:${env.JWT_SECRET}:${ip}`).digest('hex').slice(0, 32)
      : null,
    userAgent: userAgent ? userAgent.slice(0, 400) : null,
  };
}

/**
 * Honeypot and submit-timing checks run before validation so a bot cannot
 * learn which individual rule it tripped. The response is deliberately generic.
 */
function rejectLikelyBot(body: unknown) {
  if (typeof body !== 'object' || body === null) return;

  const { company, formStartedAt } = body as { company?: unknown; formStartedAt?: unknown };

  if (typeof company === 'string' && company.trim().length > 0) {
    throw new AppError(400, 'SUBMISSION_REJECTED', 'This request could not be accepted.');
  }

  if (typeof formStartedAt === 'number' && Date.now() - formStartedAt < 2000) {
    throw new AppError(400, 'SUBMISSION_REJECTED', 'This request could not be accepted.');
  }
}

publicSubmissionRouter.post('/appointments', appointmentLimiter, async (request, response) => {
  rejectLikelyBot(request.body);
  const payload = AppointmentCreateSchema.parse(request.body);
  const result = await createAppointmentRequest(payload, requestContext(request));

  response.status(201).json({
    success: true,
    data: {
      reference: result.reference,
      status: result.status,
      whatsappUrl: result.whatsappUrl,
      serviceName: result.serviceName,
    },
  });
});

publicSubmissionRouter.post('/enquiries', enquiryLimiter, async (request, response) => {
  rejectLikelyBot(request.body);
  const payload = EnquiryCreateSchema.parse(request.body);
  const result = await createEnquiry(payload, requestContext(request));

  response.status(201).json({ success: true, data: result });
});

publicSubmissionRouter.post('/contact', contactLimiter, async (request, response) => {
  rejectLikelyBot(request.body);
  const payload = ContactCreateSchema.parse(request.body);
  const result = await createContactSubmission(payload, requestContext(request));

  response.status(201).json({ success: true, data: result });
});

publicSubmissionRouter.post(
  '/testimonials/submit',
  testimonialLimiter,
  async (request, response) => {
    rejectLikelyBot(request.body);
    const payload = TestimonialSubmitSchema.parse(request.body);
    const result = await createTestimonialSubmission(payload, requestContext(request));

    response.status(201).json({ success: true, data: result });
  },
);
