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
  const [inputExercises, setInputExercises] = useState<any[]>([]);
  const [idMap, setIdMap] = useState<Record<number, number>>({});
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
        } else {
          setSelectedExercises(builtInRes.data.map((e: any) => e.id));
        }
      } else {
        setPrefsLoaded(true);
        setSelectedExercises(builtInRes.data.map((e: any) => e.id));
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
      let rawEx = builtIn
        .filter((e) => selectedExercises.includes(e.id))
        .map((e: any) => ({
          dbId: e.id, name: e.name, oneRm: e.default_one_rm, muscleGroup: e.muscle_group,
        }));
      if (!rawEx.length) rawEx = builtIn.map((e: any) => ({
        dbId: e.id, name: e.name, oneRm: e.default_one_rm, muscleGroup: e.muscle_group,
      }));
      const mapping: Record<number, number> = {};
      const exercises = rawEx.map((e: any, i: number) => {
        const seqId = i + 1;
        mapping[seqId] = e.dbId;
        return { id: seqId, name: e.name, oneRm: e.oneRm, muscleGroup: e.muscleGroup };
      });
      setIdMap(mapping);
      setInputExercises(exercises);

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
      console.log('AI response:', result.plan_json);
      const planJson = JSON.parse(result.plan_json);

      if (planJson.days) {
        for (const d of planJson.days) {
          d.exercises = d.exercises || d.упражнения || [];
        }
      }

      const { data: plan } = await training.createPlan({ userId: user.user_id, name: planName });

      const daysWithExercises = (planJson.days || []).filter((d: any) => d.exercises.length > 0);
      const emptyDays = (planJson.days || []).filter((d: any) => !d.exercises.length);

      if (emptyDays.length > 0) {
        setError(`Внимание: ${emptyDays.length} день(дня) не содержат упражнений. Они будут пропущены.`);
      }

      if (daysWithExercises.length) {
        let exList = inputExercises;
        if (!exList.length) {
          const [builtIn, userEx] = await Promise.all([
            training.getBuiltInExercises(),
            training.getExercises(user.user_id),
          ]);
          exList = [...(builtIn.data || []), ...(userEx.data || [])].map((e: any) => ({
            id: e.id, name: e.name, oneRm: e.default_one_rm, muscleGroup: e.muscle_group,
          }));
        }
        const exercisedById: Record<number, any> = {};
        for (const ex of exList) exercisedById[idMap[ex.id] || ex.id] = ex;

        const days = daysWithExercises.map((d: any, di: number) => {
          const abbr = (d.day || '').split(' ')[0].toUpperCase();
          const dayName = DAY_ABBR[abbr] || d.day;
          const dayFocus = d.focus != null ? d.focus : (focusGroup || 0);
          return {
            id: 0,
            dayName,
            focusGroup: dayFocus,
            sortOrder: di,
            exercises: d.exercises.map((e: any, ei: number) => {
              const maxId = Object.keys(idMap).length;
              const seqId = e.id > 0 && e.id <= maxId ? e.id : 0;
              const dbId = idMap[seqId] || 0;
              const exData = exercisedById[dbId] || exList.find((x: any) => x.name === e.name);
              return {
                id: 0,
                exerciseId: dbId,
                exerciseName: exData?.name || 'Unknown',
                sets: e.sets ?? 3,
                sortOrder: ei,
              };
            }).filter((ex: any) => ex.exerciseName !== 'Unknown'),
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
