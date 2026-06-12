import { useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { Dashboard } from './components/Dashboard';
import { getToken, setToken } from './api';
import type { AuthUser } from './types';

export function App() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));
  const [user, setUser] = useState<AuthUser | null>(null);

  function logout() {
    setToken(null);
    setUser(null);
    setAuthed(false);
  }

  return (
    <div className="app">
      <header>
        <h1>Inventory &amp; Orders</h1>
        {authed && (
          <button className="link" onClick={logout}>
            {user ? `Sign out (${user.name})` : 'Sign out'}
          </button>
        )}
      </header>
      <main>
        {authed ? (
          <Dashboard />
        ) : (
          <AuthPanel
            onAuthenticated={(u) => {
              setUser(u);
              setAuthed(true);
            }}
          />
        )}
      </main>
    </div>
  );
}
