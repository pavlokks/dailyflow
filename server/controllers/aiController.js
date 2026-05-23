import {
  generateDailySummaryWithAI,
  generateNextActionWithAI,
  generateTasksWithAI,
} from '../services/aiService.js';

export const generateTasks = async (req, res) => {
  const { goal } = req.body;

  if (!goal?.trim()) {
    console.warn('[AI] POST /api/ai/generate-tasks відмовлено: ціль пропущена');
    return res.status(400).json({
      message: 'Ціль необхідна',
    });
  }

  console.log('[AI] POST /api/ai/generate-tasks', {
    userId: req.user?._id?.toString(),
    goalLength: goal.trim().length,
  });

  const taskPlan = await generateTasksWithAI(goal);

  console.log('[AI] POST /api/ai/generate-tasks completed', {
    tasks: taskPlan.tasks.length,
  });

  return res.json(taskPlan);
};

export const generateDailySummary = async (req, res) => {
  const { events = [], tasks = [], weather = {} } = req.body;

  console.log('[AI] POST /api/ai/daily-summary', {
    userId: req.user?._id?.toString(),
    tasks: tasks.length,
    events: events.length,
    hasWeather: Boolean(weather && Object.keys(weather).length > 0),
  });

  const summary = await generateDailySummaryWithAI({
    events,
    tasks,
    weather,
  });

  console.log('[AI] POST /api/ai/daily-summary завершено');

  return res.json(summary);
};

export const generateNextAction = async (req, res) => {
  const { events = [], tasks = [] } = req.body;

  console.log('[AI] POST /api/ai/next-action', {
    userId: req.user?._id?.toString(),
    tasks: tasks.length,
    events: events.length,
  });

  const recommendation = await generateNextActionWithAI({
    events,
    tasks,
  });

  console.log('[AI] POST /api/ai/next-action завершено');

  return res.json(recommendation);
};
