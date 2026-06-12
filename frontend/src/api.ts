import type { AuthUser, Order, Paginated, Product } from './types';

const BASE = '/api/v1';

let authToken: string | null = localStorage.getItem('token');

export function setToken(token: string | null): void {
  authToken = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getToken(): string | null {
  return authToken;
}

export function setStoredUser(user: AuthUser | null): void {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = body?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  register(input: { name: string; email: string; password: string }) {
    return request<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  listProducts(page = 1, limit = 10) {
    return request<Paginated<Product>>(`/products?page=${page}&limit=${limit}`);
  },
  createProduct(input: { name: string; sku: string; priceCents: number; stock: number }) {
    return request<Product>('/products', { method: 'POST', body: JSON.stringify(input) });
  },
  listOrders(page = 1, limit = 10) {
    return request<Paginated<Order>>(`/orders?page=${page}&limit=${limit}`);
  },
  createOrder(items: { productId: string; quantity: number }[]) {
    return request<Order>('/orders', { method: 'POST', body: JSON.stringify({ items }) });
  },
};
