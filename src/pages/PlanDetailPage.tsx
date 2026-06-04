import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

interface CycleDay {
  day_label: string;
  focus_group: string;
  sets: {
    exercise_name: string;
    one_rm: number;
    sets: number;
    reps: number;
    working_weight: number;
    is_focus: boolean;
  }[];
}

export default function PlanDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [cycleData, setCycleData] = useState<CycleDay[] | null>(null);
  const [cycleNumber, setCycleNumber] = useState(1);

  useEffect(() => {
    if (!user || !id) return;
    training.getPlan(Number(id), user.user_id).then((res) => {
      setPlan(res.data);
      setCycleNumber(res.data.cycle_number);
      training.getCycle(Number(id), user.user_id).then((c) => setCycleData(c.data.days));
    });
  }, [user, id]);

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

  if (!plan) return <p>Загрузка...</p>;

  return (
    <div>
      <button onClick={() => navigate('/plans')} style={{ marginBottom: 16, background: '#eee', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
        ← Назад к планам
      </button>
      <h1>{plan.name}</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, flex: 1 }}>
          <p>Цикл: {plan.cycle_number}/4</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select value={cycleNumber} onChange={(e) => setCycleNumber(Number(e.target.value))}
              style={{ padding: 6, border: '1px solid #ddd', borderRadius: 4 }}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Цикл {n}</option>)}
            </select>
            <button onClick={changeCycle} style={{ padding: '6px 12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Применить
            </button>
          </div>
        </div>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, flex: 1 }}>
          <p>Прогресс: {plan.progress_counter}</p>
          <button onClick={incrementProgress} style={{ marginTop: 8, padding: '6px 12px', background: '#2a9d8f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            +1 прогресс
          </button>
        </div>
      </div>
      {cycleData && cycleData.length > 0 ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {cycleData.map((day, i) => (
            <div key={i} style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
              <h3>{day.day_label} — {day.focus_group}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={th}>Упражнение</th>
                    <th style={th}>1RM</th>
                    <th style={th}>Подходы</th>
                    <th style={th}>Повторы</th>
                    <th style={th}>Вес</th>
                    <th style={th}>Фокус</th>
                  </tr>
                </thead>
                <tbody>
                  {day.sets.map((s, j) => (
                    <tr key={j}>
                      <td style={td}>{s.exercise_name}</td>
                      <td style={td}>{s.one_rm}</td>
                      <td style={td}>{s.sets}</td>
                      <td style={td}>{s.reps}</td>
                      <td style={td}>{s.working_weight} кг</td>
                      <td style={td}>{s.is_focus ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888' }}>Нет данных цикла. Создайте план через AI генерацию.</p>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' };
const td: React.CSSProperties = { padding: 8, borderBottom: '1px solid #eee' };
