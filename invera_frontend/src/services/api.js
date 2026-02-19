// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const clearSession = () => {
  ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((k) =>
    localStorage.removeItem(k)
  );
};

const redirectToLoginOnce = (message) => {
  // show on login page too
  if (message) sessionStorage.setItem('authError', message);

  // avoid redirect loop
  if (window.location.pathname === '/login') return;

  // prevent multiple triggers
  if (window.__redirectingToLogin) return;
  window.__redirectingToLogin = true;

  setTimeout(() => {
    window.location.href = '/login';
  }, 300);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    const cleanedToken = String(token).replace(/^"|"$/g, '').trim();
    const normalizedToken = cleanedToken.startsWith('Bearer ')
      ? cleanedToken.slice(7)
      : cleanedToken;

    config.headers.Authorization = `Bearer ${normalizedToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'Erreur serveur';

    if (status === 401) {
      clearSession();
      toast.error('Session expirée. Veuillez vous reconnecter.');
      redirectToLoginOnce('Session expirée. Veuillez vous reconnecter.');
    }

    if (status === 403) {
      // typical for "account deactivated"
      clearSession();
      const text = typeof msg === 'string' ? msg : 'Accès refusé. Compte désactivé.';
      toast.error(text);
      redirectToLoginOnce(text);
    }

    return Promise.reject(error);
  }
);

export default api;
