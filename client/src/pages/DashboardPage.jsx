import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import AssistantBrief from '../components/AssistantBrief.jsx';
import DailySummaryWidget from '../components/DailySummaryWidget.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import LoadDemoDataButton from '../components/LoadDemoDataButton.jsx';
import ProductivityStatsWidget from '../components/ProductivityStatsWidget.jsx';

const DashboardPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Огляд дня"
        subtitle="DailyFlow - персональний вебпомічник для задач, подій, погоди та фокусу."
      />

      <section className="dashboard-grid">
        <LoadDemoDataButton />
        <AssistantBrief />
        <DailySummaryWidget />
        <ProductivityStatsWidget />
      </section>
    </DashboardShell>
  );
};

export default DashboardPage;
