import React, { useCallback, useEffect } from 'react';
import { ListChecks } from 'lucide-react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const buildFallbackSummary = ({ events, tasks, weather }) => {
  const temperature =
    weather?.temperature !== undefined
      ? `${Math.round(weather.temperature) > 0 ? '+' : ''}${Math.round(weather.temperature)}°C`
      : 'без даних про погоду';

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === 'high' && !task.completed
  ).length;

  return {
    advice:
      highPriorityTasks > 0
        ? 'Спочатку варто закрити задачі з високим пріоритетом.'
        : 'Оберіть одну невелику задачу і завершіть її першою.',
    summary: `Сьогодні: ${tasks.length} задач, ${events.length} подій, погода ${temperature}.`
  };
};

const DailySummaryWidget = () => {
  const loadSummaryContext = useCallback(async () => {
    const [tasksResponse, eventsResponse, weatherResponse] = await Promise.allSettled([
      api.get('/tasks'),
      api.get('/events'),
      api.get('/weather')
    ]);

    if (tasksResponse.status === 'rejected' || eventsResponse.status === 'rejected') {
      throw new Error('Не вдалося завантажити контекст дня.');
    }

    const context = {
      events: eventsResponse.value.data,
      tasks: tasksResponse.value.data,
      weather: weatherResponse.status === 'fulfilled' ? weatherResponse.value.data : {}
    };

    try {
      const { data } = await api.post('/ai/daily-summary', context);

      return [
        {
          ...context,
          advice: data.advice,
          summary: data.summary
        }
      ];
    } catch {
      return [
        {
          ...context,
          ...buildFallbackSummary(context)
        }
      ];
    }
  }, []);

  const { error, isLoading, items, refresh } = useAsyncList({
    fallbackError: 'Підсумок дня зараз недоступний.',
    loadItems: loadSummaryContext
  });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => {
      window.removeEventListener('dailyflow:tasks-updated', refresh);
    };
  }, [refresh]);

  const context = items[0];

  return (
    <article className="dashboard-card daily-summary-card">
      <div className="card-heading">
        <div>
          <h2><ListChecks size={18} /> Підсумок дня</h2>
          <p>Задачі, події та коротка порада</p>
        </div>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Формуємо підсумок...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <div className="daily-summary-content">
          <p className="daily-summary-text">{context.summary}</p>
          <p className="daily-summary-advice">{context.advice}</p>
        </div>
      )}
    </article>
  );
};

export default DailySummaryWidget;
