// src/services/userService.js
import api from './api';

export const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get('/auth/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ✅ Uses your backend filter (nom/prenom), role is filtered client-side
  filterUsers: async ({ nom, prenom } = {}) => {
    try {
      const hasNom = nom && String(nom).trim().length > 0;
      const hasPrenom = prenom && String(prenom).trim().length > 0;

      // If no name params -> return all
      if (!hasNom && !hasPrenom) {
        return await userService.getAllUsers();
      }

      const params = new URLSearchParams();
      if (hasNom) params.append('nom', nom.trim());
      if (hasPrenom) params.append('prenom', prenom.trim());

      const response = await api.get(`/auth/filter?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateUser: async (emailToUpdate, userData) => {
    try {
      const response = await api.put(`/auth/update/${encodeURIComponent(emailToUpdate)}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteUser: async (email) => {
    try {
      const response = await api.delete(`/auth/delete/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  setUserActiveStatus: async (email, active) => {
    try {
      const response = await api.patch(
        `/auth/activate/${encodeURIComponent(email)}?active=${active}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
