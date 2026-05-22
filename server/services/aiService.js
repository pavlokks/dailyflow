import { GoogleGenAI } from '@google/genai';

const allowedPriorities = ['low', 'medium', 'high'];

const logAI = (message, details = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[AI][${timestamp}] ${message}`, details);
};

const warnAI = (message, details = {}) => {
  const timestamp = new Date().toISOString();
  console.warn(`[AI][${timestamp}] ${message}`, details);
};

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
};

const getModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const normalizeGoal = (goal) => goal.trim().replace(/\s+/g, ' ');

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const stripCodeFence = (text = '') => {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
};

const getResponseText = (response) => {
  if (typeof response?.text === 'string') {
    return response.text;
  }

  if (typeof response?.text === 'function') {
    return response.text();
  }

  return '';
};

const generateJson = async ({ operation, prompt }) => {
  const client = getGeminiClient();
  const model = getModel();

  if (!client) {
    warnAI(`${operation}: GEMINI_API_KEY is missing, using local fallback`, {
      model
    });
    return null;
  }

  const startedAt = Date.now();
  logAI(`${operation}: sending request to Gemini`, {
    model,
    promptLength: prompt.length
  });

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = stripCodeFence(getResponseText(response));

  logAI(`${operation}: Gemini response received`, {
    durationMs: Date.now() - startedAt,
    responseLength: text.length
  });

  return text;
};

const fallbackTasks = (goal) => {
  const normalizedGoal = normalizeGoal(goal);

  return [
    {
      title: `Проаналізувати ціль: ${normalizedGoal}`,
      description: 'Визначити бажаний результат, дедлайн і потрібні матеріали.',
      priority: 'high'
    },
    {
      title: `Скласти короткий план: ${normalizedGoal}`,
      description: 'Розбити ціль на кілька зрозумілих кроків.',
      priority: 'high'
    },
    {
      title: `Зробити перший крок: ${normalizedGoal}`,
      description: 'Почати з найменшої практичної дії.',
      priority: 'medium'
    },
    {
      title: `Перевірити прогрес: ${normalizedGoal}`,
      description: 'Оцінити результат і скоригувати наступні дії.',
      priority: 'medium'
    }
  ];
};

const sanitizeTasks = (tasks, goal) => {
  if (!Array.isArray(tasks)) {
    return fallbackTasks(goal);
  }

  const sanitizedTasks = tasks
    .filter((task) => task?.title)
    .slice(0, 8)
    .map((task) => ({
      title: String(task.title).trim(),
      description: String(task.description || '').trim(),
      priority: allowedPriorities.includes(task.priority) ? task.priority : 'medium'
    }));

  return sanitizedTasks.length > 0 ? sanitizedTasks : fallbackTasks(goal);
};

export const generateTasksWithAI = async (goal) => {
  const operation = 'generate-tasks';

  try {
    const prompt = `Ти допомагаєш користувачу DailyFlow розбити ціль на задачі.
Згенеруй 4-6 практичних задач для цілі: "${normalizeGoal(goal)}".
Поверни тільки JSON-масив без markdown.
Кожен елемент має поля:
- title: коротка назва українською
- description: короткий опис українською
- priority: один з варіантів low, medium, high`;

    const text = await generateJson({ operation, prompt });

    if (!text) {
      logAI(`${operation}: local fallback returned`, {
        reason: 'missing_api_key',
        tasks: 4
      });
      return fallbackTasks(goal);
    }

    const parsedTasks = parseJson(text);

    if (!parsedTasks) {
      warnAI(`${operation}: invalid JSON from Gemini, using local fallback`, {
        preview: text.slice(0, 160)
      });
      return fallbackTasks(goal);
    }

    const tasks = sanitizeTasks(parsedTasks, goal);
    logAI(`${operation}: tasks ready`, {
      tasks: tasks.length,
      source: 'gemini'
    });

    return tasks;
  } catch (error) {
    warnAI(`${operation}: Gemini request failed, using local fallback`, {
      error: error.message
    });
    return fallbackTasks(goal);
  }
};

const fallbackDailySummary = ({ events = [], tasks = [], weather = {} }) => {
  const temperature =
    weather?.temperature !== undefined
      ? `${Math.round(weather.temperature) > 0 ? '+' : ''}${Math.round(weather.temperature)}°C`
      : 'без даних про погоду';
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === 'high' && !task.completed
  ).length;

  return {
    summary: `Сьогодні у вас ${tasks.length} задачі, ${events.length} події і погода ${temperature}.`,
    advice:
      highPriorityTasks > 0
        ? 'Спочатку варто виконати задачі з високим пріоритетом.'
        : 'Оберіть одну відкриту задачу і почніть з неї.'
  };
};

const sanitizeSummary = (summary, context) => {
  if (!summary?.summary || !summary?.advice) {
    return fallbackDailySummary(context);
  }

  return {
    summary: String(summary.summary).trim(),
    advice: String(summary.advice).trim()
  };
};

export const generateDailySummaryWithAI = async (context) => {
  const operation = 'daily-summary';

  try {
    const prompt = `Ти лаконічний український помічник продуктивності.
На основі JSON створи короткий підсумок дня:
${JSON.stringify(context)}

Поверни тільки JSON-об'єкт без markdown:
{
  "summary": "одне коротке речення",
  "advice": "одна практична порада"
}`;

    const text = await generateJson({ operation, prompt });

    if (!text) {
      logAI(`${operation}: local fallback returned`, {
        reason: 'missing_api_key'
      });
      return fallbackDailySummary(context);
    }

    const parsedSummary = parseJson(text);

    if (!parsedSummary) {
      warnAI(`${operation}: invalid JSON from Gemini, using local fallback`, {
        preview: text.slice(0, 160)
      });
      return fallbackDailySummary(context);
    }

    const summary = sanitizeSummary(parsedSummary, context);
    logAI(`${operation}: summary ready`, {
      source: 'gemini'
    });

    return summary;
  } catch (error) {
    warnAI(`${operation}: Gemini request failed, using local fallback`, {
      error: error.message
    });
    return fallbackDailySummary(context);
  }
};
