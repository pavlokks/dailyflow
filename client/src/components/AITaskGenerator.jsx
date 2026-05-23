import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, GripVertical, Plus, Trash2, WandSparkles } from 'lucide-react';
import api from '../services/api.js';
import { getClientAIContext } from '../utils/aiContext.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const priorityLabels = {
  high: 'Високий',
  low: 'Низький',
  medium: 'Середній',
};

const normalizeGeneratedTask = (task = {}) => ({
  deadline: task.deadline || '',
  description: task.description || '',
  priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
  title: task.title || '',
});

const AITaskGenerator = () => {
  const [goal, setGoal] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [targetProjectId, setTargetProjectId] = useState('new');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draggingTaskIndex, setDraggingTaskIndex] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      const [projectsResponse, tasksResponse, trashResponse] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/tasks?trash=true'),
      ]);
      const usedProjectIds = new Set(
        [...tasksResponse.data, ...trashResponse.data]
          .map((task) => task.project?._id || task.project || '')
          .filter(Boolean),
      );

      setProjects(projectsResponse.data.filter((project) => usedProjectIds.has(project._id)));
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    window.addEventListener('dailyflow:projects-updated', loadProjects);
    window.addEventListener('dailyflow:tasks-updated', loadProjects);

    return () => {
      window.removeEventListener('dailyflow:projects-updated', loadProjects);
      window.removeEventListener('dailyflow:tasks-updated', loadProjects);
    };
  }, [loadProjects]);

  useEffect(() => {
    if (targetProjectId !== 'new' && !projects.some((project) => project._id === targetProjectId)) {
      setTargetProjectId('new');
    }
  }, [projects, targetProjectId]);

  const handleGenerateTasks = async (event) => {
    event.preventDefault();

    if (!goal.trim()) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsGenerating(true);
      const { data } = await api.post('/ai/generate-tasks', {
        goal: goal.trim(),
        ...getClientAIContext(),
      });

      setProjectName(data.projectName || goal.trim());
      setGeneratedTasks((data.tasks || []).map(normalizeGeneratedTask));
      setTargetProjectId('new');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Не вдалося підготувати список задач. Спробуйте ще раз.',
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateGeneratedTask = (index, field, value) => {
    setGeneratedTasks((currentTasks) =>
      currentTasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, [field]: value } : task,
      ),
    );
  };

  const removeGeneratedTask = (index) => {
    setGeneratedTasks((currentTasks) => currentTasks.filter((_, taskIndex) => taskIndex !== index));
  };

  const addGeneratedTask = () => {
    setGeneratedTasks((currentTasks) => [
      ...currentTasks,
      normalizeGeneratedTask({
        description: '',
        priority: 'medium',
        title: '',
      }),
    ]);
  };

  const moveGeneratedTask = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex === null || toIndex === null) return;

    setGeneratedTasks((currentTasks) => {
      const nextTasks = [...currentTasks];
      const [movedTask] = nextTasks.splice(fromIndex, 1);
      nextTasks.splice(toIndex, 0, movedTask);
      return nextTasks;
    });
  };

  const handleAddTasks = async () => {
    const tasksToAdd = generatedTasks
      .map((task) => ({
        ...task,
        description: task.description.trim(),
        title: task.title.trim(),
      }))
      .filter((task) => task.title);

    if (tasksToAdd.length === 0) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsAdding(true);

      let projectId = targetProjectId;
      let finalProjectName = projects.find((project) => project._id === targetProjectId)?.name;

      if (targetProjectId === 'new') {
        const { data: project } = await api.post('/projects', {
          name: projectName.trim() || goal.trim(),
        });
        projectId = project._id;
        finalProjectName = project.name;
      }

      for (const task of tasksToAdd) {
        await api.post('/tasks', {
          deadline: task.deadline || null,
          description: task.description,
          priority: task.priority || 'medium',
          project: projectId,
          title: task.title,
        });
      }

      setSuccess(`${tasksToAdd.length} задач додано до проєкту "${finalProjectName}".`);
      setGeneratedTasks([]);
      setProjectName('');
      setGoal('');
      window.dispatchEvent(new Event('dailyflow:projects-updated'));
      window.dispatchEvent(new Event('dailyflow:tasks-updated'));
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося додати задачі. Спробуйте ще раз.'),
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className='dashboard-card ai-generator-card'>
      <div className='card-heading'>
        <div>
          <h2>
            <WandSparkles size={18} /> План із цілі
          </h2>
          <p>Опишіть ціль, відредагуйте чернетки й додайте їх у потрібний проєкт.</p>
        </div>
      </div>

      <form className='ai-generator-form' onSubmit={handleGenerateTasks}>
        <textarea
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder='Наприклад: підготуватися до екзамену'
          rows='4'
        />
        <button type='submit' disabled={isGenerating || !goal.trim()}>
          <WandSparkles size={16} /> {isGenerating ? 'Готуємо...' : 'Запропонувати задачі'}
        </button>
      </form>

      {error && <ModuleState tone='error'>{error}</ModuleState>}
      {success && <ModuleState tone='success'>{success}</ModuleState>}

      {generatedTasks.length > 0 && (
        <div className='generated-task-list'>
          <div className='generated-task-list-header'>
            <WandSparkles size={20} />
            <div>
              <h3>Запропонувати задачі</h3>
              <p>Додайте задачі для нового проєкту</p>
            </div>
          </div>

          <div className='generated-project-grid'>
            <label className='generated-project-name'>
              Куди додати
              <select
                value={targetProjectId}
                onChange={(event) => setTargetProjectId(event.target.value)}
              >
                <option value='new'>Новий проєкт</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            {targetProjectId === 'new' && (
              <label className='generated-project-name'>
                Назва проєкту
                <input
                  type='text'
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder='Назва проєкту'
                />
              </label>
            )}
          </div>

          {generatedTasks.map((task, index) => (
            <div
              className={
                draggingTaskIndex === index
                  ? 'generated-task-item generated-task-editor generated-task-editor-dragging'
                  : 'generated-task-item generated-task-editor'
              }
              key={`${task.title}-${index}`}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
                moveGeneratedTask(Number.isFinite(sourceIndex) ? sourceIndex : draggingTaskIndex, index);
                setDraggingTaskIndex(null);
              }}
              onDragEnd={() => setDraggingTaskIndex(null)}
            >
              <div
                className='generated-task-grip'
                draggable
                aria-label='Перетягнути задачу'
                title='Перетягнути'
                onDragStart={(event) => {
                  setDraggingTaskIndex(index);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(index));
                }}
              >
                <GripVertical size={18} />
              </div>
              <div className='generated-task-fields'>
                <input
                  className='generated-task-title-input'
                  type='text'
                  value={task.title}
                  onChange={(event) => updateGeneratedTask(index, 'title', event.target.value)}
                  placeholder='Назва задачі'
                />
                <textarea
                  className='generated-task-description-input'
                  value={task.description}
                  onChange={(event) =>
                    updateGeneratedTask(index, 'description', event.target.value)
                  }
                  placeholder='Опис'
                  rows='2'
                />
                <div className='generated-task-controls'>
                  <label className={`generated-priority generated-priority-${task.priority}`}>
                    <span aria-hidden='true' />
                    <select
                      value={task.priority}
                      onChange={(event) =>
                        updateGeneratedTask(index, 'priority', event.target.value)
                      }
                      aria-label='Пріоритет'
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className='generated-date-field'>
                    <CalendarDays size={16} aria-hidden='true' />
                    <input
                      type='date'
                      value={task.deadline}
                      onChange={(event) =>
                        updateGeneratedTask(index, 'deadline', event.target.value)
                      }
                      aria-label='Дедлайн'
                    />
                  </label>
                </div>
              </div>
              <button
                className='generated-task-remove'
                type='button'
                onClick={() => removeGeneratedTask(index)}
                aria-label='Видалити чернетку'
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button className='generated-add-draft' type='button' onClick={addGeneratedTask}>
            <Plus size={16} /> Додати ще задачу
          </button>

          <button
            className='add-generated-tasks'
            type='button'
            onClick={handleAddTasks}
            disabled={isAdding || generatedTasks.every((task) => !task.title.trim())}
          >
            <Plus size={16} /> {isAdding ? 'Додаємо...' : 'Додати до задач'}
          </button>
        </div>
      )}
    </article>
  );
};

export default AITaskGenerator;
