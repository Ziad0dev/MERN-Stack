const BASE = import.meta.env.VITE_API_URL || '/api';

export const session = {
  get: () => {
    try { return JSON.parse(localStorage.getItem('session')); } catch { return null; }
  },
  set: (s) => localStorage.setItem('session', JSON.stringify(s)),
  clear: () => localStorage.removeItem('session'),
};

export async function api(path, { method = 'GET', body } = {}) {
  const token = session.get()?.token;
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
