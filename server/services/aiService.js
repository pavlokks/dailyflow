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

const getModel = () => process.env.GEMINI_MODEL;

const normalizeGoal = (goal) => goal.trim().replace(/\s+/g, ' ');

const formatUserLocalTime = ({ localTime, timezone } = {}) => {
  if (!localTime) return '';

  const parsedDate = new Date(localTime);
  if (Number.isNaN(parsedDate.getTime())) return localTime;

  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: '2-digit',
        timeZone: timezone || 'UTC',
        year: 'numeric',
      })
        .formatToParts(parsedDate)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  } catch {
    try {
      return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: '2-digit',
      timeZone: timezone || 'UTC',
      year: 'numeric',
      })
        .format(parsedDate)
        .replace(',', '');
    } catch {
      return localTime;
    }
  }
};

const buildTimeInstruction = (userTime = {}) => {
  const timezone = userTime.timezone || 'невідомий';
  const localTime = formatUserLocalTime(userTime) || userTime.localTime || 'невідомий';

  return `Поточний локальний час користувача: ${localTime}
Часовий пояс: ${timezone}
Gemini не повинен самостійно вгадувати поточний час. Усі AI-поради, підсумки та відповіді, пов'язані з датою або часом, мають використовувати цей локальний час користувача.`;
};

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
      deadline: task.deadline || null,
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

export const generateTasksWithAI = async (goal, { userTime } = {}) => {
  const operation = 'generate-tasks';

  try {
    const prompt = `Ти допомагаєш користувачу DailyFlow розбити ціль на задачі.
${buildTimeInstruction(userTime)}

Згенеруй коротку нормальну назву проєкту і 4-6 практичних задач для цілі: "${normalizeGoal(goal)}".
Поверни тільки JSON-об'єкт без markdown:
{
  "projectName": "коротка назва проєкту українською",
  "tasks": [
    {
      "title": "коротка назва задачі українською",
      "description": "короткий опис українською",
      "deadline": "YYYY-MM-DD або null",
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

const getUserReferenceTime = ({ userTime } = {}) => {
  const parsedTime = userTime?.localTime ? new Date(userTime.localTime).getTime() : NaN;
  return Number.isNaN(parsedTime) ? Date.now() : parsedTime;
};

const fallbackNextAction = (context = {}) => {
  const { events = [], tasks = [] } = context;
  const task = pickFallbackTask(tasks);
  const referenceTime = getUserReferenceTime(context);
  const nextEvent = [...events]
    .filter((event) => new Date(event.date).getTime() >= referenceTime)
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
  const knownTaskIds = new Set((context.tasks || []).map((task) => String(task._id || task.id)));
  const taskId = recommendation.taskId ? String(recommendation.taskId) : null;

  return {
    action: String(recommendation.action).trim(),
    focusMinutes: Number.isFinite(focusMinutes)
      ? Math.min(Math.max(Math.round(focusMinutes), 5), 60)
      : 25,
    reason: String(recommendation.reason).trim(),
    taskId: taskId && knownTaskIds.has(taskId) ? taskId : null,
    title: String(recommendation.title).trim(),
  };
};

export const generateDailySummaryWithAI = async (context) => {
  const operation = 'daily-summary';

  try {
    const prompt = `Ти лаконічний український помічник продуктивності.
${buildTimeInstruction(context.userTime)}

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
${buildTimeInstruction(context.userTime)}

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

const fallbackAssistantReply = ({ message, context }) => {
  const openTasks = (context.tasks || []).filter((task) => !task.completed);
  const nextTask = pickFallbackTask(context.tasks || []);

  if (!openTasks.length) {
    return {
      reply:
        'Зараз немає відкритих задач. Додайте одну конкретну задачу або попросіть мене розбити ціль на кроки.',
    };
  }

  return {
    reply: `Я бачу ${openTasks.length} відкритих задач. Почніть із "${nextTask?.title || openTasks[0].title}", а потім поверніться до запиту: ${message}`,
  };
};

export const generateAssistantReplyWithAI = async ({ context, message }) => {
  const operation = 'assistant-command';

  try {
    const prompt = `Ти український AI-помічник DailyFlow. Відповідай коротко і практично.
${buildTimeInstruction(context.userTime)}

Користувач може просити перепланувати день, пояснити що робити далі, знайти ризики або розбити роботу.
Контекст:
${JSON.stringify(context)}

Запит користувача:
${message}

Поверни тільки JSON-об'єкт без markdown:
{
  "reply": "коротка корисна відповідь українською"
}`;

    const text = await generateJson({ operation, prompt });

    if (!text) {
      return fallbackAssistantReply({ context, message });
    }

    const parsedReply = parseJson(text);

    if (!parsedReply?.reply) {
      return fallbackAssistantReply({ context, message });
    }

    return {
      reply: String(parsedReply.reply).trim(),
    };
  } catch (error) {
    warnAI(`${operation}: Gemini request failed, using local fallback`, {
      error: error.message,
    });
    return fallbackAssistantReply({ context, message });
  }
};
