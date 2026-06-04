import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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
  createExercise: (body: { name: string; defaultOneRm: number; muscleGroup: string; userId: string }) =>
    api.post('/training/exercises', body),
  deleteExercise: (id: number, userId: string) =>
    api.delete(`/training/exercises/${id}`, { params: { user_id: userId } }),
  getPlans: (userId: string) =>
    api.get('/training/plans', { params: { user_id: userId } }),
  createPlan: (body: { userId: string; name: string }) =>
    api.post('/training/plans', body),
  getPlan: (id: number, userId: string) =>
    api.get(`/training/plans/${id}`, { params: { user_id: userId } }),
  deletePlan: (id: number, userId: string) =>
    api.delete(`/training/plans/${id}`, { params: { user_id: userId } }),
  getCycle: (planId: number, userId: string) =>
    api.get(`/training/cycle/${planId}`, { params: { user_id: userId } }),
  setCycle: (planId: number, body: { cycleNumber: number; userId: string }) =>
    api.post(`/training/cycle/${planId}`, body),
  incrementProgress: (planId: number, userId: string) =>
    api.post(`/training/progress/${planId}`, { user_id: userId }),
};

export const ai = {
  generate: (body: { userId: string; prompt: string }) =>
    api.post('/ai/generate', body),
  history: (userId: string) =>
    api.get('/ai/history', { params: { user_id: userId } }),
};

export default api;
