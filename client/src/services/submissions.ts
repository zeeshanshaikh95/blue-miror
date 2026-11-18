import { z } from 'zod';

import { apiRequest } from '@/lib/api-client';

const submissionResponseSchema = z.object({
  reference: z.string(),
  status: z.string(),
  whatsappUrl: z.string().nullable().optional(),
  serviceName: z.string().nullable().optional(),
});

export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;

const requiredText = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Please keep this under ${max} characters.`);

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: 'Use a valid email address.',
  });

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a contact number.')
  .max(20, 'That number is too long.')
  .regex(/^\+?[0-9][0-9\s-]{5,19}$/, 'Use digits, spaces, hyphens and an optional leading +.');

const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .refine((value) => value === '' || /^\+?[0-9][0-9\s-]{5,19}$/.test(value), {
    message: 'Use a valid contact number.',
  });

const consent = z
  .boolean()
  .refine((value) => value === true, { message: 'Please confirm the consent statement.' });

const todayIso = () => new Date().toISOString().slice(0, 10);

const preferredDate = z
  .string()
  .min(1, 'Choose a preferred date.')
  .refine((value) => value >= todayIso(), { message: 'Choose today or a later date.' });

const preferredTime = z
  .string()
  .min(1, 'Choose a preferred time.')
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time, for example 14:30.');

export const bookingFormSchema = z.object({
  fullName: requiredText(2, 120, 'Enter your full name.'),
  phone,
  email: optionalEmail,
  preferredDate,
  preferredTime,
  message: z.string().trim().max(1000, 'Please keep this under 1000 characters.'),
  consentAccepted: consent,
  serviceSlug: z.string().nullable().optional(),
});

export const enquiryFormSchema = z.object({
  name: requiredText(2, 120, 'Enter your name.'),
  phone,
  email: optionalEmail,
  message: requiredText(5, 1000, 'Tell the clinic what you would like to ask.'),
  consentAccepted: consent,
  serviceSlug: z.string().nullable().optional(),
});

export const contactFormSchema = z.object({
  name: requiredText(2, 120, 'Enter your name.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Use a valid email address.'),
  phone: optionalPhone,
  subject: requiredText(2, 160, 'Add a short subject.'),
  message: requiredText(10, 1000, 'Tell the clinic how they can help.'),
  consentAccepted: consent,
});

export const testimonialFormSchema = z.object({
  name: requiredText(2, 120, 'Tell us how to credit you.'),
  treatment: z.string().trim().max(120),
  quote: requiredText(20, 1200, 'Please write at least 20 characters.'),
  consentAccepted: consent,
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

type SubmissionMeta = { company: string; formStartedAt: number };

async function post<T extends z.ZodTypeAny>(
  path: string,
  body: unknown,
  schema: T,
): Promise<z.infer<T>> {
  const data = await apiRequest<unknown>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return schema.parse(data) as z.infer<T>;
}

function withMeta(meta: SubmissionMeta) {
  return { company: meta.company, formStartedAt: meta.formStartedAt };
}

export function submitAppointment(
  values: BookingFormValues,
  meta: SubmissionMeta,
): Promise<SubmissionResponse> {
  return post(
    '/appointments',
    {
      ...withMeta(meta),
      fullName: values.fullName,
      phone: values.phone,
      email: values.email.trim() ? values.email.trim() : null,
      serviceSlug: values.serviceSlug ?? null,
      preferredDate: values.preferredDate,
      preferredTime: values.preferredTime,
      message: values.message.trim() ? values.message.trim() : null,
      consentAccepted: true,
    },
    submissionResponseSchema,
  );
}

export function submitEnquiry(
  values: EnquiryFormValues,
  meta: SubmissionMeta,
): Promise<SubmissionResponse> {
  return post(
    '/enquiries',
    {
      ...withMeta(meta),
      name: values.name,
      phone: values.phone,
      email: values.email.trim() ? values.email.trim() : null,
      serviceSlug: values.serviceSlug ?? null,
      message: values.message,
      consentAccepted: true,
    },
    submissionResponseSchema,
  );
}

export function submitContactMessage(
  values: ContactFormValues,
  meta: SubmissionMeta,
): Promise<SubmissionResponse> {
  return post(
    '/contact',
    {
      ...withMeta(meta),
      name: values.name,
      email: values.email,
      phone: values.phone.trim() ? values.phone.trim() : null,
      subject: values.subject,
      message: values.message,
      consentAccepted: true,
    },
    submissionResponseSchema,
  );
}

export function submitTestimonial(
  values: TestimonialFormValues,
  meta: SubmissionMeta,
): Promise<SubmissionResponse> {
  return post(
    '/testimonials/submit',
    {
      ...withMeta(meta),
      name: values.name,
      treatment: values.treatment.trim() ? values.treatment.trim() : null,
      quote: values.quote,
      consentAccepted: true,
    },
    submissionResponseSchema,
  );
}

export type FieldErrors = Record<string, string>;

export function collectFieldErrors(error: unknown): FieldErrors {
  if (typeof error !== 'object' || error === null) return {};

  const fields = (error as { fields?: unknown }).fields;
  if (typeof fields !== 'object' || fields === null) return {};

  return Object.fromEntries(
    Object.entries(fields as Record<string, unknown>).filter(
      ([, value]) => typeof value === 'string',
    ),
  ) as FieldErrors;
}

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const entries = error.issues.map((issue) => [issue.path.join('.') || '_form', issue.message]);
  return Object.fromEntries(entries) as FieldErrors;
}
