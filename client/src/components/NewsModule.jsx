import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

const NewsModule = () => {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setError('');
        const { data } = await api.get('/news');
        setArticles(data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Could not load news. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, []);

  return (
    <article className="dashboard-card news-card">
      <div className="card-heading">
        <div>
          <h2>News</h2>
          <p>Latest headlines</p>
        </div>
        <span>{articles.length}</span>
      </div>

      {error && <p className="news-error">{error}</p>}

      <div className="news-list">
        {isLoading ? (
          <p className="news-empty">Loading news...</p>
        ) : articles.length === 0 ? (
          <p className="news-empty">No news available right now.</p>
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
                  Read More
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
