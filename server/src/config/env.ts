import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ quiet: true });

const placeholderPattern =
  /(change[-_ ]?me|placeholder|replace[-_ ]?(me|with)|your[-_ ]?(secret|key|password)|example[-_ ]?secret|secret123|password123)/i;

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z
    .enum(['0', '1', 'true', 'false', 'yes', 'no'])
    .default('0')
    .transform((value) => ['1', 'true', 'yes'].includes(value)),
  REQUEST_BODY_LIMIT: z.string().trim().min(1).default('100kb'),

  // Admin login protection (in-memory, per process — see login-throttle.middleware.ts).
  ADMIN_LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(50).default(5),
  ADMIN_LOGIN_IP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(200).default(20),
  ADMIN_LOGIN_WINDOW_SECONDS: z.coerce.number().int().min(10).max(86_400).default(900),
  ADMIN_LOGIN_LOCKOUT_SECONDS: z.coerce.number().int().min(1).max(86_400).default(900),

  // Admin session lifetime; also sets the JWT expiry and the session document TTL.
  ADMIN_SESSION_TTL_MINUTES: z.coerce.number().int().min(1).max(1440).default(60),

  MONGODB_URI: z
    .string()
    .trim()
    .min(1, 'MONGODB_URI is required.')
    .refine(
      (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://.',
    )
    .refine((value) => !/\s/.test(value), 'MONGODB_URI must not contain whitespace.'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required.'),
  JWT_ISSUER: z.string().trim().min(1).default('blue-miror-api'),
  JWT_AUDIENCE: z.string().trim().min(1).default('blue-miror-admin'),
  ADMIN_BOOTSTRAP_SECRET: optionalString,

  CORS_ORIGINS: optionalString,

  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  CLOUDINARY_FOLDER_PREFIX: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9/_-]*$/, 'CLOUDINARY_FOLDER_PREFIX must be a safe folder path.')
    .refine((value) => !value.includes('..'), 'CLOUDINARY_FOLDER_PREFIX must not traverse paths.')
    .default('blue-miror'),
});

type RawEnv = z.infer<typeof rawEnvSchema>;

export type AppEnv = Omit<RawEnv, 'CORS_ORIGINS'> & {
  CORS_ORIGINS: string[];
  IS_PRODUCTION: boolean;
  IS_CLOUDINARY_CONFIGURED: boolean;
};

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `${path}: ${issue.message}`;
    })
    .join('\n');
}

function parseCorsOrigins(rawOrigins: string, issues: string[]): string[] {
  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    issues.push('CORS_ORIGINS must contain at least one exact browser origin.');
    return [];
  }

  const parsedOrigins = new Set<string>();

  for (const origin of origins) {
    if (origin === '*') {
      issues.push('CORS_ORIGINS must not contain a wildcard.');
      continue;
    }

    try {
      const url = new URL(origin);

      if (!['http:', 'https:'].includes(url.protocol)) {
        issues.push(`CORS_ORIGINS entry "${origin}" must use http or https.`);
        continue;
      }

      if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
        issues.push(
          `CORS_ORIGINS entry "${origin}" must be an origin only, without a path or credentials.`,
        );
        continue;
      }

      parsedOrigins.add(url.origin);
    } catch {
      issues.push(`CORS_ORIGINS entry "${origin}" is not a valid URL.`);
    }
  }

  return [...parsedOrigins];
}

export function createEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = rawEnvSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${formatZodError(parsed.error)}`);
  }

  const value = parsed.data;
  const isProduction = value.NODE_ENV === 'production';
  const issues: string[] = [];
  const minimumJwtLength = isProduction ? 64 : 32;

  if (value.JWT_SECRET.length < minimumJwtLength) {
    issues.push(`JWT_SECRET must be at least ${minimumJwtLength} characters in ${value.NODE_ENV}.`);
  }

  if (placeholderPattern.test(value.JWT_SECRET)) {
    issues.push('JWT_SECRET must not contain a placeholder value.');
  }

  if (isProduction) {
    if (!value.CORS_ORIGINS) {
      issues.push('CORS_ORIGINS is required in production.');
    }

    if (!value.CLOUDINARY_CLOUD_NAME) {
      issues.push('CLOUDINARY_CLOUD_NAME is required in production.');
    }
    if (!value.CLOUDINARY_API_KEY) {
      issues.push('CLOUDINARY_API_KEY is required in production.');
    }
    if (!value.CLOUDINARY_API_SECRET) {
      issues.push('CLOUDINARY_API_SECRET is required in production.');
    }
    // ADMIN_BOOTSTRAP_SECRET is intentionally optional: once the first admin
    // exists the secret should be removed from the environment. The bootstrap
    // endpoint returns 503 BOOTSTRAP_DISABLED when it is not configured.

    if (value.MONGODB_URI.includes('localhost') || value.MONGODB_URI.includes('127.0.0.1')) {
      issues.push('MONGODB_URI must not point to localhost in production.');
    }
  }

  if (value.ADMIN_BOOTSTRAP_SECRET && placeholderPattern.test(value.ADMIN_BOOTSTRAP_SECRET)) {
    issues.push('ADMIN_BOOTSTRAP_SECRET must not contain a placeholder value.');
  }

  if (value.ADMIN_BOOTSTRAP_SECRET && value.ADMIN_BOOTSTRAP_SECRET.length < 32) {
    issues.push('ADMIN_BOOTSTRAP_SECRET must be at least 32 characters.');
  }

  const cloudinaryValues = [
    value.CLOUDINARY_CLOUD_NAME,
    value.CLOUDINARY_API_KEY,
    value.CLOUDINARY_API_SECRET,
  ];
  const cloudinaryValueCount = cloudinaryValues.filter(Boolean).length;

  if (cloudinaryValueCount > 0 && cloudinaryValueCount < cloudinaryValues.length) {
    issues.push(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be configured together.',
    );
  }

  if (placeholderPattern.test(value.CLOUDINARY_API_SECRET ?? '')) {
    issues.push('CLOUDINARY_API_SECRET must not contain a placeholder value.');
  }

  const parsedOrigins = parseCorsOrigins(value.CORS_ORIGINS ?? 'http://localhost:5173', issues);

  // Production traffic must be HTTPS. Ignore any plain-HTTP origin left in the
  // environment (for example from early domain setup) rather than rejecting
  // the whole configuration at boot.
  const origins = isProduction
    ? parsedOrigins.filter((origin) => origin.startsWith('https://'))
    : parsedOrigins;

  if (issues.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${issues.join('\n- ')}`);
  }

  return {
    ...value,
    CORS_ORIGINS: origins,
    IS_PRODUCTION: isProduction,
    IS_CLOUDINARY_CONFIGURED: cloudinaryValueCount === cloudinaryValues.length,
  };
}

export const env = createEnv();
