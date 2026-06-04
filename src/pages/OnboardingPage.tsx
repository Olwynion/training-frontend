import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiApi, training } from '../api/client';

const DAY_ABBR: Record<string, string> = {
  'ПН': 'Понедельник', 'ВТ': 'Вторник', 'СР': 'Среда', 'ЧТ': 'Четверг',
  'ПТ': 'Пятница', 'СБ': 'Суббота', 'ВС': 'Воскресенье',
};

const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const PROGRAM_OPTIONS = [
  { value: 'fullbody', label: 'Фулбоди', desc: 'Всё тело за одну тренировку' },
  { value: 'split', label: 'Сплит', desc: 'Разные группы мышц в разные дни' },
];
const FOCUS_OPTIONS = [
  { value: 0, label: 'Равномерно', desc: 'Все группы мышц' },
  { value: 1, label: 'Грудные', desc: 'Акцент на грудь' },
  { value: 2, label: 'Спина', desc: 'Акцент на спину' },
  { value: 3, label: 'Ноги', desc: 'Акцент на ноги' },
  { value: 4, label: 'Плечи', desc: 'Акцент на плечи' },
  { value: 5, label: 'Бицепс', desc: 'Акцент на бицепс' },
  { value: 6, label: 'Трицепс', desc: 'Акцент на трицепс' },
  { value: 7, label: 'Пресс', desc: 'Акцент на пресс' },
];

interface ExerciseOption {
  id: number;
  name: string;
  default_one_rm: number;
  muscle_group: number;
}

const MUSCLE_LABELS: Record<number, string> = {
  1: 'Грудные', 2: 'Спина', 3: 'Ноги', 4: 'Плечи', 5: 'Бицепс', 6: 'Трицепс', 7: 'Пресс',
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [programType, setProgramType] = useState('fullbody');
  const [focusGroup, setFocusGroup] = useState(0);
  const [builtIn, setBuiltIn] = useState<ExerciseOption[]>([]);
  const [oneRms, setOneRms] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    training.getBuiltInExercises().then((res) => setBuiltIn(res.data));
  }, []);

  const handleWeightChange = (id: number, val: string) => {
    setOneRms((prev) => ({ ...prev, [id]: val }));
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await training.savePreferences({
        userId: user.user_id,
        daysPerWeek,
        programType,
        focusGroup,
      });

      const entries = builtIn
        .map((ex) => {
          const val = oneRms[ex.id];
          return {
            exerciseId: ex.id,
            oneRm: val && Number(val) > 0 ? Number(val) : ex.default_one_rm,
          };
        })
        .filter((e) => e.oneRm > 0);

      console.log('=== 1RM entries to save ===', entries);
      if (entries.length > 0) {
        await training.saveOneRm({ userId: user.user_id, entries });
      }

      const builtInRes = await training.getBuiltInExercises();
      const exercises = builtInRes.data.map((e: any) => ({
        name: e.name,
        oneRm: e.default_one_rm,
        muscleGroup: e.muscle_group,
      }));

      const prompt = `Составь программу на ${daysPerWeek} дня в неделю, тип "${programType === 'split' ? 'сплит' : 'фулбоди'}", фокус на ${FOCUS_OPTIONS.find(f => f.value === focusGroup)?.label.toLowerCase() || 'все группы'}. Используй только перечисленные упражнения и их одноповторные максимумы. Ответ строго в JSON формате.`;

      const { data: aiResult } = await aiApi.generate({
        userId: user.user_id,
        prompt,
        exercises,
        daysPerWeek,
        programType,
        focusGroup,
      });

      const planJson = JSON.parse(aiResult.plan_json);
      console.log('=== AI plan_json days ===', JSON.stringify(planJson.days, null, 2));
      const { data: plan } = await training.createPlan({ userId: user.user_id, name: aiResult.plan_name });

      if (planJson.days?.length) {
        const allExes = planJson.days.flatMap((d: any) => d.exercises || []);
        const uniqueNames = [...new Set(allExes.map((e: any) => e.name))];
        const existingEx = [...(builtInRes.data || [])];
        console.log('=== Existing exercises ===', existingEx.map((e: any) => ({ id: e.id, name: e.name, defaultOneRm: e.default_one_rm })));

        const exerciseMap: Record<string, number> = {};
        for (const name of uniqueNames) {
          const match = existingEx.find((e: any) => e.name === name);
          if (match) {
            exerciseMap[name] = match.id;
          } else {
            try {
              const inputEx = allExes.find((e: any) => e.name === name);
              const { data: ex } = await training.createExercise({
                userId: user.user_id, name,
                defaultOneRm: inputEx?.oneRm ?? inputEx?.one_rm ?? 0,
                muscleGroup: inputEx?.muscleGroup ?? inputEx?.muscle_group ?? 1,
              });
              exerciseMap[name] = ex.id;
            } catch {
              exerciseMap[name] = 0;
            }
          }
        }
        console.log('=== exerciseMap ===', exerciseMap);

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
        console.log('=== Days to save ===', JSON.stringify(days, null, 2));

        await training.updatePlanDays(plan.id, { userId: user.user_id, days });
      }

      await training.setCycle(plan.id, { cycleNumber: 1, userId: user.user_id });
      const cycle = await training.getCycle(plan.id, user.user_id);
      console.log('=== Cycle after apply ===', JSON.stringify(cycle.data, null, 2));

      navigate(`/plans/${plan.id}`);
    } catch (e: any) {
      console.error('=== ONBOARDING ERROR ===');
      console.error('Message:', e?.message);
      console.error('Status:', e?.response?.status);
      console.error('StatusText:', e?.response?.statusText);
      console.error('Response data:', JSON.stringify(e?.response?.data, null, 2));
      console.error('Request URL:', e?.config?.url);
      console.error('Request method:', e?.config?.method);
      console.error('Request headers:', e?.config?.headers);
      navigate('/ai-generate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s <= step ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-200 text-[var(--color-text-secondary)]'
            }`}>
              {s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-center mb-6">Сколько дней в неделю тренируетесь?</h2>
            <div className="space-y-3">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  className={`w-full py-4 rounded-xl text-center text-sm font-medium cursor-pointer border ${
                    daysPerWeek === d
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                  }`}
                >
                  {d} дня(ей) в неделю
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-center mb-6">Тип программы</h2>
            <div className="space-y-3">
              {PROGRAM_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProgramType(p.value)}
                  className={`w-full p-4 rounded-xl text-left cursor-pointer border ${
                    programType === p.value
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                  }`}
                >
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-xs opacity-70 mt-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-center mb-6">Фокусная группа мышц</h2>
            <div className="space-y-3">
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFocusGroup(f.value)}
                  className={`w-full p-4 rounded-xl text-left cursor-pointer border ${
                    focusGroup === f.value
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                  }`}
                >
                  <p className="font-medium text-sm">{f.label}</p>
                  <p className="text-xs opacity-70 mt-1">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-center mb-2">Ваши рабочие веса</h2>
            <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">Укажите вес на ~10 повторений для упражнений, которые будете делать</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {builtIn.map((ex) => (
                <div key={ex.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 flex items-center gap-3">
                  <span className="flex-1 text-sm">{ex.name}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] w-16 text-right">{MUSCLE_LABELS[ex.muscle_group]}</span>
                  <input
                    type="number"
                    placeholder="кг"
                    value={oneRms[ex.id] || ''}
                    onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                    className="w-20 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm text-center outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-medium cursor-pointer border-none">
              Назад
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors border-none">
              Далее
            </button>
          ) : (
            <button onClick={finish} disabled={saving}
              className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 hover:bg-[var(--color-primary-dark)] transition-colors border-none">
              {saving ? 'Сохранение...' : '🚀 Сгенерировать план'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
