import React, { useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const buildBrief = ({ events, tasks, user }) => {
  const openTasks = tasks.filter((task) => !task.completed).length;
  const nextEvent = events[0];
  const name = user?.name || 'У вас';

  if (openTasks === 0 && !nextEvent) {
    return `${name} сьогодні спокійний день. Додайте задачу або подію, коли з'явиться план.`;
  }

  if (nextEvent) {
    return `${openTasks} відкритих задач. Найближча подія: "${nextEvent.title}".`;
  }

  return `${openTasks} відкритих задач. Оберіть одну головну і почніть з неї.`;
};

const AssistantBrief = () => {
  const loadAssistantContext = useCallback(async () => {
    const [profileResponse, tasksResponse, eventsResponse] = await Promise.all([
      api.get('/auth/me'),
      api.get('/tasks'),
      api.get('/events')
    ]);

    return [
      {
        events: eventsResponse.data,
        tasks: tasksResponse.data,
        user: profileResponse.data.user
      }
    ];
  }, []);

  const { error, isLoading, items } = useAsyncList({
    fallbackError: 'Огляд зараз недоступний.',
    loadItems: loadAssistantContext
  });

  const context = items[0];
  const completedTasks =
    context?.tasks.filter((task) => task.completed).length || 0;
  const openTasks = context?.tasks.length - completedTasks || 0;

  return (
    <article className="dashboard-card assistant-card">
      <div className="card-heading">
        <div>
          <h2><ClipboardList size={18} /> Огляд</h2>
          <p>Поточний стан дня</p>
        </div>
        <span>{openTasks}</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо огляд...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <>
          <p className="assistant-brief">{buildBrief(context)}</p>

          <div className="assistant-metrics">
            <div>
              <p>Відкриті</p>
              <strong>{openTasks}</strong>
            </div>
            <div>
              <p>Виконано</p>
              <strong>{completedTasks}</strong>
            </div>
            <div>
              <p>Події</p>
              <strong>{context.events.length}</strong>
            </div>
          </div>
        </>
      )}
    </article>
  );
};

export default AssistantBrief;
