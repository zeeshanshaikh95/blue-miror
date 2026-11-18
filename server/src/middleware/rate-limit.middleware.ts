import { rateLimit } from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    const requestId =
      typeof response.locals.requestId === 'string' ? response.locals.requestId : undefined;

    response.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
      ...(requestId ? { requestId } : {}),
    });
  },
});
