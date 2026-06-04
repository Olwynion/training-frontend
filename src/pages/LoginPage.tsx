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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f5f5'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff', padding: 32, borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 360
      }}>
        <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Вход</h2>
        {error && <p style={{ color: '#e63946', marginBottom: 12 }}>{error}</p>}
        <input
          placeholder="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 4 }}
        />
        <input
          placeholder="Пароль" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 4 }}
        />
        <button type="submit" style={{
          width: '100%', padding: 10, background: '#1a1a2e', color: '#fff',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold'
        }}>
          Войти
        </button>
        <p style={{ marginTop: 12, textAlign: 'center', color: '#666' }}>
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </form>
    </div>
  );
}
