import { Router } from 'express';

import { isDatabaseReady } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  const databaseUp = isDatabaseReady();
  const status = databaseUp ? 'ok' : 'degraded';

  response
    .status(databaseUp ? 200 : 503)
    .set('Cache-Control', 'no-store')
    .json({
      status,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseUp ? 'up' : 'down',
      },
    });
});
