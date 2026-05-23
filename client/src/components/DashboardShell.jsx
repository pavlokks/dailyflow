import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CalendarDays,
  CloudSun,
  Folder,
  ListTodo,
  LayoutDashboard,
  Newspaper,
  Target,
  Timer,
  UserRound
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import api from '../services/api.js';
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
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const selectedProject = new URLSearchParams(location.search).get('project') || 'all';
  const isTasksPage = location.pathname === '/tasks';

  const loadProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    window.addEventListener('dailyflow:projects-updated', loadProjects);

    return () => window.removeEventListener('dailyflow:projects-updated', loadProjects);
  }, [loadProjects]);

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

        <section className="sidebar-projects" aria-label="Проекти">
          <p>Проекти</p>
          <Link
            className={
              isTasksPage && selectedProject === 'all'
                ? 'sidebar-project-link sidebar-project-link-active'
                : 'sidebar-project-link'
            }
            to="/tasks"
          >
            <ListTodo size={15} />
            <span>Усі задачі</span>
          </Link>
          <Link
            className={
              isTasksPage && selectedProject === 'none'
                ? 'sidebar-project-link sidebar-project-link-active'
                : 'sidebar-project-link'
            }
            to="/tasks?project=none"
          >
            <Folder size={15} />
            <span>Без проєкту</span>
          </Link>
          {projects.slice(0, 8).map((project) => (
            <Link
              className={
                isTasksPage && selectedProject === project._id
                  ? 'sidebar-project-link sidebar-project-link-active'
                  : 'sidebar-project-link'
              }
              key={project._id}
              to={`/tasks?project=${project._id}`}
            >
              <Folder size={15} />
              <span>{project.name}</span>
            </Link>
          ))}
        </section>

        <div className="sidebar-footer" aria-hidden="true" />
      </aside>

      <div className="dashboard-main">{children}</div>
      <FloatingFocusTimer />
    </main>
  );
};

export default DashboardShell;
