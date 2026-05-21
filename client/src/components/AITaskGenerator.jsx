import React, { useState } from 'react';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const AITaskGenerator = () => {
  const [goal, setGoal] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
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

      setGeneratedTasks(data.tasks || []);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Could not generate tasks for this goal. Please try again.'
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

      await Promise.all(
        generatedTasks.map((task) =>
          api.post('/tasks', {
            deadline: task.deadline || null,
            description: task.description || '',
            priority: task.priority || 'medium',
            title: task.title
          })
        )
      );

      setSuccess(`${generatedTasks.length} tasks added to your focus list.`);
      setGeneratedTasks([]);
      setGoal('');
      window.dispatchEvent(new Event('dailyflow:tasks-updated'));
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Could not add generated tasks to your list. Please try again.'
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
          <h2>AI Task Generator</h2>
          <p>Turn a goal into actionable focus tasks</p>
        </div>
        <span>AI</span>
      </div>

      <form className="ai-generator-form" onSubmit={handleGenerateTasks}>
        <textarea
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Наприклад: Підготуватися до екзамену"
          rows="4"
        />
        <button type="submit" disabled={isGenerating || !goal.trim()}>
          {isGenerating ? 'Generating...' : 'Generate Tasks'}
        </button>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}
      {success && <ModuleState tone="success">{success}</ModuleState>}

      {generatedTasks.length > 0 && (
        <div className="generated-task-list">
          {generatedTasks.map((task, index) => (
            <div className="generated-task-item" key={`${task.title}-${index}`}>
              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <div className="generated-task-meta">
                <span>{task.priority}</span>
                <span>{task.deadline || 'No deadline'}</span>
              </div>
            </div>
          ))}

          <button
            className="add-generated-tasks"
            type="button"
            onClick={handleAddTasks}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Tasks'}
          </button>
        </div>
      )}
    </article>
  );
};

export default AITaskGenerator;
