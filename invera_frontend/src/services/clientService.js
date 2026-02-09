// src/services/clientService.js
import api from './api';
import { authHeader } from './authHeader';

// clientService.jsx - CORRIGÉ
const clientService = {
  // Récupérer tous les clients
  getAllClients: async (params = {}) => {
    try {
      const response = await api.get('/clients/liste', { // ⬅️ Changé
        params,
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Créer un nouveau client
  createClient: async (clientData) => {
    try {
      const response = await api.post('/clients/creer', clientData, { // ⬅️ Changé
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },

  // Rechercher des clients
  searchClients: async (searchTerm) => {
    try {
      const response = await api.get('/clients/rechercher', { // ⬅️ Changé
        params: { q: searchTerm },
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de clients:', error);
      throw error;
    }
  
},

  // Récupérer un client par ID
  getClientById: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  },


  // Mettre à jour un client
  updateClient: async (id, clientData) => {
    try {
      const response = await api.put(`/clients/${id}`, clientData, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  },



  // Obtenir les statistiques clients
  getClientStats: async () => {
    try {
      const response = await api.get('/clients/stats', {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques clients:', error);
      throw error;
    }
  },
  
// Récupérer les types de client depuis la base (ENUM backend)
  getClientTypes: async () => {
    try {
      const response = await api.get('/clients/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching client types:', error);
      throw error;
    }
  },
   // Récupérer la remise par type de client
  getRemiseByType: async (typeClient) => {
    try {
      const response = await api.get(`/clients/remise/${typeClient}`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la remise pour ${typeClient}:`, error);
      throw error;
    }
  }

};

export default clientService;
