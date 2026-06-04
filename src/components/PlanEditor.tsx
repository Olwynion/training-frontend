import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

interface PlanEditorProps {
  plan: {
    id: number;
    name: string;
    days: DayData[];
  };
  onSaved: () => void;
}

interface DayData {
  id: number;
  day_name: string;
  focus_group: number;
  sort_order: number;
  exercises: ExerciseData[];
}

interface ExerciseData {
  id: number;
  exercise_id: number;
  exercise_name: string;
  sets: number;
  sort_order: number;
}

const FOCUS_OPTIONS = [
  { value: 0, label: 'Равномерно' },
  { value: 1, label: 'Грудные' },
  { value: 2, label: 'Спина' },
  { value: 3, label: 'Ноги' },
  { value: 4, label: 'Плечи' },
  { value: 5, label: 'Бицепс' },
  { value: 6, label: 'Трицепс' },
  { value: 7, label: 'Пресс' },
];

export default function PlanEditor({ plan, onSaved }: PlanEditorProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<DayData[]>(plan.days);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExercises, setAllExercises] = useState<Record<number, { name: string; defaultOneRm: number }>>({});
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragDayIdx, setDragDayIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      training.getExercises(user.user_id),
      training.getBuiltInExercises(),
    ]).then(([userRes, builtInRes]) => {
      const map: Record<number, { name: string; defaultOneRm: number }> = {};
      [...(userRes.data || []), ...(builtInRes.data || [])].forEach((ex: any) => {
        map[ex.id] = { name: ex.name, defaultOneRm: ex.default_one_rm ?? 0 };
      });
      setAllExercises(map);
    });
  }, [user]);

  const addDay = () => {
    const newDay: DayData = {
      id: 0,
      day_name: `День ${days.length + 1}`,
      focus_group: 0,
      sort_order: days.length,
      exercises: [],
    };
    setDays([...days, newDay]);
  };

  const updateDay = (idx: number, field: keyof DayData, value: any) => {
    const copy = [...days];
    (copy[idx] as any)[field] = value;
    setDays(copy);
  };

  const removeDay = (idx: number) => {
    setDays(days.filter((_, i) => i !== idx));
  };

  const addExercise = (dayIdx: number) => {
    const copy = [...days];
    copy[dayIdx].exercises.push({
      id: 0,
      exercise_id: 0,
      exercise_name: '',
      sets: 3,
      sort_order: copy[dayIdx].exercises.length,
    });
    setDays(copy);
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof ExerciseData, value: any) => {
    const copy = [...days];
    (copy[dayIdx].exercises[exIdx] as any)[field] = value;
    if (field === 'exercise_id' && value > 0 && allExercises[value]) {
      copy[dayIdx].exercises[exIdx].exercise_name = allExercises[value].name;
    }
    setDays(copy);
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    const copy = [...days];
    copy[dayIdx].exercises = copy[dayIdx].exercises.filter((_, i) => i !== exIdx);
    setDays(copy);
  };

  const updateExerciseOneRm = (exerciseId: number, oneRm: number) => {
    setAllExercises(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], defaultOneRm: oneRm },
    }));
  };

  const handleDragStart = (dayIdx: number, exIdx: number) => {
    setDragDayIdx(dayIdx);
    dragItem.current = exIdx;
  };

  const handleDragOver = (exIdx: number) => {
    dragOverItem.current = exIdx;
  };

  const handleDrop = (dayIdx: number) => {
    if (dragItem.current === null || dragDayIdx === null) return;
    const copy = [...days];
    const exercises = copy[dayIdx].exercises;
    const dragIdx = dragItem.current;
    const dropIdx = dragOverItem.current ?? exercises.length - 1;
    if (dragIdx === dropIdx && dayIdx === dragDayIdx) return;

    if (dayIdx === dragDayIdx) {
      const [removed] = exercises.splice(dragIdx, 1);
      exercises.splice(dropIdx, 0, removed);
      exercises.forEach((ex, i) => (ex.sort_order = i));
    }
    setDays(copy);
    dragItem.current = null;
    dragOverItem.current = null;
    setDragDayIdx(null);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        userId: user.user_id,
        days: days.map((d, di) => ({
          id: d.id,
          dayName: d.day_name,
          focusGroup: d.focus_group,
          sortOrder: di,
          exercises: d.exercises.map((e, ei) => ({
            id: e.id,
            exerciseId: e.exercise_id,
            sets: e.sets,
            sortOrder: ei,
          })),
        })),
      };
      await training.updatePlanDays(plan.id, body);

      const oneRmEntries = days.flatMap(d =>
        d.exercises
          .filter(e => e.exercise_id > 0 && e.exercise_id in allExercises)
          .map(e => ({ exerciseId: e.exercise_id, oneRm: allExercises[e.exercise_id].defaultOneRm }))
      );
      if (oneRmEntries.length > 0) {
        await training.saveOneRm({ userId: user.user_id, entries: oneRmEntries });
      }

      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || 'Ошибка сохранения';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {days.map((day, di) => (
        <div key={di} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <input value={day.day_name} onChange={(e) => updateDay(di, 'day_name', e.target.value)}
              className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]" />
            <select value={day.focus_group} onChange={(e) => updateDay(di, 'focus_group', Number(e.target.value))}
              className="px-2 py-2 border border-[var(--color-border)] rounded-lg text-sm">
              {FOCUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => removeDay(di)} className="px-2 py-2 text-sm text-[var(--color-error)] bg-red-50 rounded-lg cursor-pointer border-none">
              ✕
            </button>
          </div>

          <div className="space-y-1">
            {day.exercises.map((ex, ei) => (
              <div
                key={ei}
                draggable
                onDragStart={() => handleDragStart(di, ei)}
                onDragOver={() => handleDragOver(ei)}
                onDrop={() => handleDrop(di)}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-grab active:cursor-grabbing"
              >
                <span className="text-sm text-[var(--color-text-secondary)] cursor-grab">⠿</span>
                <span className="flex-1 text-sm truncate">{ex.exercise_name || '(выберите ID)'}</span>
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                  <span>Подх:</span>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(di, ei, 'sets', Number(e.target.value))}
                    className="w-12 px-2 py-1.5 border border-[var(--color-border)] rounded text-sm text-center"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                  <span>1RM:</span>
                  <input
                    type="number"
                    value={allExercises[ex.exercise_id]?.defaultOneRm ?? ''}
                    onChange={(e) => updateExerciseOneRm(ex.exercise_id, Number(e.target.value))}
                    className="w-16 px-2 py-1.5 border border-[var(--color-border)] rounded text-sm text-center"
                  />
                </div>
                <button onClick={() => removeExercise(di, ei)} className="px-2 py-1.5 text-xs text-[var(--color-error)] bg-red-50 rounded cursor-pointer border-none">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => addExercise(di)} className="mt-2 w-full py-2 text-sm text-[var(--color-primary)] bg-blue-50 rounded-lg cursor-pointer border-none">
            + Добавить упражнение
          </button>
        </div>
      ))}

      <button onClick={addDay} className="w-full py-3 text-sm text-[var(--color-primary)] bg-blue-50 rounded-xl cursor-pointer border-none">
        + Добавить день
      </button>

      {error && <p className="text-sm text-[var(--color-error)] bg-red-50 p-3 rounded-lg">{error}</p>}

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 border-none">
        {saving ? 'Сохранение...' : 'Сохранить план'}
      </button>
    </div>
  );
}
