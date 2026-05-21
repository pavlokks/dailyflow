import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: ''
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
      const { data } = await api.post('/auth/register', formData);

      localStorage.setItem('dailyflowToken', data.token);
      navigate('/dashboard');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Не вдалося створити акаунт. Спробуйте ще раз.'
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
          <h1>Створіть акаунт</h1>
          <p>Організуйте задачі, місто та щоденний ритм в одному робочому просторі.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Ім'я
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Павло"
              required
            />
          </label>

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
              placeholder="Мінімум 6 символів"
              minLength="6"
              required
            />
          </label>

          <label>
            Місто
            <input
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              placeholder="Київ"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Створення...' : 'Зареєструватися'}
          </button>

          <p className="auth-switch">
            Вже маєте акаунт? <Link to="/login">Увійти</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default RegisterPage;
