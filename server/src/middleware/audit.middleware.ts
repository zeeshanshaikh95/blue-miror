import type { RequestHandler } from 'express';

import { describeAdminAction, recordAudit } from '../services/audit.service.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Records successful mutating admin requests once the response has been sent.
 * Bodies are never captured, so credentials and customer messages cannot leak
 * into the audit trail.
 */
export const auditAdminWrites: RequestHandler = (request, response, next) => {
  if (!mutatingMethods.has(request.method)) {
    next();
    return;
  }

  response.on('finish', () => {
    if (response.statusCode >= 400) return;

    const { user } = request as AuthenticatedRequest;
    if (!user) return;

    const { action, entityType, entityId } = describeAdminAction(
      request.method,
      request.originalUrl,
    );

    void recordAudit({
      action,
      method: request.method,
      path: request.originalUrl.split('?')[0] ?? request.originalUrl,
      statusCode: response.statusCode,
      adminId: user.id,
      adminEmail: user.email,
      entityType,
      entityId,
      requestId: typeof response.locals.requestId === 'string' ? response.locals.requestId : null,
    });
  });

  next();
};
