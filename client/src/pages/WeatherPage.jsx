import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import WeatherCard from '../components/WeatherCard.jsx';

const WeatherPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Погода"
        subtitle="Використовуйте локальні умови як частину щоденного планування."
      />

      <section className="dashboard-grid module-page-grid">
        <WeatherCard />
      </section>
    </DashboardShell>
  );
};

export default WeatherPage;
