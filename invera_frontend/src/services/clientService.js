// src/services/clientService.js
import api from './api';

const clientService = {
  // Récupérer tous les clients
  getAllClients: async (params = {}) => {
    try {
      const response = await api.get('/clients/liste', {params});
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Créer un nouveau client
  createClient: async (clientData) => {
    try {
      const response = await api.post('/clients/creer', clientData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },

  // Rechercher des clients
  searchClients: async (searchTerm) => {
    try {
      const response = await api.get('/clients/rechercher', {
        params: { q: searchTerm },
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
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  },

  // Mettre à jour un client (admin only – not used in this view)
  updateClient: async (id, clientData) => {
    try {
      const response = await api.post(`/clients/update/${id}`, clientData );
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un client (admin only – not used in this view)
  deleteClient: async (id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
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
      const response = await api.get(`/clients/remise/${typeClient}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la remise pour ${typeClient}:`, error);
      throw error;
    }
  },

  // 🔥 NOUVEAU : Mettre à jour la remise pour un type de client
  updateTypeDiscount: async (type, discount) => {
    try {
      // L'endpoint doit être implémenté côté backend
      const response = await api.put(
        `/clients/type/${type}/remise`,
        { remise: discount },
      );
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la remise pour ${type}:`, error);
      throw error;
    }
  },

  // Vérifier si un téléphone existe
  checkTelephone: async (telephone) => {
    try {
      const response = await api.get('/clients/verifier-telephone', {
        params: { telephone },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du téléphone:', error);
      throw error;
    }
  }
};

export default clientService;