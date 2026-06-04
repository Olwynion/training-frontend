import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
        <h2 className="text-2xl font-bold text-center mb-2">TrainHub</h2>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">Войдите в свой аккаунт</p>

        {error && <p className="text-sm text-[var(--color-error)] mb-4 text-center">{error}</p>}

        <input
          placeholder="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 mb-3 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <input
          placeholder="Пароль" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 mb-4 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]"
        />

        <button type="submit" className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors">
          Войти
        </button>

        <p className="mt-4 text-sm text-center text-[var(--color-text-secondary)]">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-[var(--color-primary)] no-underline">Регистрация</Link>
        </p>
      </form>
    </div>
  );
}
