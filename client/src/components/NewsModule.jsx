import React, { useCallback } from 'react';
import { Newspaper } from 'lucide-react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import ModuleState from './ModuleState.jsx';

const NewsModule = () => {
  const loadNews = useCallback(async () => {
    const { data } = await api.get('/news');
    return data;
  }, []);

  const { error, isLoading, items: articles } = useAsyncList({
    fallbackError: 'Не вдалося завантажити новини. Перевірте NEWS_API_KEY або спробуйте пізніше.',
    loadItems: loadNews
  });

  return (
    <article className="dashboard-card news-card">
      <div className="card-heading">
        <div>
          <h2><Newspaper size={18} /> Новини</h2>
          <p>Короткий контекст дня без зайвого шуму.</p>
        </div>
        <span>{articles.length}</span>
      </div>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="news-list">
        {isLoading ? (
          <ModuleState tone="loading">Завантажуємо новини...</ModuleState>
        ) : articles.length === 0 ? (
          <ModuleState>Новин зараз немає. Можна спокійно повернутися до задач.</ModuleState>
        ) : (
          articles.map((article) => (
            <div
              className={article.image ? 'news-item' : 'news-item news-item-no-image'}
              key={article.url}
            >
              {article.image && <img src={article.image} alt={article.title} />}
              <div className="news-content">
                <p className="news-source">{article.source}</p>
                <h3>{article.title}</h3>
                <a href={article.url} target="_blank" rel="noreferrer">
                  Читати
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
