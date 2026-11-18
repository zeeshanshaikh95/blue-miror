import { createHash } from 'node:crypto';
import type { Request, RequestHandler } from 'express';

import { env } from '../config/env.js';

/**
 * Dedicated admin-login throttle.
 *
 * IMPORTANT LIMITATION: state lives in this process's memory. Behind more than
 * one instance (or a serverless/autoscaled deployment), each instance keeps its
 * own counters, so an attacker gets `maxAttempts × instances` before any single
 * instance locks. Multi-instance deployments should replace this store with a
 * shared one (Redis/Upstash with atomic INCR + EXPIRE, or a Mongo-backed
 * counters collection) and keep the same keys and thresholds.
 *
 * The limiter is applied only to POST /api/admin/login, so public website and
 * booking endpoints are unaffected.
 */

type Bucket = {
  failures: number;
  windowStartedAt: number;
  lockedUntil: number;
  lockouts: number;
};

const buckets = new Map<string, Bucket>();
const maxTrackedKeys = 10_000;

function windowMs(): number {
  return env.ADMIN_LOGIN_WINDOW_SECONDS * 1000;
}

/** Progressive lockout: each repeat offence doubles the wait, capped at 8×. */
function lockoutMs(lockouts: number): number {
  const multiplier = Math.min(2 ** Math.max(0, lockouts - 1), 8);
  return env.ADMIN_LOGIN_LOCKOUT_SECONDS * 1000 * multiplier;
}

function normalizeEmail(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : undefined;
}

function accountKey(email: string): string {
  const digest = createHash('sha256').update(email).digest('hex');
  return `acct:${digest}`;
}

function ipKey(request: Request): string {
  return `ip:${request.ip ?? 'unknown'}`;
}

function keysFor(request: Request): string[] {
  const keys = [ipKey(request)];
  const email = normalizeEmail((request.body as { email?: unknown } | undefined)?.email);

  if (email) {
    keys.push(accountKey(email));
  }

  return keys;
}

function thresholdsFor(key: string): number {
  return key.startsWith('ip:') ? env.ADMIN_LOGIN_IP_MAX_ATTEMPTS : env.ADMIN_LOGIN_MAX_ATTEMPTS;
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    const idle = now - bucket.windowStartedAt > windowMs() * 2;
    if (idle && bucket.lockedUntil <= now) {
      buckets.delete(key);
    }
  }
}

function bucketFor(key: string, now: number): Bucket {
  const existing = buckets.get(key);
  if (existing) {
    return existing;
  }

  const created: Bucket = { failures: 0, windowStartedAt: now, lockedUntil: 0, lockouts: 0 };
  buckets.set(key, created);
  return created;
}

/** Milliseconds until a lock on any of this request's keys expires (0 if none). */
function lockedForMs(request: Request, now: number): number {
  let remaining = 0;

  for (const key of keysFor(request)) {
    const bucket = buckets.get(key);
    if (bucket && bucket.lockedUntil > now) {
      remaining = Math.max(remaining, bucket.lockedUntil - now);
    }
  }

  return remaining;
}

export const loginThrottle: RequestHandler = (request, response, next) => {
  const now = Date.now();

  if (buckets.size > maxTrackedKeys) {
    prune(now);
  }

  const remaining = lockedForMs(request, now);

  if (remaining > 0) {
    response.setHeader('Retry-After', String(Math.ceil(remaining / 1000)));
    response.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMITED',
        message: 'Too many sign-in attempts. Please wait and try again.',
      },
    });
    return;
  }

  next();
};

/** Records a failed credential check against both the IP and account buckets. */
export function recordLoginFailure(request: Request): void {
  const now = Date.now();

  for (const key of keysFor(request)) {
    const bucket = bucketFor(key, now);

    if (now - bucket.windowStartedAt > windowMs()) {
      bucket.failures = 0;
      bucket.windowStartedAt = now;
    }

    bucket.failures += 1;

    if (bucket.failures >= thresholdsFor(key)) {
      bucket.lockouts += 1;
      bucket.lockedUntil = now + lockoutMs(bucket.lockouts);
      // Start a fresh window so the admin can try again after the cooldown.
      bucket.failures = 0;
      bucket.windowStartedAt = now;
    }
  }
}

/** A successful sign-in clears both counters, so one success unblocks the pair. */
export function recordLoginSuccess(request: Request): void {
  for (const key of keysFor(request)) {
    buckets.delete(key);
  }
}

/** Test/ops helper; not exposed over HTTP. */
export function resetLoginThrottleState(): void {
  buckets.clear();
}
