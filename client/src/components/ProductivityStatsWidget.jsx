import React, { useCallback, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const isToday = (date) => {
  if (!date) {
    return false;
  }

  const eventDate = new Date(date);
  const today = new Date();

  return (
    eventDate.getFullYear() === today.getFullYear() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getDate() === today.getDate()
  );
};

const ProductivityStatsWidget = () => {
  const loadStatsContext = useCallback(async () => {
    const [tasksResponse, eventsResponse] = await Promise.all([
      api.get('/tasks'),
      api.get('/events'),
    ]);

    return [
      {
        events: eventsResponse.data,
        tasks: tasksResponse.data,
      },
    ];
  }, []);

  const { error, isLoading, items, refresh } = useAsyncList({
    fallbackError: 'Статистика зараз недоступна.',
    loadItems: loadStatsContext,
  });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => {
      window.removeEventListener('dailyflow:tasks-updated', refresh);
    };
  }, [refresh]);

  const context = items[0];
  const totalTasks = context?.tasks.length || 0;
  const completedTasks = context?.tasks.filter((task) => task.completed).length || 0;
  const highPriorityTasks = context?.tasks.filter((task) => task.priority === 'high').length || 0;
  const todayEvents = context?.events.filter((event) => isToday(event.date)).length || 0;
  const completionProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <article className='dashboard-card productivity-stats-card'>
      <div className='card-heading'>
        <div>
          <h2>
            <BarChart3 size={18} /> Статистика
          </h2>
          <p>Прогрес задач і подій.</p>
        </div>
        <span>{completionProgress}%</span>
      </div>

      {isLoading ? (
        <ModuleState tone='loading'>Рахуємо...</ModuleState>
      ) : error ? (
        <ModuleState tone='error'>{error}</ModuleState>
      ) : (
        <>
          <div className='stats-grid'>
            <div>
              <p>Задачі</p>
              <strong>{totalTasks}</strong>
            </div>
            <div>
              <p>Виконано</p>
              <strong>{completedTasks}</strong>
            </div>
            <div>
              <p>Високий пріоритет</p>
              <strong>{highPriorityTasks}</strong>
            </div>
            <div>
              <p>Події сьогодні</p>
              <strong>{todayEvents}</strong>
            </div>
          </div>

          <div className='task-progress'>
            <div>
              <span>Прогрес</span>
              <strong>{completionProgress}%</strong>
            </div>
            <div className='progress-track' aria-label='Прогрес виконання задач'>
              <span style={{ width: `${completionProgress}%` }} />
            </div>
          </div>
        </>
      )}
    </article>
  );
};

export default ProductivityStatsWidget;
