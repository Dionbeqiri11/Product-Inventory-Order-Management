import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, setToken, getToken, setStoredUser, getStoredUser } from './api';

beforeEach(() => {
  localStorage.clear();
  setToken(null);
  vi.unstubAllGlobals();
});

describe('token & user storage', () => {
  it('persists and clears the auth token', () => {
    setToken('abc');
    expect(getToken()).toBe('abc');
    expect(localStorage.getItem('token')).toBe('abc');

    setToken(null);
    expect(getToken()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('persists and reads the stored user', () => {
    const user = { id: '1', name: 'Ada', email: 'ada@example.com', role: 'user' as const };
    setStoredUser(user);
    expect(getStoredUser()).toEqual(user);

    setStoredUser(null);
    expect(getStoredUser()).toBeNull();
  });
});

describe('api request client', () => {
  it('attaches the bearer token and builds the paged URL', async () => {
    setToken('tok');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [], page: 2, limit: 5, total: 0 })),
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.listProducts(2, 5);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/products?page=2&limit=5',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  it('throws the server-provided error message on a failed request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: () => Promise.resolve(JSON.stringify({ error: 'Insufficient stock' })),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createOrder([{ productId: 'p1', quantity: 1 }])).rejects.toThrow(
      'Insufficient stock',
    );
  });
});
