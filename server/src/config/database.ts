import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);
  mongoose.set('bufferCommands', false);

  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    autoIndex: env.NODE_ENV !== 'production',
  });

  logger.info('MongoDB connected');
}

/**
 * Creates any missing schema indexes (including TTL and unique indexes) in
 * production, where Mongoose's automatic index build is disabled at boot.
 */
export async function ensureModelIndexes(): Promise<void> {
  await Promise.all(
    mongoose.modelNames().map(async (name) => {
      try {
        await mongoose.model(name).createIndexes();
      } catch (error) {
        logger.warn({ err: error, model: name }, 'Could not create model indexes');
      }
    }),
  );
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}
