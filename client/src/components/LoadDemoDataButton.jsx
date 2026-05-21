import React, { useState } from 'react';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const demoTasks = [
  {
    title: 'Підготувати вступ до презентації',
    description: 'Коротко пояснити ідею DailyFlow та основні модулі.',
    priority: 'high',
    deadline: new Date().toISOString().slice(0, 10)
  },
  {
    title: 'Показати AI Daily Summary',
    description: 'Продемонструвати огляд задач, подій і погоди на панелі.',
    priority: 'high',
    deadline: new Date().toISOString().slice(0, 10)
  },
  {
    title: 'Запустити фокус-режим',
    description: 'Показати Pomodoro-таймер і лічильник фокус-сесій.',
    priority: 'medium',
    deadline: ''
  }
];

const demoEvents = [
  {
    title: 'Захист курсової роботи',
    description: 'Демонстрація DailyFlow як персонального вебпомічника.',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Підсумкові питання',
    description: 'Пояснити MERN-структуру, protected routes і AI fallback logic.',
    date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  }
];

const LoadDemoDataButton = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadDemoData = async () => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);

      await Promise.all([
        ...demoTasks.map((task) => api.post('/tasks', task)),
        ...demoEvents.map((event) => api.post('/events', event))
      ]);

      window.dispatchEvent(new Event('dailyflow:tasks-updated'));
      setSuccess('Демо-дані додано. Можна показувати функціонал.');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Не вдалося додати демо-дані. Спробуйте ще раз.'
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="demo-data-panel">
      <button type="button" onClick={handleLoadDemoData} disabled={isLoading}>
        {isLoading ? 'Додаємо демо...' : 'Завантажити демо-дані'}
      </button>
      {success && <ModuleState tone="success">{success}</ModuleState>}
      {error && <ModuleState tone="error">{error}</ModuleState>}
    </div>
  );
};

export default LoadDemoDataButton;
