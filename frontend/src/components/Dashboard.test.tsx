import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    listProducts: vi.fn(),
    listOrders: vi.fn(),
    createOrder: vi.fn(),
    createProduct: vi.fn(),
  },
}));

const productsPage = {
  data: [{ id: 'p1', name: 'Widget', sku: 'W-1', priceCents: 1000, stock: 5 }],
  page: 1,
  limit: 10,
  total: 1,
  totalPages: 1,
};

const emptyOrders = { data: [], page: 1, limit: 10, total: 0, totalPages: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listProducts).mockResolvedValue(productsPage);
  vi.mocked(api.listOrders).mockResolvedValue(emptyOrders);
});

describe('Dashboard', () => {
  it('shows the ordering UI for customers', async () => {
    render(<Dashboard isAdmin={false} />);

    await waitFor(() => expect(screen.getByText('Widget')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /qty/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your orders/i })).toBeInTheDocument();
    // Customers cannot manage the catalog.
    expect(screen.queryByRole('heading', { name: /add product/i })).not.toBeInTheDocument();
  });

  it('shows management UI and hides ordering for admins', async () => {
    render(<Dashboard isAdmin />);

    await waitFor(() => expect(screen.getByText('Widget')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /add product/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /place order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /qty/i })).not.toBeInTheDocument();
    // Admins do not fetch orders.
    expect(api.listOrders).not.toHaveBeenCalled();
  });

  it('renders pagination controls reflecting the page metadata', async () => {
    render(<Dashboard isAdmin={false} />);

    await waitFor(() => expect(screen.getByText('Widget')).toBeInTheDocument());
    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });
});
