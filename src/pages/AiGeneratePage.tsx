import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ai, training } from '../api/client';

export default function AiGeneratePage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const generate = async () => {
    if (!user || !prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await ai.generate({ userId: user.user_id, prompt: prompt.trim() });
      setResult(data);
    } catch {
      setError('Ошибка генерации. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await ai.history(user.user_id);
    setHistory(data);
    setShowHistory(!showHistory);
  };

  const applyPlan = async (planName: string) => {
    if (!user) return;
    const { data } = await training.createPlan({ userId: user.user_id, name: planName });
    alert(`План "${planName}" создан! ID: ${data.id}`);
  };

  return (
    <div>
      <h1>AI генерация плана</h1>
      <textarea
        placeholder="Опиши свою тренировочную цель, уровень, предпочтения...&#10;Пример: Хочу программу на массу 3 раза в неделю, упор на ноги и спину"
        value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
        style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, marginTop: 12 }}
      />
      <button onClick={generate} disabled={loading} style={{
        marginTop: 12, padding: '10px 20px', background: loading ? '#888' : '#1a1a2e',
        color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer'
      }}>
        {loading ? 'Генерация...' : 'Сгенерировать'}
      </button>
      {error && <p style={{ color: '#e63946', marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 24, background: '#fff', padding: 16, borderRadius: 8 }}>
          <h3>Результат:</h3>
          {result.plan_name && (
            <button onClick={() => applyPlan(result.plan_name)} style={{
              marginTop: 8, padding: '8px 16px', background: '#2a9d8f', color: '#fff',
              border: 'none', borderRadius: 4, cursor: 'pointer'
            }}>
              Создать план "{result.plan_name}"
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <button onClick={loadHistory} style={{
          padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer'
        }}>
          {showHistory ? 'Скрыть' : 'Показать'} историю генераций
        </button>
        {showHistory && history.length > 0 && (
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {history.map((h: any, i: number) => (
              <div key={h.id || i} style={{ background: '#fff', padding: 12, borderRadius: 6 }}>
                <p><strong>Запрос:</strong> {h.prompt}</p>
                <p><strong>План:</strong> {h.plan_name}</p>
                <p style={{ fontSize: 12, color: '#888' }}>{h.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
