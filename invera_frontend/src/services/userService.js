// src/services/userService.js
import api from './api';

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/auth/all');
    return response.data;
  },

  filterUsers: async ({ nom, prenom, role } = {}) => {
    const params = new URLSearchParams();
    if (nom?.trim()) params.append('nom', nom.trim());
    if (prenom?.trim()) params.append('prenom', prenom.trim());
    if (role?.trim()) params.append('role', role.trim());

    const response = await api.get(`/auth/filter?${params.toString()}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  updateUser: async (emailToUpdate, userData) => {
    const response = await api.put(`/auth/update/${encodeURIComponent(emailToUpdate)}`, userData);
    return response.data;
  },

  deleteUser: async (email) => {
    const response = await api.delete(`/auth/delete/${encodeURIComponent(email)}`);
    return response.data;
  },

  setUserActiveStatus: async (email, active) => {
    const response = await api.patch(`/auth/activate/${encodeURIComponent(email)}?active=${active}`);
    return response.data;
  },
};
