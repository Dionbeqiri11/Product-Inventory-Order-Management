import { describe, it, expect, beforeEach } from 'vitest';
import { app, request, registerAndLogin, createProduct } from './helpers';

describe('products', () => {
  let token: string;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it('requires auth to create a product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .send({ name: 'X', sku: 'X-1', priceCents: 100, stock: 1 });
    expect(res.status).toBe(401);
  });

  it('creates and lists products', async () => {
    const { id } = await createProduct(token, { sku: 'LIST-1', stock: 5 });
    expect(id).toBeTruthy();

    const list = await request(app).get('/api/v1/products');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(id);
  });

  it('validates the create payload', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', sku: 'BAD', priceCents: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects duplicate SKU with 409', async () => {
    await createProduct(token, { sku: 'UNIQUE-1' });
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dupe', sku: 'UNIQUE-1', priceCents: 100, stock: 1 });
    expect(res.status).toBe(409);
  });

  it('updates and deletes a product', async () => {
    const { id } = await createProduct(token, { sku: 'UPD-1', priceCents: 1000 });

    const upd = await request(app)
      .patch(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priceCents: 2000 });
    expect(upd.status).toBe(200);
    expect(upd.body.priceCents).toBe(2000);

    const del = await request(app)
      .delete(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const after = await request(app).get(`/api/v1/products/${id}`);
    expect(after.status).toBe(404);
  });
});
