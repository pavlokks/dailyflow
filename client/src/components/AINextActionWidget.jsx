import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Brain, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const cacheKey = 'dailyflowAiNextActionCache';
const autoRefreshDelay = 2500;
let nextActionRequestPromise = null;

const buildContextSignature = ({ events, tasks }) => {
  const taskSignature = tasks
    .map((task) => ({
      completed: Boolean(task.completed),
      deadline: task.deadline || null,
      id: task._id,
      priority: task.priority || 'medium',
      title: task.title,
    }))
    .sort((firstTask, secondTask) => String(firstTask.id).localeCompare(String(secondTask.id)));

  const eventSignature = events
    .map((event) => ({
      date: event.date,
      id: event._id,
      title: event.title,
    }))
    .sort((firstEvent, secondEvent) => String(firstEvent.id).localeCompare(String(secondEvent.id)));

  return JSON.stringify({
    events: eventSignature,
    tasks: taskSignature,
  });
};

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey));
  } catch {
    return null;
  }
};

const writeCache = (value) => {
  localStorage.setItem(cacheKey, JSON.stringify(value));
};

const loadContext = async () => {
  const [tasksResponse, eventsResponse] = await Promise.all([
    api.get('/tasks'),
    api.get('/events'),
  ]);

  return {
    events: eventsResponse.data,
    tasks: tasksResponse.data,
  };
};

const runSingleRequest = async (context) => {
  if (!nextActionRequestPromise) {
    nextActionRequestPromise = api.post('/ai/next-action', context).finally(() => {
      nextActionRequestPromise = null;
    });
  }

  return nextActionRequestPromise;
};

const formatUpdatedAt = (date) => {
  if (!date) return 'Ще не оновлювалось';

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(date));
};

const AINextActionWidget = () => {
  const [recommendation, setRecommendation] = useState(() => readCache());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(() => !readCache());
  const debounceTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const refreshRecommendation = useCallback(async ({ initial = false } = {}) => {
    const cachedRecommendation = readCache();

    try {
      if (isMountedRef.current) {
        setError('');
        setIsLoading(!cachedRecommendation || !initial);
      }

      const context = await loadContext();
      const signature = buildContextSignature(context);

      if (initial && cachedRecommendation?.signature === signature) {
        if (isMountedRef.current) {
          setRecommendation(cachedRecommendation);
          setIsLoading(false);
        }
        return;
      }

      const { data } = await runSingleRequest(context);
      const nextValue = {
        ...data,
        signature,
        updatedAt: new Date().toISOString(),
      };

      writeCache(nextValue);

      if (isMountedRef.current) {
        setRecommendation(nextValue);
      }
    } catch {
      if (isMountedRef.current) {
        setError('Не вдалося оновити AI пораду. Залишили останню збережену.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const cachedRecommendation = readCache();

    if (cachedRecommendation) {
      setRecommendation(cachedRecommendation);
      setIsLoading(false);
      loadContext()
        .then((context) => {
          if (
            isMountedRef.current &&
            buildContextSignature(context) !== cachedRecommendation.signature
          ) {
            window.clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = window.setTimeout(() => {
              refreshRecommendation();
            }, autoRefreshDelay);
          }
        })
        .catch(() => {
          // Keep cached recommendation visible.
        });
    } else {
      refreshRecommendation({ initial: true });
    }

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(debounceTimerRef.current);
    };
  }, [refreshRecommendation]);

  useEffect(() => {
    const handleContextChanged = () => {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        refreshRecommendation();
      }, autoRefreshDelay);
    };

    window.addEventListener('dailyflow:tasks-updated', handleContextChanged);
    window.addEventListener('dailyflow:events-updated', handleContextChanged);

    return () => {
      window.clearTimeout(debounceTimerRef.current);
      window.removeEventListener('dailyflow:tasks-updated', handleContextChanged);
      window.removeEventListener('dailyflow:events-updated', handleContextChanged);
    };
  }, [refreshRecommendation]);

  return (
    <article className='dashboard-card ai-next-action-card'>
      <div className='card-heading'>
        <div>
          <h2>
            <Brain size={18} /> Що робити зараз?
          </h2>
          <p>Оновлено: {formatUpdatedAt(recommendation?.updatedAt)}</p>
        </div>
      </div>

      {isLoading && !recommendation ? (
        <ModuleState tone='loading'>AI обирає наступну дію...</ModuleState>
      ) : (
        <>
          {error && <ModuleState tone='error'>{error}</ModuleState>}
          {recommendation ? (
            <div className='ai-next-action-content'>
              <div>
                <strong>{recommendation.title}</strong>
                <p>{recommendation.action}</p>
              </div>
              <div className='ai-next-action-meta'>
                <span>
                  <Timer size={14} /> {recommendation.focusMinutes || 25} хв
                </span>
                <small>{recommendation.reason}</small>
              </div>
              <Link className='overview-link' to='/tasks'>
                Перейти до задач
              </Link>
            </div>
          ) : (
            <ModuleState>AI-поради ще немає.</ModuleState>
          )}
        </>
      )}
    </article>
  );
};

export default AINextActionWidget;
