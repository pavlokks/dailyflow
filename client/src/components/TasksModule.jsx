import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

const TasksModule = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadTasks = async () => {
    try {
      setError('');
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not load tasks. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

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
        requestError.response?.data?.message ||
          'Could not create task. Please try again.'
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
        requestError.response?.data?.message ||
          'Could not update task. Please try again.'
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
        requestError.response?.data?.message ||
          'Could not delete task. Please try again.'
      );
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <article className="dashboard-card tasks-card">
      <div className="card-heading">
        <div>
          <h2>Tasks</h2>
          <p>{completedCount} of {tasks.length} completed</p>
        </div>
        <span>{tasks.length}</span>
      </div>

      <form className="task-form" onSubmit={handleCreateTask}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a new task"
        />
        <button type="submit" disabled={isCreating || !title.trim()}>
          Add
        </button>
      </form>

      {error && <p className="task-error">{error}</p>}

      <div className="task-list">
        {isLoading ? (
          <p className="task-empty">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="task-empty">No tasks yet. Add your first task above.</p>
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
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
};

export default TasksModule;
