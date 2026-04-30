// clientPlatformService.js
import platformApi from './platformApi';

export const clientPlatformService = {
  // ========== ENDPOINTS ADMIN (SUPER_ADMIN) ==========
  
  // Récupérer tous les clients
 getAllClients: async () => {
  // Option 1: Utiliser /all si vous ajoutez cet endpoint
  const response = await platformApi.get('/platform/clients/all');
  return response.data;
  
},

  // Récupérer les clients DEFINITIF
  getDefinitifClients: async () => {
    const response = await platformApi.get('/platform/clients/definitif');
    return response.data;
  },

  // Récupérer les clients en attente
  getPendingClients: async () => {
    const response = await platformApi.get('/platform/clients/pending');
    return response.data;
  },

  // Récupérer les clients par statut
  getClientsByStatus: async (status) => {
    const response = await platformApi.get(`/platform/clients/statut/${status}`);
    return response.data;
  },

  // Récupérer un client par ID
  getClientById: async (id) => {
    const response = await platformApi.get(`/platform/clients/${id}`);
    return response.data;
  },

  // Valider un client (EN_ATTENTE → VALIDE)
  validateClient: async (id) => {
    const response = await platformApi.put(`/platform/clients/${id}/validate`);
    return response.data;
  },

  // Refuser un client (EN_ATTENTE → REFUSE)
  refuseClient: async (id, motif) => {
    const response = await platformApi.put(`/platform/clients/${id}/refuse`, { motif });
    return response.data;
  },

 // Récupérer un document
getDocument: async (clientId, documentType) => {
  const response = await platformApi.get(`/platform/clients/${clientId}/document/${documentType}`, {
    responseType: 'blob'  // Important pour les fichiers
  });
  return response.data;
},


};

export default clientPlatformService;