import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { session } from './api.js';
import { useCart } from './cart.js';
import { useRoute, go } from './useRoute.js';
import { Shop, Product, Cart, Auth, Account, Admin } from './pages.jsx';
import './style.css';

function App() {
  const route = useRoute();
  const [auth, setAuth] = useState(session.get);
  const cart = useCart();
  const user = auth?.user;

  const signOut = () => {
    session.clear();
    setAuth(null);
    go('/');
  };

  const [page, id] = route;
  let view;
  if (page === 'product') view = <Product id={id} cart={cart} />;
  else if (page === 'cart') view = <Cart cart={cart} user={user} />;
  else if (page === 'signin' || page === 'signup') view = <Auth key={page} mode={page} onLogin={setAuth} />;
  else if (page === 'account' && user) view = <Account />;
  else if (page === 'admin' && user?.role === 1) view = <Admin />;
  else view = <Shop cart={cart} />;

  return (
    <>
      <header>
        <a href="#/" className="brand">MERN Shop</a>
        <nav>
          <a href="#/cart">Cart ({cart.count})</a>
          {user?.role === 1 && <a href="#/admin">Admin</a>}
          {user ? (
            <>
              <a href="#/account">{user.name}</a>
              <button className="link" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <a href="#/signin">Sign in</a>
              <a href="#/signup">Sign up</a>
            </>
          )}
        </nav>
      </header>
      <main>{view}</main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
