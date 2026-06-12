export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  priceCents: number;
  stock: number;
}

export interface OrderItem {
  product: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalCents: number;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}
