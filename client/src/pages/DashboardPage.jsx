import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Settings2 } from 'lucide-react';
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

const optionalWidgets = [
  {
    id: 'events',
    label: 'Події',
    description: 'Найближчі дати.',
    component: EventsOverviewWidget,
    visible: true
  },
  {
    id: 'news',
    label: 'Новини',
    description: 'Кілька заголовків.',
    component: NewsOverviewWidget,
    visible: false
  }
];

const defaultSettings = optionalWidgets.map(({ id, visible }) => ({ id, visible }));

const readSettings = () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(storageKey));

    if (!Array.isArray(savedSettings)) {
      return defaultSettings;
    }

    const knownIds = new Set(optionalWidgets.map((widget) => widget.id));
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
    return new Map(optionalWidgets.map((widget) => [widget.id, widget]));
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

  const visibleOptionalSettings = settings.filter((item) => item.visible);

  return (
    <DashboardShell>
      <AppTopbar
        title="Сьогодні"
        subtitle="План дня, задачі та кілька корисних деталей поруч."
        actions={
          <button
            className="secondary-button"
            type="button"
            onClick={() => setIsCustomizing((currentValue) => !currentValue)}
          >
            <Settings2 size={15} />
            Вигляд
          </button>
        }
      />

      <section className="dashboard-workspace">
        <div className="dashboard-main-column">
          <DailySummaryWidget />
          <TasksOverviewWidget />

          {visibleOptionalSettings.map((item) => {
            const WidgetComponent = widgetsById.get(item.id)?.component;

            return WidgetComponent ? <WidgetComponent key={item.id} /> : null;
          })}
        </div>

        <aside className="dashboard-side-column">
          <WeatherOverviewWidget />
          <FocusOverviewWidget />
          <ProductivityStatsWidget />
          <AssistantBrief />

          {isCustomizing && (
            <article className="dashboard-card dashboard-customizer">
              <div className="card-heading">
                <div>
                  <h2><Settings2 size={17} /> Вигляд Dashboard</h2>
                  <p>Основні блоки залишаються на місці. Тут можна додати або сховати другорядні секції.</p>
                </div>
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
            </article>
          )}
        </aside>
      </section>
    </DashboardShell>
  );
};

export default DashboardPage;
