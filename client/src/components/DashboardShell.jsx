import React from 'react';
import {
  Bot,
  CalendarDays,
  CloudSun,
  LayoutDashboard,
  Newspaper,
  Target,
  Timer,
  UserRound
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
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
  return (
    <main className="dashboard-page">
      <aside className="app-sidebar">
        <Link className="sidebar-brand" to="/">
          <span>DF</span>
          <div>
            <strong>DailyFlow</strong>
            <p>персональний вебпомічник</p>
          </div>
        </Link>

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

        <div className="sidebar-footer" aria-hidden="true" />
      </aside>

      <div className="dashboard-main">{children}</div>
      <FloatingFocusTimer />
    </main>
  );
};

export default DashboardShell;
