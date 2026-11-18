import { createServer } from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();
const server = createServer(app);
let shuttingDown = false;

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
      cloudinaryConfigured: env.IS_CLOUDINARY_CONFIGURED,
    },
    'Blue Miror API listening',
  );
});

connectDatabase(env.MONGODB_URI).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  logger.error({ message }, 'MongoDB connection failed');

  if (env.IS_PRODUCTION) {
    logger.fatal('Shutting down because the production database is unavailable.');
    void shutdown('database-unavailable', 1);
  }
});

async function shutdown(reason: string, exitCode = 0): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info({ reason }, 'Shutting down Blue Miror API');

  const forceExitTimer = setTimeout(() => {
    logger.error('Shutdown timed out; forcing exit.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  try {
    await disconnectDatabase();
  } catch (error) {
    logger.error({ err: error }, 'Failed to disconnect MongoDB during shutdown');
    exitCode = 1;
  }

  clearTimeout(forceExitTimer);
  process.exit(exitCode);
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
