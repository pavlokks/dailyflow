import React, { useCallback } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const buildBrief = ({ events, tasks, user }) => {
  const openTasks = tasks.filter((task) => !task.completed).length;
  const nextEvent = events[0];

  if (openTasks === 0 && !nextEvent) {
    return `${user?.name || 'Ваш'} AI-помічник бачить спокійний день. Додайте задачу або подію, щоб сформувати фокус.`;
  }

  if (nextEvent) {
    return `AI-фокус: ${openTasks} відкритих задач, найближча подія - "${nextEvent.title}". Почніть із найважливішого пункту до календарного блоку.`;
  }

  return `AI-фокус: ${openTasks} відкритих задач. Оберіть одну ключову справу й закрийте її першою.`;
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
    fallbackError: 'AI-огляд зараз недоступний.',
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
          <h2>AI-огляд</h2>
          <p>Короткий знімок продуктивності</p>
        </div>
        <span>AI</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Готуємо AI-огляд...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <>
          <p className="assistant-brief">{buildBrief(context)}</p>

          <div className="assistant-metrics">
            <div>
              <p>Відкриті задачі</p>
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
