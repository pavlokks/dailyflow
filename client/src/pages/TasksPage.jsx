import React from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import TasksModule from '../components/TasksModule.jsx';

const TasksPage = () => {
  return (
    <DashboardShell>
      <AppTopbar
        title="Задачі"
        subtitle="Керуйте задачами, пріоритетами, дедлайнами та статусом виконання."
      />

      <section className="dashboard-grid module-page-grid">
        <TasksModule />
      </section>
    </DashboardShell>
  );
};

export default TasksPage;
