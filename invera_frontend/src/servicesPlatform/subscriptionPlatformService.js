// subscriptionPlatformService.js
import platformApi from './platformApi';

export const subscriptionPlatformService = {
  
  // ========== GESTION DES OFFRES ==========
  
  getOffers: async (activeOnly = false) => {
    const response = await platformApi.get(`/super-admin/offres?activeOnly=${activeOnly}`);
    return response.data;
  },

  getOfferById: async (id) => {
    const response = await platformApi.get(`/super-admin/offres/${id}`);
    return response.data;
  },

  createOffer: async (payload) => {
    const response = await platformApi.post('/super-admin/offres', payload);
    return response.data;
  },

  updateOffer: async (id, payload) => {
    const response = await platformApi.put(`/super-admin/offres/${id}`, payload);
    return response.data;
  },

  activateOffer: async (id) => {
    const response = await platformApi.patch(`/super-admin/offres/${id}/activate`);
    return response.data;
  },

  deactivateOffer: async (id) => {
    const response = await platformApi.patch(`/super-admin/offres/${id}/deactivate`);
    return response.data;
  },

  // ========== GESTION DES ABONNEMENTS ==========
  
  getSubscriptions: async (statut = null) => {
    const url = statut && statut !== 'ALL' 
      ? `/super-admin/abonnements?statut=${statut}` 
      : '/super-admin/abonnements';
    const response = await platformApi.get(url);
    return response.data;
  },

  getSubscriptionById: async (id) => {
    const response = await platformApi.get(`/super-admin/abonnements/${id}`);
    return response.data;
  },

  getSubscriptionsByClient: async (clientId) => {
    const response = await platformApi.get(`/super-admin/abonnements/client/${clientId}`);
    return response.data;
  },

  /**
   * Suspendre un abonnement avec motif
   * @param {number} id - ID de l'abonnement
   * @param {string} motif - Motif de la suspension
   */
  suspendSubscription: async (id, motif) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/suspend`, { motif });
    return response.data;
  },

  /**
   * Réactiver un abonnement avec motif
   * @param {number} id - ID de l'abonnement
   * @param {string} motif - Motif de la réactivation
   */
  reactivateSubscription: async (id, motif) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/reactivate`, { motif });
    return response.data;
  },

  /**
   * Annuler un abonnement (sans motif obligatoire)
   * @param {number} id - ID de l'abonnement
   */
  cancelSubscription: async (id) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/cancel`);
    return response.data;
  },

  /**
   * Créer un abonnement pour un client existant
   * @param {number} clientId - ID du client
   * @param {number} offreId - ID de l'offre
   */
  createSubscriptionForClient: async (clientId, offreId) => {
    const response = await platformApi.post(`/super-admin/abonnements/client/${clientId}/offre/${offreId}`);
    return response.data;
  },
};

export default subscriptionPlatformService;