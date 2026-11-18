import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Express } from 'express';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { createAdminPasswordHash } from '../src/lib/auth.js';
import { Admin } from '../src/models/index.js';

export const testAdminEmail = 'admin@bluemirror.io';
export const testAdminPassword = 'VerifyMe123-';

let mongod: MongoMemoryServer | null = null;

export async function startTestServer(): Promise<{ app: Express; stop: () => Promise<void> }> {
  mongod = await MongoMemoryServer.create();
  // Match production query sanitisation so operator handling is exercised here
  // rather than only after deployment.
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(mongod.getUri('blue-miror-test'));
  await mongoose.connection.dropDatabase();
  await Admin.syncIndexes();

  const app = createApp();

  return {
    app,
    stop: async () => {
      await mongoose.disconnect();
      if (mongod) {
        await mongod.stop();
        mongod = null;
      }
    },
  };
}

export async function seedAdmin(
  email: string = testAdminEmail,
  password: string = testAdminPassword,
) {
  const passwordHash = await createAdminPasswordHash(password);

  return Admin.create({
    email,
    passwordHash,
    role: 'superadmin',
    passwordUpdatedAt: new Date(),
    isActive: true,
  });
}

export async function loginAsAdmin(
  app: Express,
  email: string = testAdminEmail,
  password: string = testAdminPassword,
): Promise<string> {
  const response = await request(app).post('/api/admin/login').send({ email, password });

  if (response.status !== 200 || typeof response.body?.data?.token !== 'string') {
    throw new Error(`Admin login failed with status ${response.status}`);
  }

  return response.body.data.token as string;
}

export function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

export async function resetDatabase(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
}
