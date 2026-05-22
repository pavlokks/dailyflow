import React, { useEffect, useState } from 'react';
import {
  Bot,
  CalendarDays,
  CloudSun,
  LayoutDashboard,
  LogOut,
  Moon,
  Newspaper,
  Sun,
  Target,
  Timer,
  UserRound
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import FloatingFocusTimer from './FloatingFocusTimer.jsx';

const navigationItems = [
  { icon: LayoutDashboard, label: 'Огляд', to: '/dashboard' },
  { icon: Target, label: 'Задачі', to: '/tasks' },
  { icon: CalendarDays, label: 'Події', to: '/events' },
  { icon: Bot, label: 'Помічник', to: '/ai-assistant' },
  { icon: Timer, label: 'Фокус', to: '/focus' },
  { icon: Newspaper, label: 'Новини', to: '/news' },
  { icon: CloudSun, label: 'Погода', to: '/weather' },
  { icon: UserRound, label: 'Профіль', to: '/profile' }
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

  const ThemeIcon = theme === 'dark' ? Sun : Moon;

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
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
                }
                key={item.to}
                to={item.to}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={toggleTheme}>
            <ThemeIcon size={16} />
            {theme === 'dark' ? 'Світла тема' : 'Темна тема'}
          </button>
          <button type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Вийти
          </button>
        </div>
      </aside>

      <div className="dashboard-main">{children}</div>
      <FloatingFocusTimer />
    </main>
  );
};

export default DashboardShell;
