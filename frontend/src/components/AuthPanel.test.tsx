import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthPanel } from './AuthPanel';
import { api } from '../api';

vi.mock('../api', () => ({
  api: { login: vi.fn(), register: vi.fn() },
  setToken: vi.fn(),
  setStoredUser: vi.fn(),
}));

describe('AuthPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders sign-in by default and toggles to register', async () => {
    render(<AuthPanel onAuthenticated={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('submits login and calls onAuthenticated with the user', async () => {
    const user = { id: '1', name: 'Ada', email: 'ada@example.com', role: 'user' as const };
    vi.mocked(api.login).mockResolvedValue({ token: 'tok', user });
    const onAuth = vi.fn();

    render(<AuthPanel onAuthenticated={onAuth} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(onAuth).toHaveBeenCalledWith(user));
    expect(api.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123' });
  });

  it('shows the server error message when login fails', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid email or password'));

    render(<AuthPanel onAuthenticated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
