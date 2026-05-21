import React, { useCallback, useEffect } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const buildRecommendation = (tasks) => {
  const highPriorityOpenTasks = tasks.filter(
    (task) => task.priority === 'high' && !task.completed
  ).length;

  if (highPriorityOpenTasks > 0) {
    return 'Рекомендується спочатку виконати задачі з високим пріоритетом.';
  }

  const openTasks = tasks.filter((task) => !task.completed).length;

  if (openTasks > 0) {
    return 'Рекомендується обрати одну відкриту задачу і завершити її першою.';
  }

  return 'На сьогодні задачі закриті. Можна переглянути події або запланувати наступний фокус.';
};

const buildSummary = ({ events, tasks, weather }) => {
  const temperature =
    weather?.temperature !== undefined
      ? `${Math.round(weather.temperature) > 0 ? '+' : ''}${Math.round(weather.temperature)}°C`
      : 'без даних про погоду';

  return `Сьогодні у вас ${tasks.length} задачі, ${events.length} події і погода ${temperature}. ${buildRecommendation(tasks)}`;
};

const DailySummaryWidget = () => {
  const loadSummaryContext = useCallback(async () => {
    const [tasksResponse, eventsResponse, weatherResponse] = await Promise.allSettled([
      api.get('/tasks'),
      api.get('/events'),
      api.get('/weather')
    ]);

    if (tasksResponse.status === 'rejected' || eventsResponse.status === 'rejected') {
      throw new Error('Could not load daily summary context.');
    }

    return [
      {
        events: eventsResponse.value.data,
        tasks: tasksResponse.value.data,
        weather:
          weatherResponse.status === 'fulfilled' ? weatherResponse.value.data : null
      }
    ];
  }, []);

  const { error, isLoading, items, refresh } = useAsyncList({
    fallbackError: 'Daily summary is unavailable right now.',
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
          <h2>AI Daily Summary</h2>
          <p>Short overview of your day</p>
        </div>
        <span>AI</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Building your daily summary...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <p className="daily-summary-text">{buildSummary(context)}</p>
      )}
    </article>
  );
};

export default DailySummaryWidget;
