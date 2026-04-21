import platformApi from './platformApi';

export const clientPlatformService = {
  getAllClients: async () => {
    const response = await platformApi.get('/platform/clients');
    return response.data;
  },

  getPendingClients: async () => {
    const response = await platformApi.get('/platform/clients/pending');
    return response.data;
  },

  getClientsByStatus: async (status) => {
    const response = await platformApi.get(`/platform/clients/statut/${status}`);
    return response.data;
  },

  getClientById: async (id) => {
    const response = await platformApi.get(`/platform/clients/${id}`);
    return response.data;
  },

  validateClient: async (id) => {
    const response = await platformApi.put(`/platform/clients/${id}/validate`);
    return response.data;
  },

  refuseClient: async (id, motif) => {
    const response = await platformApi.put(`/platform/clients/${id}/refuse`, { motif });
    return response.data;
  },

  activateClient: async (id) => {
    const response = await platformApi.post(`/platform/clients/${id}/activate`);
    return response.data;
  },

  activateClientWithPlan: async (id, plan) => {
    const response = await platformApi.post(`/platform/clients/${id}/activate-with-plan`, null, {
      params: { plan },
    });
    return response.data;
  },

  dropDatabase: async (id) => {
    const response = await platformApi.delete(`/platform/clients/${id}/database`);
    return response.data;
  },
};

export default clientPlatformService;
