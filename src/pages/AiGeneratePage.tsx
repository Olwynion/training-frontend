import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiApi, training } from '../api/client';

const MUSCLE_LABELS: Record<number, string> = {
  1: 'Грудные', 2: 'Спина', 3: 'Ноги', 4: 'Плечи', 5: 'Бицепс', 6: 'Трицепс', 7: 'Пресс',
};

const DAY_ABBR: Record<string, string> = {
  'ПН': 'Понедельник', 'ВТ': 'Вторник', 'СР': 'Среда', 'ЧТ': 'Четверг',
  'ПТ': 'Пятница', 'СБ': 'Суббота', 'ВС': 'Воскресенье',
};

const FOCUS_GROUPS_BY_MUSCLE: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
};

export default function AiGeneratePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [builtIn, setBuiltIn] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [programType, setProgramType] = useState('fullbody');
  const [focusGroup, setFocusGroup] = useState(0);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      training.getBuiltInExercises(),
      user ? training.getPreferences(user.user_id).catch(() => null) : null,
    ]).then(([builtInRes, prefs]) => {
      setBuiltIn(builtInRes.data);
      if (prefs?.data) {
        const fg = prefs.data.focusGroup ?? prefs.data.focus_group ?? 0;
        const dpw = prefs.data.daysPerWeek ?? prefs.data.days_per_week ?? 3;
        const pt = prefs.data.programType ?? prefs.data.program_type ?? 'fullbody';
        setFocusGroup(fg);
        setDaysPerWeek(dpw);
        setProgramType(pt);
        setPrefsLoaded(true);
        if (fg > 0) {
          const matching = builtInRes.data
            .filter((e: any) => e.muscle_group === fg)
            .map((e: any) => e.id);
          setSelectedExercises(matching);
        }
      } else {
        setPrefsLoaded(true);
      }
    });
  }, [user]);

  const toggleExercise = (id: number) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedExercises(builtIn.map((e) => e.id));
  };

  const clearAll = () => {
    setSelectedExercises([]);
  };

  const generate = async () => {
    if (!user || !prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const exercises = builtIn
        .filter((e) => selectedExercises.includes(e.id))
        .map((e) => ({
          name: e.name,
          oneRm: e.default_one_rm,
          muscleGroup: e.muscle_group,
        }));

      const body = {
        userId: user.user_id,
        prompt: prompt.trim(),
        exercises,
        daysPerWeek,
        programType,
        focusGroup,
      };
      console.log('AI body:', JSON.stringify(body, null, 2));
      const { data } = await aiApi.generate(body);
      setResult(data);
    } catch (e: any) {
      const msg = e?.response?.data?.title || e?.message || 'Ошибка генерации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async (planName: string) => {
    if (!user || !result) return;
    setError('');
    setLoading(true);
    try {
      const planJson = JSON.parse(result.plan_json);
      const { data: plan } = await training.createPlan({ userId: user.user_id, name: planName });

      if (planJson.days?.length) {
        const allExercises = planJson.days.flatMap((d: any) => d.exercises || []);
        const uniqueNames = [...new Set(allExercises.map((e: any) => e.name))];

        const [builtIn, userEx] = await Promise.all([
          training.getBuiltInExercises(),
          training.getExercises(user.user_id),
        ]);
        const existing = [...(builtIn.data || []), ...(userEx.data || [])];

        const exerciseMap: Record<string, number> = {};
        for (const name of uniqueNames) {
          const match = existing.find((e: any) => e.name === name);
          if (match) {
            exerciseMap[name] = match.id;
          } else {
            try {
              const inputEx = allExercises.find((e: any) => e.name === name);
              const defaultOneRm = inputEx?.oneRm ?? inputEx?.one_rm ?? 0;
              const muscleGroup = inputEx?.muscleGroup ?? inputEx?.muscle_group ?? 1;
              const { data: ex } = await training.createExercise({
                userId: user.user_id, name,
                defaultOneRm, muscleGroup,
              });
              exerciseMap[name] = ex.id;
            } catch {
              exerciseMap[name] = 0;
            }
          }
        }

        const days = planJson.days.map((d: any, di: number) => {
          const abbr = (d.day || '').split(' ')[0].toUpperCase();
          const dayName = DAY_ABBR[abbr] || d.day;
          return {
            id: 0,
            dayName,
            focusGroup: focusGroup || 0,
            sortOrder: di,
            exercises: (d.exercises || []).map((e: any, ei: number) => ({
              id: 0,
              exerciseId: exerciseMap[e.name] ?? 0,
              sets: e.sets ?? 3,
              sortOrder: ei,
            })),
          };
        });

        await training.updatePlanDays(plan.id, { userId: user.user_id, days });
      }

      navigate(`/plans/${plan.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.title || e?.message || 'Ошибка при создании плана');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await aiApi.history(user.user_id);
    setHistory(data);
    setShowHistory(!showHistory);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">AI генерация плана</h1>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Выберите упражнения для генерации:</p>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer border-none">Все</button>
            <button onClick={clearAll} className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer border-none">Сброс</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {builtIn.map((ex: any) => (
            <button
              key={ex.id}
              onClick={() => toggleExercise(ex.id)}
              className={`px-3 py-1.5 rounded-full text-xs cursor-pointer border border-[var(--color-border)] ${
                selectedExercises.includes(ex.id)
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white text-[var(--color-text-secondary)]'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Опишите вашу цель, уровень подготовки, предпочтения..."
        value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4}
        className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm outline-none focus:border-[var(--color-primary)] mb-3"
      />

      <button onClick={generate} disabled={loading || !prompt.trim()}
        className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 hover:bg-[var(--color-primary-dark)] transition-colors border-none mb-4">
        {loading ? 'Генерация...' : 'Сгенерировать план'}
      </button>

      {error && <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-green-800">План создан: {result.plan_name}</p>
          <button onClick={() => applyPlan(result.plan_name)}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm cursor-pointer border-none">
            Перейти к плану
          </button>
        </div>
      )}

      <div>
        <button onClick={loadHistory} className="text-sm text-[var(--color-text-secondary)] bg-transparent border-none cursor-pointer">
          {showHistory ? 'Скрыть' : 'Показать'} историю генераций
        </button>
        {showHistory && history.length > 0 && (
          <div className="mt-3 space-y-2">
            {history.map((h: any, i: number) => (
              <div key={h.id || i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3">
                <p className="text-xs font-medium">{h.plan_name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{h.prompt}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{h.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
