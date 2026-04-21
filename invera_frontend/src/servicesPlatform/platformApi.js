import axios from 'axios';
import toast from 'react-hot-toast';

const platformApi = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 60000
});

// Intercepteur pour token Super Admin
platformApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour erreurs 401
platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isSessionProbe = requestUrl.includes('/super-admin/me');

    if (status === 401 || (status === 403 && isSessionProbe)) {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      localStorage.removeItem('superAdminInfo');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      toast.error('Session expirée');
      window.location.href = '/super-admin/login';
    } else if (status === 403) {
      toast.error("Acces refuse pour cette operation");
    }
    return Promise.reject(error);
  }
);

export default platformApi;
