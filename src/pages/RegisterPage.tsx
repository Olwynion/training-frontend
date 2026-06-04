import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, name);
      window.location.href = '/onboarding';
    } catch {
      setError('Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
        <h2 className="text-2xl font-bold text-center mb-2">TrainHub</h2>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">Создайте аккаунт</p>

        {error && <p className="text-sm text-[var(--color-error)] mb-4 text-center">{error}</p>}

        <input
          placeholder="Имя" value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 mb-3 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]"
        />
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
          Зарегистрироваться
        </button>

        <p className="mt-4 text-sm text-center text-[var(--color-text-secondary)]">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-[var(--color-primary)] no-underline">Войти</Link>
        </p>
      </form>
    </div>
  );
}
