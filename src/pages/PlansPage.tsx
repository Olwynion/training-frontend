import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

interface Plan {
  id: number;
  name: string;
  cycle_number: number;
  progress_counter: number;
  days?: any[];
}

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState('');

  const load = () => {
    if (!user) return;
    training.getPlans(user.user_id).then((res) => setPlans(res.data));
  };

  useEffect(load, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    await training.createPlan({ userId: user.user_id, name: name.trim() });
    setName('');
    load();
  };

  const remove = async (id: number) => {
    if (!user) return;
    await training.deletePlan(id, user.user_id);
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Планы тренировок</h1>

      <form onSubmit={create} className="flex gap-2 mb-4">
        <input placeholder="Название плана" value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]" />
        <button type="submit" className="px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-[var(--color-primary-dark)] transition-colors">
          Создать
        </button>
      </form>

      <div className="space-y-2">
        {plans.map((p) => (
          <div key={p.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <Link to={`/plans/${p.id}`} className="no-underline text-inherit block">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Цикл {p.cycle_number}/4 · Прогресс: {p.progress_counter} · Дней: {p.days?.length || 0}
              </p>
            </Link>
            <button onClick={() => remove(p.id)}
              className="mt-2 text-xs px-3 py-1.5 bg-red-50 text-[var(--color-error)] rounded-lg cursor-pointer border-none">
              Удалить
            </button>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">У вас пока нет планов</p>
            <Link to="/ai-generate" className="inline-block px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium no-underline">
              🤖 Сгенерировать первый план
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
