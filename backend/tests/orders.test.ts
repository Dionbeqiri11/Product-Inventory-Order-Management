import { describe, it, expect, beforeEach } from 'vitest';
import { app, request, registerAndLogin, createAdminAndLogin, createProduct } from './helpers';
import { ProductModel } from '../src/api/products/product.model';

describe('orders', () => {
  let token: string; // regular customer placing orders
  let adminToken: string; // admin seeding products

  beforeEach(async () => {
    token = await registerAndLogin();
    adminToken = await createAdminAndLogin();
  });

  it('forbids admins from placing orders', async () => {
    const { id } = await createProduct(adminToken, { sku: 'ADMIN-NOORDER', stock: 5 });
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ productId: id, quantity: 1 }] });
    expect(res.status).toBe(403);

    const product = await ProductModel.findById(id);
    expect(product?.stock).toBe(5);
  });

  it('creates an order and decrements stock', async () => {
    const { id } = await createProduct(adminToken, { priceCents: 500, stock: 10 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: id, quantity: 3 }] });

    expect(res.status).toBe(201);
    expect(res.body.totalCents).toBe(1500);
    expect(res.body.status).toBe('confirmed');

    const product = await ProductModel.findById(id);
    expect(product?.stock).toBe(7);
  });

  it('rejects an order exceeding available stock with 409 and leaves stock intact', async () => {
    const { id } = await createProduct(adminToken, { stock: 2 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: id, quantity: 5 }] });

    expect(res.status).toBe(409);
    const product = await ProductModel.findById(id);
    expect(product?.stock).toBe(2);
  });

  it('compensates (rolls back) earlier reservations when a later line fails', async () => {
    const a = await createProduct(adminToken, { sku: 'COMP-A', stock: 10 });
    const b = await createProduct(adminToken, { sku: 'COMP-B', stock: 1 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: a.id, quantity: 5 }, // would succeed
          { productId: b.id, quantity: 3 }, // fails -> whole order rolls back
        ],
      });

    expect(res.status).toBe(409);
    // Product A must have been released back to its original stock.
    const productA = await ProductModel.findById(a.id);
    const productB = await ProductModel.findById(b.id);
    expect(productA?.stock).toBe(10);
    expect(productB?.stock).toBe(1);
  });

  it('does not oversell under concurrent orders (only one wins for the last unit)', async () => {
    const { id } = await createProduct(adminToken, { sku: 'RACE-1', stock: 1 });
    const ATTEMPTS = 12;

    const results = await Promise.all(
      Array.from({ length: ATTEMPTS }, () =>
        request(app)
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${token}`)
          .send({ items: [{ productId: id, quantity: 1 }] }),
      ),
    );

    const successes = results.filter((r) => r.status === 201).length;
    const conflicts = results.filter((r) => r.status === 409).length;

    expect(successes).toBe(1);
    expect(conflicts).toBe(ATTEMPTS - 1);

    const product = await ProductModel.findById(id);
    expect(product?.stock).toBe(0);
    expect(product?.stock).toBeGreaterThanOrEqual(0);
  });

  it('lists only the authenticated user\'s orders', async () => {
    const { id } = await createProduct(adminToken, { stock: 10 });
    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: id, quantity: 1 }] });

    const otherToken = await registerAndLogin({ email: 'other@example.com' });

    const mine = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${token}`);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.total).toBe(1);

    const theirs = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(theirs.body.data).toHaveLength(0);
  });
});
