import { AuditLog } from '../models/audit-log.model.js';
import { logger } from '../utils/logger.js';

export type AuditEntry = {
  action: string;
  method: string;
  path: string;
  statusCode: number;
  adminId: string;
  adminEmail: string;
  entityType?: string | null;
  entityId?: string | null;
  requestId?: string | null;
};

const actionMap: Array<{ pattern: RegExp; method?: string; action: string; entity: string }> = [
  { pattern: /^\/api\/admin\/login$/, action: 'admin.login', entity: 'admin' },
  { pattern: /^\/api\/admin\/logout$/, action: 'admin.logout', entity: 'admin' },
  { pattern: /^\/api\/admin\/password$/, action: 'admin.password_change', entity: 'admin' },
  { pattern: /^\/api\/admin\/uploads$/, method: 'POST', action: 'media.upload', entity: 'media' },
  { pattern: /^\/api\/admin\/uploads$/, method: 'DELETE', action: 'media.delete', entity: 'media' },
  {
    pattern: /^\/api\/admin\/services\/[^/]+\/reorder$/,
    action: 'service.reorder',
    entity: 'service',
  },
  {
    pattern: /^\/api\/admin\/services$/,
    method: 'POST',
    action: 'service.create',
    entity: 'service',
  },
  {
    pattern: /^\/api\/admin\/services\/[^/]+$/,
    method: 'PUT',
    action: 'service.update',
    entity: 'service',
  },
  {
    pattern: /^\/api\/admin\/services\/[^/]+$/,
    method: 'DELETE',
    action: 'service.archive',
    entity: 'service',
  },
  {
    pattern: /^\/api\/admin\/categories\/reorder$/,
    action: 'category.reorder',
    entity: 'category',
  },
  {
    pattern: /^\/api\/admin\/categories$/,
    method: 'POST',
    action: 'category.create',
    entity: 'category',
  },
  {
    pattern: /^\/api\/admin\/categories\/[^/]+$/,
    method: 'PUT',
    action: 'category.update',
    entity: 'category',
  },
  {
    pattern: /^\/api\/admin\/categories\/[^/]+$/,
    method: 'DELETE',
    action: 'category.archive',
    entity: 'category',
  },
  {
    pattern: /^\/api\/admin\/gallery$/,
    method: 'POST',
    action: 'gallery.create',
    entity: 'gallery',
  },
  {
    pattern: /^\/api\/admin\/gallery\/[^/]+$/,
    method: 'PUT',
    action: 'gallery.update',
    entity: 'gallery',
  },
  {
    pattern: /^\/api\/admin\/gallery\/[^/]+$/,
    method: 'DELETE',
    action: 'gallery.archive',
    entity: 'gallery',
  },
  { pattern: /^\/api\/admin\/team$/, method: 'POST', action: 'team.create', entity: 'team' },
  { pattern: /^\/api\/admin\/team\/[^/]+$/, method: 'PUT', action: 'team.update', entity: 'team' },
  {
    pattern: /^\/api\/admin\/team\/[^/]+$/,
    method: 'DELETE',
    action: 'team.archive',
    entity: 'team',
  },
  {
    pattern: /^\/api\/admin\/testimonials$/,
    method: 'POST',
    action: 'testimonial.create',
    entity: 'testimonial',
  },
  {
    pattern: /^\/api\/admin\/testimonials\/[^/]+$/,
    method: 'PUT',
    action: 'testimonial.update',
    entity: 'testimonial',
  },
  {
    pattern: /^\/api\/admin\/testimonials\/[^/]+$/,
    method: 'DELETE',
    action: 'testimonial.archive',
    entity: 'testimonial',
  },
  { pattern: /^\/api\/admin\/faqs$/, method: 'POST', action: 'faq.create', entity: 'faq' },
  { pattern: /^\/api\/admin\/faqs\/[^/]+$/, method: 'PUT', action: 'faq.update', entity: 'faq' },
  {
    pattern: /^\/api\/admin\/faqs\/[^/]+$/,
    method: 'DELETE',
    action: 'faq.archive',
    entity: 'faq',
  },
  {
    pattern: /^\/api\/admin\/settings$/,
    method: 'PUT',
    action: 'settings.update',
    entity: 'settings',
  },
  {
    pattern: /^\/api\/admin\/appointments\/[^/]+$/,
    method: 'PATCH',
    action: 'appointment.update',
    entity: 'appointment',
  },
  {
    pattern: /^\/api\/admin\/enquiries\/[^/]+$/,
    method: 'PATCH',
    action: 'enquiry.update',
    entity: 'enquiry',
  },
  {
    pattern: /^\/api\/admin\/contact-submissions\/[^/]+$/,
    method: 'PATCH',
    action: 'contact.update',
    entity: 'contact',
  },
  {
    pattern: /^\/api\/admin\/testimonial-submissions\/[^/]+$/,
    method: 'PATCH',
    action: 'testimonial.moderation',
    entity: 'testimonial',
  },
];

/**
 * Maps a mutating admin request to a stable action name. Unlisted paths still
 * produce an entry (`admin.request`) so no administrative write goes unrecorded.
 */
export function describeAdminAction(
  method: string,
  path: string,
): { action: string; entityType: string | null; entityId: string | null } {
  const cleanPath = path.split('?')[0] ?? path;

  for (const candidate of actionMap) {
    if (candidate.method && candidate.method !== method) continue;
    if (!candidate.method && method !== 'POST') continue;
    if (!candidate.pattern.test(cleanPath)) continue;

    const segments = cleanPath.split('/');
    const entityId = segments.length >= 5 ? segments[segments.length - 1] : null;

    return {
      action: candidate.action,
      entityType: candidate.entity,
      entityId: entityId && entityId.length <= 120 ? entityId : null,
    };
  }

  return { action: 'admin.request', entityType: null, entityId: null };
}

/**
 * Fire-and-forget: an audit failure must never break the request it describes,
 * but it is logged so operators notice the gap.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      action: entry.action,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      requestId: entry.requestId ?? null,
    });
  } catch (error) {
    logger.error(
      { err: error, action: entry.action, adminId: entry.adminId },
      'Audit log write failed',
    );
  }
}

export async function listAuditLogs(
  options: { page?: number; limit?: number; action?: string } = {},
) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 25));
  const filter: Record<string, unknown> = {};
  if (options.action) filter.action = options.action;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => ({ ...item, id: String(item._id) })),
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
