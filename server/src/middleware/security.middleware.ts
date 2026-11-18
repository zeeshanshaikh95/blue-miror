import type { RequestHandler } from 'express';

import { logger } from '../utils/logger.js';

export const logAdminMutation: RequestHandler = (request, _response, next) => {
  if (request.method === 'GET') {
    return next();
  }

  logger.info(
    {
      adminId:
        (request as Parameters<RequestHandler>[0] & { user?: { id: string } }).user?.id ?? null,
      method: request.method,
      path: request.originalUrl,
      eventType: 'admin_mutation_request',
    },
    'Admin mutation inbound',
  );
  next();
};

export function safeJsonBody(request: Parameters<RequestHandler>[0]): Record<string, unknown> {
  if (typeof request.body !== 'object' || request.body === null) {
    return {};
  }
  return request.body as Record<string, unknown>;
}

export function normalizeOriginForReferer(origin: string): string {
  try {
    const url = new URL(origin);
    return url.origin;
  } catch {
    return '';
  }
}
