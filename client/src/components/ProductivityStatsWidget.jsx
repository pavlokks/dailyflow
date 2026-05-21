import React, { useCallback, useEffect } from 'react';
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
      api.get('/events')
    ]);

    return [
      {
        events: eventsResponse.data,
        tasks: tasksResponse.data
      }
    ];
  }, []);

  const { error, isLoading, items, refresh } = useAsyncList({
    fallbackError: 'Productivity statistics are unavailable right now.',
    loadItems: loadStatsContext
  });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => {
      window.removeEventListener('dailyflow:tasks-updated', refresh);
    };
  }, [refresh]);

  const context = items[0];
  const totalTasks = context?.tasks.length || 0;
  const completedTasks =
    context?.tasks.filter((task) => task.completed).length || 0;
  const highPriorityTasks =
    context?.tasks.filter((task) => task.priority === 'high').length || 0;
  const todayEvents =
    context?.events.filter((event) => isToday(event.date)).length || 0;
  const completionProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <article className="dashboard-card productivity-stats-card">
      <div className="card-heading">
        <div>
          <h2>Productivity Statistics</h2>
          <p>Task progress and today&apos;s workload</p>
        </div>
        <span>{completionProgress}%</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Calculating productivity stats...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <>
          <div className="stats-grid">
            <div>
              <p>All tasks</p>
              <strong>{totalTasks}</strong>
            </div>
            <div>
              <p>Completed</p>
              <strong>{completedTasks}</strong>
            </div>
            <div>
              <p>High priority</p>
              <strong>{highPriorityTasks}</strong>
            </div>
            <div>
              <p>Today events</p>
              <strong>{todayEvents}</strong>
            </div>
          </div>

          <div className="task-progress">
            <div>
              <span>Task completion</span>
              <strong>{completionProgress}%</strong>
            </div>
            <div className="progress-track" aria-label="Task completion progress">
              <span style={{ width: `${completionProgress}%` }} />
            </div>
          </div>
        </>
      )}
    </article>
  );
};

export default ProductivityStatsWidget;
