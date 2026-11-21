import { randomUUID } from 'node:crypto';

import compression from 'compression';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimit } from './middleware/rate-limit.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { publicContentRouter } from './routes/public.routes.js';
import { publicSubmissionRouter } from './controllers/submission.controller.js';
import { adminRoutes } from './routes/admin.routes.js';
import { AppError } from './utils/app-error.js';
import { logger } from './utils/logger.js';

const requestIdPattern = /^[A-Za-z0-9._-]{8,128}$/;

function createCorsOptions(allowedOrigins: string[]): CorsOptions {
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'This origin is not allowed.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400,
    optionsSuccessStatus: 204,
  };
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('json escape', true);
  app.set('trust proxy', env.TRUST_PROXY ? 1 : false);

  app.use(
    pinoHttp({
      logger,
      genReqId(request, response) {
        const incomingRequestId = request.headers['x-request-id'];
        const requestId =
          typeof incomingRequestId === 'string' && requestIdPattern.test(incomingRequestId)
            ? incomingRequestId
            : randomUUID();

        response.locals.requestId = requestId;
        response.setHeader('X-Request-Id', requestId);
        return requestId;
      },
      autoLogging: {
        ignore: (request) => request.url === '/api/health',
      },
      serializers: {
        req(request) {
          return {
            id: request.id,
            method: request.method,
            url: request.url,
          };
        },
        res(response) {
          return {
            statusCode: response.statusCode,
          };
        },
      },
    }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: env.IS_PRODUCTION ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    }),
  );

  app.use(cors(createCorsOptions(env.CORS_ORIGINS)));
  app.use(compression());
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }));

  app.use('/api/health', healthRouter);
  app.use('/api', apiRateLimit);

  // Authenticated staff data must never be cached by a browser or proxy.
  app.use('/api/admin', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.setHeader('Pragma', 'no-cache');
    next();
  });

  app.use('/api/public', publicContentRouter);
  app.use('/api', publicSubmissionRouter);
  app.use('/api', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
