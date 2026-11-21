import {
  createAdminPasswordHash,
  verifyAdminPassword,
  verifyAdminSessionToken,
  type AuthenticatedAdmin,
  type AdminTokenPayload,
} from '../lib/auth.js';
import {
  createSessionForAdmin,
  resolveSession,
  revokeSession,
  type AuthenticatedSession,
  type IssuedAdminSession,
} from './session.service.js';

import { lookupAdminByEmail } from '../models/index.js';
import { AppError } from '../utils/app-error.js';

/**
 * A valid Argon2id digest of a value that is never accepted as a password.
 * Verifying against it for unknown emails keeps the response time close to a
 * wrong-password attempt, so callers cannot enumerate admin accounts.
 */
const timingEqualiserHash =
  '$argon2id$v=19$m=65536,t=3,p=1$bWJnkkq31Kqh7b/YNSbhwg$aXbEmDUu4ZD0EuIu7Gcmko1dFeCoGxCVVP4gg8FRXjU';

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AuthenticatedAdmin> {
  const doc = await lookupAdminByEmail(email);

  // Always perform the expensive hash verification, even when no account
  // exists, so the missing-user path is not measurably faster.
  const valid = await verifyAdminPassword(password, doc?.passwordHash ?? timingEqualiserHash);

  if (!doc || !valid) {
    throw new AppError(401, 'ADMIN_INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.email,
    role: doc.role,
  };
}

export async function createAdminSession(admin: AuthenticatedAdmin): Promise<IssuedAdminSession> {
  return createSessionForAdmin(admin);
}

/** Verifies the token and its persisted session, and reloads the admin record. */
export async function validateAdminSession(token: string): Promise<AuthenticatedSession> {
  return resolveSession(token);
}

export async function revokeAdminSession(sessionId: string, adminId: string): Promise<boolean> {
  return revokeSession(sessionId, adminId);
}

/** Token-only verification; does not consult the session store. */
export async function parseAdminSession(token: string): Promise<AdminTokenPayload> {
  return verifyAdminSessionToken(token);
}

export async function createDefaultAdminPassword(password: string): Promise<string> {
  return createAdminPasswordHash(password);
}
