import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

interface Exercise {
  id: number;
  name: string;
  default_one_rm: number;
  muscle_group: number;
  is_built_in: boolean;
}

const MUSCLE_LABELS: Record<number, string> = {
  1: 'Грудные', 2: 'Спина', 3: 'Ноги', 4: 'Плечи', 5: 'Бицепс', 6: 'Трицепс', 7: 'Пресс',
};

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');

  const load = () => {
    if (!user) return;
    training.getExercises(user.user_id).then((res) => setExercises(res.data));
  };

  useEffect(load, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!user || !name.trim()) return;
    try {
      const body = { name: name.trim(), defaultOneRm: Number(weight), muscleGroup, userId: user.user_id };
      console.log('Exercises body:', JSON.stringify(body));
      if (editId) {
        await training.updateExercise(editId, body);
        setEditId(null);
      } else {
        await training.createExercise(body);
      }
      setName(''); setWeight(''); setMuscleGroup(1);
      load();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.title || err?.message || 'Ошибка');
    }
  };

  const startEdit = (ex: Exercise) => {
    setEditId(ex.id);
    setName(ex.name);
    setWeight(String(ex.default_one_rm));
    setMuscleGroup(ex.muscle_group);
  };

  const remove = async (id: number) => {
    if (!user) return;
    await training.deleteExercise(id, user.user_id);
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Упражнения</h1>

      <form onSubmit={submit} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4 space-y-3">
        <input placeholder="Название" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]" />
        <div className="flex gap-3">
          <input placeholder="Вес (кг)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]" />
          <select value={muscleGroup} onChange={(e) => setMuscleGroup(Number(e.target.value))}
            className="flex-1 px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]">
            {Object.entries(MUSCLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {submitError && <p className="text-sm text-[var(--color-error)] text-center">{submitError}</p>}
        <div className="flex gap-2">
          <button type="submit" className="flex-1 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors">
            {editId ? 'Сохранить' : 'Добавить'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setName(''); setWeight(''); setMuscleGroup(1); }}
              className="py-2.5 px-4 bg-gray-100 rounded-lg text-sm cursor-pointer">
              Отмена
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{ex.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {MUSCLE_LABELS[ex.muscle_group] || '—'} · {ex.default_one_rm} кг
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(ex)}
                className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer border-none">
                Ред.
              </button>
              <button onClick={() => remove(ex.id)}
                className="text-xs px-3 py-1.5 bg-red-50 text-[var(--color-error)] rounded-lg cursor-pointer border-none">
                Удалить
              </button>
            </div>
          </div>
        ))}
        {exercises.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            У вас пока нет упражнений. Создайте или сгенерируйте план.
          </p>
        )}
      </div>
    </div>
  );
}
