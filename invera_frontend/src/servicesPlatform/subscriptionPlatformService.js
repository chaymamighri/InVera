import platformApi from './platformApi';

export const subscriptionPlatformService = {
  getOffers: async (activeOnly = false) => {
    const response = await platformApi.get('/super-admin/abonnements/offres', {
      params: { activeOnly },
    });
    return response.data;
  },

  getOfferById: async (id) => {
    const response = await platformApi.get(`/super-admin/abonnements/offres/${id}`);
    return response.data;
  },

  createOffer: async (payload) => {
    const response = await platformApi.post('/super-admin/abonnements/offres', payload);
    return response.data;
  },

  updateOffer: async (id, payload) => {
    const response = await platformApi.put(`/super-admin/abonnements/offres/${id}`, payload);
    return response.data;
  },

  activateOffer: async (id) => {
    const response = await platformApi.patch(`/super-admin/abonnements/offres/${id}/activate`);
    return response.data;
  },

  deactivateOffer: async (id) => {
    const response = await platformApi.patch(`/super-admin/abonnements/offres/${id}/deactivate`);
    return response.data;
  },

  deleteOffer: async (id) => {
    const response = await platformApi.delete(`/super-admin/abonnements/offres/${id}`);
    return response.data;
  },

  getSubscriptions: async (statut) => {
    const response = await platformApi.get('/super-admin/abonnements', {
      params: statut ? { statut } : {},
    });
    return response.data;
  },

  getSubscriptionById: async (id) => {
    const response = await platformApi.get(`/super-admin/abonnements/${id}`);
    return response.data;
  },

  getClientSubscriptions: async (clientId) => {
    const response = await platformApi.get(`/super-admin/abonnements/clients/${clientId}`);
    return response.data;
  },

  assignOfferToClient: async (clientId, offerId) => {
    const response = await platformApi.post(`/super-admin/abonnements/clients/${clientId}/offres/${offerId}`);
    return response.data;
  },

  suspendSubscription: async (id, motif) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/suspend`, { motif });
    return response.data;
  },

  reactivateSubscription: async (id) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/reactivate`);
    return response.data;
  },

  cancelSubscription: async (id) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/cancel`);
    return response.data;
  },

  renewSubscription: async (id) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/renew`);
    return response.data;
  },

  updateAutoRenewal: async (id, autoRenouvellement) => {
    const response = await platformApi.patch(`/super-admin/abonnements/${id}/auto-renewal`, {
      autoRenouvellement,
    });
    return response.data;
  },
};

export default subscriptionPlatformService;
