import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { argon2id, hash, verify, type HashOptions } from 'argon2';

import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const jwtAlgorithm = 'HS256' as const;
const clockSkewSeconds = 10;

export function getSessionLifetimeMs(): number {
  return env.ADMIN_SESSION_TTL_MINUTES * 60_000;
}

/**
 * Argon2id parameters. `satisfies HashOptions` keeps the literal `2` from
 * `argon2id` so the overload that returns a string hash is selected.
 */
const argonHashOptions = {
  type: argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
} satisfies HashOptions;

export type AdminRole = 'superadmin';

export type AdminTokenPayload = JWTPayload & {
  sub: string;
  jti: string;
  role: AdminRole;
  email?: string;
  name?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export type AdminPasswordHash = string;

export async function createAdminPasswordHash(password: string): Promise<AdminPasswordHash> {
  if (typeof password !== 'string' || password.length === 0) {
    throw new AppError(
      422,
      'PASSWORD_MISSING',
      'A password is required to create a password hash.',
    );
  }
  if (password.length > 72) {
    throw new AppError(422, 'PASSWORD_TOO_LONG', 'Password must be 72 characters or fewer.');
  }

  return hash(password, argonHashOptions);
}

export async function verifyAdminPassword(
  plainText: string,
  hashed: AdminPasswordHash,
): Promise<boolean> {
  if (typeof plainText !== 'string' || plainText.length === 0) {
    return false;
  }
  if (typeof hashed !== 'string' || hashed.length === 0) {
    return false;
  }

  try {
    // Verification options only accept a `secret`; the parameters are read
    // from the encoded digest itself.
    return await verify(hashed, plainText);
  } catch {
    return false;
  }
}

export async function createAdminSessionToken(
  admin: AuthenticatedAdmin,
  issuedAt = new Date(),
  tokenId: string = randomUUID(),
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  return new SignJWT({ role: admin.role, email: admin.email, name: admin.name })
    .setProtectedHeader({ alg: jwtAlgorithm, typ: 'JWT' })
    .setSubject(admin.id)
    .setJti(tokenId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt(Math.floor(issuedAt.getTime() / 1000))
    .setExpirationTime(new Date(issuedAt.getTime() + getSessionLifetimeMs()))
    .sign(secret);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminTokenPayload> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  let payload: JWTPayload;

  try {
    ({ payload } = await jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      clockTolerance: clockSkewSeconds,
    }));
  } catch {
    // Signature, issuer, audience and expiry failures are authentication
    // failures, never server errors.
    throw new AppError(401, 'SESSION_INVALID', 'Session token is invalid or has expired.');
  }

  const sub = typeof payload.sub === 'string' && payload.sub ? payload.sub : undefined;
  const role = typeof payload.role === 'string' && payload.role ? payload.role : undefined;
  const jti = typeof payload.jti === 'string' && payload.jti ? payload.jti : undefined;

  if (!sub || !role || !jti) {
    throw new AppError(401, 'SESSION_INVALID', 'Session token is missing required claims.');
  }

  return { ...payload, sub, jti, role: role as AdminRole } as AdminTokenPayload;
}

export function resolveAuthenticatedAdmin(payload: AdminTokenPayload): AuthenticatedAdmin {
  const email = typeof payload.email === 'string' ? payload.email : payload.sub;
  const name = typeof payload.name === 'string' ? payload.name : email;

  return { id: payload.sub, email, name, role: payload.role };
}

export function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}
