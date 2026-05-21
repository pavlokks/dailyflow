import React, { useCallback, useEffect, useState } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const priorityLabels = {
  high: 'Високий',
  low: 'Низький',
  medium: 'Середній'
};

const priorityOrder = {
  high: 1,
  medium: 2,
  low: 3
};

const initialTaskForm = {
  deadline: '',
  description: '',
  priority: 'medium',
  title: ''
};

const formatDeadline = (deadline) => {
  if (!deadline) {
    return 'Без дедлайну';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(deadline));
};

const sortTasks = (tasks) => {
  return [...tasks].sort((firstTask, secondTask) => {
    if (firstTask.completed !== secondTask.completed) {
      return firstTask.completed ? 1 : -1;
    }

    const priorityDifference =
      priorityOrder[firstTask.priority || 'medium'] -
      priorityOrder[secondTask.priority || 'medium'];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const firstDeadline = firstTask.deadline
      ? new Date(firstTask.deadline).getTime()
      : Number.MAX_SAFE_INTEGER;
    const secondDeadline = secondTask.deadline
      ? new Date(secondTask.deadline).getTime()
      : Number.MAX_SAFE_INTEGER;

    return firstDeadline - secondDeadline;
  });
};

const notifyTasksUpdated = () => {
  window.dispatchEvent(new Event('dailyflow:tasks-updated'));
};

const TasksModule = () => {
  const [formData, setFormData] = useState(initialTaskForm);
  const [isCreating, setIsCreating] = useState(false);

  const loadTasks = useCallback(async () => {
    const { data } = await api.get('/tasks');
    return data;
  }, []);

  const { error, isLoading, items: tasks, refresh, setError, setItems: setTasks } =
    useAsyncList({
      fallbackError: 'Не вдалося завантажити задачі. Спробуйте ще раз.',
      loadItems: loadTasks
    });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => {
      window.removeEventListener('dailyflow:tasks-updated', refresh);
    };
  }, [refresh]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const { data } = await api.post('/tasks', {
        deadline: formData.deadline || null,
        description: formData.description.trim(),
        priority: formData.priority,
        title: trimmedTitle
      });

      setTasks((currentTasks) => sortTasks([data, ...currentTasks]));
      setFormData(initialTaskForm);
      notifyTasksUpdated();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося додати задачу. Спробуйте ще раз.')
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      setError('');
      const { data } = await api.put(`/tasks/${task._id}`, {
        completed: !task.completed
      });

      setTasks((currentTasks) =>
        sortTasks(
          currentTasks.map((currentTask) =>
            currentTask._id === data._id ? data : currentTask
          )
        )
      );
      notifyTasksUpdated();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося оновити задачу. Спробуйте ще раз.')
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setError('');
      await api.delete(`/tasks/${taskId}`);
      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask._id !== taskId)
      );
      notifyTasksUpdated();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося видалити задачу. Спробуйте ще раз.')
      );
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const sortedTasks = sortTasks(tasks);

  return (
    <article className="dashboard-card tasks-card">
      <div className="card-heading">
        <div>
          <h2>Задачі</h2>
          <p>Виконано {completedCount} з {tasks.length}</p>
        </div>
        <span>{tasks.length}</span>
      </div>

      <form className="task-form" onSubmit={handleCreateTask}>
        <input
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Додайте задачу"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Опис або нотатки"
          rows="3"
        />
        <div className="task-form-row">
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            aria-label="Пріоритет задачі"
          >
            <option value="low">Низький пріоритет</option>
            <option value="medium">Середній пріоритет</option>
            <option value="high">Високий пріоритет</option>
          </select>
          <input
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            aria-label="Дедлайн задачі"
          />
        </div>
        <button type="submit" disabled={isCreating || !formData.title.trim()}>
          {isCreating ? 'Додаємо...' : 'Додати задачу'}
        </button>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="task-list">
        {isLoading ? (
          <ModuleState tone="loading">Завантажуємо задачі...</ModuleState>
        ) : sortedTasks.length === 0 ? (
          <ModuleState>Задач поки немає. Додайте першу задачу або натисніть Load Demo Data на огляді.</ModuleState>
        ) : (
          sortedTasks.map((task) => {
            const priority = task.priority || 'medium';

            return (
              <div
                className={task.completed ? 'task-item task-item-done' : 'task-item'}
                key={task._id}
              >
                <div className="task-card-main">
                  <div className="task-card-topline">
                    <h3 className={task.completed ? 'task-title done' : 'task-title'}>
                      {task.title}
                    </h3>
                    <span className={`task-priority task-priority-${priority}`}>
                      {priorityLabels[priority]}
                    </span>
                  </div>

                  <p className="task-description">
                    {task.description || 'Опис не додано.'}
                  </p>

                  <div className="task-meta">
                    <span>{formatDeadline(task.deadline)}</span>
                    <span>{task.completed ? 'Виконано' : 'У процесі'}</span>
                  </div>
                </div>

                <div className="task-actions">
                  <label className="task-check">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                    />
                    <span>{task.completed ? 'Готово' : 'Виконати'}</span>
                  </label>
                  <button
                    className="task-delete"
                    type="button"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    Видалити
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
};

export default TasksModule;
