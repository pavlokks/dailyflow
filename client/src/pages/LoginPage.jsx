import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';

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
        getApiErrorMessage(
          requestError,
          'Не вдалося увійти. Перевірте email і пароль.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="DailyFlow"
      description="Персональний вебпомічник для задач, подій, погоди та щоденного фокусу."
      switchText="Немає акаунта?"
      switchLabel="Зареєструватися"
      switchTo="/register"
      onSubmit={handleSubmit}
    >
      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="pavlo@example.com"
        required
      />

      <FormField
        label="Пароль"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Ваш пароль"
        required
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Вхід...' : 'Увійти'}
      </button>
    </AuthLayout>
  );
};

export default LoginPage;
