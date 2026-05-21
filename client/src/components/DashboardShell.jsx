import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navigationItems = [
  {
    label: 'Огляд',
    to: '/dashboard'
  },
  {
    label: 'Задачі',
    to: '/tasks'
  },
  {
    label: 'Події',
    to: '/events'
  },
  {
    label: 'AI-помічник',
    to: '/ai-assistant'
  },
  {
    label: 'Фокус',
    to: '/focus'
  },
  {
    label: 'Новини',
    to: '/news'
  },
  {
    label: 'Погода',
    to: '/weather'
  },
  {
    label: 'Профіль',
    to: '/profile'
  }
];

const DashboardShell = ({ children }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem('dailyflowTheme') || 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dailyflowTheme', theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem('dailyflowToken');
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <main className="dashboard-page">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span>DF</span>
          <div>
            <strong>DailyFlow</strong>
            <p>персональний вебпомічник</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Основна навігація">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Тема інтерфейсу</p>
          <button type="button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Світла тема' : 'Темна тема'}
          </button>
          <button type="button" onClick={handleLogout}>
            Вийти
          </button>
        </div>
      </aside>

      <div className="dashboard-main">{children}</div>
    </main>
  );
};

export default DashboardShell;
