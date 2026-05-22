import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import FocusModeWidget from '../components/FocusModeWidget.jsx';

const FocusPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Фокус"
        subtitle="Запустіть 25-хвилинну сесію і працюйте без перемикань."
      />

      <section className="dashboard-grid module-page-grid">
        <FocusModeWidget />
      </section>
    </DashboardShell>
  );
};

export default FocusPage;
