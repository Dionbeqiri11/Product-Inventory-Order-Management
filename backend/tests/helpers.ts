import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { UserModel, hashPassword } from '../src/api/auth/user.model';

export const app: Express = createApp();

/** Register a regular user and return its bearer token. */
export async function registerAndLogin(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<string> {
  const payload = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `user_${Date.now()}_${Math.round(Math.random() * 1e6)}@example.com`,
    password: overrides.password ?? 'password123',
  };
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  return res.body.token as string;
}

/** Create an admin directly in the DB, then log in to obtain an admin token. */
export async function createAdminAndLogin(
  overrides: Partial<{ email: string; password: string }> = {},
): Promise<string> {
  const email = overrides.email ?? `admin_${Date.now()}_${Math.round(Math.random() * 1e6)}@example.com`;
  const password = overrides.password ?? 'admin12345';
  await UserModel.create({
    name: 'Admin',
    email,
    passwordHash: await hashPassword(password),
    role: 'admin',
  });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.token as string;
}

/** Create a product (requires auth) and return its id. */
export async function createProduct(
  token: string,
  overrides: Partial<{ name: string; sku: string; priceCents: number; stock: number }> = {},
): Promise<{ id: string; stock: number }> {
  const payload = {
    name: overrides.name ?? 'Widget',
    sku: overrides.sku ?? `SKU-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    priceCents: overrides.priceCents ?? 1000,
    stock: overrides.stock ?? 10,
  };
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  return { id: res.body.id as string, stock: res.body.stock as number };
}

export { request };
