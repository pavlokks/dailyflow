import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import NewsModule from '../components/NewsModule.jsx';

const NewsPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Новини"
        subtitle="Короткий список заголовків, якщо потрібен контекст дня."
      />

      <section className="dashboard-grid module-page-grid">
        <NewsModule />
      </section>
    </DashboardShell>
  );
};

export default NewsPage;
