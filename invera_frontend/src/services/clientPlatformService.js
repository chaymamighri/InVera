// src/servicesPlatform/clientPlatformService.js
import api from '../services/api';

export const clientPlatformService = {
  
  // Récupérer TOUS les clients
  getAllClients: async () => {
    try {
      const response = await api.get('/platform/clients');
      // ✅ S'assurer que les données d'offre sont incluses
      console.log('✅ Clients chargés:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Erreur getAllClients:', error);
      throw error;
    }
  },

  // ⭐ Récupérer UNIQUEMENT les clients DEFINITIF (utilise l'endpoint backend)
  getDefinitifClients: async () => {
    try {
      // ✅ Utiliser l'endpoint backend dédié
      const response = await api.get('/platform/clients/definitif');
      console.log('✅ Clients DEFINITIF chargés:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Erreur getDefinitifClients:', error);
      // Fallback: filtrer côté frontend si l'endpoint n'existe pas
      try {
        const allClients = await clientPlatformService.getAllClients();
        const definitifClients = allClients.filter(client => client.typeInscription === 'DEFINITIF');
        return definitifClients;
      } catch (fallbackError) {
        throw error;
      }
    }
  },

  // ⭐ Récupérer les clients par statut
  getClientsByStatus: async (status) => {
    try {
      const response = await api.get(`/platform/clients/statut/${status}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getClientsByStatus:', error);
      throw error;
    }
  },

  // ⭐ Récupérer les clients en attente
  getPendingClients: async () => {
    try {
      const response = await api.get('/platform/clients/pending');
      return response.data;
    } catch (error) {
      console.error('Erreur getPendingClients:', error);
      throw error;
    }
  },

  // ⭐ Récupérer un client par ID (avec détails de l'offre)
  getClientById: async (id) => {
    try {
      const response = await api.get(`/platform/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getClientById:', error);
      throw error;
    }
  },
  // ⭐ VALIDER un client (EN_ATTENTE → VALIDE_EN_ATTENTE_PAIEMENT)
  validateClient: async (clientId) => {
    try {
      const response = await api.put(`/platform/clients/${clientId}/validate`);
      return response.data;
    } catch (error) {
      console.error('Erreur validateClient:', error);
      throw error;
    }
  },

  // ⭐ REFUSER un client
  refuseClient: async (clientId, motif) => {
    try {
      const response = await api.put(`/platform/clients/${clientId}/refuse`, { motif });
      return response.data;
    } catch (error) {
      console.error('Erreur refuseClient:', error);
      throw error;
    }
  },

  // ⭐ ACTIVER après paiement (confirmation paiement)
  activateAfterPayment: async (clientId, offreId, transactionId) => {
    try {
      const params = new URLSearchParams();
      params.append('offreId', offreId);
      if (transactionId) params.append('transactionId', transactionId);
      
      const response = await api.post(`/platform/clients/${clientId}/activate-after-payment?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur activateAfterPayment:', error);
      throw error;
    }
  },

  // ⭐ Récupérer les offres d'abonnement
  getOffres: async (activeOnly = true) => {
    try {
      const response = await api.get(`/super-admin/offres?activeOnly=${activeOnly}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getOffres:', error);
      throw error;
    }
  },

  // ⭐ Supprimer une base de données
  dropDatabase: async (clientId) => {
    try {
      const response = await api.delete(`/platform/clients/${clientId}/database`);
      return response.data;
    } catch (error) {
      console.error('Erreur dropDatabase:', error);
      throw error;
    }
  }
};