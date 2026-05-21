import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AppTopbar = ({ title, subtitle, backLink, backLabel }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('dailyflowToken');
    navigate('/login');
  };

  return (
    <header className="dashboard-topbar">
      <div>
        <p className="eyebrow">DailyFlow AI</p>
        <h1>{title}</h1>
        {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        {backLink && (
          <Link className="secondary-button" to={backLink}>
            {backLabel}
          </Link>
        )}
        <button className="logout-button" type="button" onClick={handleLogout}>
          Вийти
        </button>
      </div>
    </header>
  );
};

export default AppTopbar;
