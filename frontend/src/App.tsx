import { useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { Dashboard } from './components/Dashboard';
import { getToken, setToken, getStoredUser, setStoredUser } from './api';
import type { AuthUser } from './types';

export function App() {
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getStoredUser() : null));
  const authed = Boolean(getToken());

  function logout() {
    setToken(null);
    setStoredUser(null);
    setUser(null);
  }

  return (
    <div className="app">
      <header>
        <h1>Inventory &amp; Orders</h1>
        {authed && (
          <button className="link" onClick={logout}>
            {user ? `Sign out (${user.name}${user.role === 'admin' ? ' · admin' : ''})` : 'Sign out'}
          </button>
        )}
      </header>
      <main>
        {authed ? (
          <Dashboard isAdmin={user?.role === 'admin'} />
        ) : (
          <AuthPanel onAuthenticated={(u) => setUser(u)} />
        )}
      </main>
    </div>
  );
}
