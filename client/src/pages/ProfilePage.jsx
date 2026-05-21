import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

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
          requestError.response?.data?.message ||
            'Could not load profile. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dailyflowToken');
    navigate('/login');
  };

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
      setSuccess('City updated successfully.');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not update city. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">DailyFlow</p>
          <h1>Profile</h1>
        </div>
        <div className="topbar-actions">
          <Link className="secondary-button" to="/dashboard">
            Dashboard
          </Link>
          <button className="logout-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="profile-shell">
        <article className="dashboard-card profile-card">
          {isLoading ? (
            <p className="profile-muted">Loading profile...</p>
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
                  <p>City</p>
                  <h2>{user.city || 'Not set'}</h2>
                </div>
              </div>

              <form className="profile-form" onSubmit={handleUpdateCity}>
                <label>
                  Update city
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Kyiv"
                  />
                </label>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save city'}
                </button>
              </form>
            </>
          ) : (
            <p className="profile-muted">Profile is unavailable.</p>
          )}

          {error && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">{success}</p>}
        </article>
      </section>
    </main>
  );
};

export default ProfilePage;
