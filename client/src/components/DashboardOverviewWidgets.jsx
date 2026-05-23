import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, CloudSun, Newspaper, Play, Plus, Target, Timer } from 'lucide-react';
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
    month: 'short',
  }).format(new Date(date));

const priorityLabels = {
  high: 'Високий',
  low: 'Низький',
  medium: 'Середній',
};

const priorityOrder = { high: 1, medium: 2, low: 3 };

const formatTemperature = (temperature) =>
  temperature !== undefined && temperature !== null ? `${Math.round(temperature)}°C` : '—';

const formatTaskDeadline = (deadline) => {
  if (!deadline) return 'Без дедлайну';

  const date = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const dayDifference = Math.round((targetDate - today) / 86400000);

  if (dayDifference < 0) return 'Прострочено';
  if (dayDifference === 0) return 'Сьогодні';
  if (dayDifference === 1) return 'Завтра';

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const sortDashboardTasks = (tasks) =>
  [...tasks].sort((firstTask, secondTask) => {
    const priorityDifference =
      priorityOrder[firstTask.priority || 'medium'] -
      priorityOrder[secondTask.priority || 'medium'];

    if (priorityDifference !== 0) return priorityDifference;

    const firstDeadline = firstTask.deadline
      ? new Date(firstTask.deadline).getTime()
      : Number.MAX_SAFE_INTEGER;
    const secondDeadline = secondTask.deadline
      ? new Date(secondTask.deadline).getTime()
      : Number.MAX_SAFE_INTEGER;

    return firstDeadline - secondDeadline;
  });

const initialQuickTask = {
  project: '',
  title: '',
};

const notifyTasksUpdated = () => {
  window.dispatchEvent(new Event('dailyflow:tasks-updated'));
};

export const TasksOverviewWidget = () => {
  const [projects, setProjects] = useState([]);
  const [quickTask, setQuickTask] = useState(initialQuickTask);
  const [quickTaskError, setQuickTaskError] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState('');

  const loadTasks = useCallback(async () => {
    const { data } = await api.get('/tasks');
    return data;
  }, []);

  const {
    error,
    isLoading,
    items: tasks,
    refresh,
  } = useAsyncList({
    fallbackError: 'Не вдалося завантажити задачі.',
    loadItems: loadTasks,
  });

  useEffect(() => {
    window.addEventListener('dailyflow:tasks-updated', refresh);

    return () => window.removeEventListener('dailyflow:tasks-updated', refresh);
  }, [refresh]);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        const { data } = await api.get('/projects');

        if (isMounted) {
          setProjects(data);
        }
      } catch {
        if (isMounted) {
          setProjects([]);
        }
      }
    };

    loadProjects();
    window.addEventListener('dailyflow:projects-updated', loadProjects);

    return () => {
      isMounted = false;
      window.removeEventListener('dailyflow:projects-updated', loadProjects);
    };
  }, []);

  const handleQuickTaskChange = (event) => {
    const { name, value } = event.target;
    setQuickTask((currentTask) => ({ ...currentTask, [name]: value }));
  };

  const handleQuickTaskSubmit = async (event) => {
    event.preventDefault();

    const title = quickTask.title.trim();
    if (!title) return;

    try {
      setIsCreatingTask(true);
      setQuickTaskError('');
      await api.post('/tasks', {
        deadline: null,
        description: '',
        priority: 'medium',
        project: quickTask.project || null,
        title,
      });
      setQuickTask(initialQuickTask);
      notifyTasksUpdated();
    } catch {
      setQuickTaskError('Не вдалося додати задачу. Спробуйте ще раз.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      setActiveTaskId(task._id);
      setQuickTaskError('');
      await api.put(`/tasks/${task._id}`, {
        completed: true,
      });
      notifyTasksUpdated();
    } catch {
      setQuickTaskError('Не вдалося оновити задачу. Спробуйте ще раз.');
    } finally {
      setActiveTaskId('');
    }
  };

  const openTasks = tasks.filter((task) => !task.completed);
  const previewTasks = sortDashboardTasks(openTasks).slice(0, 4);
  const overdueTasks = openTasks.filter(
    (task) => task.deadline && new Date(task.deadline).getTime() < Date.now(),
  ).length;
  const todayTasks = openTasks.filter(
    (task) => formatTaskDeadline(task.deadline) === 'Сьогодні',
  ).length;

  return (
    <article className='dashboard-card overview-widget tasks-overview-widget'>
      <div className='card-heading'>
        <div>
          <h2>
            <Target size={18} />
            Задачі
          </h2>
          <p>Короткий список відкритих задач.</p>
        </div>
        <span>{openTasks.length}</span>
      </div>

      {isLoading ? (
        <ModuleState tone='loading'>Завантажуємо задачі...</ModuleState>
      ) : error ? (
        <ModuleState tone='error'>{error}</ModuleState>
      ) : openTasks.length === 0 ? (
        <ModuleState>Відкритих задач немає. Додайте першу прямо тут.</ModuleState>
      ) : (
        <div className='overview-widget-content'>
          <div className='tasks-overview-stats'>
            <span>{todayTasks} сьогодні</span>
            <span>{overdueTasks} прострочено</span>
          </div>
          <ul className='overview-list tasks-overview-list'>
            {previewTasks.map((task) => (
              <li key={task._id}>
                <button
                  className='task-overview-complete'
                  type='button'
                  aria-label='Позначити виконаною'
                  onClick={() => handleCompleteTask(task)}
                  disabled={activeTaskId === task._id}
                >
                  <Check size={13} />
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.project?.name || 'Без проєкту'}</small>
                </div>
                <span>{formatTaskDeadline(task.deadline)}</span>
                <b>{priorityLabels[task.priority] || 'Середній'}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className='dashboard-quick-task' onSubmit={handleQuickTaskSubmit}>
        <input
          name='title'
          type='text'
          value={quickTask.title}
          onChange={handleQuickTaskChange}
          placeholder='Швидко додати задачу...'
        />
        <select
          name='project'
          value={quickTask.project}
          onChange={handleQuickTaskChange}
          aria-label='Проєкт для задачі'
        >
          <option value=''>Без проєкту</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
        <button type='submit' disabled={isCreatingTask || !quickTask.title.trim()}>
          <Plus size={14} />
          Додати
        </button>
      </form>
      {quickTaskError && <p className='dashboard-quick-task-error'>{quickTaskError}</p>}

      <Link className='overview-link' to='/tasks'>
        Перейти до задач
      </Link>
    </article>
  );
};

export const EventsOverviewWidget = () => {
  const loadEvents = useCallback(async () => {
    const { data } = await api.get('/events');
    return data;
  }, []);

  const {
    error,
    isLoading,
    items: events,
  } = useAsyncList({
    fallbackError: 'Не вдалося завантажити події.',
    loadItems: loadEvents,
  });

  const upcomingEvents = [...events]
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .sort((firstEvent, secondEvent) => new Date(firstEvent.date) - new Date(secondEvent.date))
    .slice(0, 3);

  return (
    <article className='dashboard-card overview-widget'>
      <div className='card-heading'>
        <div>
          <h2>
            <CalendarDays size={18} />
            Події
          </h2>
          <p>Найближчі дати.</p>
        </div>
        <span>{upcomingEvents.length}</span>
      </div>

      {isLoading ? (
        <ModuleState tone='loading'>Завантажуємо події...</ModuleState>
      ) : error ? (
        <ModuleState tone='error'>{error}</ModuleState>
      ) : upcomingEvents.length === 0 ? (
        <ModuleState>Найближчих подій немає. Створити подію можна в окремому розділі.</ModuleState>
      ) : (
        <ul className='overview-list'>
          {upcomingEvents.map((event) => (
            <li key={event._id}>
              <strong>{event.title}</strong>
              <span>{formatEventDate(event.date)}</span>
            </li>
          ))}
        </ul>
      )}

      <Link className='overview-link' to='/events'>
        Перейти до подій
      </Link>
    </article>
  );
};

export const NewsOverviewWidget = () => {
  const loadNews = useCallback(async () => {
    const { data } = await api.get('/news');
    return data;
  }, []);

  const {
    error,
    isLoading,
    items: articles,
  } = useAsyncList({
    fallbackError: 'Не вдалося завантажити новини.',
    loadItems: loadNews,
  });

  const previewArticles = articles.slice(0, 3);

  return (
    <article className='dashboard-card overview-widget news-overview-widget'>
      <div className='card-heading'>
        <div>
          <h2>
            <Newspaper size={18} /> Новини
          </h2>
          <p>Кілька заголовків.</p>
        </div>
        <span>{articles.length}</span>
      </div>

      {isLoading ? (
        <ModuleState tone='loading'>Завантажуємо новини...</ModuleState>
      ) : error ? (
        <ModuleState tone='error'>{error}</ModuleState>
      ) : previewArticles.length === 0 ? (
        <ModuleState>Новин зараз немає. Це не заважає планувати день.</ModuleState>
      ) : (
        <ul className='overview-list'>
          {previewArticles.map((article) => (
            <li key={article.url}>
              <strong>{article.title}</strong>
              <span>{article.source}</span>
            </li>
          ))}
        </ul>
      )}

      <Link className='overview-link' to='/news'>
        Перейти до новин
      </Link>
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
    loadItems: loadWeather,
  });

  const weather = items[0];

  return (
    <article className='dashboard-card overview-widget weather-overview-widget'>
      <div className='card-heading'>
        <div>
          <h2>
            <CloudSun size={18} /> Погода
          </h2>
          <p>Стислий прогноз.</p>
        </div>
        <span>{formatTemperature(weather?.temperature)}</span>
      </div>

      {isLoading ? (
        <ModuleState tone='loading'>Завантажуємо погоду...</ModuleState>
      ) : error ? (
        <ModuleState tone='error'>{error}</ModuleState>
      ) : (
        <div className='overview-weather'>
          <strong>{weather?.city || 'Ваше місто'}</strong>
          <p>{weather?.description || 'Дані про погоду недоступні'}</p>
          <dl className='overview-weather-details'>
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

      <Link className='overview-link' to='/weather'>
        Детальніше про погоду
      </Link>
    </article>
  );
};

export const FocusOverviewWidget = () => {
  const { completedSessions, isRunning, remainingSeconds, start } = useFocusTimer();

  return (
    <article className='dashboard-card overview-widget focus-overview-widget'>
      <div className='card-heading'>
        <div>
          <h2>
            <Timer size={18} />
            Таймер Помодоро
          </h2>
          <p>25хв роботи, 5хв перерви.</p>
        </div>
        <span>{completedSessions}</span>
      </div>

      <div className='overview-focus'>
        <strong>{formatFocusTime(remainingSeconds)}</strong>
        <p>
          {isRunning
            ? 'Сесія триває. Таймер доступний у куті екрана.'
            : 'Таймер готовий до старту.'}
        </p>
      </div>

      <div className='focus-overview-actions'>
        <button
          className='overview-action-button'
          type='button'
          onClick={start}
          disabled={isRunning}
        >
          <Play size={14} />
          {isRunning ? 'Таймер триває' : 'Почати таймер'}
        </button>
        <Link className='overview-link' to='/focus'>
          Відкрити таймер
        </Link>
      </div>
    </article>
  );
};
