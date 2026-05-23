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
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const getModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const normalizeGoal = (goal) => goal.trim().replace(/\s+/g, ' ');

const buildFallbackProjectName = (goal) => {
  const normalizedGoal = normalizeGoal(goal);
  const shortGoal =
    normalizedGoal.length > 48 ? `${normalizedGoal.slice(0, 45).trim()}...` : normalizedGoal;

  return shortGoal || 'Новий проєкт';
};

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
      model,
    });
    return null;
  }

  const startedAt = Date.now();
  logAI(`${operation}: sending request to Gemini`, {
    model,
    promptLength: prompt.length,
  });

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = stripCodeFence(getResponseText(response));

  logAI(`${operation}: Gemini response received`, {
    durationMs: Date.now() - startedAt,
    responseLength: text.length,
  });

  return text;
};

const fallbackTasks = (goal) => {
  const normalizedGoal = normalizeGoal(goal);

  return [
    {
      title: `Проаналізувати ціль: ${normalizedGoal}`,
      description: 'Визначити бажаний результат, дедлайн і потрібні матеріали.',
      priority: 'high',
    },
    {
      title: `Скласти короткий план: ${normalizedGoal}`,
      description: 'Розбити ціль на кілька зрозумілих кроків.',
      priority: 'high',
    },
    {
      title: `Зробити перший крок: ${normalizedGoal}`,
      description: 'Почати з найменшої практичної дії.',
      priority: 'medium',
    },
    {
      title: `Перевірити прогрес: ${normalizedGoal}`,
      description: 'Оцінити результат і скоригувати наступні дії.',
      priority: 'medium',
    },
  ];
};

const fallbackTaskPlan = (goal) => ({
  projectName: buildFallbackProjectName(goal),
  tasks: fallbackTasks(goal),
});

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
      priority: allowedPriorities.includes(task.priority) ? task.priority : 'medium',
    }));

  return sanitizedTasks.length > 0 ? sanitizedTasks : fallbackTasks(goal);
};

const sanitizeTaskPlan = (taskPlan, goal) => {
  if (Array.isArray(taskPlan)) {
    return {
      projectName: buildFallbackProjectName(goal),
      tasks: sanitizeTasks(taskPlan, goal),
    };
  }

  return {
    projectName: String(taskPlan?.projectName || buildFallbackProjectName(goal)).trim(),
    tasks: sanitizeTasks(taskPlan?.tasks, goal),
  };
};

export const generateTasksWithAI = async (goal) => {
  const operation = 'generate-tasks';

  try {
    const prompt = `Ти допомагаєш користувачу DailyFlow розбити ціль на задачі.
Згенеруй коротку нормальну назву проєкту і 4-6 практичних задач для цілі: "${normalizeGoal(goal)}".
Поверни тільки JSON-об'єкт без markdown:
{
  "projectName": "коротка назва проєкту українською",
  "tasks": [
    {
      "title": "коротка назва задачі українською",
      "description": "короткий опис українською",
      "priority": "low | medium | high"
    }
  ]
}`;

    const text = await generateJson({ operation, prompt });

    if (!text) {
      logAI(`${operation}: local fallback returned`, {
        reason: 'missing_api_key',
        tasks: 4,
      });
      return fallbackTaskPlan(goal);
    }

    const parsedTasks = parseJson(text);

    if (!parsedTasks) {
      warnAI(`${operation}: invalid JSON from Gemini, using local fallback`, {
        preview: text.slice(0, 160),
      });
      return fallbackTaskPlan(goal);
    }

    const taskPlan = sanitizeTaskPlan(parsedTasks, goal);
    logAI(`${operation}: tasks ready`, {
      tasks: taskPlan.tasks.length,
      source: 'gemini',
    });

    return taskPlan;
  } catch (error) {
    warnAI(`${operation}: Gemini request failed, using local fallback`, {
      error: error.message,
    });
    return fallbackTaskPlan(goal);
  }
};

const fallbackDailySummary = ({ events = [], tasks = [], weather = {} }) => {
  const temperature =
    weather?.temperature !== undefined
      ? `${Math.round(weather.temperature) > 0 ? '+' : ''}${Math.round(weather.temperature)}°C`
      : 'без даних про погоду';
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === 'high' && !task.completed,
  ).length;

  return {
    summary: `Сьогодні у вас ${tasks.length} задачі, ${events.length} події і погода ${temperature}.`,
    advice:
      highPriorityTasks > 0
        ? 'Спочатку варто виконати задачі з високим пріоритетом.'
        : 'Оберіть одну відкриту задачу і почніть з неї.',
  };
};

const sanitizeSummary = (summary, context) => {
  if (!summary?.summary || !summary?.advice) {
    return fallbackDailySummary(context);
  }

  return {
    summary: String(summary.summary).trim(),
    advice: String(summary.advice).trim(),
  };
};

const pickFallbackTask = (tasks = []) => {
  const openTasks = tasks.filter((task) => !task.completed);

  if (openTasks.length === 0) {
    return null;
  }

  return [...openTasks].sort((firstTask, secondTask) => {
    const firstPriority = allowedPriorities.indexOf(firstTask.priority || 'medium');
    const secondPriority = allowedPriorities.indexOf(secondTask.priority || 'medium');
    const priorityDifference = secondPriority - firstPriority;

    if (priorityDifference !== 0) return priorityDifference;

    const firstDeadline = firstTask.deadline
      ? new Date(firstTask.deadline).getTime()
      : Number.MAX_SAFE_INTEGER;
    const secondDeadline = secondTask.deadline
      ? new Date(secondTask.deadline).getTime()
      : Number.MAX_SAFE_INTEGER;

    return firstDeadline - secondDeadline;
  })[0];
};

const fallbackNextAction = ({ events = [], tasks = [] }) => {
  const task = pickFallbackTask(tasks);
  const nextEvent = [...events]
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .sort((firstEvent, secondEvent) => new Date(firstEvent.date) - new Date(secondEvent.date))[0];

  if (!task) {
    return {
      action: nextEvent
        ? 'Перегляньте найближчу подію і залиште перед нею короткий буфер.'
        : 'Додайте одну конкретну задачу на сьогодні, щоб день мав точку старту.',
      focusMinutes: 15,
      reason: nextEvent
        ? `Найближча подія: ${nextEvent.title}. Варто підготуватися без поспіху.`
        : 'Зараз немає відкритих задач, тому найкраща дія — сформулювати наступний крок.',
      taskId: null,
      title: nextEvent ? 'Підготуватися до події' : 'Створити перший крок',
    };
  }

  return {
    action: `Почніть із задачі “${task.title}”.`,
    focusMinutes: task.priority === 'high' ? 25 : 15,
    reason: task.deadline
      ? 'Вона має дедлайн або вищий пріоритет, тому її краще не відкладати.'
      : 'Це найкращий відкритий крок за поточним пріоритетом.',
    taskId: task._id || null,
    title: task.title,
  };
};

const sanitizeNextAction = (recommendation, context) => {
  if (!recommendation?.title || !recommendation?.action || !recommendation?.reason) {
    return fallbackNextAction(context);
  }

  const focusMinutes = Number(recommendation.focusMinutes);

  return {
    action: String(recommendation.action).trim(),
    focusMinutes: Number.isFinite(focusMinutes)
      ? Math.min(Math.max(Math.round(focusMinutes), 5), 60)
      : 25,
    reason: String(recommendation.reason).trim(),
    taskId: recommendation.taskId ? String(recommendation.taskId) : null,
    title: String(recommendation.title).trim(),
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
        reason: 'missing_api_key',
      });
      return fallbackDailySummary(context);
    }

    const parsedSummary = parseJson(text);

    if (!parsedSummary) {
      warnAI(`${operation}: invalid JSON from Gemini, using local fallback`, {
        preview: text.slice(0, 160),
      });
      return fallbackDailySummary(context);
    }

    const summary = sanitizeSummary(parsedSummary, context);
    logAI(`${operation}: summary ready`, {
      source: 'gemini',
    });

    return summary;
  } catch (error) {
    warnAI(`${operation}: Gemini request failed, using local fallback`, {
      error: error.message,
    });
    return fallbackDailySummary(context);
  }
};

export const generateNextActionWithAI = async (context) => {
  const operation = 'next-action';

  try {
    const prompt = `Ти український AI-помічник DailyFlow. На основі задач і подій обери одну найкращу дію, яку користувачу варто зробити зараз.
Відповідай коротко, практично, без мотиваційної води.
Контекст:
${JSON.stringify(context)}

Поверни тільки JSON-об'єкт без markdown:
{
  "title": "коротка назва рекомендації",
  "action": "одна конкретна дія",
  "reason": "коротке пояснення чому саме це",
  "focusMinutes": 15,
  "taskId": "id задачі, якщо рекомендація прив'язана до задачі, інакше null"
}`;

    const text = await generateJson({ operation, prompt });

    if (!text) {
      logAI(`${operation}: local fallback returned`, {
        reason: 'missing_api_key',
      });
      return fallbackNextAction(context);
    }

    const parsedRecommendation = parseJson(text);

    if (!parsedRecommendation) {
      warnAI(`${operation}: invalid JSON from Gemini, using local fallback`, {
        preview: text.slice(0, 160),
      });
      return fallbackNextAction(context);
    }

    const recommendation = sanitizeNextAction(parsedRecommendation, context);
    logAI(`${operation}: recommendation ready`, {
      source: 'gemini',
    });

    return recommendation;
  } catch (error) {
    warnAI(`${operation}: Gemini request failed, using local fallback`, {
      error: error.message,
    });
    return fallbackNextAction(context);
  }
};
