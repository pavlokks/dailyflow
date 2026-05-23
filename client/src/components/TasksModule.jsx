import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Folder, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const priorityLabels = {
  high: 'Високий',
  low: 'Низький',
  medium: 'Середній'
};

const priorityOrder = { high: 1, medium: 2, low: 3 };

const initialTaskForm = {
  deadline: '',
  description: '',
  priority: 'medium',
  project: '',
  title: ''
};

const formatDeadline = (deadline) => {
  if (!deadline) return 'Без дедлайну';

  return new Intl.DateTimeFormat('uk-UA', {
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

    if (priorityDifference !== 0) return priorityDifference;

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

const notifyProjectsUpdated = () => {
  window.dispatchEvent(new Event('dailyflow:projects-updated'));
};

const getTaskProjectId = (task) => task.project?._id || task.project || '';

const getTaskProjectName = (task) => task.project?.name || 'Без проєкту';

const TasksModule = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(initialTaskForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [renamingProjectId, setRenamingProjectId] = useState('');
  const [renamingProjectName, setRenamingProjectName] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);

  const loadTasks = useCallback(async () => {
    const { data } = await api.get('/tasks');
    return data;
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      setProjects([]);
    }
  }, []);

  const { error, isLoading, items: tasks, refresh, setError, setItems: setTasks } =
    useAsyncList({
      fallbackError: 'Не вдалося завантажити задачі. Спробуйте ще раз.',
      loadItems: loadTasks
    });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => window.removeEventListener('dailyflow:tasks-updated', refresh);
  }, [refresh]);

  useEffect(() => {
    loadProjects();
    window.addEventListener('dailyflow:projects-updated', loadProjects);

    return () => window.removeEventListener('dailyflow:projects-updated', loadProjects);
  }, [loadProjects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) return;

    try {
      setIsCreating(true);
      setError('');
      const { data } = await api.post('/tasks', {
        deadline: formData.deadline || null,
        description: formData.description.trim(),
        priority: formData.priority,
        project: formData.project || null,
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

  const handleCreateProject = async (event) => {
    event?.preventDefault();

    const trimmedName = newProjectName.trim();
    if (!trimmedName) return;

    try {
      setIsSavingProject(true);
      setError('');
      const { data } = await api.post('/projects', {
        name: trimmedName
      });

      setProjects((currentProjects) => [data, ...currentProjects]);
      setFormData((currentData) => ({ ...currentData, project: data._id }));
      setNewProjectName('');
      setIsProjectFormOpen(false);
      notifyProjectsUpdated();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося створити проєкт. Спробуйте ще раз.')
      );
    } finally {
      setIsSavingProject(false);
    }
  };

  const startRenamingProject = (project) => {
    setRenamingProjectId(project._id);
    setRenamingProjectName(project.name);
  };

  const handleRenameProject = async (event) => {
    event.preventDefault();

    const trimmedName = renamingProjectName.trim();
    if (!renamingProjectId || !trimmedName) return;

    try {
      setIsSavingProject(true);
      setError('');
      const { data } = await api.put(`/projects/${renamingProjectId}`, {
        name: trimmedName
      });

      setProjects((currentProjects) =>
        currentProjects.map((project) => (project._id === data._id ? data : project))
      );
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          getTaskProjectId(task) === data._id
            ? { ...task, project: { ...task.project, name: data.name } }
            : task
        )
      );
      setRenamingProjectId('');
      setRenamingProjectName('');
      notifyProjectsUpdated();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося перейменувати проєкт.')
      );
    } finally {
      setIsSavingProject(false);
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

  const handleClearTasks = async () => {
    if (tasks.length === 0) return;

    try {
      setIsClearing(true);
      setError('');
      await Promise.all(tasks.map((task) => api.delete(`/tasks/${task._id}`)));
      setTasks([]);
      notifyTasksUpdated();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося видалити всі задачі.')
      );
    } finally {
      setIsClearing(false);
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const sortedTasks = sortTasks(tasks);
  const selectedProject = searchParams.get('project') || 'all';
  const visibleTasks = sortedTasks.filter((task) => {
    const projectId = getTaskProjectId(task);

    if (selectedProject === 'all') return true;
    if (selectedProject === 'none') return !projectId;
    return projectId === selectedProject;
  });
  const visibleCompletedCount = visibleTasks.filter((task) => task.completed).length;
  const selectedProjectName =
    selectedProject === 'all'
      ? 'Усі задачі'
      : selectedProject === 'none'
        ? 'Без проєкту'
        : projects.find((project) => project._id === selectedProject)?.name || 'Проєкт';
  const projectGroups = [
    ...projects.map((project) => ({
      id: project._id,
      name: project.name,
      project,
      tasks: visibleTasks.filter((task) => getTaskProjectId(task) === project._id)
    })),
    {
      id: 'no-project',
      name: 'Без проєкту',
      project: null,
      tasks: visibleTasks.filter((task) => !getTaskProjectId(task))
    }
  ].filter((group) => {
    if (selectedProject === 'all') return group.tasks.length > 0 || group.id === 'no-project';
    return group.tasks.length > 0;
  });

  return (
    <article className="dashboard-card tasks-card">
      <div className="card-heading">
        <div>
          <h2><CheckCircle2 size={18} /> Задачі</h2>
          <p>Виконано {visibleCompletedCount} з {visibleTasks.length}. Поточний фільтр: {selectedProjectName}.</p>
        </div>
        <span>{visibleTasks.length}</span>
      </div>

      <form className="task-form" onSubmit={handleCreateTask}>
        <input
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Назва задачі"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Короткий опис або нотатки"
          rows="3"
        />
        <div className="task-form-row">
          <select
            name="project"
            value={formData.project}
            onChange={handleChange}
            aria-label="Проект задачі"
          >
            <option value="">Без проєкту</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
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
        <div className="task-form-actions">
          <button type="submit" disabled={isCreating || !formData.title.trim()}>
            <Plus size={16} /> {isCreating ? 'Додаємо...' : 'Додати'}
          </button>
          <button
            className="ghost-danger-button"
            type="button"
            disabled={isClearing || tasks.length === 0}
            onClick={handleClearTasks}
          >
            <Trash2 size={16} /> {isClearing ? 'Очищення...' : 'Видалити всі'}
          </button>
        </div>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <section className="projects-toolbar">
        <div>
          <h3><Folder size={16} /> Проекти</h3>
          <p>{projects.length} проєктів</p>
        </div>
        {isProjectFormOpen ? (
          <div className="project-create-form">
            <input
              type="text"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Назва проєкту"
              autoFocus
            />
            <button
              type="button"
              disabled={isSavingProject || !newProjectName.trim()}
              onClick={handleCreateProject}
            >
              <Save size={15} /> Зберегти
            </button>
            <button
              className="project-create-cancel"
              type="button"
              onClick={() => {
                setIsProjectFormOpen(false);
                setNewProjectName('');
              }}
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            className="project-create-button"
            type="button"
            onClick={() => setIsProjectFormOpen(true)}
          >
            <Plus size={15} /> Створити проєкт
          </button>
        )}
      </section>

      <div className="task-list">
        {isLoading ? (
          <ModuleState tone="loading">Завантажуємо задачі...</ModuleState>
        ) : visibleTasks.length === 0 ? (
          <ModuleState>У цьому фільтрі задач ще немає.</ModuleState>
        ) : (
          projectGroups.map((group) => (
            <section className="task-project-group" key={group.id}>
              <div className="task-project-heading">
                <div>
                  <h3><Folder size={16} /> {group.name}</h3>
                  <p>{group.tasks.length} задач</p>
                </div>
                {group.project && (
                  renamingProjectId === group.project._id ? (
                    <form className="project-rename-form" onSubmit={handleRenameProject}>
                      <input
                        type="text"
                        value={renamingProjectName}
                        onChange={(event) => setRenamingProjectName(event.target.value)}
                        aria-label="Нова назва проєкту"
                      />
                      <button type="submit" disabled={isSavingProject || !renamingProjectName.trim()}>
                        <Save size={14} />
                      </button>
                    </form>
                  ) : (
                    <button
                      className="project-rename-button"
                      type="button"
                      aria-label={`Перейменувати проєкт ${group.project.name}`}
                      onClick={() => startRenamingProject(group.project)}
                    >
                      <Pencil size={14} />
                    </button>
                  )
                )}
              </div>

              {group.tasks.length === 0 ? (
                <ModuleState>Задач без проєкту немає.</ModuleState>
              ) : (
                group.tasks.map((task) => {
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
                          <span>{getTaskProjectName(task)}</span>
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
                          <Trash2 size={15} /> Видалити
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          ))
        )}
      </div>
    </article>
  );
};

export default TasksModule;
