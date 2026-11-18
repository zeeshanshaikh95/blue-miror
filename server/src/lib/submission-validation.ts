import { z } from 'zod';

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a contact number.')
  .max(20, 'That number is too long.')
  .regex(/^\+?[0-9][0-9\s-]{5,19}$/, 'Use digits, spaces, hyphens and an optional leading +.');

const emailSchema = z.string().trim().toLowerCase().email('Use a valid email address.').max(254);

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a preferred date.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const difference = parsed.getTime() - todayUtc;
    return difference >= 0 && difference <= 366 * 24 * 60 * 60 * 1000;
  }, 'Choose a date within the next twelve months.');

const timeSchema = z
  .string()
  .trim()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    'Choose a preferred time in 24-hour form, for example 14:30.',
  );

/**
 * Honeypot plus submit-timing checks. Real visitors never fill the hidden
 * `company` field, and never submit a form within a couple of seconds of it
 * being rendered. Both checks fail closed with a generic rejection.
 */
const antiSpamShape = {
  company: z.string().max(0).optional(),
  formStartedAt: z
    .number()
    .int()
    .positive()
    .refine(
      (value) => Date.now() - value >= 2000 && Date.now() - value <= 24 * 60 * 60 * 1000,
      'This form was submitted too quickly. Please try again.',
    ),
};

export const AppointmentCreateSchema = z
  .object({
    fullName: trimmed(2, 120),
    phone: phoneSchema,
    email: emailSchema.nullable().optional(),
    serviceSlug: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullable()
      .optional(),
    preferredDate: dateSchema,
    preferredTime: timeSchema,
    message: trimmed(1, 1000).nullable().optional(),
    consentAccepted: z.literal(true, {
      message: 'Please confirm the consent statement before sending.',
    }),
    ...antiSpamShape,
  })
  .strict();

export const EnquiryCreateSchema = z
  .object({
    name: trimmed(2, 120),
    phone: phoneSchema,
    email: emailSchema.nullable().optional(),
    serviceSlug: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullable()
      .optional(),
    message: trimmed(5, 1000),
    consentAccepted: z.literal(true, {
      message: 'Please confirm the consent statement before sending.',
    }),
    ...antiSpamShape,
  })
  .strict();

export const ContactCreateSchema = z
  .object({
    name: trimmed(2, 120),
    email: emailSchema,
    phone: phoneSchema.nullable().optional(),
    subject: trimmed(2, 160),
    message: trimmed(10, 1000),
    consentAccepted: z.literal(true, {
      message: 'Please confirm the consent statement before sending.',
    }),
    ...antiSpamShape,
  })
  .strict();

export const TestimonialSubmitSchema = z
  .object({
    name: trimmed(2, 120),
    treatment: trimmed(1, 120).nullable().optional(),
    quote: trimmed(20, 1200),
    consentAccepted: z.literal(true, {
      message: 'Consent is required to submit a testimonial.',
    }),
    ...antiSpamShape,
  })
  .strict();

export type AppointmentCreateInput = z.infer<typeof AppointmentCreateSchema>;
export type EnquiryCreateInput = z.infer<typeof EnquiryCreateSchema>;
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
export type TestimonialSubmitInput = z.infer<typeof TestimonialSubmitSchema>;

export type RequestContext = {
  ipHash: string | null;
  userAgent: string | null;
};

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return value.trim().startsWith('+') ? `+${digits}` : digits;
}
