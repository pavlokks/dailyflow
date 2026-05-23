import React, { useCallback, useEffect } from 'react';
import { CalendarDays, CloudSun, Newspaper, Target, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAsyncList from '../hooks/useAsyncList.js';
import useFocusTimer, { formatFocusTime } from '../hooks/useFocusTimer.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const formatEventDate = (date) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short'
  }).format(new Date(date));

const priorityLabels = {
  high: 'високий',
  low: 'низький',
  medium: 'середній'
};

const formatTemperature = (temperature) =>
  temperature !== undefined && temperature !== null ? `${Math.round(temperature)}°C` : '—';

export const TasksOverviewWidget = () => {
  const loadTasks = useCallback(async () => {
    const { data } = await api.get('/tasks');
    return data;
  }, []);

  const { error, isLoading, items: tasks, refresh } = useAsyncList({
    fallbackError: 'Не вдалося завантажити задачі.',
    loadItems: loadTasks
  });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => window.removeEventListener('dailyflow:tasks-updated', refresh);
  }, [refresh]);

  const openTasks = tasks.filter((task) => !task.completed);
  const highPriorityTasks = openTasks.filter((task) => task.priority === 'high');
  const previewTasks = openTasks.slice(0, 3);

  return (
    <article className="dashboard-card overview-widget">
      <div className="card-heading">
        <div>
          <h2><Target size={18} /> Задачі на зараз</h2>
          <p>Короткий список без повної форми створення.</p>
        </div>
        <span>{openTasks.length}</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо задачі...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : openTasks.length === 0 ? (
        <ModuleState>Відкритих задач немає. Додати нову можна на сторінці задач.</ModuleState>
      ) : (
        <div className="overview-widget-content">
          <p className="overview-helper">
            Високий пріоритет: <strong>{highPriorityTasks.length}</strong>
          </p>
          <ul className="overview-list">
            {previewTasks.map((task) => (
              <li key={task._id}>
                <strong>{task.title}</strong>
                <span>{priorityLabels[task.priority] || 'середній'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link className="overview-link" to="/tasks">Перейти до задач</Link>
    </article>
  );
};

export const EventsOverviewWidget = () => {
  const loadEvents = useCallback(async () => {
    const { data } = await api.get('/events');
    return data;
  }, []);

  const { error, isLoading, items: events } = useAsyncList({
    fallbackError: 'Не вдалося завантажити події.',
    loadItems: loadEvents
  });

  const upcomingEvents = [...events]
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .sort((firstEvent, secondEvent) => new Date(firstEvent.date) - new Date(secondEvent.date))
    .slice(0, 3);

  return (
    <article className="dashboard-card overview-widget">
      <div className="card-heading">
        <div>
          <h2><CalendarDays size={18} /> Найближчі події</h2>
          <p>Тільки наступні дати, без повного календаря.</p>
        </div>
        <span>{upcomingEvents.length}</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо події...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : upcomingEvents.length === 0 ? (
        <ModuleState>Найближчих подій немає. Створити подію можна в окремому розділі.</ModuleState>
      ) : (
        <ul className="overview-list">
          {upcomingEvents.map((event) => (
            <li key={event._id}>
              <strong>{event.title}</strong>
              <span>{formatEventDate(event.date)}</span>
            </li>
          ))}
        </ul>
      )}

      <Link className="overview-link" to="/events">Перейти до подій</Link>
    </article>
  );
};

export const NewsOverviewWidget = () => {
  const loadNews = useCallback(async () => {
    const { data } = await api.get('/news');
    return data;
  }, []);

  const { error, isLoading, items: articles } = useAsyncList({
    fallbackError: 'Не вдалося завантажити новини.',
    loadItems: loadNews
  });

  const previewArticles = articles.slice(0, 3);

  return (
    <article className="dashboard-card overview-widget">
      <div className="card-heading">
        <div>
          <h2><Newspaper size={18} /> Новини</h2>
          <p>Кілька заголовків, якщо потрібен контекст.</p>
        </div>
        <span>{articles.length}</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо новини...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : previewArticles.length === 0 ? (
        <ModuleState>Новин зараз немає. Це не заважає планувати день.</ModuleState>
      ) : (
        <ul className="overview-list">
          {previewArticles.map((article) => (
            <li key={article.url}>
              <strong>{article.title}</strong>
              <span>{article.source}</span>
            </li>
          ))}
        </ul>
      )}

      <Link className="overview-link" to="/news">Перейти до новин</Link>
    </article>
  );
};

export const WeatherOverviewWidget = () => {
  const loadWeather = useCallback(async () => {
    const { data } = await api.get('/weather');
    return [data];
  }, []);

  const { error, isLoading, items } = useAsyncList({
    fallbackError: 'Не вдалося завантажити погоду.',
    loadItems: loadWeather
  });

  const weather = items[0];

  return (
    <article className="dashboard-card overview-widget weather-overview-widget">
      <div className="card-heading">
        <div>
          <h2><CloudSun size={18} /> Погода</h2>
          <p>Коротко для плану дня.</p>
        </div>
        <span>{formatTemperature(weather?.temperature)}</span>
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо погоду...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <div className="overview-weather">
          <strong>{weather?.city || 'Ваше місто'}</strong>
          <p>{weather?.description || 'Дані про погоду недоступні'}</p>
          <dl className="overview-weather-details">
            <div>
              <dt>Відчувається</dt>
              <dd>{formatTemperature(weather?.feelsLike)}</dd>
            </div>
            <div>
              <dt>Вітер</dt>
              <dd>{weather?.windSpeed ?? '—'} м/с</dd>
            </div>
            <div>
              <dt>Хмарність</dt>
              <dd>{weather?.clouds ?? '—'}%</dd>
            </div>
            <div>
              <dt>Тиск</dt>
              <dd>{weather?.pressure ?? '—'} гПа</dd>
            </div>
          </dl>
        </div>
      )}

      <Link className="overview-link" to="/weather">Детальніше про погоду</Link>
    </article>
  );
};

export const FocusOverviewWidget = () => {
  const { completedSessions, isRunning, remainingSeconds } = useFocusTimer();

  return (
    <article className="dashboard-card overview-widget focus-overview-widget">
      <div className="card-heading">
        <div>
          <h2><Timer size={18} /> Фокус</h2>
          <p>Стан поточної Pomodoro-сесії.</p>
        </div>
        <span>{completedSessions}</span>
      </div>

      <div className="overview-focus">
        <strong>{formatFocusTime(remainingSeconds)}</strong>
        <p>{isRunning ? 'Сесія триває. Таймер доступний у куті екрана.' : 'Таймер готовий до старту.'}</p>
      </div>

      <Link className="overview-link" to="/focus">
        {isRunning ? 'Відкрити таймер' : 'Почати фокус'}
      </Link>
    </article>
  );
};
