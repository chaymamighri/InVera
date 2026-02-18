// frontend/src/services/userService.js
import api from './api';

/**
 * Service pour la gestion des utilisateurs côté admin.
 * Correspond exactement aux endpoints du backend.
 */
export const userService = {
  /**
   * Récupère tous les utilisateurs.
   * GET /api/auth/all
   * @returns {Promise<Array>} Liste des utilisateurs (UserInfoResponse)
   */
  getAllUsers: async () => {
    try {
      const response = await api.get('/auth/all');
      // Retourne directement le tableau
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Crée un nouvel utilisateur (admin uniquement).
   * POST /api/auth/register
   * @param {Object} userData - { username, email, nom, prenom, role } (role en majuscules: COMMERCIAL, RESPONSABLE_ACHAT)
   * @returns {Promise<Object>} MessageResponse
   */
  createUser: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Met à jour un utilisateur par email.
   * PUT /api/auth/update/{email}
   * @param {string} email - Email de l'utilisateur à modifier
   * @param {Object} userData - { username, email, nom, prenom, role }
   * @returns {Promise<Object>} MessageResponse
   */
  updateUser: async (email, userData) => {
    try {
      const response = await api.put(`/auth/update/${email}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Supprime un utilisateur par email.
   * DELETE /api/auth/delete/{email}
   * @param {string} email
   * @returns {Promise<Object>} MessageResponse
   */
  deleteUser: async (email) => {
    try {
      const response = await api.delete(`/auth/delete/${email}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Active ou désactive un utilisateur.
   * PATCH /api/auth/activate/{email}?active={boolean}
   * @param {string} email
   * @param {boolean} active
   * @returns {Promise<Object>} MessageResponse
   */
  setUserActiveStatus: async (email, active) => {
    try {
      const response = await api.patch(`/auth/activate/${email}?active=${active}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Optionnel : filtrer les utilisateurs (GET /api/auth/filter)
  // Mais on peut le faire côté client après getAllUsers.
};