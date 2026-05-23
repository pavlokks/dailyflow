import React, { useState } from 'react';
import { Plus, WandSparkles } from 'lucide-react';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const priorityLabels = {
  high: 'високий',
  low: 'низький',
  medium: 'середній'
};

const AITaskGenerator = () => {
  const [goal, setGoal] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

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
        goal: goal.trim()
      });

      setProjectName(data.projectName || goal.trim());
      setGeneratedTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Не вдалося підготувати список задач. Спробуйте ще раз.'
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTasks = async () => {
    if (generatedTasks.length === 0) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsAdding(true);

      const { data: project } = await api.post('/projects', {
        name: projectName.trim() || goal.trim()
      });

      await Promise.all(
        generatedTasks.map((task) =>
          api.post('/tasks', {
            description: task.description || '',
            priority: task.priority || 'medium',
            project: project._id,
            title: task.title
          })
        )
      );

      setSuccess(`${generatedTasks.length} задач додано до проєкту “${project.name}”.`);
      setGeneratedTasks([]);
      setProjectName('');
      setGoal('');
      window.dispatchEvent(new Event('dailyflow:projects-updated'));
      window.dispatchEvent(new Event('dailyflow:tasks-updated'));
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Не вдалося додати задачі. Спробуйте ще раз.'
        )
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className="dashboard-card ai-generator-card">
      <div className="card-heading">
        <div>
          <h2><WandSparkles size={18} /> План із цілі</h2>
          <p>Опишіть ціль, а DailyFlow запропонує кілька конкретних кроків.</p>
        </div>
      </div>

      <form className="ai-generator-form" onSubmit={handleGenerateTasks}>
        <textarea
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Наприклад: підготуватися до екзамену"
          rows="4"
        />
        <button type="submit" disabled={isGenerating || !goal.trim()}>
          <WandSparkles size={16} /> {isGenerating ? 'Готуємо...' : 'Запропонувати задачі'}
        </button>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}
      {success && <ModuleState tone="success">{success}</ModuleState>}

      {generatedTasks.length > 0 && (
        <div className="generated-task-list">
          <label className="generated-project-name">
            Проєкт
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Назва проєкту"
            />
          </label>

          {generatedTasks.map((task, index) => (
            <div className="generated-task-item" key={`${task.title}-${index}`}>
              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <div className="generated-task-meta">
                <span>{priorityLabels[task.priority] || 'середній'}</span>
              </div>
            </div>
          ))}

          <button
            className="add-generated-tasks"
            type="button"
            onClick={handleAddTasks}
            disabled={isAdding}
          >
            <Plus size={16} /> {isAdding ? 'Додаємо...' : 'Додати до задач'}
          </button>
        </div>
      )}
    </article>
  );
};

export default AITaskGenerator;
