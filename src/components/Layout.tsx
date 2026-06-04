import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{
        background: '#1a1a2e', color: '#fff', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 24
      }}>
        <Link to="/" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>
          Training Platform
        </Link>
        <Link to="/exercises" style={{ color: '#ccc', textDecoration: 'none' }}>Упражнения</Link>
        <Link to="/plans" style={{ color: '#ccc', textDecoration: 'none' }}>Планы</Link>
        <Link to="/ai-generate" style={{ color: '#ccc', textDecoration: 'none' }}>AI генерация</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{user?.name}</span>
          <button onClick={handleLogout} style={{
            background: '#e63946', color: '#fff', border: 'none',
            padding: '6px 14px', borderRadius: 4, cursor: 'pointer'
          }}>
            Выйти
          </button>
        </div>
      </nav>
      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
