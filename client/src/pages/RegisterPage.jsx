import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';

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
        getApiErrorMessage(
          requestError,
          'Не вдалося створити акаунт. Спробуйте ще раз.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Створіть DailyFlow AI"
      description="Налаштуйте персональний простір, де помічник тримає задачі, календар, погоду й новини в одному контексті."
      switchText="Вже маєте акаунт?"
      switchLabel="Увійти"
      switchTo="/login"
      onSubmit={handleSubmit}
    >
      <FormField
        label="Ім'я"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        placeholder="Павло"
        required
      />

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
        placeholder="Мінімум 6 символів"
        minLength="6"
        required
      />

      <FormField
        label="Місто"
        name="city"
        type="text"
        value={formData.city}
        onChange={handleChange}
        placeholder="Київ"
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Створення...' : 'Запустити AI-помічника'}
      </button>
    </AuthLayout>
  );
};

export default RegisterPage;
