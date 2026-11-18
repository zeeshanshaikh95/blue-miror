import type { RequestHandler } from 'express';

import { AppError } from '../utils/app-error.js';

export type AdminRequest = Parameters<RequestHandler>[0] & {
  user: { id: string; email: string; name: string; role: 'superadmin' };
};

export const requireAdminRole: RequestHandler = (request, _response, next) => {
  try {
    const user = (request as AdminRequest).user;
    if (!user || user.role !== 'superadmin') {
      throw new AppError(403, 'ADMIN_FORBIDDEN', 'This action is not permitted for your role.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export function pickFields<T extends Record<string, unknown>>(
  source: T,
  allowed: readonly (keyof T)[],
): Partial<T> {
  const selected: Partial<T> = {};
  for (const key of allowed) {
    if (source[key] !== undefined) {
      selected[key] = source[key];
    }
  }
  return selected;
}
