import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const token = localStorage.getItem('dailyflowToken');

  return (
    <main className='landing-page'>
      <header className='landing-nav'>
        <Link className='brand' to='/'>
          <span>DF</span>
          <strong>DailyFlow</strong>
        </Link>
        <div className='landing-actions'>
          <Link to={token ? '/dashboard' : '/login'}>{token ? 'До кабінету' : 'Увійти'}</Link>
        </div>
      </header>

      <section className='landing-hero'>
        <p className='eyebrow'>Персональний вебпомічник</p>
        <h1>DailyFlow</h1>
        <p>Простір для планування, фокусу і щоденного ритму.</p>
        <div className='landing-cta'>
          <Link to={token ? '/dashboard' : '/register'}>Почати</Link>
          <Link to='/login'>Увійти</Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
