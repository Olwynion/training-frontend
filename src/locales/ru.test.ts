import { describe, it, expect } from 'vitest';
import ru from './ru';

describe('ru locale', () => {
  it('should have app translations', () => {
    expect(ru.app.name).toBe('TrainHub');
    expect(ru.app.loading).toBe('Загрузка...');
    expect(ru.app.save).toBe('Сохранить');
  });

  it('should have navigation translations', () => {
    expect(ru.nav.dashboard).toBe('Главная');
    expect(ru.nav.exercises).toBe('Упражнения');
    expect(ru.nav.plans).toBe('Планы');
  });

  it('should have auth translations', () => {
    expect(ru.auth.login).toBe('Войти');
    expect(ru.auth.register).toBe('Регистрация');
  });

  it('should have onboarding translations', () => {
    expect(ru.onboarding.title).toBe('Настройка программы');
    expect(ru.onboarding.fullbody).toBe('Фулбоди');
    expect(ru.onboarding.split).toBe('Сплит');
  });

  it('should have muscle translations', () => {
    expect(ru.muscle.chest).toBe('Грудные');
    expect(ru.muscle.back).toBe('Спина');
    expect(ru.muscle.legs).toBe('Ноги');
  });

  it('should have all required sections', () => {
    const sections = ['app', 'nav', 'auth', 'onboarding', 'exercise', 'plan', 'muscle', 'ai'];
    sections.forEach(s => {
      expect(ru).toHaveProperty(s);
    });
  });

  it('should have all plan fields', () => {
    const planKeys = ['title', 'create', 'name', 'day', 'addDay', 'addExercise', 'sets', 'cycle', 'progress', 'noPlans', 'generateFirst'];
    planKeys.forEach(k => {
      expect(ru.plan).toHaveProperty(k);
    });
  });

  it('should have all ai fields', () => {
    expect(ru.ai.generate).toBe('Сгенерировать план');
    expect(ru.ai.generating).toBe('Генерация...');
  });
});
