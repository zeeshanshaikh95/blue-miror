import { z } from 'zod';

export const appointmentStatuses = [
  'pending',
  'contacted',
  'confirmed',
  'rescheduled',
  'completed',
  'cancelled',
] as const;

export const enquiryStatuses = ['new', 'contacted', 'closed'] as const;
export const contactStatuses = ['new', 'in_progress', 'closed'] as const;
export const testimonialModerationActions = ['approve', 'unpublish', 'archive'] as const;

export type AppointmentStatusValue = (typeof appointmentStatuses)[number];
export type EnquiryStatusValue = (typeof enquiryStatuses)[number];
export type ContactStatusValue = (typeof contactStatuses)[number];
export type TestimonialModerationAction = (typeof testimonialModerationActions)[number];

/** Allowed forward moves. Terminal states accept no automatic change. */
export const appointmentTransitions: Record<AppointmentStatusValue, AppointmentStatusValue[]> = {
  pending: ['contacted', 'confirmed', 'cancelled'],
  contacted: ['confirmed', 'rescheduled', 'cancelled'],
  confirmed: ['completed', 'rescheduled', 'cancelled'],
  rescheduled: ['confirmed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.')
  .refine(
    (value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()),
    'Use a real calendar date.',
  );

export const InboxListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(120).optional(),
    status: z.string().trim().max(40).optional(),
    from: isoDay.optional(),
    to: isoDay.optional(),
  })
  .strict();

const manualPhone = z
  .string()
  .trim()
  .min(7, 'Enter a contact number.')
  .max(20, 'That number is too long.')
  .regex(/^\+?[0-9][0-9\s-]{5,19}$/, 'Use digits, spaces, hyphens and an optional leading +.');

const manualTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time such as 14:30.');

/** Clinic-created appointment/reminder. No public form fields are involved. */
export const ManualAppointmentCreateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: manualPhone,
    serviceName: z.string().trim().min(1).max(160),
    preferredDate: isoDay,
    preferredTime: manualTime,
    notes: z.string().trim().max(1000).nullable().optional(),
    done: z.boolean().optional(),
  })
  .strict();

export const ManualAppointmentDoneSchema = z
  .object({ done: z.boolean() })
  .strict();

export const AppointmentUpdateSchema = z
  .object({
    status: z.enum(appointmentStatuses).optional(),
    adminNotes: z.string().trim().max(2000).nullable().optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Send at least one change.',
  });

export const EnquiryUpdateSchema = z
  .object({
    status: z.enum(enquiryStatuses).optional(),
    adminNotes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Send at least one change.' });

export const ContactUpdateSchema = z
  .object({
    status: z.enum(contactStatuses).optional(),
    adminNotes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Send at least one change.' });

export const TestimonialModerationSchema = z
  .object({
    action: z.enum(testimonialModerationActions),
  })
  .strict();

export function canTransitionAppointment(
  from: AppointmentStatusValue,
  to: AppointmentStatusValue,
): boolean {
  return from === to || appointmentTransitions[from].includes(to);
}

export function parseStatusFilter<T extends string>(
  allowed: readonly T[],
  raw: string | undefined,
  extra: readonly string[] = [],
): T | undefined {
  if (!raw || extra.includes(raw)) return undefined;
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

export function buildDateRange(from?: string, to?: string): Record<string, Date> | undefined {
  if (!from && !to) return undefined;

  const range: Record<string, Date> = {};

  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) range.$lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86_400_000);

  return range;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Never return security metadata through the admin API. Expressed as a
 * projection string so every model accepts it without extra type parameters.
 */
export const inboxProjection = '-ipHash -userAgent -__v -consentAccepted';
