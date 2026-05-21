import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import EventsModule from '../components/EventsModule.jsx';

const EventsPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Події"
        subtitle="Тримайте календарний контекст поруч із задачами."
      />

      <section className="dashboard-grid module-page-grid">
        <EventsModule />
      </section>
    </DashboardShell>
  );
};

export default EventsPage;
