export {
  createAdminPasswordHash,
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
  resolveAuthenticatedAdmin,
  constantTimeEquals,
  getSessionLifetimeMs,
} from './auth.js';
export type {
  AdminRole,
  AdminTokenPayload,
  AuthenticatedAdmin,
  AdminPasswordHash,
} from './auth.js';

export {
  authenticateAdmin,
  createAdminSession,
  validateAdminSession,
  revokeAdminSession,
  parseAdminSession,
  createDefaultAdminPassword,
} from '../services/auth.service.js';
export type { AuthenticatedSession, IssuedAdminSession } from '../services/session.service.js';
export {
  revokeAllSessionsForAdmin,
  deleteExpiredSessions,
  getSessionTtlMs,
} from '../services/session.service.js';

export {
  buildPaginated,
  CategorySchema,
  CategoryUpsertSchema,
  ServiceCreateSchema,
  ServiceUpdateSchema,
  ProductCreateSchema,
  ProductUpdateSchema,
  GalleryCreateSchema,
  GalleryUpdateSchema,
  TeamCreateSchema,
  TeamUpdateSchema,
  TestimonialCreateSchema,
  TestimonialUpdateSchema,
  FaqCreateSchema,
  FaqUpdateSchema,
  AdminLoginSchema,
  SettingsSchema,
  Slug,
  ShortSlug,
} from './validation.js';
export type { PaginatedResponse, ServiceFilters } from './validation.js';
