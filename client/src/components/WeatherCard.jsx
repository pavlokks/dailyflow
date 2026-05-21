import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const WeatherCard = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setError('');
        setIsLoading(true);
        const { data } = await api.get('/weather');
        setWeather(data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            'Не вдалося завантажити погоду. Вкажіть місто у профілі або перевірте OPENWEATHER_API_KEY.'
          )
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
          <p className="weather-label">Погода</p>
          <h2>{weather?.city || 'Ваше місто'}</h2>
        </div>
        {weather?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
          />
        )}
      </div>

      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо погоду...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <div className="weather-content">
          <p className="weather-temperature">{roundedTemperature}°C</p>
          <p className="weather-description">
            {weather?.description || 'Погода недоступна'}
          </p>
        </div>
      )}
    </article>
  );
};

export default WeatherCard;
