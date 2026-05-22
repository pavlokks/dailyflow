import {
  generateDailySummaryWithAI,
  generateTasksWithAI
} from '../services/aiService.js';

export const generateTasks = async (req, res) => {
  const { goal } = req.body;

  if (!goal?.trim()) {
    console.warn('[AI] POST /api/ai/generate-tasks rejected: goal is missing');
    return res.status(400).json({
      message: 'Goal is required'
    });
  }

  console.log('[AI] POST /api/ai/generate-tasks', {
    userId: req.user?._id?.toString(),
    goalLength: goal.trim().length
  });

  const tasks = await generateTasksWithAI(goal);

  console.log('[AI] POST /api/ai/generate-tasks completed', {
    tasks: tasks.length
  });

  return res.json(tasks);
};

export const generateDailySummary = async (req, res) => {
  const { events = [], tasks = [], weather = {} } = req.body;

  console.log('[AI] POST /api/ai/daily-summary', {
    userId: req.user?._id?.toString(),
    tasks: tasks.length,
    events: events.length,
    hasWeather: Boolean(weather && Object.keys(weather).length > 0)
  });

  const summary = await generateDailySummaryWithAI({
    events,
    tasks,
    weather
  });

  console.log('[AI] POST /api/ai/daily-summary completed');

  return res.json(summary);
};
