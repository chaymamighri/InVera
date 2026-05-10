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

 /**
   * Valider un client (EN_ATTENTE → VALIDE)
   * Envoie un email au client avec lien de paiement
   * Endpoint: PUT /api/super-admin/clients/{id}/validate
   */
  validateClient: async (id, comment = null) => {
    const payload = comment ? { comment } : {};
    const response = await platformApi.put(`/platform/clients/${id}/validate`, payload);
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
 /**
   * Activer un client après paiement (appelé automatiquement par webhook)
   * Endpoint: POST /api/super-admin/clients/{id}/activate-apres-paiement
   * Note: Généralement appelé par le backend, pas directement par le frontend
   */
  activateAfterPayment: async (clientId, offreId) => {
    const response = await platformApi.post(`/super-admin/clients/${clientId}/activate-apres-paiement`, { offreId });
    return response.data;
  },


    // ========== NOUVELLES MÉTHODES POUR LE LOGO ==========

  /**
   * Uploader le logo d'un client
   * @param {number} clientId - ID du client
   * @param {File} logoFile - Fichier image (JPEG/PNG)
   * @returns {Promise} - Réponse avec le chemin du logo
   */
  uploadLogo: async (clientId, logoFile) => {
    const formData = new FormData();
    formData.append('file', logoFile);
    
    const response = await platformApi.post(`/platform/clients/${clientId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Récupérer le logo d'un client
   * @param {number} clientId - ID du client
   * @returns {Promise<Blob>} - L'image du logo
   */
  getLogo: async (clientId) => {
    const response = await platformApi.get(`/platform/clients/${clientId}/logo`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Récupérer l'URL du logo (pour l'afficher directement dans une balise <img>)
   * @param {number} clientId - ID du client
   * @returns {string} - URL du logo
   */
  getLogoUrl: (clientId) => {
    return `${platformApi.defaults.baseURL}/platform/clients/${clientId}/logo`;
  },

  /**
   * Supprimer le logo d'un client
   * @param {number} clientId - ID du client
   * @returns {Promise} - Réponse de suppression
   */
  deleteLogo: async (clientId) => {
    const response = await platformApi.delete(`/platform/clients/${clientId}/logo`);
    return response.data;
  },

  /**
   * Vérifier si un client a un logo
   * @param {number} clientId - ID du client
   * @returns {Promise<boolean>} - True si le logo existe
   */
  hasLogo: async (clientId) => {
    const response = await platformApi.get(`/platform/clients/${clientId}/logo/exists`);
    return response.data.hasLogo;
  },

  /**
   * Mettre à jour le logo (supprime l'ancien et upload le nouveau)
   * @param {number} clientId - ID du client
   * @param {File} logoFile - Nouveau fichier logo
   * @returns {Promise} - Réponse avec le nouveau chemin
   */
  updateLogo: async (clientId, logoFile) => {
    const formData = new FormData();
    formData.append('file', logoFile);
    
    const response = await platformApi.put(`/platform/clients/${clientId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

};

export default clientPlatformService;