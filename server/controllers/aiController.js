import {
  generateAssistantReplyWithAI,
  generateDailySummaryWithAI,
  generateNextActionWithAI,
  generateTasksWithAI,
} from '../services/aiService.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';

const fetchWeatherSnapshot = async (user) => {
  const city = user?.city?.trim();
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!city) {
    return {
      city: '',
      available: false,
      reason: 'city_missing',
    };
  }

  if (!apiKey) {
    return {
      city,
      available: false,
      reason: 'api_key_missing',
    };
  }

  try {
    const params = new URLSearchParams({
      appid: apiKey,
      q: city,
      units: 'metric',
    });
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
    );
    const weatherData = await response.json();

    if (!response.ok) {
      return {
        city,
        available: false,
        reason: weatherData.message || 'weather_request_failed',
      };
    }

    return {
      available: true,
      city,
      clouds: weatherData.clouds?.all ?? null,
      description: weatherData.weather?.[0]?.description ?? null,
      feelsLike: weatherData.main?.feels_like ?? null,
      humidity: weatherData.main?.humidity ?? null,
      pressure: weatherData.main?.pressure ?? null,
      temperature: weatherData.main?.temp ?? null,
      windSpeed: weatherData.wind?.speed ?? null,
    };
  } catch (error) {
    return {
      city,
      available: false,
      reason: error.message,
    };
  }
};

const loadUserAIContext = async (user) => {
  const userId = user._id;
  const [tasks, events] = await Promise.all([
    Task.find({
      user: userId,
      deletedAt: null,
    })
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .lean(),
    Event.find({
      user: userId,
      deletedAt: null,
    })
      .sort({ date: 1 })
      .lean(),
  ]);

  return {
    currentTime: new Date().toISOString(),
    events,
    tasks,
    user: {
      city: user.city || '',
      name: user.name || '',
    },
    weather: await fetchWeatherSnapshot(user),
  };
};

const buildUserTimeContext = (body = {}) => ({
  localTime: typeof body.localTime === 'string' ? body.localTime : '',
  timezone: typeof body.timezone === 'string' ? body.timezone : '',
});

export const generateTasks = async (req, res) => {
  const { goal } = req.body;
  const userTime = buildUserTimeContext(req.body);

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

  const taskPlan = await generateTasksWithAI(goal, { userTime });

  console.log('[AI] POST /api/ai/generate-tasks completed', {
    tasks: taskPlan.tasks.length,
  });

  return res.json(taskPlan);
};

export const generateDailySummary = async (req, res) => {
  const { weather: requestWeather = {} } = req.body;
  const userTime = buildUserTimeContext(req.body);
  const context = await loadUserAIContext(req.user);
  const { events, tasks } = context;
  const weather =
    requestWeather && Object.keys(requestWeather).length > 0 ? requestWeather : context.weather;

  console.log('[AI] POST /api/ai/daily-summary', {
    userId: req.user?._id?.toString(),
    tasks: tasks.length,
    events: events.length,
    hasWeather: Boolean(weather && Object.keys(weather).length > 0),
  });

  const summary = await generateDailySummaryWithAI({
    events,
    tasks,
    userTime,
    weather,
  });

  console.log('[AI] POST /api/ai/daily-summary завершено');

  return res.json(summary);
};

export const generateNextAction = async (req, res) => {
  const userTime = buildUserTimeContext(req.body);
  const context = await loadUserAIContext(req.user);
  const { events, tasks } = context;

  console.log('[AI] POST /api/ai/next-action', {
    userId: req.user?._id?.toString(),
    tasks: tasks.length,
    events: events.length,
  });

  const recommendation = await generateNextActionWithAI({
    events,
    tasks,
    userTime,
    weather: context.weather,
    currentTime: context.currentTime,
  });

  console.log('[AI] POST /api/ai/next-action завершено');

  return res.json(recommendation);
};

export const runAssistantCommand = async (req, res) => {
  const { message } = req.body;
  const userTime = buildUserTimeContext(req.body);

  if (!message?.trim()) {
    return res.status(400).json({
      message: 'Запит до помічника необхідний',
    });
  }

  const context = await loadUserAIContext(req.user);

  console.log('[AI] POST /api/ai/command', {
    userId: req.user?._id?.toString(),
    messageLength: message.trim().length,
    tasks: context.tasks.length,
    events: context.events.length,
  });

  const reply = await generateAssistantReplyWithAI({
    context: {
      ...context,
      userTime,
    },
    message: message.trim(),
  });

  return res.json(reply);
};
