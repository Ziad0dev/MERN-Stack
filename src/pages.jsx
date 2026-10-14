import { useEffect, useState } from 'react';
import { api, session } from './api.js';
import { go } from './useRoute.js';

const money = (n) => `$${n.toFixed(2)}`;

function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let live = true;
    api(path).then(
      (data) => live && setState({ data, error: null }),
      (error) => live && setState({ data: null, error: error.message }),
    );
    return () => { live = false; };
  }, [path, ...deps]);
  return state;
}

export function ProductCard({ product, cart }) {
  return (
    <article className="card">
      <a href={`#/product/${product._id}`}>
        <div className="thumb" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined} />
        <h3>{product.name}</h3>
      </a>
      <p className="muted">{product.category?.name}</p>
      <div className="row">
        <strong>{money(product.price)}</strong>
        <button disabled={product.quantity < 1} onClick={() => cart.add(product)}>
          {product.quantity < 1 ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}

export function Shop({ cart }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const categories = useFetch('/categories');
  const query = new URLSearchParams({ search, sortBy, ...(category && { category }) });
  const products = useFetch(`/products?${query}`);

  return (
    <section>
      <div className="filters">
        <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Newest</option>
          <option value="sold">Best sellers</option>
        </select>
      </div>
      {products.error && <p className="error">Could not load products: {products.error}</p>}
      <div className="grid">
        {products.data?.map((p) => <ProductCard key={p._id} product={p} cart={cart} />)}
      </div>
      {products.data?.length === 0 && <p className="muted">No products found.</p>}
    </section>
  );
}

export function Product({ id, cart }) {
  const product = useFetch(`/product/${id}`);
  const related = useFetch(`/product/${id}/related`);
  if (product.error) return <p className="error">{product.error}</p>;
  if (!product.data) return <p>Loading…</p>;
  const p = product.data;
  return (
    <section>
      <div className="detail">
        <div className="thumb big" style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined} />
        <div>
          <h2>{p.name}</h2>
          <p className="muted">{p.category?.name} · {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}</p>
          <p>{p.description}</p>
          <p><strong>{money(p.price)}</strong></p>
          <button disabled={p.quantity < 1} onClick={() => cart.add(p)}>Add to cart</button>
        </div>
      </div>
      {related.data?.length > 0 && <h3>Related</h3>}
      <div className="grid">
        {related.data?.map((r) => <ProductCard key={r._id} product={r} cart={cart} />)}
      </div>
    </section>
  );
}

export function Cart({ cart, user }) {
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState(null);

  const checkout = async (e) => {
    e.preventDefault();
    try {
      const order = await api('/order', {
        method: 'POST',
        body: { address, items: cart.items.map((i) => ({ product: i._id, count: i.count })) },
      });
      cart.clear();
      setMessage(`Order placed! Total charged: ${money(order.amount)}`);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (cart.items.length === 0) return <p>{message || 'Your cart is empty.'} <a href="#/">Keep shopping</a></p>;
  return (
    <section>
      <h2>Cart</h2>
      <table>
        <tbody>
          {cart.items.map((i) => (
            <tr key={i._id}>
              <td>{i.name}</td>
              <td><input type="number" min="0" value={i.count} onChange={(e) => cart.setCount(i._id, Number(e.target.value))} /></td>
              <td>{money(i.price * i.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Total: {money(cart.total)}</strong></p>
      {user ? (
        <form onSubmit={checkout} className="stack">
          <label>Shipping address <textarea required value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <button>Place order</button>
        </form>
      ) : <p><a href="#/signin">Sign in</a> to check out.</p>}
      {message && <p className="error">{message}</p>}
    </section>
  );
}

export function Auth({ mode, onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'signup') await api('/signup', { method: 'POST', body: form });
      const s = await api('/signin', { method: 'POST', body: { email: form.email, password: form.password } });
      session.set(s);
      onLogin(s);
      go('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="stack narrow">
      <h2>{mode === 'signup' ? 'Create account' : 'Sign in'}</h2>
      {mode === 'signup' && <label>Name <input required value={form.name} onChange={set('name')} /></label>}
      <label>Email <input type="email" required value={form.email} onChange={set('email')} /></label>
      <label>Password <input type="password" required minLength={6} value={form.password} onChange={set('password')} /></label>
      <button>{mode === 'signup' ? 'Sign up' : 'Sign in'}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export function Account() {
  const orders = useFetch('/user/me/orders');
  return (
    <section>
      <h2>Your orders</h2>
      {orders.data?.length === 0 && <p className="muted">No orders yet.</p>}
      <ul>
        {orders.data?.map((o) => (
          <li key={o._id}>
            {new Date(o.createdAt).toLocaleDateString()} · {o.products.map((p) => `${p.name} ×${p.count}`).join(', ')} · {money(o.amount)} · <em>{o.status}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Admin() {
  const [tick, setTick] = useState(0);
  const categories = useFetch('/categories', [tick]);
  const orders = useFetch('/orders', [tick]);
  const statuses = useFetch('/orders/status-values');
  const [catName, setCatName] = useState('');
  const [product, setProduct] = useState({ name: '', description: '', price: '', quantity: '', category: '', imageUrl: '' });
  const [message, setMessage] = useState(null);
  const refresh = () => setTick((t) => t + 1);

  const run = (fn) => async (e) => {
    e?.preventDefault();
    try {
      await fn();
      setMessage('Saved.');
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const setP = (k) => (e) => setProduct({ ...product, [k]: e.target.value });

  return (
    <section className="admin">
      <h2>Admin</h2>
      {message && <p className="muted">{message}</p>}
      <form className="stack narrow" onSubmit={run(async () => {
        await api('/category', { method: 'POST', body: { name: catName } });
        setCatName('');
      })}>
        <h3>New category</h3>
        <input required placeholder="Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
        <button>Create category</button>
      </form>

      <form className="stack narrow" onSubmit={run(async () => {
        await api('/product', {
          method: 'POST',
          body: { ...product, price: Number(product.price), quantity: Number(product.quantity) },
        });
        setProduct({ name: '', description: '', price: '', quantity: '', category: '', imageUrl: '' });
      })}>
        <h3>New product</h3>
        <input required placeholder="Name" value={product.name} onChange={setP('name')} />
        <textarea required placeholder="Description" value={product.description} onChange={setP('description')} />
        <input required type="number" step="0.01" min="0" placeholder="Price" value={product.price} onChange={setP('price')} />
        <input required type="number" min="0" placeholder="Quantity" value={product.quantity} onChange={setP('quantity')} />
        <input placeholder="Image URL" value={product.imageUrl} onChange={setP('imageUrl')} />
        <select required value={product.category} onChange={setP('category')}>
          <option value="">Category…</option>
          {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button>Create product</button>
      </form>

      <h3>Orders</h3>
      {orders.error && <p className="error">{orders.error}</p>}
      <table>
        <tbody>
          {orders.data?.map((o) => (
            <tr key={o._id}>
              <td>{o.user?.email}</td>
              <td>{o.products.map((p) => `${p.name} ×${p.count}`).join(', ')}</td>
              <td>{money(o.amount)}</td>
              <td>
                <select value={o.status} onChange={(e) => run(() =>
                  api(`/order/${o._id}/status`, { method: 'PUT', body: { status: e.target.value } }))()}>
                  {statuses.data?.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
