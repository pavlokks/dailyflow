import React, { useEffect, useState } from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import ModuleState from '../components/ModuleState.jsx';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError('');
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        setCity(data.user.city || '');
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            'Не вдалося завантажити профіль. Спробуйте ще раз.'
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdateCity = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      const { data } = await api.put('/auth/me', {
        city
      });

      setUser(data.user);
      setCity(data.user.city || '');
      setSuccess('Профіль оновлено.');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Не вдалося оновити місто. Спробуйте ще раз.'
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardShell>
      <AppTopbar
        title="Профіль"
        subtitle="Особисті дані та місто для погоди."
      />

      <section className="profile-shell">
        <article className="dashboard-card profile-card">
          {isLoading ? (
            <ModuleState tone="loading">Завантажуємо профіль...</ModuleState>
          ) : user ? (
            <>
              <div className="profile-summary">
                <div>
                  <p>Ім'я</p>
                  <h2>{user.name}</h2>
                </div>
                <div>
                  <p>Email</p>
                  <h2>{user.email}</h2>
                </div>
                <div>
                  <p>Місто для погоди</p>
                  <h2>{user.city || 'Не вказано'}</h2>
                </div>
              </div>

              <form className="profile-form" onSubmit={handleUpdateCity}>
                <label>
                  Оновити місто
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Київ"
                  />
                </label>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Збереження...' : 'Зберегти'}
                </button>
              </form>
            </>
          ) : (
            <ModuleState>Профіль недоступний.</ModuleState>
          )}

          {error && <ModuleState tone="error">{error}</ModuleState>}
          {success && <ModuleState tone="success">{success}</ModuleState>}
        </article>
      </section>
    </DashboardShell>
  );
};

export default ProfilePage;
