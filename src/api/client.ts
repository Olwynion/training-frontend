import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (body: { email: string; password: string; name: string }) =>
    api.post('/auth/register', body),
  login: (body: { email: string; password: string }) =>
    api.post('/auth/login', body),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

export const training = {
  getExercises: (userId: string) =>
    api.get('/training/exercises', { params: { user_id: userId } }),
  createExercise: (body: any) =>
    api.post('/training/exercises', body),
  updateExercise: (id: number, body: any) =>
    api.put(`/training/exercises/${id}`, body),
  deleteExercise: (id: number, userId: string) =>
    api.delete(`/training/exercises/${id}`, { params: { user_id: userId } }),
  getBuiltInExercises: () =>
    api.get('/training/exercises/built-in'),
  getPlans: (userId: string) =>
    api.get('/training/plans', { params: { user_id: userId } }),
  createPlan: (body: { userId: string; name: string }) =>
    api.post('/training/plans', body),
  getPlan: (id: number, userId: string) =>
    api.get(`/training/plans/${id}`, { params: { user_id: userId } }),
  deletePlan: (id: number, userId: string) =>
    api.delete(`/training/plans/${id}`, { params: { user_id: userId } }),
  updatePlanDays: (planId: number, body: any) =>
    api.put(`/training/plans/${planId}/days`, body),
  getCycle: (planId: number, userId: string) =>
    api.get(`/training/cycle/${planId}`, { params: { user_id: userId } }),
  setCycle: (planId: number, body: { cycleNumber: number; userId: string }) =>
    api.post(`/training/cycle/${planId}`, body),
  incrementProgress: (planId: number, userId: string) =>
    api.post(`/training/progress/${planId}`, { user_id: userId }),
  savePreferences: (body: any) =>
    api.post('/training/preferences', body),
  getPreferences: (userId: string) =>
    api.get(`/training/preferences/${userId}`),
  getOneRm: (userId: string) =>
    api.get(`/training/one-rm/${userId}`),
  saveOneRm: (body: any) =>
    api.post('/training/one-rm', body),
};

export const aiApi = {
  generate: (body: any) =>
    api.post('/ai/generate', body),
  history: (userId: string) =>
    api.get('/ai/history', { params: { user_id: userId } }),
};

export default api;
