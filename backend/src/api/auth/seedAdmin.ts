import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { UserModel, hashPassword } from './user.model';

/**
 * Idempotently ensure a bootstrap admin account exists. Runs on startup when
 * ADMIN_EMAIL and ADMIN_PASSWORD are configured. If a user with that email
 * already exists it is promoted to admin (but its password is left untouched).
 */
export async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;

  const existing = await UserModel.findOne({ email: env.ADMIN_EMAIL.toLowerCase() }).exec();
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      logger.info(`Promoted existing user to admin: ${env.ADMIN_EMAIL}`);
    }
    return;
  }

  await UserModel.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    role: 'admin',
  });
  logger.info(`Seeded admin account: ${env.ADMIN_EMAIL}`);
}
