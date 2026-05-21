import React, { useCallback, useState } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const TasksModule = () => {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadTasks = useCallback(async () => {
    const { data } = await api.get('/tasks');
    return data;
  }, []);

  const { error, isLoading, items: tasks, setError, setItems: setTasks } =
    useAsyncList({
      fallbackError: 'AI assistant could not load your tasks. Please try again.',
      loadItems: loadTasks
    });

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const { data } = await api.post('/tasks', {
        title: trimmedTitle
      });

      setTasks((currentTasks) => [data, ...currentTasks]);
      setTitle('');
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
        currentTasks.map((currentTask) =>
          currentTask._id === data._id ? data : currentTask
        )
      );
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
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Could not remove this task. Please try again.')
      );
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;

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
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a focus task"
        />
        <button type="submit" disabled={isCreating || !title.trim()}>
          Add
        </button>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="task-list">
        {isLoading ? (
          <ModuleState tone="loading">AI is loading your tasks...</ModuleState>
        ) : tasks.length === 0 ? (
          <ModuleState>No focus tasks yet. Add one above.</ModuleState>
        ) : (
          tasks.map((task) => (
            <div className="task-item" key={task._id}>
              <label className="task-check">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task)}
                />
                <span className={task.completed ? 'task-title done' : 'task-title'}>
                  {task.title}
                </span>
              </label>
              <button
                className="task-delete"
                type="button"
                onClick={() => handleDeleteTask(task._id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
};

export default TasksModule;
