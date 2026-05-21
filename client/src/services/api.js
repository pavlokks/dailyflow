import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dailyflowToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.startsWith('/auth/login') ||
      requestUrl.startsWith('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('dailyflowToken');
      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

export default api;
