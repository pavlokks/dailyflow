import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('dailyflowTheme') || 'light'
  );
  const token = localStorage.getItem('dailyflowToken');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dailyflowTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/">
          <span>DF</span>
          <strong>DailyFlow</strong>
        </Link>
        <div className="landing-actions">
          <button type="button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Світла тема' : 'Темна тема'}
          </button>
          <Link to={token ? '/dashboard' : '/login'}>
            {token ? 'До кабінету' : 'Увійти'}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <p className="eyebrow">персональний вебпомічник</p>
        <h1>DailyFlow</h1>
        <p>
          Простий простір для задач, подій, погоди, новин і фокус-сесій.
          Без зайвого шуму: відкрили день, подивилися план, почали працювати.
        </p>
        <div className="landing-cta">
          <Link to={token ? '/dashboard' : '/register'}>Почати</Link>
          <Link to="/login">Увійти</Link>
        </div>
      </section>

      <section className="landing-features" aria-label="Можливості DailyFlow">
        <article>
          <h2>План дня</h2>
          <p>Задачі, події та короткий підсумок в одному місці.</p>
        </article>
        <article>
          <h2>Фокус</h2>
          <p>Простий Pomodoro-таймер для спокійної роботи.</p>
        </article>
        <article>
          <h2>Контекст</h2>
          <p>Погода і новини поруч, коли вони справді потрібні.</p>
        </article>
      </section>
    </main>
  );
};

export default HomePage;
