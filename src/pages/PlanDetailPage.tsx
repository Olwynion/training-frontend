import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';
import PlanEditor from '../components/PlanEditor';

interface Plan {
  id: number;
  name: string;
  cycle_number: number;
  progress_counter: number;
  days: Day[];
}

interface Day {
  id: number;
  day_name: string;
  focus_group: number;
  sort_order: number;
  exercises: ExerciseItem[];
}

interface ExerciseItem {
  id: number;
  exercise_id: number;
  exercise_name: string;
  sets: number;
  sort_order: number;
}

const FOCUS_LABELS: Record<number, string> = {
  0: 'Равномерно', 1: 'Грудные', 2: 'Спина', 3: 'Ноги', 4: 'Плечи', 5: 'Бицепс', 6: 'Трицепс', 7: 'Пресс',
};

export default function PlanDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [cycleData, setCycleData] = useState<any[] | null>(null);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [tab, setTab] = useState<'view' | 'edit'>('view');

  const load = useCallback(() => {
    if (!user || !id) return;
    training.getPlan(Number(id), user.user_id).then((res) => {
      setPlan(res.data);
      setCycleNumber(res.data.cycle_number);
      training.getCycle(Number(id), user.user_id).then((c) => {
        console.log('Cycle response:', JSON.stringify(c.data, null, 2));
        setCycleData(c.data.days);
      });
    });
  }, [user, id]);

  useEffect(load, [load]);

  const changeCycle = async () => {
    if (!user || !id) return;
    await training.setCycle(Number(id), { cycleNumber, userId: user.user_id });
    const c = await training.getCycle(Number(id), user.user_id);
    setCycleData(c.data.days);
  };

  const incrementProgress = async () => {
    if (!user || !id) return;
    await training.incrementProgress(Number(id), user.user_id);
    const p = await training.getPlan(Number(id), user.user_id);
    setPlan(p.data);
  };

  if (!plan) return <p className="text-sm text-[var(--color-text-secondary)] p-4">Загрузка...</p>;

  return (
    <div>
      <button onClick={() => navigate('/plans')} className="text-sm text-[var(--color-text-secondary)] bg-transparent border-none cursor-pointer mb-4 flex items-center gap-1">
        ← Назад к планам
      </button>

      <h1 className="text-xl font-bold mb-4">{plan.name}</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('view')}
          className={`px-4 py-2 rounded-lg text-sm cursor-pointer border-none ${tab === 'view' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100'}`}>
          Просмотр
        </button>
        <button onClick={() => setTab('edit')}
          className={`px-4 py-2 rounded-lg text-sm cursor-pointer border-none ${tab === 'edit' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100'}`}>
          Редактор
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Цикл</p>
          <div className="flex items-center gap-2 mt-1">
            <select value={cycleNumber} onChange={(e) => setCycleNumber(Number(e.target.value))}
              className="px-2 py-1 border border-[var(--color-border)] rounded text-sm">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={changeCycle} className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs cursor-pointer border-none">
              Применить
            </button>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Прогресс</p>
          <p className="text-lg font-bold">{plan.progress_counter}</p>
          <button onClick={incrementProgress} className="mt-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer border-none">
            +1
          </button>
        </div>
      </div>

      {tab === 'edit' ? (
        <PlanEditor plan={plan} onSaved={load} />
      ) : cycleData && cycleData.length > 0 ? (
        <div className="space-y-3">
          {cycleData.map((day: any, i: number) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="font-semibold text-sm mb-2">{day.day_label} — {FOCUS_LABELS[day.focus_group as number] || day.focus_group}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[var(--color-text-secondary)]">
                      <th className="text-left py-1 pr-2">Упражнение</th>
                      <th className="text-right px-2">1RM</th>
                      <th className="text-right px-2">Подх.</th>
                      <th className="text-right px-2">Повт.</th>
                      <th className="text-right px-2">Вес</th>
                      <th className="text-right pl-2">Фокус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.sets.map((s: any, j: number) => (
                      <tr key={j} className="border-t border-[var(--color-border)]">
                        <td className="py-2 pr-2 font-medium">{s.exercise_name}</td>
                        <td className="text-right px-2">{s.one_rm}</td>
                        <td className="text-right px-2">{s.sets}</td>
                        <td className="text-right px-2">{s.reps}</td>
                        <td className="text-right px-2">{s.working_weight} кг</td>
                        <td className="text-right pl-2">{s.is_focus ? '★' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">Нет данных. Создайте план через AI генерацию.</p>
      )}
    </div>
  );
}
