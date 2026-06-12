import type { AuthUser, Order, Product } from './types';

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
  listProducts() {
    return request<Product[]>('/products');
  },
  createProduct(input: { name: string; sku: string; priceCents: number; stock: number }) {
    return request<Product>('/products', { method: 'POST', body: JSON.stringify(input) });
  },
  listOrders() {
    return request<Order[]>('/orders');
  },
  createOrder(items: { productId: string; quantity: number }[]) {
    return request<Order>('/orders', { method: 'POST', body: JSON.stringify({ items }) });
  },
};
