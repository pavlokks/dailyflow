import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

const WeatherCard = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setError('');
        const { data } = await api.get('/weather');
        setWeather(data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Could not load weather. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, []);

  const roundedTemperature =
    weather?.temperature !== undefined ? Math.round(weather.temperature) : null;

  return (
    <article className="dashboard-card weather-card">
      <div className="weather-card-top">
        <div>
          <p className="weather-label">Weather</p>
          <h2>{weather?.city || 'Your city'}</h2>
        </div>
        {weather?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
          />
        )}
      </div>

      {isLoading ? (
        <p className="weather-muted">Loading weather...</p>
      ) : error ? (
        <p className="weather-error">{error}</p>
      ) : (
        <div className="weather-content">
          <p className="weather-temperature">{roundedTemperature}C</p>
          <p className="weather-description">{weather.description}</p>
        </div>
      )}
    </article>
  );
};

export default WeatherCard;
