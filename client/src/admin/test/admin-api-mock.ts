import { vi } from 'vitest';

import type {
  AdminCategory,
  AdminFaq,
  AdminGalleryItem,
  AdminService,
  AdminSettings,
  AdminTeamMember,
  AdminTestimonial,
} from '../types';
import { emptySettings } from '../types';
import { handleInboxRequest, type InboxMockState } from './inbox-mock';

export const adminCredentials = {
  email: 'admin@bluemirror.io',
  password: 'correct-horse-battery',
};

export const adminSessionExpiry = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

const now = '2026-01-01T09:00:00.000Z';

export type AdminMockState = InboxMockState & {
  services: AdminService[];
  categories: AdminCategory[];
  gallery: AdminGalleryItem[];
  team: AdminTeamMember[];
  testimonials: AdminTestimonial[];
  faqs: AdminFaq[];
  settings: AdminSettings | null;
};

export function seededState(): AdminMockState {
  return {
    services: [
      {
        id: 'svc-1',
        slug: 'skin-consultation',
        name: 'Skin consultation',
        category: 'consultations',
        shortDescription: 'A private conversation about your concerns.',
        description: ['Overview paragraph.'],
        steps: ['Consultation'],
        benefits: ['Clarity'],
        considerations: ['Requires assessment'],
        faqs: [{ question: 'Is it safe?', answer: 'Discuss at consultation.' }],
        isFeatured: true,
        visual: 'orbit',
        publishedAt: now,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'svc-2',
        slug: 'led-therapy',
        name: 'LED therapy',
        category: 'skin',
        shortDescription: 'Low-level light therapy.',
        description: ['Overview paragraph.'],
        steps: ['Cleanse'],
        benefits: ['Calm skin'],
        considerations: ['Not for photosensitive clients'],
        faqs: [{ question: 'How long?', answer: 'Thirty minutes.' }],
        isFeatured: false,
        visual: 'bloom',
        publishedAt: null,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    categories: [
      {
        id: 'cat-1',
        slug: 'consultations',
        name: 'Consultations',
        description: null,
        isArchived: false,
      },
      { id: 'cat-2', slug: 'skin', name: 'Skin', description: null, isArchived: false },
    ],
    gallery: [
      {
        id: 'gal-1',
        title: 'Reception study',
        alt: 'Clinic reception',
        category: 'Clinic spaces',
        cloudId: 'blue-miror/gallery/reception',
        variant: 'arch',
        publishedAt: now,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    team: [
      {
        id: 'team-1',
        name: 'Dr Example',
        designation: 'Aesthetic Practitioner',
        bio: 'Biography pending verification.',
        cloudId: null,
        publishedAt: now,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    testimonials: [
      {
        id: 'test-1',
        name: 'A Client',
        treatment: 'Skin consultation',
        quote: 'Considered and calm throughout.',
        consentStoredAt: now,
        publishedAt: now,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    faqs: [
      {
        id: 'faq-1',
        question: 'Do I need a consultation?',
        answer: 'Yes, always.',
        category: 'Booking',
        publishedAt: now,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    settings: null,
  };
}

export type MockOptions = {
  inboxError?: boolean;
  unauthorized?: boolean;
  settings?: AdminSettings;
  /** Forces a 500 from the settings save, for error-state coverage. */
  settingsWriteError?: boolean;
};

type Json = Record<string, unknown>;

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return jsonResponse(
    { success: false, error: { ...(fields ? { fields } : {}), code, message }, requestId: 'test' },
    status,
  );
}

function requestPath(input: string | URL | Request): { path: string; url: URL; method: string } {
  const raw =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(raw);

  return { path: url.pathname.replace(/^\/api/, ''), url, method: 'GET' };
}

export function createAdminApiMock(options: MockOptions = {}) {
  const state = seededState();
  if (options.settings) state.settings = options.settings;

  let idCounter = 100;

  const fetchMock = vi.fn(
    async (input: string | URL | Request, init?: { method?: string; body?: string }) => {
      const { path, url } = requestPath(input);
      const method = init?.method ?? 'GET';
      const body: Json = init?.body ? (JSON.parse(init.body) as Json) : {};

      if (path === '/admin/login' && method === 'POST') {
        if (body.email === adminCredentials.email && body.password === adminCredentials.password) {
          return jsonResponse({
            success: true,
            data: {
              token: 'test-session-token',
              expiresAt: adminSessionExpiry(),
              admin: {
                id: 'admin-1',
                email: adminCredentials.email,
                name: adminCredentials.email,
                role: 'superadmin',
              },
            },
          });
        }

        return fail(401, 'ADMIN_INVALID_CREDENTIALS', 'Invalid email or password.');
      }

      if (path === '/admin/logout' && method === 'POST') {
        return jsonResponse({ success: true, data: { revoked: true } });
      }

      if (path === '/admin/password' && method === 'PATCH') {
        if (body.currentPassword !== adminCredentials.password) {
          return fail(422, 'PASSWORD_CURRENT_INVALID', 'The current password is not correct.', {
            currentPassword: 'The current password is not correct.',
          });
        }
        if (typeof body.newPassword !== 'string' || body.newPassword.length < 12) {
          return fail(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', {
            newPassword: 'Use at least 12 characters.',
          });
        }
        return jsonResponse({ success: true, data: { changed: true, sessionsRevoked: 2 } });
      }

      if (options.unauthorized) {
        return fail(401, 'SESSION_REVOKED', 'This session has been signed out.');
      }

      if (path === '/admin/services' && method === 'GET') {
        const q = url.searchParams.get('q')?.toLowerCase() ?? '';
        const category = url.searchParams.get('category') ?? '';
        const page = Number(url.searchParams.get('page') ?? '1');
        const limit = Number(url.searchParams.get('limit') ?? '10');
        const filtered = state.services
          .filter((service) => !service.isArchived)
          .filter((service) => (category ? service.category === category : true))
          .filter(
            (service) =>
              !q ||
              service.name.toLowerCase().includes(q) ||
              service.shortDescription.toLowerCase().includes(q),
          );
        const start = (page - 1) * limit;

        return jsonResponse({
          success: true,
          data: {
            items: filtered.slice(start, start + limit),
            page,
            limit,
            total: filtered.length,
            totalPages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / limit),
          },
        });
      }

      if (path === '/admin/services' && method === 'POST') {
        idCounter += 1;
        const service: AdminService = {
          id: `svc-${idCounter}`,
          slug: String(body.slug),
          name: String(body.name),
          category: String(body.category),
          shortDescription: String(body.shortDescription),
          description: body.description as string[],
          steps: body.steps as string[],
          benefits: body.benefits as string[],
          considerations: body.considerations as string[],
          faqs: body.faqs as AdminService['faqs'],
          isFeatured: Boolean(body.isFeatured),
          visual: (body.visual as AdminService['visual']) ?? 'column',
          publishedAt: (body.publishedAt as string | null) ?? null,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        };
        state.services = [service, ...state.services];
        return jsonResponse({ success: true, data: service }, 201);
      }

      const serviceMatch = /^\/admin\/services\/([^/]+)$/.exec(path);
      if (serviceMatch) {
        const id = serviceMatch[1];
        const existing = state.services.find((service) => service.id === id);

        if (!existing) return fail(404, 'SERVICE_NOT_FOUND', 'Service not found.');

        if (method === 'PUT') {
          const updated = { ...existing, ...(body as Partial<AdminService>) };
          state.services = state.services.map((service) => (service.id === id ? updated : service));
          return jsonResponse({ success: true, data: updated });
        }

        if (method === 'DELETE') {
          const archived = { ...existing, isArchived: true };
          state.services = state.services.map((service) =>
            service.id === id ? archived : service,
          );
          return jsonResponse({ success: true, data: archived });
        }

        return jsonResponse({ success: true, data: existing });
      }

      if (path === '/admin/categories') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: {
              items: state.categories
                .filter((category) => !category.isArchived)
                .map((category) => ({
                  ...category,
                  // Mirrors the server's grouped count across every service.
                  serviceCount: state.services.filter(
                    (service) => !service.isArchived && service.category === category.slug,
                  ).length,
                })),
              total: state.categories.filter((category) => !category.isArchived).length,
            },
          });
        }

        if (method === 'POST') {
          idCounter += 1;
          const category: AdminCategory = {
            id: `cat-${idCounter}`,
            slug: String(body.slug),
            name: String(body.name),
            description: (body.description as string | null) ?? null,
            isArchived: false,
          };
          state.categories = [...state.categories, category];
          return jsonResponse({ success: true, data: category }, 201);
        }
      }

      const categoryMatch = /^\/admin\/categories\/([^/]+)$/.exec(path);
      if (categoryMatch) {
        const slug = categoryMatch[1];
        const existing = state.categories.find((category) => category.slug === slug);
        if (!existing) return fail(404, 'CATEGORY_NOT_FOUND', 'Category not found.');

        if (method === 'PUT') {
          const updated = { ...existing, ...(body as Partial<AdminCategory>) };
          state.categories = state.categories.map((category) =>
            category.slug === slug ? updated : category,
          );
          return jsonResponse({ success: true, data: updated });
        }

        if (method === 'DELETE') {
          state.categories = state.categories.map((category) =>
            category.slug === slug ? { ...category, isArchived: true } : category,
          );
          return jsonResponse({ success: true, data: { ...existing, isArchived: true } });
        }
      }

      if (path === '/admin/gallery') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: {
              items: state.gallery.filter((item) => !item.isArchived),
              total: state.gallery.filter((item) => !item.isArchived).length,
            },
          });
        }
        if (method === 'POST') {
          idCounter += 1;
          const item = {
            ...(body as unknown as Omit<AdminGalleryItem, 'id' | 'isArchived'>),
            id: `gal-${idCounter}`,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          } as AdminGalleryItem;
          state.gallery = [item, ...state.gallery];
          return jsonResponse({ success: true, data: item }, 201);
        }
      }

      const galleryMatch = /^\/admin\/gallery\/([^/]+)$/.exec(path);
      if (galleryMatch) {
        const id = galleryMatch[1];
        const existing = state.gallery.find((item) => item.id === id);
        if (!existing) return fail(404, 'GALLERY_ITEM_NOT_FOUND', 'Gallery item not found.');

        if (method === 'PUT') {
          const updated = { ...existing, ...(body as Partial<AdminGalleryItem>) };
          state.gallery = state.gallery.map((item) => (item.id === id ? updated : item));
          return jsonResponse({ success: true, data: updated });
        }
        if (method === 'DELETE') {
          state.gallery = state.gallery.map((item) =>
            item.id === id ? { ...item, isArchived: true } : item,
          );
          return jsonResponse({ success: true, data: { ...existing, isArchived: true } });
        }
      }

      if (path === '/admin/team') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: { items: state.team.filter((m) => !m.isArchived), total: state.team.length },
          });
        }
        if (method === 'POST') {
          idCounter += 1;
          const member = {
            ...(body as unknown as Omit<AdminTeamMember, 'id' | 'isArchived'>),
            id: `team-${idCounter}`,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          } as AdminTeamMember;
          state.team = [member, ...state.team];
          return jsonResponse({ success: true, data: member }, 201);
        }
      }

      const teamMatch = /^\/admin\/team\/([^/]+)$/.exec(path);
      if (teamMatch) {
        const id = teamMatch[1];
        const existing = state.team.find((member) => member.id === id);
        if (!existing) return fail(404, 'TEAM_MEMBER_NOT_FOUND', 'Team member not found.');
        if (method === 'PUT') {
          const updated = { ...existing, ...(body as Partial<AdminTeamMember>) };
          state.team = state.team.map((member) => (member.id === id ? updated : member));
          return jsonResponse({ success: true, data: updated });
        }
        if (method === 'DELETE') {
          state.team = state.team.map((member) =>
            member.id === id ? { ...member, isArchived: true } : member,
          );
          return jsonResponse({ success: true, data: { ...existing, isArchived: true } });
        }
      }

      if (path === '/admin/testimonials') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: {
              items: state.testimonials.filter((item) => !item.isArchived),
              total: state.testimonials.length,
            },
          });
        }
        if (method === 'POST') {
          idCounter += 1;
          const item = {
            ...(body as unknown as Omit<AdminTestimonial, 'id' | 'isArchived'>),
            id: `test-${idCounter}`,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          } as AdminTestimonial;
          state.testimonials = [item, ...state.testimonials];
          return jsonResponse({ success: true, data: item }, 201);
        }
      }

      const testimonialMatch = /^\/admin\/testimonials\/([^/]+)$/.exec(path);
      if (testimonialMatch) {
        const id = testimonialMatch[1];
        const existing = state.testimonials.find((item) => item.id === id);
        if (!existing) return fail(404, 'TESTIMONIAL_NOT_FOUND', 'Testimonial not found.');
        if (method === 'PUT') {
          const updated = { ...existing, ...(body as Partial<AdminTestimonial>) };
          state.testimonials = state.testimonials.map((item) => (item.id === id ? updated : item));
          return jsonResponse({ success: true, data: updated });
        }
        if (method === 'DELETE') {
          state.testimonials = state.testimonials.map((item) =>
            item.id === id ? { ...item, isArchived: true } : item,
          );
          return jsonResponse({ success: true, data: { ...existing, isArchived: true } });
        }
      }

      if (path === '/admin/faqs') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: { items: state.faqs.filter((f) => !f.isArchived), total: state.faqs.length },
          });
        }
        if (method === 'POST') {
          idCounter += 1;
          const item = {
            ...(body as unknown as Omit<AdminFaq, 'id' | 'isArchived'>),
            id: `faq-${idCounter}`,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          } as AdminFaq;
          state.faqs = [item, ...state.faqs];
          return jsonResponse({ success: true, data: item }, 201);
        }
      }

      const faqMatch = /^\/admin\/faqs\/([^/]+)$/.exec(path);
      if (faqMatch) {
        const id = faqMatch[1];
        const existing = state.faqs.find((item) => item.id === id);
        if (!existing) return fail(404, 'FAQ_NOT_FOUND', 'FAQ not found.');
        if (method === 'PUT') {
          const updated = { ...existing, ...(body as Partial<AdminFaq>) };
          state.faqs = state.faqs.map((item) => (item.id === id ? updated : item));
          return jsonResponse({ success: true, data: updated });
        }
        if (method === 'DELETE') {
          state.faqs = state.faqs.map((item) =>
            item.id === id ? { ...item, isArchived: true } : item,
          );
          return jsonResponse({ success: true, data: { ...existing, isArchived: true } });
        }
      }

      if (path === '/admin/settings') {
        if (method === 'GET') {
          if (!state.settings) {
            return fail(404, 'SETTINGS_NOT_FOUND', 'Website settings not found.');
          }
          // Mirrors the API, which returns the document id on read.
          return jsonResponse({ success: true, data: { id: 'settings-1', ...state.settings } });
        }
        if (method === 'PUT') {
          if (options.settingsWriteError) {
            return fail(500, 'INTERNAL_ERROR', 'The settings could not be saved.');
          }
          state.settings = { ...emptySettings, ...(body as AdminSettings) };
          return jsonResponse({ success: true, data: state.settings });
        }
      }

      const inboxResponse = handleInboxRequest(path, method, url, body, state, options);
      if (inboxResponse) return inboxResponse;

      return fail(404, 'NOT_FOUND', 'The requested resource was not found.');
    },
  );

  return { fetchMock, state };
}

export function mockAdminApi(options: MockOptions = {}) {
  const mock = createAdminApiMock(options);
  vi.stubGlobal('fetch', mock.fetchMock);
  return mock;
}
