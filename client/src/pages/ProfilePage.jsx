import React, { useEffect, useState } from 'react';
import AppTopbar from '../components/AppTopbar.jsx';
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
            'Could not load your assistant profile. Please try again.'
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
      setSuccess('Assistant context updated successfully.');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Could not update assistant city context. Please try again.'
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="dashboard-page">
      <AppTopbar
        title="Assistant Profile"
        subtitle="Personal context used by DailyFlow AI."
        backLink="/dashboard"
        backLabel="Dashboard"
      />

      <section className="profile-shell">
        <article className="dashboard-card profile-card">
          {isLoading ? (
            <ModuleState tone="loading">Loading assistant profile...</ModuleState>
          ) : user ? (
            <>
              <div className="profile-summary">
                <div>
                  <p>Name</p>
                  <h2>{user.name}</h2>
                </div>
                <div>
                  <p>Email</p>
                  <h2>{user.email}</h2>
                </div>
                <div>
                  <p>Weather city</p>
                  <h2>{user.city || 'Not set'}</h2>
                </div>
              </div>

              <form className="profile-form" onSubmit={handleUpdateCity}>
                <label>
                  Update weather city
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Kyiv"
                  />
                </label>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save context'}
                </button>
              </form>
            </>
          ) : (
            <ModuleState>Assistant profile is unavailable.</ModuleState>
          )}

          {error && <ModuleState tone="error">{error}</ModuleState>}
          {success && <ModuleState tone="success">{success}</ModuleState>}
        </article>
      </section>
    </main>
  );
};

export default ProfilePage;
