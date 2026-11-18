import type {
  AdminAppointment,
  AdminContactSubmission,
  AdminEnquiry,
  TestimonialSubmission,
} from '../types';
import { appointmentStatusTransitions } from '../types';

export type InboxMockState = {
  appointments?: AdminAppointment[];
  enquiries?: AdminEnquiry[];
  contacts?: AdminContactSubmission[];
  testimonialSubmissions?: TestimonialSubmission[];
};

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const now = '2026-01-01T09:00:00.000Z';

function jsonResponse(data: unknown, status = 200): MockResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function fail(status: number, code: string, message: string): MockResponse {
  return jsonResponse({ success: false, error: { code, message } }, status);
}

/** Seeded inbox records, created on first use so older tests stay valid. */
export function seededInbox() {
  return {
    appointments: [
      {
        id: 'appt-1',
        bookingRef: 'BM-261120-AB12',
        fullName: 'Ayesha Khan',
        phone: '07700900123',
        email: 'ayesha@example.com',
        serviceSlug: 'skin-consultation',
        serviceName: 'Skin consultation',
        preferredDate: '2026-12-01',
        preferredTime: '14:30',
        message: 'Please advise on availability.',
        status: 'pending' as const,
        adminNotes: null,
        statusHistory: [{ status: 'pending' as const, at: now, note: null }],
        createdAt: now,
      },
      {
        id: 'appt-2',
        bookingRef: 'BM-261119-CD34',
        fullName: 'Sara Ali',
        phone: '07700900456',
        email: null,
        serviceSlug: null,
        serviceName: null,
        preferredDate: '2026-12-04',
        preferredTime: '10:00',
        message: null,
        status: 'confirmed' as const,
        adminNotes: 'Confirmed by phone.',
        statusHistory: [
          { status: 'pending' as const, at: now, note: null },
          { status: 'confirmed' as const, at: now, note: 'Confirmed by phone.' },
        ],
        createdAt: now,
      },
    ] satisfies AdminAppointment[],
    enquiries: [
      {
        id: 'enq-1',
        name: 'Hana Yusuf',
        phone: '07700900789',
        email: 'hana@example.com',
        serviceSlug: 'skin-consultation',
        serviceName: 'Skin consultation',
        message: 'Do you offer a consultation for sensitive skin?',
        status: 'new' as const,
        adminNotes: null,
        createdAt: now,
      },
    ] satisfies AdminEnquiry[],
    contacts: [
      {
        id: 'contact-1',
        name: 'Nadia Rehman',
        email: 'nadia@example.com',
        phone: null,
        subject: 'Opening hours',
        message: 'Could you confirm your weekend opening hours please?',
        status: 'new' as const,
        adminNotes: null,
        createdAt: now,
      },
    ] satisfies AdminContactSubmission[],
    testimonialSubmissions: [
      {
        id: 'story-1',
        name: 'Hana Y.',
        treatment: 'Skin consultation',
        quote: 'The consultation was calm, clear and genuinely unhurried.',
        consentStoredAt: now,
        publishedAt: null,
        isArchived: false,
        createdAt: now,
      },
      {
        id: 'story-2',
        name: 'Unconsented',
        treatment: null,
        quote: 'A story submitted without a stored consent timestamp.',
        consentStoredAt: null,
        publishedAt: null,
        isArchived: false,
        createdAt: now,
      },
    ] satisfies TestimonialSubmission[],
  };
}

function ensureInbox(state: InboxMockState) {
  const seed = seededInbox();
  state.appointments ??= seed.appointments;
  state.enquiries ??= seed.enquiries;
  state.contacts ??= seed.contacts;
  state.testimonialSubmissions ??= seed.testimonialSubmissions;

  return {
    appointments: state.appointments,
    enquiries: state.enquiries,
    contacts: state.contacts,
    testimonialSubmissions: state.testimonialSubmissions,
  };
}

function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total: items.length,
    totalPages: items.length === 0 ? 0 : Math.ceil(items.length / limit),
  };
}

const inboxPrefixes = [
  '/admin/inbox',
  '/admin/appointments',
  '/admin/enquiries',
  '/admin/contact-submissions',
  '/admin/testimonial-submissions',
];

/**
 * Returns a mocked response for inbox routes, or `null` when the request is
 * not an inbox request so the caller can keep matching other endpoints.
 */
export function handleInboxRequest(
  path: string,
  method: string,
  url: URL,
  body: Record<string, unknown>,
  state: InboxMockState,
  options: { inboxError?: boolean } = {},
): MockResponse | null {
  if (!inboxPrefixes.some((prefix) => path.startsWith(prefix))) return null;

  if (options.inboxError) {
    return fail(503, 'INBOX_UNAVAILABLE', 'The inbox could not be loaded right now.');
  }

  const inbox = ensureInbox(state);
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const q = url.searchParams.get('q')?.toLowerCase() ?? '';
  const status = url.searchParams.get('status') ?? 'all';

  if (path === '/admin/inbox/summary') {
    const pendingAppointments = inbox.appointments.filter((item) => item.status === 'pending');
    const newEnquiries = inbox.enquiries.filter((item) => item.status === 'new');
    const newContactMessages = inbox.contacts.filter((item) => item.status === 'new');
    const pendingTestimonials = inbox.testimonialSubmissions.filter(
      (item) => !item.publishedAt && !item.isArchived,
    );

    return jsonResponse({
      success: true,
      data: {
        pendingAppointments: pendingAppointments.length,
        newEnquiries: newEnquiries.length,
        newContactMessages: newContactMessages.length,
        pendingTestimonials: pendingTestimonials.length,
        inboxTotal:
          pendingAppointments.length +
          newEnquiries.length +
          newContactMessages.length +
          pendingTestimonials.length,
        generatedAt: now,
      },
    });
  }

  if (path === '/admin/appointments' && method === 'GET') {
    const filtered = inbox.appointments
      .filter((item) => (status === 'all' ? true : item.status === status))
      .filter(
        (item) =>
          !q ||
          item.bookingRef.toLowerCase().includes(q) ||
          item.fullName.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q),
      );

    return jsonResponse({ success: true, data: paginate(filtered, page, limit) });
  }

  const appointmentMatch = /^\/admin\/appointments\/([^/]+)$/.exec(path);
  if (appointmentMatch) {
    const id = appointmentMatch[1];
    const existing = inbox.appointments.find((item) => item.id === id);
    if (!existing) return fail(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found.');

    if (method === 'GET') return jsonResponse({ success: true, data: existing });

    if (method === 'PATCH') {
      const nextStatus = body.status as AdminAppointment['status'] | undefined;

      if (nextStatus && nextStatus !== existing.status) {
        if (!appointmentStatusTransitions[existing.status].includes(nextStatus)) {
          return fail(
            409,
            'INVALID_STATUS_TRANSITION',
            `An appointment cannot move from ${existing.status} to ${nextStatus}.`,
          );
        }
      }

      const updated: AdminAppointment = {
        ...existing,
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes as string | null } : {}),
        statusHistory:
          nextStatus && nextStatus !== existing.status
            ? [
                ...existing.statusHistory,
                {
                  status: nextStatus,
                  at: now,
                  note: (body.note as string | undefined) ?? null,
                },
              ]
            : existing.statusHistory,
      };

      state.appointments = inbox.appointments.map((item) => (item.id === id ? updated : item));
      return jsonResponse({ success: true, data: updated });
    }
  }

  if (path === '/admin/enquiries' && method === 'GET') {
    const filtered = inbox.enquiries
      .filter((item) => (status === 'all' ? true : item.status === status))
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.phone.includes(q));

    return jsonResponse({ success: true, data: paginate(filtered, page, limit) });
  }

  const enquiryMatch = /^\/admin\/enquiries\/([^/]+)$/.exec(path);
  if (enquiryMatch) {
    const id = enquiryMatch[1];
    const existing = inbox.enquiries.find((item) => item.id === id);
    if (!existing) return fail(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found.');

    if (method === 'GET') return jsonResponse({ success: true, data: existing });

    if (method === 'PATCH') {
      const updated = { ...existing, ...(body as Partial<AdminEnquiry>) };
      state.enquiries = inbox.enquiries.map((item) => (item.id === id ? updated : item));
      return jsonResponse({ success: true, data: updated });
    }
  }

  if (path === '/admin/contact-submissions' && method === 'GET') {
    const filtered = inbox.contacts
      .filter((item) => (status === 'all' ? true : item.status === status))
      .filter(
        (item) => !q || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q),
      );

    return jsonResponse({ success: true, data: paginate(filtered, page, limit) });
  }

  const contactMatch = /^\/admin\/contact-submissions\/([^/]+)$/.exec(path);
  if (contactMatch) {
    const id = contactMatch[1];
    const existing = inbox.contacts.find((item) => item.id === id);
    if (!existing) return fail(404, 'CONTACT_NOT_FOUND', 'Contact message not found.');

    if (method === 'GET') return jsonResponse({ success: true, data: existing });

    if (method === 'PATCH') {
      const updated = { ...existing, ...(body as Partial<AdminContactSubmission>) };
      state.contacts = inbox.contacts.map((item) => (item.id === id ? updated : item));
      return jsonResponse({ success: true, data: updated });
    }
  }

  if (path === '/admin/testimonial-submissions' && method === 'GET') {
    const filtered = inbox.testimonialSubmissions
      .filter((item) => {
        if (status === 'pending') return !item.publishedAt && !item.isArchived;
        if (status === 'published') return Boolean(item.publishedAt) && !item.isArchived;
        if (status === 'archived') return item.isArchived;
        return !item.isArchived;
      })
      .filter((item) => !q || item.name.toLowerCase().includes(q));

    return jsonResponse({ success: true, data: paginate(filtered, page, limit) });
  }

  const storyMatch = /^\/admin\/testimonial-submissions\/([^/]+)$/.exec(path);
  if (storyMatch) {
    const id = storyMatch[1];
    const existing = inbox.testimonialSubmissions.find((item) => item.id === id);
    if (!existing) return fail(404, 'TESTIMONIAL_NOT_FOUND', 'Testimonial not found.');

    if (method === 'GET') return jsonResponse({ success: true, data: existing });

    if (method === 'PATCH') {
      const action = body.action as 'approve' | 'unpublish' | 'archive';

      if (action === 'approve' && !existing.consentStoredAt) {
        return fail(
          409,
          'CONSENT_REQUIRED',
          'This story has no recorded consent and cannot be published.',
        );
      }

      const updated: TestimonialSubmission = {
        ...existing,
        publishedAt: action === 'approve' ? (existing.publishedAt ?? now) : null,
        isArchived: action === 'archive',
      };

      state.testimonialSubmissions = inbox.testimonialSubmissions.map((item) =>
        item.id === id ? updated : item,
      );
      return jsonResponse({ success: true, data: updated });
    }
  }

  return fail(404, 'NOT_FOUND', 'The requested resource was not found.');
}
