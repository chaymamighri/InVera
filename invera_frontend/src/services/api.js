// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

    // ✅ logout on 401 OR 403 (deactivated user => 403)
    if (status === 401 || status === 403) {
      ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((k) =>
        localStorage.removeItem(k)
      );
      // redirect (hard)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
