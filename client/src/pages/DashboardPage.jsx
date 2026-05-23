import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Settings2, X } from 'lucide-react';
import AppTopbar from '../components/AppTopbar.jsx';
import AssistantBrief from '../components/AssistantBrief.jsx';
import DailySummaryWidget from '../components/DailySummaryWidget.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import {
  EventsOverviewWidget,
  FocusOverviewWidget,
  NewsOverviewWidget,
  TasksOverviewWidget,
  WeatherOverviewWidget
} from '../components/DashboardOverviewWidgets.jsx';
import ProductivityStatsWidget from '../components/ProductivityStatsWidget.jsx';

const storageKey = 'dailyflowDashboardWidgets';

const dashboardWidgets = [
  {
    id: 'dailySummary',
    label: 'AI Daily Summary',
    description: 'Короткий підсумок дня.',
    component: DailySummaryWidget,
    region: 'main',
    visible: true
  },
  {
    id: 'events',
    label: 'Events',
    description: 'Найближчі дати.',
    component: EventsOverviewWidget,
    region: 'main',
    visible: true
  },
  {
    id: 'news',
    label: 'News',
    description: 'Кілька заголовків.',
    component: NewsOverviewWidget,
    region: 'main',
    visible: false
  },
  {
    id: 'weather',
    label: 'Weather',
    description: 'Короткий прогноз.',
    component: WeatherOverviewWidget,
    region: 'side',
    visible: true
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Стан Pomodoro-таймера.',
    component: FocusOverviewWidget,
    region: 'side',
    visible: true
  },
  {
    id: 'productivityStats',
    label: 'Productivity Statistics',
    description: 'Прогрес задач і подій.',
    component: ProductivityStatsWidget,
    region: 'side',
    visible: true
  },
  {
    id: 'aiOverview',
    label: 'AI Overview',
    description: 'Короткий стан дня.',
    component: AssistantBrief,
    region: 'side',
    visible: true
  }
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
      (item) => !validSavedSettings.some((savedItem) => savedItem.id === item.id)
    );

    return [...validSavedSettings, ...missingSettings];
  } catch {
    return defaultSettings;
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(storageKey, JSON.stringify(settings));
};

const DashboardPage = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [settings, setSettings] = useState(readSettings);

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
        item.id === widgetId ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const moveWidget = (widgetId, direction) => {
    updateSettings((currentSettings) => {
      const currentIndex = currentSettings.findIndex((item) => item.id === widgetId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentSettings.length) {
        return currentSettings;
      }

      const nextSettings = [...currentSettings];
      const [movedWidget] = nextSettings.splice(currentIndex, 1);
      nextSettings.splice(nextIndex, 0, movedWidget);

      return nextSettings;
    });
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
        title="Сьогодні"
        subtitle="План дня, задачі та кілька корисних деталей поруч."
        actions={
          <button
            className="secondary-button"
            type="button"
            onClick={() => setIsCustomizing(true)}
          >
            <Settings2 size={15} />
            Налаштувати Dashboard
          </button>
        }
      />

      <section className="dashboard-workspace">
        <div className="dashboard-main-column">
          {visibleMainWidgets.map((item) => {
            const WidgetComponent = widgetsById.get(item.id)?.component;
            return WidgetComponent ? <WidgetComponent key={item.id} /> : null;
          })}

          <TasksOverviewWidget />
        </div>

        <aside className="dashboard-side-column">
          {visibleSideWidgets.map((item) => {
            const WidgetComponent = widgetsById.get(item.id)?.component;
            return WidgetComponent ? <WidgetComponent key={item.id} /> : null;
          })}
        </aside>
      </section>

      {isCustomizing && (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCustomizing(false);
            }
          }}
        >
          <section
            className="dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-modal-title"
          >
            <div className="dashboard-modal-header">
              <div>
                <h2 id="dashboard-modal-title">Налаштувати Dashboard</h2>
                <p>Покажіть тільки ті блоки, які потрібні на огляді дня.</p>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Закрити"
                onClick={() => setIsCustomizing(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="customizer-list">
              {settings.map((item, index) => {
                const widget = widgetsById.get(item.id);

                return (
                  <div className="customizer-item" key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={() => toggleWidget(item.id)}
                      />
                      <span>
                        <strong>{widget.label}</strong>
                        <small>{widget.description}</small>
                      </span>
                    </label>
                    <div className="customizer-actions">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveWidget(item.id, -1)}
                      >
                        <ArrowUp size={14} />
                        Вгору
                      </button>
                      <button
                        type="button"
                        disabled={index === settings.length - 1}
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

            <div className="dashboard-modal-footer">
              <button
                className="secondary-button"
                type="button"
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
