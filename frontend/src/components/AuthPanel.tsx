import { useState, type FormEvent } from 'react';
import { api, setToken } from '../api';
import type { AuthUser } from '../types';

interface Props {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthPanel({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ name, email, password });
      setToken(result.token);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth">
      <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : 1}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>
      </form>
      <p className="switch">
        {mode === 'login' ? "No account?" : 'Have an account?'}{' '}
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          {mode === 'login' ? 'Register' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
