import React from 'react';
import AITaskGenerator from '../components/AITaskGenerator.jsx';
import AppTopbar from '../components/AppTopbar.jsx';
import AssistantBrief from '../components/AssistantBrief.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import DailySummaryWidget from '../components/DailySummaryWidget.jsx';

const AIAssistantPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="AI-помічник"
        subtitle="Генеруйте задачі з цілі та переглядайте поточний контекст продуктивності."
      />

      <section className="dashboard-grid module-page-grid">
        <AssistantBrief />
        <DailySummaryWidget />
        <AITaskGenerator />
      </section>
    </DashboardShell>
  );
};

export default AIAssistantPage;
