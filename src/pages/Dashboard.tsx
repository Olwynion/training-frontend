import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exercises: 0, plans: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      training.getExercises(user.user_id),
      training.getPlans(user.user_id),
    ]).then(([exRes, plRes]) => {
      setStats({ exercises: exRes.data.length, plans: plRes.data.length });
    }).finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Привет, {user?.name}!</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">Ваша тренировочная программа</p>

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Загрузка...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">Упражнения</p>
              <p className="text-2xl font-bold">{stats.exercises}</p>
            </div>
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">Планы</p>
              <p className="text-2xl font-bold">{stats.plans}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/ai-generate" className="block bg-[var(--color-primary)] text-white rounded-xl p-4 no-underline">
              <p className="font-semibold">🤖 Сгенерировать план</p>
              <p className="text-sm opacity-80 mt-1">AI создаст программу под ваши цели</p>
            </Link>
            <Link to="/exercises" className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 no-underline text-inherit">
              <p className="font-semibold">💪 Упражнения</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{stats.exercises} упражнений</p>
            </Link>
            <Link to="/plans" className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 no-underline text-inherit">
              <p className="font-semibold">📋 Планы</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{stats.plans} планов</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
