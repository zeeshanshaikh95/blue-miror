import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

type NormalizedError = {
  statusCode: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
};

function isJsonParseError(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const parseError = error as SyntaxError & { status?: unknown; body?: unknown };
  return parseError.status === 400 && 'body' in parseError;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    };
  }

  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || '_root', issue.message]),
    );

    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Please check the highlighted fields.',
      fields,
    };
  }

  if (isJsonParseError(error)) {
    return {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'The request body contains invalid JSON.',
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(
      Object.entries(error.errors).map(([path, validationError]) => [
        path,
        validationError.message,
      ]),
    );

    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Please check the highlighted fields.',
      fields,
    };
  }

  if (isDuplicateKeyError(error)) {
    return {
      statusCode: 409,
      code: 'DUPLICATE_RESOURCE',
      message: 'A record with these details already exists.',
    };
  }

  // An invalid ObjectId (e.g. a stale client sending "undefined") is a missing
  // resource, not a server fault.
  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  };
}

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.'));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const normalized = normalizeError(error);
  const requestId =
    typeof response.locals.requestId === 'string' ? response.locals.requestId : undefined;

  if (normalized.statusCode >= 500) {
    logger.error(
      {
        err: error,
        requestId,
        method: request.method,
        path: request.originalUrl,
      },
      'Unhandled request error',
    );
  }

  response.status(normalized.statusCode).json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.fields ? { fields: normalized.fields } : {}),
    },
    ...(requestId ? { requestId } : {}),
  });
};
