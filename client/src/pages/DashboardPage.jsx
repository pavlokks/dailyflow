import React from 'react';
import { useNavigate } from 'react-router-dom';
import TasksModule from '../components/TasksModule.jsx';

const dashboardSections = [
  {
    title: 'Weather',
    value: '18C',
    description: 'Kyiv, partly cloudy',
    items: ['Feels like 16C', 'Humidity 62%', 'Wind 8 km/h']
  },
  {
    title: 'Events',
    value: '3',
    description: 'Upcoming calendar events',
    items: ['Team sync at 10:00', 'Study block at 14:30', 'Gym at 18:00']
  },
  {
    title: 'News',
    value: '4',
    description: 'Latest saved headlines',
    items: ['Productivity tools update', 'Local tech meetup announced', 'Weather changes this week']
  }
];

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
        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="dashboard-grid">
        <TasksModule />

        {dashboardSections.map((section) => (
          <article className="dashboard-card" key={section.title}>
            <div className="card-heading">
              <h2>{section.title}</h2>
              <span>{section.value}</span>
            </div>
            <p>{section.description}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
};

export default DashboardPage;
