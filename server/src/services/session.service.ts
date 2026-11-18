import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';

import { env } from '../config/env.js';
import {
  Admin,
  AdminSession,
  type AdminDocument,
  type AdminSessionDocument,
} from '../models/index.js';
import {
  createAdminSessionToken,
  getSessionLifetimeMs,
  verifyAdminSessionToken,
  type AuthenticatedAdmin,
} from '../lib/auth.js';
import { AppError } from '../utils/app-error.js';

export type IssuedAdminSession = {
  token: string;
  tokenId: string;
  expiresAt: Date;
};

export type AuthenticatedSession = {
  admin: AuthenticatedAdmin;
  sessionId: string;
  expiresAt: Date;
};

function toAuthenticatedAdmin(admin: AdminDocument): AuthenticatedAdmin {
  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.email,
    role: admin.role,
  };
}

/**
 * Issues a session token and persists the matching session row. The row is the
 * authority for revocation: a token is only accepted while its row exists, is
 * not revoked, is unexpired and belongs to an active admin.
 */
export async function createSessionForAdmin(
  admin: AuthenticatedAdmin,
): Promise<IssuedAdminSession> {
  const tokenId = randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + getSessionLifetimeMs());

  const token = await createAdminSessionToken(admin, issuedAt, tokenId);

  await AdminSession.create({
    tokenId,
    adminId: admin.id,
    expiresAt,
    revokedAt: null,
  });

  return { token, tokenId, expiresAt };
}

/**
 * Validates a bearer token against both the JWT claims and the session store,
 * then re-reads the admin record so deactivation and role changes take effect
 * immediately. Never revokes a session because a token failed verification.
 */
export async function resolveSession(token: string): Promise<AuthenticatedSession> {
  const payload = await verifyAdminSessionToken(token);

  const session = await AdminSession.findOne({ tokenId: payload.jti }).lean<AdminSessionDocument>();

  if (!session || session.adminId.toString() !== payload.sub) {
    throw new AppError(
      401,
      'SESSION_INVALID',
      'Your session is no longer valid. Please sign in again.',
    );
  }

  if (session.revokedAt) {
    throw new AppError(
      401,
      'SESSION_REVOKED',
      'This session has been signed out. Please sign in again.',
    );
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await AdminSession.deleteOne({ _id: session._id });
    throw new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  }

  const admin = await Admin.findById(session.adminId).lean<AdminDocument>();

  if (!admin || !admin.isActive) {
    throw new AppError(401, 'SESSION_INVALID', 'Your admin account is not available.');
  }

  // Password changes bump `passwordUpdatedAt`; tokens issued before the change
  // are rejected and every outstanding session for that admin is revoked.
  // Compared at second granularity because `iat` is seconds, so a login in the
  // same second it was provisioned is not treated as stale.
  if (payload.iat < Math.floor(admin.passwordUpdatedAt.getTime() / 1000)) {
    await revokeAllSessionsForAdmin(admin._id.toString());
    throw new AppError(401, 'SESSION_REVOKED', 'Your credentials changed. Please sign in again.');
  }

  return {
    admin: toAuthenticatedAdmin(admin),
    sessionId: session.tokenId,
    expiresAt: session.expiresAt,
  };
}

export async function revokeSession(tokenId: string, adminId: string): Promise<boolean> {
  const result = await AdminSession.updateOne(
    { tokenId, adminId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return result.modifiedCount > 0;
}

export async function revokeAllSessionsForAdmin(adminId: string): Promise<number> {
  const result = await AdminSession.updateMany(
    { adminId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return result.modifiedCount;
}

/** Safety net alongside the TTL index; safe to call from cron or at boot. */
export async function deleteExpiredSessions(): Promise<number> {
  const result = await AdminSession.deleteMany({
    expiresAt: mongoose.trusted({ $lte: new Date() }),
  });
  return result.deletedCount;
}

/** Exposed for diagnostics; never returned to clients. */
export function getSessionTtlMs(): number {
  return env.ADMIN_SESSION_TTL_MINUTES * 60_000;
}
