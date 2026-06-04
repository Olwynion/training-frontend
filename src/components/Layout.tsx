import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/exercises', label: 'Упражнения', icon: '💪' },
  { path: '/plans', label: 'Планы', icon: '📋' },
  { path: '/ai-generate', label: 'AI', icon: '🤖' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="text-lg font-bold text-[var(--color-primary)] no-underline">
          TrainHub
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-secondary)] hidden sm:inline">{user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-[var(--color-error)] bg-transparent border-none cursor-pointer">
            Выйти
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-20 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] flex sm:hidden z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center py-2 text-xs no-underline ${
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-[var(--color-border)] flex-col pt-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 text-sm no-underline ${
                isActive
                  ? 'text-[var(--color-primary)] bg-blue-50 font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="mt-auto px-6 py-4 text-xs text-[var(--color-text-secondary)]">
          {user?.name}
        </div>
      </aside>
    </div>
  );
}
