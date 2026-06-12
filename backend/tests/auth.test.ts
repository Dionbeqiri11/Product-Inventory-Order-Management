import { describe, it, expect } from 'vitest';
import { app, request } from './helpers';

describe('auth', () => {
  it('registers a user and returns a token (no password leak)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate email with 409', async () => {
    const payload = { name: 'Ada', email: 'dup@example.com', password: 'password123' };
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(409);
  });

  it('rejects weak password with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada', email: 'weak@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('logs in with valid credentials and rejects bad ones', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada', email: 'login@example.com', password: 'password123' });

    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTypeOf('string');

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' });
    expect(bad.status).toBe(401);
  });

  it('protects /me and accepts a valid token', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada', email: 'me@example.com', password: 'password123' });

    const unauth = await request(app).get('/api/v1/auth/me');
    expect(unauth.status).toBe(401);

    const auth = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(auth.status).toBe(200);
    expect(auth.body.user.email).toBe('me@example.com');
  });
});
