import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks, RefreshCw } from 'lucide-react';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const summaryCacheKey = 'dailyflowAiSummaryCache';
const autoRegenerateDelay = 900;
let summaryRequestPromise = null;

const buildFallbackSummary = ({ events, tasks, weather }) => {
  const temperature =
    weather?.temperature !== undefined
      ? `${Math.round(weather.temperature) > 0 ? '+' : ''}${Math.round(weather.temperature)}°C`
      : 'без даних про погоду';

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === 'high' && !task.completed
  ).length;

  return {
    advice:
      highPriorityTasks > 0
        ? 'Спочатку варто закрити задачі з високим пріоритетом.'
        : 'Оберіть одну невелику задачу і завершіть її першою.',
    summary: `Сьогодні: ${tasks.length} задач, ${events.length} подій, погода ${temperature}.`
  };
};

const buildSummarySignature = ({ events, tasks }) => {
  const taskSignature = tasks
    .map((task) => ({
      completed: Boolean(task.completed),
      deadline: task.deadline || null,
      id: task._id,
      priority: task.priority || 'medium',
      project: task.project?._id || task.project || null,
      title: task.title
    }))
    .sort((firstTask, secondTask) => String(firstTask.id).localeCompare(String(secondTask.id)));

  const eventSignature = events
    .map((event) => ({
      date: event.date,
      id: event._id,
      title: event.title
    }))
    .sort((firstEvent, secondEvent) => String(firstEvent.id).localeCompare(String(secondEvent.id)));

  return JSON.stringify({
    events: eventSignature,
    tasks: taskSignature
  });
};

const readSummaryCache = () => {
  try {
    return JSON.parse(localStorage.getItem(summaryCacheKey));
  } catch {
    return null;
  }
};

const writeSummaryCache = (summary) => {
  localStorage.setItem(summaryCacheKey, JSON.stringify(summary));
};

const runSingleSummaryRequest = async (context) => {
  if (!summaryRequestPromise) {
    summaryRequestPromise = api
      .post('/ai/daily-summary', context)
      .finally(() => {
        summaryRequestPromise = null;
      });
  }

  return summaryRequestPromise;
};

const formatUpdatedAt = (date) => {
  if (!date) return 'Ще не оновлювався';

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short'
  }).format(new Date(date));
};

const loadSummaryContext = async () => {
  const [tasksResponse, eventsResponse, weatherResponse] = await Promise.allSettled([
    api.get('/tasks'),
    api.get('/events'),
    api.get('/weather')
  ]);

  if (tasksResponse.status === 'rejected' || eventsResponse.status === 'rejected') {
    throw new Error('Не вдалося завантажити контекст дня.');
  }

  return {
    events: eventsResponse.value.data,
    tasks: tasksResponse.value.data,
    weather: weatherResponse.status === 'fulfilled' ? weatherResponse.value.data : {}
  };
};

const DailySummaryWidget = () => {
  const [summaryState, setSummaryState] = useState(() => readSummaryCache());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(() => !readSummaryCache());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSummaryStale, setIsSummaryStale] = useState(false);
  const debounceTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const summaryStateRef = useRef(summaryState);

  useEffect(() => {
    summaryStateRef.current = summaryState;
  }, [summaryState]);

  const regenerateSummary = useCallback(async ({ mode = 'manual' } = {}) => {
    const cachedSummary = readSummaryCache();
    const currentSummary = summaryStateRef.current;

    try {
      if (isMountedRef.current) {
        setError('');
        setIsLoading(!cachedSummary && !currentSummary);
        setIsRegenerating(true);
      }

      const context = await loadSummaryContext();
      const signature = buildSummarySignature(context);

      if (mode !== 'manual' && cachedSummary?.signature === signature) {
        const nextState = {
          advice: cachedSummary.advice,
          summary: cachedSummary.summary,
          signature: cachedSummary.signature,
          updatedAt: cachedSummary.updatedAt
        };

        summaryStateRef.current = nextState;
        if (isMountedRef.current) {
          setSummaryState(nextState);
          setIsSummaryStale(false);
        }
        return;
      }

      const { data } = await runSingleSummaryRequest(context);
      const nextSummary = {
        advice: data.advice,
        summary: data.summary
      };

      const updatedAt = new Date().toISOString();
      const cacheValue = {
        ...nextSummary,
        signature,
        updatedAt
      };

      writeSummaryCache(cacheValue);
      const nextState = {
        ...nextSummary,
        signature,
        updatedAt
      };

      summaryStateRef.current = nextState;
      if (isMountedRef.current) {
        setSummaryState(nextState);
        setIsSummaryStale(false);
      }
    } catch (requestError) {
      if (!cachedSummary && !currentSummary) {
        try {
          const context = await loadSummaryContext();
          const fallbackSummary = buildFallbackSummary(context);
          const updatedAt = new Date().toISOString();
          const cacheValue = {
            ...fallbackSummary,
            signature: buildSummarySignature(context),
            updatedAt
          };

          writeSummaryCache(cacheValue);
          summaryStateRef.current = cacheValue;
          if (isMountedRef.current) {
            setSummaryState(cacheValue);
            setIsSummaryStale(false);
          }
        } catch {
          // Keep the original error below.
        }
      }

      if (isMountedRef.current) {
        setError('Не вдалося оновити AI summary. Залишили останній збережений підсумок.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRegenerating(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const cachedSummary = readSummaryCache();

    if (cachedSummary) {
      summaryStateRef.current = cachedSummary;
      setSummaryState(cachedSummary);
      setIsLoading(false);
      loadSummaryContext()
        .then((context) => {
          if (isMountedRef.current) {
            setIsSummaryStale(buildSummarySignature(context) !== cachedSummary.signature);
          }
        })
        .catch(() => {
          // Keep cached summary visible if freshness check fails.
        });
    } else {
      regenerateSummary({ mode: 'initial' });
    }

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(debounceTimerRef.current);
    };
  }, [regenerateSummary]);

  useEffect(() => {
    const handleContextChanged = () => {
      setIsSummaryStale(true);
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        regenerateSummary({ mode: 'auto' });
      }, autoRegenerateDelay);
    };

    window.addEventListener('dailyflow:tasks-updated', handleContextChanged);
    window.addEventListener('dailyflow:events-updated', handleContextChanged);

    return () => {
      window.clearTimeout(debounceTimerRef.current);
      window.removeEventListener('dailyflow:tasks-updated', handleContextChanged);
      window.removeEventListener('dailyflow:events-updated', handleContextChanged);
    };
  }, [regenerateSummary]);

  return (
    <article className="dashboard-card daily-summary-card">
      <div className="card-heading">
        <div>
          <h2><ListChecks size={18} /> Підсумок дня</h2>
          <p>
            Оновлено: {formatUpdatedAt(summaryState?.updatedAt)}
            {isSummaryStale && !isRegenerating ? ' · Дані змінились, оновіть summary' : ''}
          </p>
        </div>
        <button
          className="summary-refresh-button"
          type="button"
          onClick={() => regenerateSummary({ mode: 'manual' })}
          disabled={isRegenerating}
        >
          <RefreshCw size={15} />
          {isRegenerating ? 'Оновлюємо...' : 'Оновити AI summary'}
        </button>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Формуємо підсумок...</ModuleState>
      ) : (
        <>
          {isRegenerating && <ModuleState tone="loading">Оновлюємо AI summary...</ModuleState>}
          {error && <ModuleState tone="error">{error}</ModuleState>}
          {summaryState ? (
            <div className="daily-summary-content">
              <p className="daily-summary-text">{summaryState.summary}</p>
              <p className="daily-summary-advice">{summaryState.advice}</p>
            </div>
          ) : (
            <ModuleState>AI summary ще немає.</ModuleState>
          )}
        </>
      )}
    </article>
  );
};

export default DailySummaryWidget;
