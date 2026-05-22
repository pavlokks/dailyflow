import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({
  children,
  description,
  onSubmit,
  switchLabel,
  switchText,
  switchTo,
  title
}) => {
  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem('dailyflowTheme') || 'light';
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">DailyFlow</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {children}

          <p className="auth-switch">
            {switchText} <Link to={switchTo}>{switchLabel}</Link>
          </p>
          <Link className="auth-home-link" to="/">
            На головну
          </Link>
        </form>
      </section>
    </main>
  );
};

export default AuthLayout;
