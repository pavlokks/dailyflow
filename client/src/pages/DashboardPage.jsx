import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Settings2, X } from 'lucide-react';
import AINextActionWidget from '../components/AINextActionWidget.jsx';
import AppTopbar from '../components/AppTopbar.jsx';
import AssistantBrief from '../components/AssistantBrief.jsx';
import DailySummaryWidget from '../components/DailySummaryWidget.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import {
  EventsOverviewWidget,
  FocusOverviewWidget,
  NewsOverviewWidget,
  TasksOverviewWidget,
  WeatherOverviewWidget,
} from '../components/DashboardOverviewWidgets.jsx';
import ProductivityStatsWidget from '../components/ProductivityStatsWidget.jsx';
import api from '../services/api.js';

const storageKey = 'dailyflowDashboardWidgets';

const dashboardWidgets = [
  {
    id: 'aiOverview',
    label: 'AI Overview',
    description: 'Короткий стан дня.',
    component: AssistantBrief,
    region: 'main',
    visible: true,
  },
  {
    id: 'nextAction',
    label: 'AI Next Action',
    description: 'Одна практична порада, що робити зараз.',
    component: AINextActionWidget,
    region: 'main',
    visible: true,
  },
  {
    id: 'dailySummary',
    label: 'AI Daily Summary',
    description: 'Короткий підсумок дня.',
    component: DailySummaryWidget,
    region: 'main',
    visible: true,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Короткий список відкритих задач.',
    component: TasksOverviewWidget,
    region: 'main',
    visible: true,
  },
  {
    id: 'events',
    label: 'Events',
    description: 'Найближчі дати.',
    component: EventsOverviewWidget,
    region: 'main',
    visible: true,
  },
  {
    id: 'news',
    label: 'News',
    description: 'Кілька заголовків.',
    component: NewsOverviewWidget,
    region: 'main',
    visible: false,
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Стан Pomodoro-таймера.',
    component: FocusOverviewWidget,
    region: 'side',
    visible: true,
  },
  {
    id: 'weather',
    label: 'Weather',
    description: 'Короткий прогноз.',
    component: WeatherOverviewWidget,
    region: 'side',
    visible: true,
  },
  {
    id: 'productivityStats',
    label: 'Productivity Statistics',
    description: 'Прогрес задач і подій.',
    component: ProductivityStatsWidget,
    region: 'side',
    visible: true,
  },
];

const defaultSettings = dashboardWidgets.map(({ id, visible }) => ({ id, visible }));

const readSettings = () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(storageKey));

    if (!Array.isArray(savedSettings)) {
      return defaultSettings;
    }

    const knownIds = new Set(dashboardWidgets.map((widget) => widget.id));
    const validSavedSettings = savedSettings.filter((item) => knownIds.has(item.id));
    const missingSettings = defaultSettings.filter(
      (item) => !validSavedSettings.some((savedItem) => savedItem.id === item.id),
    );

    if (missingSettings.length > 0) {
      return defaultSettings.map((defaultItem) => {
        const savedItem = validSavedSettings.find((item) => item.id === defaultItem.id);
        return savedItem ? { ...defaultItem, visible: savedItem.visible } : defaultItem;
      });
    }

    return [...validSavedSettings, ...missingSettings];
  } catch {
    return defaultSettings;
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(storageKey, JSON.stringify(settings));
};

const getMillisecondsUntilNextMinute = () => {
  const now = new Date();
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
};

const formatDashboardDate = (date) => {
  const formattedDate = new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `Сьогодні, ${formattedDate} · ${formattedTime}`;
};

const DashboardPage = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [settings, setSettings] = useState(readSettings);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [profileName, setProfileName] = useState('');

  const widgetsById = useMemo(() => {
    return new Map(dashboardWidgets.map((widget) => [widget.id, widget]));
  }, []);

  useEffect(() => {
    if (!isCustomizing) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCustomizing(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isCustomizing]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const name = data?.user?.name?.trim();

        if (isMounted && name) {
          setProfileName(name);
        }
      } catch {
        if (isMounted) {
          setProfileName('');
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let intervalId;
    const timeoutId = window.setTimeout(() => {
      setCurrentDate(new Date());
      intervalId = window.setInterval(() => {
        setCurrentDate(new Date());
      }, 60000);
    }, getMillisecondsUntilNextMinute());

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const updateSettings = (updater) => {
    setSettings((currentSettings) => {
      const nextSettings = updater(currentSettings);
      saveSettings(nextSettings);
      return nextSettings;
    });
  };

  const toggleWidget = (widgetId) => {
    updateSettings((currentSettings) =>
      currentSettings.map((item) =>
        item.id === widgetId ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  const moveWidget = (widgetId, direction) => {
    updateSettings((currentSettings) => {
      const currentIndex = currentSettings.findIndex((item) => item.id === widgetId);
      const currentWidget = widgetsById.get(widgetId);

      if (currentIndex < 0 || !currentWidget) {
        return currentSettings;
      }

      const sameRegionSettings = currentSettings.filter(
        (item) => widgetsById.get(item.id)?.region === currentWidget.region,
      );
      const regionIndex = sameRegionSettings.findIndex((item) => item.id === widgetId);
      const nextRegionItem = sameRegionSettings[regionIndex + direction];

      if (!nextRegionItem) {
        return currentSettings;
      }

      const nextIndex = currentSettings.findIndex((item) => item.id === nextRegionItem.id);
      const nextSettings = [...currentSettings];
      [nextSettings[currentIndex], nextSettings[nextIndex]] = [
        nextSettings[nextIndex],
        nextSettings[currentIndex],
      ];

      return nextSettings;
    });
  };

  const getSectionSettings = (region) =>
    settings.filter((item) => widgetsById.get(item.id)?.region === region);

  const renderCustomizerSection = ({ region, title }) => {
    const sectionSettings = getSectionSettings(region);

    return (
      <section className='customizer-section'>
        <h3>{title}</h3>
        <div className='customizer-list'>
          {sectionSettings.map((item, index) => {
            const widget = widgetsById.get(item.id);

            return (
              <div className='customizer-item' key={item.id}>
                <label>
                  <input
                    type='checkbox'
                    checked={item.visible}
                    onChange={() => toggleWidget(item.id)}
                  />
                  <span>
                    <strong>{widget.label}</strong>
                    <small>{widget.description}</small>
                  </span>
                </label>
                <div className='customizer-actions'>
                  <button
                    type='button'
                    disabled={index === 0}
                    onClick={() => moveWidget(item.id, -1)}
                  >
                    <ArrowUp size={14} />
                    Вгору
                  </button>
                  <button
                    type='button'
                    disabled={index === sectionSettings.length - 1}
                    onClick={() => moveWidget(item.id, 1)}
                  >
                    <ArrowDown size={14} />
                    Вниз
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const visibleMainWidgets = settings.filter((item) => {
    const widget = widgetsById.get(item.id);
    return item.visible && widget?.region === 'main';
  });

  const visibleSideWidgets = settings.filter((item) => {
    const widget = widgetsById.get(item.id);
    return item.visible && widget?.region === 'side';
  });

  return (
    <DashboardShell>
      <AppTopbar
        title={profileName ? `Привіт, ${profileName}` : 'Привіт'}
        subtitle={formatDashboardDate(currentDate)}
        actions={
          <button className='secondary-button' type='button' onClick={() => setIsCustomizing(true)}>
            <Settings2 size={15} />
            Налаштувати панель
          </button>
        }
      />

      <section className='dashboard-workspace'>
        <div className='dashboard-main-column'>
          {visibleMainWidgets.map((item) => {
            const WidgetComponent = widgetsById.get(item.id)?.component;
            return WidgetComponent ? <WidgetComponent key={item.id} /> : null;
          })}
        </div>

        <aside className='dashboard-side-column'>
          {visibleSideWidgets.map((item) => {
            const WidgetComponent = widgetsById.get(item.id)?.component;
            return WidgetComponent ? <WidgetComponent key={item.id} /> : null;
          })}
        </aside>
      </section>

      {isCustomizing && (
        <div
          className='dashboard-modal-overlay'
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCustomizing(false);
            }
          }}
        >
          <section
            className='dashboard-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='dashboard-modal-title'
          >
            <div className='dashboard-modal-header'>
              <div>
                <h2 id='dashboard-modal-title'>Налаштувати Dashboard</h2>
                <p>Покажіть тільки ті блоки, які потрібні на огляді дня.</p>
              </div>
              <button
                className='modal-close-button'
                type='button'
                aria-label='Закрити'
                onClick={() => setIsCustomizing(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className='customizer-sections'>
              {renderCustomizerSection({ region: 'main', title: 'Main column' })}
              {renderCustomizerSection({ region: 'side', title: 'Sidebar widgets' })}
            </div>

            <div className='dashboard-modal-footer'>
              <button
                className='secondary-button'
                type='button'
                onClick={() => setIsCustomizing(false)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
};

export default DashboardPage;
