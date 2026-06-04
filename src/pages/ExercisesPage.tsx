import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

interface Exercise {
  id: number;
  name: string;
  default_one_rm: number;
  muscle_group: string;
  is_built_in: boolean;
}

const MUSCLE_GROUPS = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'CORE', 'FULL_BODY'];

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [defaultOneRm, setDefaultOneRm] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);

  const load = () => {
    if (!user) return;
    training.getExercises(user.user_id).then((res) => setExercises(res.data));
  };

  useEffect(load, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await training.createExercise({
      name, defaultOneRm: Number(defaultOneRm), muscleGroup, userId: user.user_id,
    });
    setName('');
    setDefaultOneRm('');
    load();
  };

  const remove = async (id: number) => {
    if (!user) return;
    await training.deleteExercise(id, user.user_id);
    load();
  };

  return (
    <div>
      <h1>Упражнения</h1>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 24 }}>
        <input placeholder="Название" value={name} onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, flex: 1 }} />
        <input placeholder="1RM" type="number" value={defaultOneRm} onChange={(e) => setDefaultOneRm(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, width: 80 }} />
        <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }}>
          {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button type="submit" style={{ padding: '8px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Добавить
        </button>
      </form>
      <div style={{ display: 'grid', gap: 8 }}>
        {exercises.map((ex) => (
          <div key={ex.id} style={{ background: '#fff', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{ex.name}</strong> — {ex.muscle_group}, 1RM: {ex.default_one_rm} кг
              {ex.is_built_in && <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>(встроенное)</span>}
            </div>
            {!ex.is_built_in && (
              <button onClick={() => remove(ex.id)} style={{ background: '#e63946', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
