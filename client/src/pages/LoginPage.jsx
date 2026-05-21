import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', formData);

      localStorage.setItem('dailyflowToken', data.token);
      navigate('/dashboard');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Не вдалося увійти. Перевірте email і пароль.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">DailyFlow</p>
          <h1>Увійдіть в акаунт</h1>
          <p>Поверніться до своїх задач і продовжуйте планувати день без зайвого шуму.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="pavlo@example.com"
              required
            />
          </label>

          <label>
            Пароль
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ваш пароль"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Вхід...' : 'Увійти'}
          </button>

          <p className="auth-switch">
            Немає акаунта? <Link to="/register">Зареєструватися</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
