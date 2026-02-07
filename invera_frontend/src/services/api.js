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
    const cleanedToken = token.replace(/^"|"$/g, '').trim();
    const normalizedToken = cleanedToken.startsWith('Bearer ') ? cleanedToken.slice(7) : cleanedToken;
    config.headers.Authorization = `Bearer ${normalizedToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userDashboard');
    }
    return Promise.reject(error);
  }
);

export default api;
