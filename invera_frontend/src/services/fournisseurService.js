import api from './api'; 

class FournisseurService {
  // ==================== GET ALL ====================
  
  /**
   * Récupère tous les fournisseurs (actifs + inactifs)
   */
  async getAllFournisseurs() {
    try {
      const response = await api.get('/fournisseurs/all');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupère uniquement les fournisseurs actifs
   */
  async getActiveFournisseurs() {
    try {
      const response = await api.get('/fournisseurs/active');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupère uniquement les fournisseurs inactifs
   */
  async getInactiveFournisseurs() {
    try {
      const response = await api.get('/fournisseurs/inactive');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== GET BY ID ====================

  /**
   * Récupère un fournisseur par son ID
   */
  async getFournisseurById(id, admin = false) {
    try {
      const url = admin ? `/fournisseurs/${id}/admin` : `/fournisseurs/${id}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CREATE ====================

  /**
   * Crée un nouveau fournisseur
   */
  async createFournisseur(fournisseurData) {
    try {
      const response = await api.post('/fournisseurs/add', fournisseurData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== UPDATE ====================

  /**
   * Met à jour un fournisseur existant
   */
  async updateFournisseur(id, fournisseurData) {
    try {
      const response = await api.put(`/fournisseurs/${id}`, fournisseurData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== DELETE ====================

  /**
   * Soft delete - Désactive un fournisseur
   */
  async softDeleteFournisseur(id) {
    try {
      const response = await api.delete(`/fournisseurs/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Hard delete - Suppression définitive
   */
  async hardDeleteFournisseur(id) {
    try {
      const response = await api.delete(`/fournisseurs/${id}/hard`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== REACTIVATE ====================

  /**
   * Réactive un fournisseur désactivé
   */
  async reactivateFournisseur(id) {
    try {
      const response = await api.patch(`/fournisseurs/${id}/reactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== SEARCH ====================

  /**
   * Recherche paginée des fournisseurs
   */
  async searchFournisseurs(term, page = 0, size = 10, sort = 'nomFournisseur,asc', all = false) {
    try {
      const endpoint = all ? '/fournisseurs/search/all' : '/fournisseurs/search';
      const response = await api.get(endpoint, {
        params: {
          term,
          page,
          size,
          sort
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Récupère les statistiques
   */
  async getStats() {
    try {
      const response = await api.get('/fournisseurs/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== UTILS ====================

  /**
   * Gestion centralisée des erreurs
   */
  handleError(error) {
    if (error.response) {
      // Erreur avec réponse du serveur
      const message = error.response.data?.message || 'Une erreur est survenue';
      const status = error.response.status;
      
      switch (status) {
        case 400:
          return new Error('Données invalides: ' + message);
        case 401:
          return new Error('Non authentifié. Veuillez vous connecter.');
        case 403:
          return new Error('Accès non autorisé.');
        case 404:
          return new Error('Fournisseur non trouvé.');
        case 409:
          return new Error('Conflit: ' + message);
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      return new Error('Impossible de contacter le serveur');
    } else {
      // Erreur de configuration
      return new Error('Erreur: ' + error.message);
    }
  }
}

export default new FournisseurService();