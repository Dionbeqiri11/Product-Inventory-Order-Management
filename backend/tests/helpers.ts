import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';

export const app: Express = createApp();

/** Register a user and return its bearer token. */
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
