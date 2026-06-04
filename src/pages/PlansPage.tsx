import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

interface Plan {
  id: number;
  name: string;
  cycle_number: number;
  progress_counter: number;
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
      <h1>Тренировочные планы</h1>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 24 }}>
        <input placeholder="Название плана" value={name} onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, flex: 1 }} />
        <button type="submit" style={{ padding: '8px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Создать
        </button>
      </form>
      <div style={{ display: 'grid', gap: 8 }}>
        {plans.map((p) => (
          <div key={p.id} style={{ background: '#fff', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/plans/${p.id}`} style={{ textDecoration: 'none', color: '#1a1a2e' }}>
              <strong>{p.name}</strong> — цикл {p.cycle_number}/4, прогресс: {p.progress_counter}
            </Link>
            <button onClick={() => remove(p.id)} style={{ background: '#e63946', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
