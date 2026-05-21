import React, { useCallback, useEffect, useState } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const priorityLabels = {
  high: 'High',
  low: 'Low',
  medium: 'Medium'
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
    return 'No deadline';
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
      fallbackError: 'AI assistant could not load your tasks. Please try again.',
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
        getApiErrorMessage(requestError, 'Could not add this focus task. Please try again.')
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
        getApiErrorMessage(requestError, 'Could not update this task. Please try again.')
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
        getApiErrorMessage(requestError, 'Could not remove this task. Please try again.')
      );
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const sortedTasks = sortTasks(tasks);

  return (
    <article className="dashboard-card tasks-card">
      <div className="card-heading">
        <div>
          <h2>Focus Tasks</h2>
          <p>{completedCount} of {tasks.length} completed</p>
        </div>
        <span>{tasks.length}</span>
      </div>

      <form className="task-form" onSubmit={handleCreateTask}>
        <input
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Add a focus task"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add context or notes"
          rows="3"
        />
        <div className="task-form-row">
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            aria-label="Task priority"
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <input
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            aria-label="Task deadline"
          />
        </div>
        <button type="submit" disabled={isCreating || !formData.title.trim()}>
          {isCreating ? 'Adding...' : 'Add task'}
        </button>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="task-list">
        {isLoading ? (
          <ModuleState tone="loading">AI is loading your tasks...</ModuleState>
        ) : sortedTasks.length === 0 ? (
          <ModuleState>No focus tasks yet. Add one above.</ModuleState>
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
                    {task.description || 'No description added.'}
                  </p>

                  <div className="task-meta">
                    <span>{formatDeadline(task.deadline)}</span>
                    <span>{task.completed ? 'Completed' : 'In progress'}</span>
                  </div>
                </div>

                <div className="task-actions">
                  <label className="task-check">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                    />
                    <span>{task.completed ? 'Done' : 'Complete'}</span>
                  </label>
                  <button
                    className="task-delete"
                    type="button"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    Remove
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
