import type { Request, RequestHandler } from 'express';

import { validateAdminSession, type AuthenticatedAdmin } from '../lib/index.js';
import { AppError } from '../utils/app-error.js';

export type AdminSessionContext = {
  id: string;
  expiresAt: Date;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedAdmin;
  session: AdminSessionContext;
};

function readBearerToken(request: Request): string | undefined {
  const header = request.headers.authorization;
  const prefix = 'Bearer ';

  if (typeof header !== 'string' || !header.startsWith(prefix)) {
    return undefined;
  }

  const token = header.slice(prefix.length).trim();
  return token.length > 0 ? token : undefined;
}

export const requireAdminAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = readBearerToken(request);
    if (!token) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required for this resource.');
    }

    const { admin, sessionId, expiresAt } = await validateAdminSession(token);

    const authenticated = request as AuthenticatedRequest;
    authenticated.user = admin;
    authenticated.session = { id: sessionId, expiresAt };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdminRole: RequestHandler = (request, _response, next) => {
  try {
    const user = (request as AuthenticatedRequest).user;
    if (!user || user.role !== 'superadmin') {
      throw new AppError(403, 'ADMIN_FORBIDDEN', 'This action is not permitted for your role.');
    }
    next();
  } catch (error) {
    next(error);
  }
};
