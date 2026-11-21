import { z } from 'zod';

const fallbackApiBaseUrl = 'http://localhost:4000/api';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || fallbackApiBaseUrl
).replace(/\/+$/, '');

export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

type ApiErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
  requestId?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    fields?: Record<string, string>,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    // The API authenticates with bearer tokens and sets no cookies, so the
    // browser never needs to attach credentials to these requests.
    credentials: 'omit',
  });

  const payload = (await response.json().catch(() => null)) as
    ApiSuccessEnvelope<T> | ApiErrorEnvelope | null;

  if (!response.ok || !payload || payload.success === false) {
    const error = payload && payload.success === false ? payload.error : undefined;
    throw new ApiError(
      error?.message ?? 'The request could not be completed.',
      response.status,
      error?.code,
      error?.fields,
      payload && 'requestId' in payload ? payload.requestId : undefined,
    );
  }

  return payload.data;
}

const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.object({
    database: z.enum(['up', 'down']),
  }),
});

export type HealthResponse = z.infer<typeof healthSchema>;

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!payload) {
    throw new ApiError('The API returned an unreadable response.', response.status);
  }

  return healthSchema.parse(payload);
}
