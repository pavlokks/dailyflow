import React, { useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const formatTemperature = (temperature) =>
  temperature !== undefined && temperature !== null ? `${Math.round(temperature)}°C` : '—';

const weatherDetailRows = [
  { key: 'feelsLike', label: 'Відчувається', render: (value) => formatTemperature(value) },
  { key: 'humidity', label: 'Вологість', render: (value) => `${value}%` },
  { key: 'windSpeed', label: 'Вітер', render: (value) => `${value} м/с` },
  { key: 'windGust', label: 'Пориви', render: (value) => `${value} м/с` },
  { key: 'pressure', label: 'Тиск', render: (value) => `${value} гПа` },
  { key: 'visibility', label: 'Видимість', render: (value) => `${value} км` },
  { key: 'clouds', label: 'Хмарність', render: (value) => `${value}%` },
  { key: 'sunrise', label: 'Схід сонця', render: (value) => value },
  { key: 'sunset', label: 'Захід сонця', render: (value) => value }
];

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
            'Не вдалося завантажити погоду. Перевірте місто в профілі або API key.'
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, []);

  const visibleDetails = weather
    ? weatherDetailRows.filter((item) => weather[item.key] !== undefined && weather[item.key] !== null)
    : [];

  return (
    <article className="dashboard-card weather-card">
      {isLoading ? (
        <ModuleState tone="loading">Завантажуємо погоду...</ModuleState>
      ) : error ? (
        <ModuleState tone="error">{error}</ModuleState>
      ) : (
        <div className="weather-content">
          <div className="weather-card-top">
            <div className="weather-main-info">
              <p className="weather-label"><CloudSun size={15} /> Погода</p>
              <h2>{weather?.city || 'Ваше місто'}</h2>
              <p className="weather-temperature">{formatTemperature(weather?.temperature)}</p>
              <p className="weather-description">
                {weather?.description || 'Погода недоступна'}
              </p>
            </div>
            {weather?.icon && (
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description || 'Погода'}
              />
            )}
          </div>

          <dl className="weather-details">
            {visibleDetails.map((item) => (
              <div className="weather-detail-card" key={item.key}>
                <dt>{item.label}</dt>
                <dd>{item.render(weather[item.key])}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </article>
  );
};

export default WeatherCard;
