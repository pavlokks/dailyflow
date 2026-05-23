import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const collapsedProjectsKey = 'dailyflowCollapsedTaskProjects';

const priorityLabels = {
  high: 'Високий',
  low: 'Низький',
  medium: 'Середній',
};

const priorityOrder = { high: 1, medium: 2, low: 3 };

const initialTaskForm = {
  deadline: '',
  description: '',
  priority: 'medium',
  project: '',
  title: '',
};

const formatDeadline = (deadline) => {
  if (!deadline) return 'Без дедлайну';

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(deadline));
};

const formatDateInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

const formatProjectCount = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) return `${count} проєкт`;
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return `${count} проєкти`;
  }

  return `${count} проєктів`;
};

const formatTaskCount = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) return `${count} задача`;
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return `${count} задачі`;
  }

  return `${count} задач`;
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

const readCollapsedProjects = () => {
  try {
    const savedProjects = JSON.parse(localStorage.getItem(collapsedProjectsKey));
    return Array.isArray(savedProjects) ? savedProjects : [];
  } catch {
    return [];
  }
};

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
  const [trashTasks, setTrashTasks] = useState([]);
  const [isTrashLoading, setIsTrashLoading] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editFormData, setEditFormData] = useState(initialTaskForm);
  const [confirmDeleteAllAction, setConfirmDeleteAllAction] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState(readCollapsedProjects);

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

  const loadTrashTasks = useCallback(async () => {
    try {
      setIsTrashLoading(true);
      const { data } = await api.get('/tasks?trash=true');
      setTrashTasks(data);
    } catch {
      setTrashTasks([]);
    } finally {
      setIsTrashLoading(false);
    }
  }, []);

  const {
    error,
    isLoading,
    items: tasks,
    refresh,
    setError,
    setItems: setTasks,
  } = useAsyncList({
    fallbackError: 'Не вдалося завантажити задачі. Спробуйте ще раз.',
    loadItems: loadTasks,
  });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => window.removeEventListener('dailyflow:tasks-updated', refresh);
  }, [refresh]);

  useEffect(() => {
    loadTrashTasks();
    window.addEventListener('dailyflow:tasks-updated', loadTrashTasks);

    return () => window.removeEventListener('dailyflow:tasks-updated', loadTrashTasks);
  }, [loadTrashTasks]);

  useEffect(() => {
    loadProjects();
    window.addEventListener('dailyflow:projects-updated', loadProjects);

    return () => window.removeEventListener('dailyflow:projects-updated', loadProjects);
  }, [loadProjects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setEditFormData({
      deadline: formatDateInput(task.deadline),
      description: task.description || '',
      priority: task.priority || 'medium',
      project: getTaskProjectId(task),
      title: task.title || '',
    });
  };

  const closeEditTask = () => {
    setEditTask(null);
    setEditFormData(initialTaskForm);
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
        title: trimmedTitle,
      });

      setTasks((currentTasks) => sortTasks([data, ...currentTasks]));
      setFormData(initialTaskForm);
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося додати задачу. Спробуйте ще раз.'));
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
        name: trimmedName,
      });

      setProjects((currentProjects) => [data, ...currentProjects]);
      setFormData((currentData) => ({ ...currentData, project: data._id }));
      setNewProjectName('');
      setIsProjectFormOpen(false);
      notifyProjectsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося створити проєкт. Спробуйте ще раз.'));
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
        name: trimmedName,
      });

      setProjects((currentProjects) =>
        currentProjects.map((project) => (project._id === data._id ? data : project)),
      );
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          getTaskProjectId(task) === data._id
            ? { ...task, project: { ...task.project, name: data.name } }
            : task,
        ),
      );
      setRenamingProjectId('');
      setRenamingProjectName('');
      notifyProjectsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося перейменувати проєкт.'));
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      setError('');
      const { data } = await api.put(`/tasks/${task._id}`, {
        completed: !task.completed,
      });

      setTasks((currentTasks) =>
        sortTasks(
          currentTasks.map((currentTask) => (currentTask._id === data._id ? data : currentTask)),
        ),
      );
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося оновити задачу. Спробуйте ще раз.'));
    }
  };

  const handleUpdateTask = async (event) => {
    event.preventDefault();

    if (!editTask || !editFormData.title.trim()) return;

    try {
      setError('');
      const { data } = await api.put(`/tasks/${editTask._id}`, {
        deadline: editFormData.deadline || null,
        description: editFormData.description.trim(),
        priority: editFormData.priority,
        project: editFormData.project || null,
        title: editFormData.title.trim(),
      });

      setTasks((currentTasks) =>
        sortTasks(
          currentTasks.map((currentTask) => (currentTask._id === data._id ? data : currentTask)),
        ),
      );
      closeEditTask();
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося оновити задачу. Спробуйте ще раз.'));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setError('');
      await api.delete(`/tasks/${taskId}`);
      setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask._id !== taskId));
      loadTrashTasks();
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося видалити задачу. Спробуйте ще раз.'));
    }
  };

  const handleClearTasks = async () => {
    if (tasks.length === 0) return;
    if (confirmDeleteAllAction !== 'tasks') {
      setConfirmDeleteAllAction('tasks');
      return;
    }

    try {
      setIsClearing(true);
      setError('');
      await Promise.all(tasks.map((task) => api.delete(`/tasks/${task._id}`)));
      setTasks([]);
      loadTrashTasks();
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося видалити всі задачі.'));
    } finally {
      setIsClearing(false);
      setConfirmDeleteAllAction('');
    }
  };

  const handleRestoreTask = async (taskId) => {
    try {
      setError('');
      const { data } = await api.put(`/tasks/${taskId}/restore`);
      setTrashTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask._id !== taskId),
      );
      setTasks((currentTasks) => sortTasks([data, ...currentTasks]));
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося відновити задачу.'));
    }
  };

  const handlePermanentlyDeleteTask = async (taskId) => {
    try {
      setError('');
      await api.delete(`/tasks/${taskId}/permanent`);
      setTrashTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask._id !== taskId),
      );
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося видалити задачу остаточно.'));
    }
  };

  const handleEmptyTaskTrash = async () => {
    if (filteredTrashTasks.length === 0) return;
    if (confirmDeleteAllAction !== 'task-trash') {
      setConfirmDeleteAllAction('task-trash');
      return;
    }

    try {
      setError('');
      if (selectedProject === 'all') {
        await api.delete('/tasks/trash');
        setTrashTasks([]);
      } else {
        await Promise.all(
          filteredTrashTasks.map((task) => api.delete(`/tasks/${task._id}/permanent`)),
        );
        setTrashTasks((currentTasks) =>
          currentTasks.filter(
            (task) => !filteredTrashTasks.some((trashTask) => trashTask._id === task._id),
          ),
        );
      }
      notifyTasksUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося очистити кошик задач.'));
    } finally {
      setConfirmDeleteAllAction('');
    }
  };

  const toggleProjectCollapsed = (projectId) => {
    setCollapsedProjects((currentProjects) => {
      const nextProjects = currentProjects.includes(projectId)
        ? currentProjects.filter((currentProjectId) => currentProjectId !== projectId)
        : [...currentProjects, projectId];

      localStorage.setItem(collapsedProjectsKey, JSON.stringify(nextProjects));
      return nextProjects;
    });
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
  const filteredTrashTasks = trashTasks.filter((task) => {
    const projectId = getTaskProjectId(task);

    if (selectedProject === 'all') return true;
    if (selectedProject === 'none') return !projectId;
    return projectId === selectedProject;
  });
  const visibleCompletedCount = visibleTasks.filter((task) => task.completed).length;
  const usedProjectIds = new Set(
    [...tasks, ...trashTasks].map((task) => getTaskProjectId(task)).filter(Boolean),
  );
  const visibleProjects = projects.filter(
    (project) =>
      usedProjectIds.has(project._id) ||
      formData.project === project._id ||
      editFormData.project === project._id ||
      renamingProjectId === project._id,
  );
  const selectedProjectName =
    selectedProject === 'all'
      ? 'Усі задачі'
      : selectedProject === 'none'
        ? 'Без проєкту'
        : projects.find((project) => project._id === selectedProject)?.name || 'Проєкт';
  const projectGroups = [
    ...visibleProjects.map((project) => ({
      id: project._id,
      name: project.name,
      project,
      tasks: visibleTasks.filter((task) => getTaskProjectId(task) === project._id),
    })),
    {
      id: 'no-project',
      name: 'Без проєкту',
      project: null,
      tasks: visibleTasks.filter((task) => !getTaskProjectId(task)),
    },
  ].filter((group) => {
    if (selectedProject === 'all') return group.tasks.length > 0 || group.id === 'no-project';
    return group.tasks.length > 0;
  });

  const isGroupSelected = (group) => {
    if (selectedProject === 'all') return false;
    if (selectedProject === 'none') return group.id === 'no-project';
    return group.id === selectedProject;
  };

  return (
    <article className='dashboard-card tasks-card'>
      <div className='card-heading'>
        <div>
          <h2>
            <CheckCircle2 size={18} /> Задачі
          </h2>
          <p>
            Виконано {visibleCompletedCount} з {visibleTasks.length}. Поточний фільтр:{' '}
            {selectedProjectName}.
          </p>
        </div>
        <span>{visibleTasks.length}</span>
      </div>

      <form className='task-form' onSubmit={handleCreateTask}>
        <input
          name='title'
          type='text'
          value={formData.title}
          onChange={handleChange}
          placeholder='Назва задачі'
        />
        <textarea
          name='description'
          value={formData.description}
          onChange={handleChange}
          placeholder='Короткий опис або нотатки'
          rows='3'
        />
        <div className='task-form-row'>
          <select
            name='project'
            value={formData.project}
            onChange={handleChange}
            aria-label='Проєкт задачі'
          >
            <option value=''>Без проєкту</option>
            {visibleProjects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            name='priority'
            value={formData.priority}
            onChange={handleChange}
            aria-label='Пріоритет задачі'
          >
            <option value='low'>Низький пріоритет</option>
            <option value='medium'>Середній пріоритет</option>
            <option value='high'>Високий пріоритет</option>
          </select>
          <input
            name='deadline'
            type='date'
            value={formData.deadline}
            onChange={handleChange}
            aria-label='Дедлайн задачі'
          />
        </div>
        <div className='task-form-actions'>
          <button type='submit' disabled={isCreating || !formData.title.trim()}>
            <Plus size={16} /> {isCreating ? 'Додаємо...' : 'Додати'}
          </button>
          <button
            className='ghost-danger-button'
            type='button'
            disabled={isClearing || tasks.length === 0}
            onClick={handleClearTasks}
          >
            <Trash2 size={16} />{' '}
            {isClearing
              ? 'Очищення...'
              : confirmDeleteAllAction === 'tasks'
                ? 'Натисніть ще раз'
                : 'Видалити всі'}
          </button>
        </div>
      </form>

      {error && <ModuleState tone='error'>{error}</ModuleState>}

      <section className='projects-toolbar'>
        <div>
          <h3>
            <Folder size={16} /> Проєкти
          </h3>
          <p>{formatProjectCount(visibleProjects.length)}</p>
        </div>
      </section>

      <div className='task-list'>
        {isLoading ? (
          <ModuleState tone='loading'>Завантажуємо задачі...</ModuleState>
        ) : visibleTasks.length === 0 ? (
          <ModuleState>У цьому фільтрі задач ще немає.</ModuleState>
        ) : (
          projectGroups.map((group) => (
            <section
              className={
                isGroupSelected(group)
                  ? 'task-project-group task-project-group-active'
                  : 'task-project-group'
              }
              key={group.id}
            >
              <div className='task-project-heading'>
                <button
                  className='task-project-toggle'
                  type='button'
                  onClick={() => toggleProjectCollapsed(group.id)}
                  aria-expanded={!collapsedProjects.includes(group.id)}
                >
                  {collapsedProjects.includes(group.id) ? (
                    <ChevronRight size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                  <Folder size={16} />
                  <span>{group.name}</span>
                </button>
                <div className='task-project-meta'>
                  <p>{formatTaskCount(group.tasks.length)}</p>
                </div>
                {group.project &&
                  (renamingProjectId === group.project._id ? (
                    <form className='project-rename-form' onSubmit={handleRenameProject}>
                      <input
                        type='text'
                        value={renamingProjectName}
                        onChange={(event) => setRenamingProjectName(event.target.value)}
                        aria-label='Нова назва проєкту'
                      />
                      <button
                        type='submit'
                        disabled={isSavingProject || !renamingProjectName.trim()}
                      >
                        <Save size={14} />
                      </button>
                    </form>
                  ) : (
                    <button
                      className='project-rename-button'
                      type='button'
                      aria-label={`Перейменувати проєкт ${group.project.name}`}
                      onClick={() => startRenamingProject(group.project)}
                    >
                      <Pencil size={14} />
                    </button>
                  ))}
              </div>

              {group.tasks.length === 0 ? (
                <ModuleState>Задач без проєкту немає.</ModuleState>
              ) : collapsedProjects.includes(group.id) ? null : (
                group.tasks.map((task) => {
                  const priority = task.priority || 'medium';

                  return (
                    <div
                      className={task.completed ? 'task-item task-item-done' : 'task-item'}
                      key={task._id}
                    >
                      <label className='task-check'>
                        <input
                          type='checkbox'
                          checked={task.completed}
                          onChange={() => handleToggleTask(task)}
                        />
                        <i className='task-checkmark' aria-hidden='true' />
                        <span className='task-check-label'>
                          {task.completed ? 'Готово' : 'Виконати'}
                        </span>
                      </label>
                      <div className='task-card-main'>
                        <div className='task-card-topline'>
                          <h3 className={task.completed ? 'task-title done' : 'task-title'}>
                            {task.title}
                          </h3>
                        </div>
                        {task.description && <p className='task-description'>{task.description}</p>}
                        <div className='task-meta'>
                          <span>{getTaskProjectName(task)}</span>
                          <span>{formatDeadline(task.deadline)}</span>
                          <span className={`task-priority task-priority-${priority}`}>
                            {priorityLabels[priority]}
                          </span>
                        </div>
                      </div>
                      <div className='task-actions'>
                        <button
                          className='task-edit'
                          type='button'
                          onClick={() => openEditTask(task)}
                        >
                          <Pencil size={15} /> Редагувати
                        </button>
                        <button
                          className='task-delete'
                          type='button'
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

      <section className='trash-panel'>
        <div className='trash-panel-heading'>
          <button
            className='trash-toggle-button'
            type='button'
            onClick={() => setIsTrashOpen((currentValue) => !currentValue)}
            aria-expanded={isTrashOpen}
          >
            {isTrashOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            <span>Кошик задач</span>
            <small>{filteredTrashTasks.length} у кошику</small>
          </button>
          <button
            className='ghost-danger-button'
            type='button'
            disabled={!isTrashOpen || filteredTrashTasks.length === 0}
            onClick={handleEmptyTaskTrash}
          >
            {confirmDeleteAllAction === 'task-trash' ? 'Натисніть ще раз' : 'Видалити всі'}
          </button>
        </div>

        {isTrashOpen &&
          (isTrashLoading ? (
            <ModuleState tone='loading'>Завантажуємо кошик...</ModuleState>
          ) : filteredTrashTasks.length === 0 ? (
            <ModuleState>Кошик задач порожній.</ModuleState>
          ) : (
            <div className='trash-list'>
              {filteredTrashTasks.map((task) => (
                <div className='trash-item' key={task._id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{getTaskProjectName(task)}</span>
                  </div>
                  <div className='trash-actions'>
                    <button type='button' onClick={() => handleRestoreTask(task._id)}>
                      <RotateCcw size={14} /> Відновити
                    </button>
                    <button
                      className='ghost-danger-button'
                      type='button'
                      onClick={() => handlePermanentlyDeleteTask(task._id)}
                    >
                      <Trash2 size={14} /> Видалити остаточно
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </section>

      {editTask && (
        <div className='dashboard-modal-overlay' role='presentation'>
          <section className='dashboard-modal' role='dialog' aria-modal='true'>
            <div className='dashboard-modal-header'>
              <div>
                <h2>Редагувати задачу</h2>
                <p>Оновіть назву, опис, дедлайн, проєкт або пріоритет.</p>
              </div>
              <button
                className='modal-close-button'
                type='button'
                aria-label='Закрити'
                onClick={closeEditTask}
              >
                <X size={18} />
              </button>
            </div>

            <form className='modal-edit-form' onSubmit={handleUpdateTask}>
              <input
                name='title'
                type='text'
                value={editFormData.title}
                onChange={handleEditChange}
                placeholder='Назва задачі'
              />
              <textarea
                name='description'
                value={editFormData.description}
                onChange={handleEditChange}
                placeholder='Опис'
                rows='3'
              />
              <div className='task-form-row'>
                <select
                  name='project'
                  value={editFormData.project}
                  onChange={handleEditChange}
                  aria-label='Проєкт задачі'
                >
                  <option value=''>Без проєкту</option>
                  {visibleProjects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  name='priority'
                  value={editFormData.priority}
                  onChange={handleEditChange}
                  aria-label='Пріоритет задачі'
                >
                  <option value='low'>Низький</option>
                  <option value='medium'>Середній</option>
                  <option value='high'>Високий</option>
                </select>
                <input
                  name='deadline'
                  type='date'
                  value={editFormData.deadline}
                  onChange={handleEditChange}
                  aria-label='Дедлайн'
                />
              </div>
              <div className='dashboard-modal-footer'>
                <button className='secondary-button' type='button' onClick={closeEditTask}>
                  Скасувати
                </button>
                <button
                  className='add-generated-tasks'
                  type='submit'
                  disabled={!editFormData.title.trim()}
                >
                  Зберегти
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </article>
  );
};

export default TasksModule;
