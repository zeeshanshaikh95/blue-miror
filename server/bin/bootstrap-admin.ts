import { createAdminPasswordHash } from '../src/lib/auth.js';
import { Admin } from '../src/models/admin.model.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

async function bootstrap() {
  const secret = env.ADMIN_BOOTSTRAP_SECRET;
  if (!secret) {
    logger.error('ADMIN_BOOTSTRAP_SECRET is not configured. Bootstrap is disabled.');
    process.exit(1);
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@bluemiror.test';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password) {
    logger.error('BOOTSTRAP_ADMIN_PASSWORD is not set. Aborting bootstrap.');
    process.exit(1);
  }

  await connectDatabase(env.MONGODB_URI);

  const existing = await Admin.findOne({ email }).lean();
  if (existing) {
    logger.info({ email }, 'Admin already exists. Bootstrap is a one-time action.');
    await disconnectDatabase();
    process.exit(0);
  }

  const passwordHash = await createAdminPasswordHash(password);
  const admin = await Admin.create({
    email,
    passwordHash,
    role: 'superadmin',
    passwordUpdatedAt: new Date(),
    isActive: true,
  });

  logger.info({ adminId: admin._id.toString(), email }, 'Admin bootstrapped');
  await disconnectDatabase();
  process.exit(0);
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Bootstrap failed');
  process.exit(1);
});
