import React from 'react';
import { Link } from 'react-router-dom';

const AppTopbar = ({ title, subtitle, backLink, backLabel, actions }) => {
  return (
    <header className='dashboard-topbar'>
      <div>
        <p className='eyebrow'>DailyFlow</p>
        <h1>{title}</h1>
        {subtitle && <p className='topbar-subtitle'>{subtitle}</p>}
      </div>
      <div className='topbar-actions'>
        {actions}
        {backLink && (
          <Link className='secondary-button' to={backLink}>
            {backLabel}
          </Link>
        )}
      </div>
    </header>
  );
};

export default AppTopbar;
