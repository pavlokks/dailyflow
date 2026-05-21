import React, { useCallback } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const NewsModule = () => {
  const loadNews = useCallback(async () => {
    const { data } = await api.get('/news');
    return data;
  }, []);

  const { error, isLoading, items: articles } = useAsyncList({
    fallbackError: 'AI assistant could not load your news brief. Please try again.',
    loadItems: loadNews
  });

  return (
    <article className="dashboard-card news-card">
      <div className="card-heading">
        <div>
          <h2>AI News Brief</h2>
          <p>Headlines for your context</p>
        </div>
        <span>{articles.length}</span>
      </div>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="news-list">
        {isLoading ? (
          <ModuleState tone="loading">AI is preparing headlines...</ModuleState>
        ) : articles.length === 0 ? (
          <ModuleState>No headlines available right now.</ModuleState>
        ) : (
          articles.map((article) => (
            <div className="news-item" key={article.url}>
              {article.image ? (
                <img src={article.image} alt={article.title} />
              ) : (
                <div className="news-image-placeholder" />
              )}
              <div className="news-content">
                <p className="news-source">{article.source}</p>
                <h3>{article.title}</h3>
                <a href={article.url} target="_blank" rel="noreferrer">
                  Read
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
};

export default NewsModule;
