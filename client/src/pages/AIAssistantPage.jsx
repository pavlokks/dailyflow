import React from 'react';
import AINextActionWidget from '../components/AINextActionWidget.jsx';
import AITaskGenerator from '../components/AITaskGenerator.jsx';
import AppTopbar from '../components/AppTopbar.jsx';
import AssistantBrief from '../components/AssistantBrief.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import DailySummaryWidget from '../components/DailySummaryWidget.jsx';

const AIAssistantPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Помічник"
        subtitle="Створіть план із цілі або перегляньте короткий контекст дня."
      />

      <section className="dashboard-grid module-page-grid">
        <AssistantBrief />
        <AINextActionWidget />
        <DailySummaryWidget />
        <AITaskGenerator />
      </section>
    </DashboardShell>
  );
};

export default AIAssistantPage;
