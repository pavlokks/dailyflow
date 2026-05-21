import React from 'react';
import AITaskGenerator from '../components/AITaskGenerator.jsx';
import AppTopbar from '../components/AppTopbar.jsx';
import AssistantBrief from '../components/AssistantBrief.jsx';
import DailySummaryWidget from '../components/DailySummaryWidget.jsx';
import EventsModule from '../components/EventsModule.jsx';
import FocusModeWidget from '../components/FocusModeWidget.jsx';
import NewsModule from '../components/NewsModule.jsx';
import ProductivityStatsWidget from '../components/ProductivityStatsWidget.jsx';
import TasksModule from '../components/TasksModule.jsx';
import WeatherCard from '../components/WeatherCard.jsx';

const DashboardPage = () => {
  return (
    <main className="dashboard-page">
      <AppTopbar
        title="AI Productivity Hub"
        subtitle="Your tasks, calendar, weather and news in one personal assistant workspace."
        backLink="/profile"
        backLabel="Profile"
      />

      <section className="dashboard-grid">
        <AssistantBrief />
        <DailySummaryWidget />
        <ProductivityStatsWidget />
        <FocusModeWidget />
        <AITaskGenerator />
        <TasksModule />
        <EventsModule />
        <WeatherCard />
        <NewsModule />
      </section>
    </main>
  );
};

export default DashboardPage;
