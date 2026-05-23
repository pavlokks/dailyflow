import React, { useEffect, useState } from 'react';
import { LogOut, Mail, MapPin, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppTopbar from '../components/AppTopbar.jsx';
import DashboardShell from '../components/DashboardShell.jsx';
import ModuleState from '../components/ModuleState.jsx';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';

const ProfilePage = () => {
  const navigate = useNavigate();
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
          getApiErrorMessage(requestError, 'Не вдалося завантажити профіль. Спробуйте ще раз.'),
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
        city,
      });

      setUser(data.user);
      setCity(data.user.city || '');
      setSuccess('Профіль оновлено.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося оновити місто. Спробуйте ще раз.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dailyflowToken');
    navigate('/login');
  };

  return (
    <DashboardShell>
      <AppTopbar title='Профіль' subtitle='Особисті дані.' />

      <section className='profile-shell'>
        <article className='dashboard-card profile-card'>
          {isLoading ? (
            <ModuleState tone='loading'>Завантажуємо профіль...</ModuleState>
          ) : user ? (
            <>
              <div className='profile-overview'>
                <div className='profile-avatar' aria-hidden='true'>
                  {user.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div>
                  <p>Ваш профіль</p>
                  <h2>{user.name}</h2>
                  <span>{user.email}</span>
                </div>
              </div>

              <div className='profile-settings-grid'>
                <form className='profile-form' onSubmit={handleUpdateCity}>
                  <div>
                    <p>Погода</p>
                    <h2>Оновити місто</h2>
                  </div>
                  <input
                    type='text'
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder='Київ'
                  />
                  <button type='submit' disabled={isSaving}>
                    {isSaving ? 'Збереження...' : 'Зберегти'}
                  </button>
                </form>

                <div className='profile-logout-panel'>
                  <div>
                    <p>Сесія</p>
                    <h2>Вихід з профілю</h2>
                  </div>
                  <button className='profile-logout-button' type='button' onClick={handleLogout}>
                    <LogOut size={16} />
                    Вийти
                  </button>
                </div>
              </div>
            </>
          ) : (
            <ModuleState>Профіль недоступний.</ModuleState>
          )}

          {error && <ModuleState tone='error'>{error}</ModuleState>}
          {success && <ModuleState tone='success'>{success}</ModuleState>}
        </article>
      </section>
    </DashboardShell>
  );
};

export default ProfilePage;
