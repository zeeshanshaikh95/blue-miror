import { Router, type RequestHandler } from 'express';

import {
  authenticateAdmin,
  createAdminSession,
  createDefaultAdminPassword,
  revokeAdminSession,
} from '../services/auth.service.js';
import { Admin } from '../models/index.js';
import { AdminLoginSchema, AdminPasswordChangeSchema } from '../lib/validation.js';
import { constantTimeEquals, createAdminPasswordHash, verifyAdminPassword } from '../lib/auth.js';
import { revokeAllSessionsForAdmin } from '../services/session.service.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import {
  loginThrottle,
  recordLoginFailure,
  recordLoginSuccess,
} from '../middleware/login-throttle.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordAudit } from '../services/audit.service.js';

export const authRouter = Router();

authRouter.post('/admin/login', loginThrottle, async (request, response, next) => {
  try {
    const input = AdminLoginSchema.parse(request.body);

    let admin;
    try {
      admin = await authenticateAdmin(input.email, input.password);
    } catch (error) {
      // Count only genuine credential failures; malformed payloads are rejected
      // by validation above and must not let an attacker lock out an account.
      recordLoginFailure(request);
      // No attempted email is stored: it may be a mistyped personal address.
      void recordAudit({
        action: 'admin.login_failed',
        method: request.method,
        path: request.originalUrl.split('?')[0] ?? request.originalUrl,
        statusCode: 401,
        adminId: 'anonymous',
        adminEmail: '',
        entityType: 'admin',
        requestId: typeof response.locals.requestId === 'string' ? response.locals.requestId : null,
      });
      throw error;
    }

    recordLoginSuccess(request);

    const session = await createAdminSession(admin);

    logger.info({ adminId: admin.id }, 'Admin login successful');

    void recordAudit({
      action: 'admin.login',
      method: request.method,
      path: request.originalUrl.split('?')[0] ?? request.originalUrl,
      statusCode: 200,
      adminId: admin.id,
      adminEmail: admin.email,
      entityType: 'admin',
      entityId: admin.id,
      requestId: response.locals.requestId as string | undefined,
    });

    return response.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/** Revokes only the caller's own session; mounted behind requireAdminAuth. */
export const logoutHandler: RequestHandler = async (request, response, next) => {
  try {
    const { user, session } = request as AuthenticatedRequest;
    const revoked = await revokeAdminSession(session.id, user.id);

    logger.info({ adminId: user.id }, 'Admin session revoked');

    void recordAudit({
      action: 'admin.logout',
      method: request.method,
      path: request.originalUrl.split('?')[0] ?? request.originalUrl,
      statusCode: 200,
      adminId: user.id,
      adminEmail: user.email,
      entityType: 'admin',
      entityId: user.id,
      requestId: response.locals.requestId as string | undefined,
    });

    return response.json({ success: true, data: { revoked } });
  } catch (error) {
    next(error);
  }
};

authRouter.patch('/admin/password', requireAdminAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const input = AdminPasswordChangeSchema.parse(request.body);

    const admin = await Admin.findById(user.id).lean();
    if (!admin) {
      throw new AppError(404, 'ADMIN_NOT_FOUND', 'This admin account is no longer available.');
    }

    const currentValid = await verifyAdminPassword(input.currentPassword, admin.passwordHash);
    if (!currentValid) {
      throw new AppError(422, 'PASSWORD_CURRENT_INVALID', 'The current password is not correct.', {
        currentPassword: 'The current password is not correct.',
      });
    }

    const passwordHash = await createAdminPasswordHash(input.newPassword);

    await Admin.updateOne(
      { _id: admin._id },
      { $set: { passwordHash, passwordUpdatedAt: new Date() } },
      { runValidators: true },
    );

    // Bumping `passwordUpdatedAt` invalidates older tokens; revoking the rows
    // makes every other device sign out immediately rather than at expiry.
    const sessionsRevoked = await revokeAllSessionsForAdmin(admin._id.toString());

    logger.info({ adminId: admin._id.toString() }, 'Admin password changed');

    void recordAudit({
      action: 'admin.password_change',
      method: request.method,
      path: request.originalUrl.split('?')[0] ?? request.originalUrl,
      statusCode: 200,
      adminId: user.id,
      adminEmail: user.email,
      entityType: 'admin',
      entityId: user.id,
      requestId: response.locals.requestId as string | undefined,
    });

    return response.json({ success: true, data: { changed: true, sessionsRevoked } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/admin/bootstrap', async (request, response, next) => {
  try {
    const body = request.body as {
      email?: unknown;
      password?: unknown;
      bootstrapSecret?: unknown;
    };

    const configuredSecret = env.ADMIN_BOOTSTRAP_SECRET;

    if (!configuredSecret) {
      throw new AppError(
        503,
        'BOOTSTRAP_DISABLED',
        'Admin bootstrap is not configured for this environment.',
      );
    }

    if (
      typeof body?.bootstrapSecret !== 'string' ||
      !constantTimeEquals(body.bootstrapSecret, configuredSecret)
    ) {
      throw new AppError(403, 'BOOTSTRAP_FORBIDDEN', 'Bootstrap secret is invalid.');
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      throw new AppError(
        422,
        'BOOTSTRAP_MISSING',
        'email and password are required for bootstrap.',
      );
    }

    const existing = await Admin.findOne({ email }).lean();
    if (existing) {
      throw new AppError(409, 'ADMIN_ALREADY_EXISTS', 'An admin with this email already exists.');
    }

    const passwordHash = await createDefaultAdminPassword(password);
    const passwordUpdatedAt = new Date();

    const admin = await Admin.create({
      email,
      passwordHash,
      role: 'superadmin',
      passwordUpdatedAt,
      isActive: true,
    });

    logger.info(
      { adminId: admin._id.toString(), email: admin.email },
      'Admin account bootstrapped',
    );

    return response.status(201).json({
      success: true,
      data: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        passwordUpdatedAt: passwordUpdatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
