import { API_BASE_URL, ApiError } from '@/lib/api-client';

import { clearSession, getSessionToken } from './session';
import type {
  AdminAppointment,
  AdminCategory,
  AdminContactSubmission,
  AdminEnquiry,
  AppointmentStatus,
  ContactStatus,
  EnquiryStatus,
  InboxQuery,
  InboxSummary,
  TestimonialSubmission,
  AdminFaq,
  AdminGalleryItem,
  AdminProduct,
  AdminService,
  AdminSession,
  AdminSettings,
  AdminTeamMember,
  AdminTestimonial,
  CategoryInput,
  FaqInput,
  GalleryInput,
  ListResponse,
  Paginated,
  ProductInput,
  ServiceInput,
  TeamInput,
  TestimonialInput,
} from './types';

type ErrorEnvelope = {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
  requestId?: string;
};

type SuccessEnvelope<T> = { success: true; data: T };

export type AdminRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

/** Broadcast when the server rejects the session, so the UI can sign out once. */
export const adminUnauthorizedEvent = new EventTarget();
export const ADMIN_UNAUTHORIZED_EVENT = 'admin-unauthorized';

async function adminRequest<T>(path: string, init: AdminRequestInit = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = init;
  const token = auth ? getSessionToken() : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload = (await response.json().catch(() => null)) as
    SuccessEnvelope<T> | ErrorEnvelope | null;

  if (response.status === 401 && auth) {
    clearSession();
    adminUnauthorizedEvent.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
  }

  if (!response.ok || !payload || payload.success === false) {
    const error = payload && payload.success === false ? payload.error : undefined;

    throw new ApiError(
      error?.message ?? 'The request could not be completed.',
      response.status,
      error?.code ?? 'API_ERROR',
      error?.fields,
      payload && 'requestId' in payload ? payload.requestId : undefined,
    );
  }

  return payload.data;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<AdminSession> {
  return adminRequest<AdminSession>('/admin/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ changed: boolean; sessionsRevoked: number }> {
  return adminRequest<{ changed: boolean; sessionsRevoked: number }>('/admin/password', {
    method: 'PATCH',
    body: input,
  });
}

export async function logout(): Promise<{ revoked: boolean }> {
  return adminRequest<{ revoked: boolean }>('/admin/logout', { method: 'POST' });
}

/** Revokes every session for this account, including the current one. */
export async function revokeAllSessions(): Promise<{ revoked: number }> {
  return adminRequest<{ revoked: number }>('/admin/sessions/revoke-all', { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export type MediaAsset = {
  url: string;
  publicId: string;
  alt: string;
  width: number | null;
  height: number | null;
  format: string;
  bytes: number;
  folder: string;
};

export type MediaFolderName = 'branding' | 'services' | 'gallery' | 'team' | 'homepage';

export const maxMediaBytes = 5 * 1024 * 1024;
export const acceptedMediaTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Multipart upload against the authenticated admin endpoint. XMLHttpRequest is
 * used only because fetch cannot report upload progress; the auth token and
 * error envelope handling match `adminRequest`.
 */
export function uploadMedia(
  file: File,
  input: {
    folder: MediaFolderName;
    alt?: string;
    onProgress?: (percent: number) => void;
  },
): Promise<MediaAsset> {
  const token = getSessionToken();

  return new Promise<MediaAsset>((resolve, reject) => {
    const body = new FormData();
    body.append('file', file);
    body.append('folder', input.folder);
    if (input.alt?.trim()) body.append('alt', input.alt.trim());

    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE_URL}/admin/uploads`);
    request.setRequestHeader('Accept', 'application/json');
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });

    request.addEventListener('load', () => {
      type Payload =
        | { success: true; data: MediaAsset }
        | {
            success: false;
            error: { code: string; message: string; fields?: Record<string, string> };
          };

      let payload: Payload | null;
      try {
        payload = JSON.parse(request.responseText) as Payload;
      } catch {
        payload = null;
      }

      if (request.status === 401) {
        clearSession();
        adminUnauthorizedEvent.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
      }

      if (request.status >= 200 && request.status < 300 && payload?.success) {
        resolve(payload.data);
        return;
      }

      reject(
        new ApiError(
          payload && !payload.success ? payload.error.message : 'The image could not be uploaded.',
          request.status,
          payload && !payload.success ? payload.error.code : 'UPLOAD_FAILED',
          payload && !payload.success ? payload.error.fields : undefined,
        ),
      );
    });

    request.addEventListener('error', () => {
      reject(new ApiError('The upload was interrupted. Please try again.', 0, 'NETWORK_ERROR'));
    });

    request.send(body);
  });
}

export function deleteMedia(publicId: string): Promise<{ deleted: boolean }> {
  return adminRequest<{ deleted: boolean }>('/admin/uploads', {
    method: 'DELETE',
    body: { publicId },
  });
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export type ServiceQuery = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
};

export function listServices(query: ServiceQuery = {}): Promise<Paginated<AdminService>> {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.category?.trim()) params.set('category', query.category.trim());

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return adminRequest<Paginated<AdminService>>(`/admin/services${suffix}`);
}

export function getService(id: string): Promise<AdminService & { _id?: string }> {
  return adminRequest<AdminService>(`/admin/services/${id}`);
}

export function createService(input: ServiceInput): Promise<AdminService> {
  return adminRequest<AdminService>('/admin/services', { method: 'POST', body: input });
}

export function updateService(id: string, input: Partial<ServiceInput>): Promise<AdminService> {
  return adminRequest<AdminService>(`/admin/services/${id}`, { method: 'PUT', body: input });
}

export function archiveService(id: string): Promise<AdminService> {
  return adminRequest<AdminService>(`/admin/services/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type ProductQuery = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
};

export function listProducts(query: ProductQuery = {}): Promise<Paginated<AdminProduct>> {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.category?.trim()) params.set('category', query.category.trim());

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return adminRequest<Paginated<AdminProduct>>(`/admin/products${suffix}`);
}

export function getProduct(id: string): Promise<AdminProduct & { _id?: string }> {
  return adminRequest<AdminProduct>(`/admin/products/${id}`);
}

export function createProduct(input: ProductInput): Promise<AdminProduct> {
  return adminRequest<AdminProduct>('/admin/products', { method: 'POST', body: input });
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', body: input });
}

export function archiveProduct(id: string): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(`/admin/products/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<ListResponse<AdminCategory>> {
  return adminRequest<ListResponse<AdminCategory>>('/admin/categories');
}

export function createCategory(input: CategoryInput): Promise<AdminCategory> {
  return adminRequest<AdminCategory>('/admin/categories', { method: 'POST', body: input });
}

export function updateCategory(
  slug: string,
  input: Partial<CategoryInput>,
): Promise<AdminCategory> {
  return adminRequest<AdminCategory>(`/admin/categories/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    body: input,
  });
}

export function archiveCategory(slug: string): Promise<AdminCategory> {
  return adminRequest<AdminCategory>(`/admin/categories/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export async function listGallery(): Promise<ListResponse<AdminGalleryItem>> {
  return adminRequest<ListResponse<AdminGalleryItem>>('/admin/gallery');
}

export function createGalleryItem(input: GalleryInput): Promise<AdminGalleryItem> {
  return adminRequest<AdminGalleryItem>('/admin/gallery', { method: 'POST', body: input });
}

export function updateGalleryItem(
  id: string,
  input: Partial<GalleryInput>,
): Promise<AdminGalleryItem> {
  return adminRequest<AdminGalleryItem>(`/admin/gallery/${id}`, { method: 'PUT', body: input });
}

export function archiveGalleryItem(id: string): Promise<AdminGalleryItem> {
  return adminRequest<AdminGalleryItem>(`/admin/gallery/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function listTeam(): Promise<ListResponse<AdminTeamMember>> {
  return adminRequest<ListResponse<AdminTeamMember>>('/admin/team');
}

export function createTeamMember(input: TeamInput): Promise<AdminTeamMember> {
  return adminRequest<AdminTeamMember>('/admin/team', { method: 'POST', body: input });
}

export function updateTeamMember(id: string, input: Partial<TeamInput>): Promise<AdminTeamMember> {
  return adminRequest<AdminTeamMember>(`/admin/team/${id}`, { method: 'PUT', body: input });
}

export function archiveTeamMember(id: string): Promise<AdminTeamMember> {
  return adminRequest<AdminTeamMember>(`/admin/team/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export async function listTestimonials(): Promise<ListResponse<AdminTestimonial>> {
  return adminRequest<ListResponse<AdminTestimonial>>('/admin/testimonials');
}

export function createTestimonial(input: TestimonialInput): Promise<AdminTestimonial> {
  return adminRequest<AdminTestimonial>('/admin/testimonials', { method: 'POST', body: input });
}

export function updateTestimonial(
  id: string,
  input: Partial<TestimonialInput>,
): Promise<AdminTestimonial> {
  return adminRequest<AdminTestimonial>(`/admin/testimonials/${id}`, {
    method: 'PUT',
    body: input,
  });
}

export function archiveTestimonial(id: string): Promise<AdminTestimonial> {
  return adminRequest<AdminTestimonial>(`/admin/testimonials/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export async function listFaqs(): Promise<ListResponse<AdminFaq>> {
  return adminRequest<ListResponse<AdminFaq>>('/admin/faqs');
}

export function createFaq(input: FaqInput): Promise<AdminFaq> {
  return adminRequest<AdminFaq>('/admin/faqs', { method: 'POST', body: input });
}

export function updateFaq(id: string, input: Partial<FaqInput>): Promise<AdminFaq> {
  return adminRequest<AdminFaq>(`/admin/faqs/${id}`, { method: 'PUT', body: input });
}

export function archiveFaq(id: string): Promise<AdminFaq> {
  return adminRequest<AdminFaq>(`/admin/faqs/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Returns `null` when the website settings document has not been created yet. */
export async function getSettings(): Promise<AdminSettings | null> {
  try {
    return await adminRequest<AdminSettings>('/admin/settings');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function saveSettings(input: AdminSettings): Promise<AdminSettings> {
  return adminRequest<AdminSettings>('/admin/settings', { method: 'PUT', body: input });
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

function inboxSuffix(query: InboxQuery = {}): string {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.status && query.status !== 'all') params.set('status', query.status);

  return params.size > 0 ? `?${params.toString()}` : '';
}

export function listAppointments(query: InboxQuery = {}): Promise<Paginated<AdminAppointment>> {
  return adminRequest<Paginated<AdminAppointment>>(`/admin/appointments${inboxSuffix(query)}`);
}

export function getAppointment(id: string): Promise<AdminAppointment> {
  return adminRequest<AdminAppointment>(`/admin/appointments/${id}`);
}

export type ManualAppointmentInput = {
  fullName: string;
  phone: string;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string | null;
  done?: boolean;
};

export function createAdminAppointment(
  input: ManualAppointmentInput,
): Promise<AdminAppointment> {
  return adminRequest<AdminAppointment>('/admin/appointments', {
    method: 'POST',
    body: input,
  });
}

export function deleteAppointment(id: string): Promise<{ deleted: boolean }> {
  return adminRequest<{ deleted: boolean }>(`/admin/appointments/${id}`, {
    method: 'DELETE',
  });
}

export function markAppointmentDone(id: string, done: boolean): Promise<AdminAppointment> {
  return adminRequest<AdminAppointment>(`/admin/appointments/${id}/done`, {
    method: 'PATCH',
    body: { done },
  });
}

export function updateAppointment(
  id: string,
  input: { status?: AppointmentStatus; adminNotes?: string | null; note?: string },
): Promise<AdminAppointment> {
  return adminRequest<AdminAppointment>(`/admin/appointments/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function listEnquiries(query: InboxQuery = {}): Promise<Paginated<AdminEnquiry>> {
  return adminRequest<Paginated<AdminEnquiry>>(`/admin/enquiries${inboxSuffix(query)}`);
}

export function getEnquiry(id: string): Promise<AdminEnquiry> {
  return adminRequest<AdminEnquiry>(`/admin/enquiries/${id}`);
}

export function updateEnquiry(
  id: string,
  input: { status?: EnquiryStatus; adminNotes?: string | null },
): Promise<AdminEnquiry> {
  return adminRequest<AdminEnquiry>(`/admin/enquiries/${id}`, { method: 'PATCH', body: input });
}

export function listContactSubmissions(
  query: InboxQuery = {},
): Promise<Paginated<AdminContactSubmission>> {
  return adminRequest<Paginated<AdminContactSubmission>>(
    `/admin/contact-submissions${inboxSuffix(query)}`,
  );
}

export function getContactSubmission(id: string): Promise<AdminContactSubmission> {
  return adminRequest<AdminContactSubmission>(`/admin/contact-submissions/${id}`);
}

export function updateContactSubmission(
  id: string,
  input: { status?: ContactStatus; adminNotes?: string | null },
): Promise<AdminContactSubmission> {
  return adminRequest<AdminContactSubmission>(`/admin/contact-submissions/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function listTestimonialSubmissions(
  query: InboxQuery = {},
): Promise<Paginated<TestimonialSubmission>> {
  return adminRequest<Paginated<TestimonialSubmission>>(
    `/admin/testimonial-submissions${inboxSuffix(query)}`,
  );
}

export function getTestimonialSubmission(id: string): Promise<TestimonialSubmission> {
  return adminRequest<TestimonialSubmission>(`/admin/testimonial-submissions/${id}`);
}

export function moderateTestimonial(
  id: string,
  action: 'approve' | 'unpublish' | 'archive',
): Promise<TestimonialSubmission> {
  return adminRequest<TestimonialSubmission>(`/admin/testimonial-submissions/${id}`, {
    method: 'PATCH',
    body: { action },
  });
}

export function getInboxSummary(): Promise<InboxSummary> {
  return adminRequest<InboxSummary>('/admin/inbox/summary');
}
