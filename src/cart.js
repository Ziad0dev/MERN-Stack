import { useEffect, useState } from 'react';

const load = () => {
  try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
};

// Cart items: { _id, name, price, count }
export function useCart() {
  const [items, setItems] = useState(load);
  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);

  const add = (product) => setItems((cur) => {
    const found = cur.find((i) => i._id === product._id);
    if (found) return cur.map((i) => (i._id === product._id ? { ...i, count: i.count + 1 } : i));
    return [...cur, { _id: product._id, name: product.name, price: product.price, count: 1 }];
  });
  const setCount = (id, count) => setItems((cur) =>
    count < 1 ? cur.filter((i) => i._id !== id) : cur.map((i) => (i._id === id ? { ...i, count } : i)));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.count, 0);
  const count = items.reduce((s, i) => s + i.count, 0);

  return { items, add, setCount, clear, total, count };
}
