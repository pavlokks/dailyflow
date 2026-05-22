import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import WeatherCard from '../components/WeatherCard.jsx';

const WeatherPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Погода"
        subtitle="Локальні умови для щоденного планування."
      />

      <section className="dashboard-grid module-page-grid">
        <WeatherCard />
      </section>
    </DashboardShell>
  );
};

export default WeatherPage;
