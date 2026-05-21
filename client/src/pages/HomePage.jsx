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
            {token ? 'До панелі' : 'Увійти'}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <p className="eyebrow">Персональний вебпомічник</p>
        <h1>DailyFlow</h1>
        <p>
          Єдиний простір для задач, подій, погоди, новин, фокус-сесій та
          AI-підказок для продуктивного дня.
        </p>
        <div className="landing-cta">
          <Link to={token ? '/dashboard' : '/register'}>Почати роботу</Link>
          <Link to="/login">Увійти в акаунт</Link>
        </div>
      </section>

      <section className="landing-features" aria-label="Можливості DailyFlow">
        <article>
          <h2>AI Summary</h2>
          <p>Короткий огляд дня з задачами, подіями та погодою.</p>
        </article>
        <article>
          <h2>Фокус-режим</h2>
          <p>Pomodoro-таймер для демонстрації фокус-сесій.</p>
        </article>
        <article>
          <h2>Демо-дані</h2>
          <p>Швидке наповнення для презентації курсової роботи.</p>
        </article>
      </section>
    </main>
  );
};

export default HomePage;
