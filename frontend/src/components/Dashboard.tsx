import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { formatPrice } from '../format';
import type { Order, Product } from '../types';

export function Dashboard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    // Admins manage the catalog and do not place or have orders.
    const [p, o] = await Promise.all([
      api.listProducts(),
      isAdmin ? Promise.resolve([]) : api.listOrders(),
    ]);
    setProducts(p);
    setOrders(o);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  function setQty(id: string, qty: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));
  }

  async function placeOrder() {
    setError(null);
    setMessage(null);
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) {
      setError('Add at least one item to order.');
      return;
    }
    try {
      const order = await api.createOrder(items);
      setMessage(`Order placed: ${formatPrice(order.totalCents)}`);
      setCart({});
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed');
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Products</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              {!isAdmin && <th>Qty</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{formatPrice(p.priceCents)}</td>
                <td>{p.stock}</td>
                {!isAdmin && (
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={p.stock}
                      value={cart[p.id] ?? 0}
                      onChange={(e) => setQty(p.id, Number(e.target.value))}
                      style={{ width: 64 }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 5}>
                  {isAdmin ? 'No products yet — add one below.' : 'No products available yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!isAdmin && <button onClick={placeOrder}>Place order</button>}
      </section>

      {isAdmin && <CreateProduct onCreated={refresh} />}

      {!isAdmin && (
        <section className="card">
          <h2>Your orders</h2>
          {orders.length === 0 && <p>No orders yet.</p>}
          <ul className="orders">
            {orders.map((o) => (
              <li key={o.id}>
                <strong>{formatPrice(o.totalCents)}</strong> · {o.status} ·{' '}
                {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CreateProduct({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createProduct({
        name,
        sku,
        priceCents: Math.round(Number(price) * 100),
        stock: Number(stock),
      });
      setName('');
      setSku('');
      setPrice('');
      setStock('');
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  }

  return (
    <section className="card">
      <h2>Add product</h2>
      <form onSubmit={submit} className="inline-form">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <input
          placeholder="Price (USD)"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          placeholder="Stock"
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
