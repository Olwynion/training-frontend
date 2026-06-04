import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { training } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exercises: 0, plans: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      training.getExercises(user.user_id),
      training.getPlans(user.user_id),
    ]).then(([exRes, plRes]) => {
      setStats({
        exercises: exRes.data.length,
        plans: plRes.data.length,
      });
    });
  }, [user]);

  return (
    <div>
      <h1>Добро пожаловать, {user?.name}!</h1>
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <div style={{ flex: 1, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h3>Упражнения</h3>
          <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.exercises}</p>
        </div>
        <div style={{ flex: 1, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h3>Тренировочные планы</h3>
          <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.plans}</p>
        </div>
      </div>
    </div>
  );
}
