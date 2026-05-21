import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EventsModule from '../components/EventsModule.jsx';
import NewsModule from '../components/NewsModule.jsx';
import TasksModule from '../components/TasksModule.jsx';
import WeatherCard from '../components/WeatherCard.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('dailyflowToken');
    navigate('/login');
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">DailyFlow</p>
          <h1>Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <Link className="secondary-button" to="/profile">
            Profile
          </Link>
          <button className="logout-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        <TasksModule />
        <EventsModule />
        <WeatherCard />
        <NewsModule />
      </section>
    </main>
  );
};

export default DashboardPage;
