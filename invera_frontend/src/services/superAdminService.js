// src/services/superAdminService.js
import api from './api';

export const superAdminService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/super-admin/login', { 
        email: email, 
        motDePasse: password 
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // ✅ Cette méthode doit exister
  getProfile: async () => {
    const response = await api.get('/super-admin/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '/super-admin/login';
  }
};