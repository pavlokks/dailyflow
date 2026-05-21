import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import FocusModeWidget from '../components/FocusModeWidget.jsx';

const FocusPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Фокус-режим"
        subtitle="Запускайте 25-хвилинні Pomodoro-сесії та відстежуйте фокус."
      />

      <section className="dashboard-grid module-page-grid">
        <FocusModeWidget />
      </section>
    </DashboardShell>
  );
};

export default FocusPage;
