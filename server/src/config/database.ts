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

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}
