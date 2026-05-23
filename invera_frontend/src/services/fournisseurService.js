// fournisseurService.js - Version CORRECTE (camelCase)

import api from './api'; 

class FournisseurService {
  
  async getAllFournisseurs() {
    try {
      const response = await api.get('/fournisseurs/all');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getActiveFournisseurs() {
    try {
      const response = await api.get('/fournisseurs/active');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getInactiveFournisseurs() {
    try {
      const response = await api.get('/fournisseurs/inactive');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getFournisseurById(id, admin = false) {
    try {
      const url = admin ? `/fournisseurs/${id}/admin` : `/fournisseurs/${id}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createFournisseur(fournisseurData) {
    try {
      console.log('📤 Données reçues:', fournisseurData);
      
      // ✅ Envoyer en camelCase (comme l'entité Java)
      const dataToSend = {
        nomFournisseur: fournisseurData.nomFournisseur?.trim(),
        matriculeFiscale: fournisseurData.matriculeFiscale?.trim().toUpperCase(),
        email: fournisseurData.email?.trim().toLowerCase(),
        telephone: fournisseurData.telephone?.trim().replace(/\s/g, ''),
        adresse: fournisseurData.adresse?.trim(),
        ville: fournisseurData.ville?.trim(),
        pays: fournisseurData.pays,
        actif: true
      };
      
      console.log('📤 Envoi backend (camelCase):', dataToSend);
      
      const response = await api.post('/fournisseurs/add', dataToSend);
      console.log('✅ Succès:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur backend:', error.response?.data);
      throw this.handleError(error);
    }
  }

  async updateFournisseur(id, fournisseurData) {
    try {
      const dataToSend = {
        nomFournisseur: fournisseurData.nomFournisseur?.trim(),
        matriculeFiscale: fournisseurData.matriculeFiscale?.trim().toUpperCase(),
        email: fournisseurData.email?.trim().toLowerCase(),
        telephone: fournisseurData.telephone?.trim().replace(/\s/g, ''),
        adresse: fournisseurData.adresse?.trim(),
        ville: fournisseurData.ville?.trim(),
        pays: fournisseurData.pays,
        actif: fournisseurData.actif
      };
      
      const response = await api.put(`/fournisseurs/${id}`, dataToSend);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async softDeleteFournisseur(id) {
    try {
      const response = await api.delete(`/fournisseurs/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async hardDeleteFournisseur(id) {
    try {
      const response = await api.delete(`/fournisseurs/${id}/hard`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async reactivateFournisseur(id) {
    try {
      const response = await api.patch(`/fournisseurs/${id}/reactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchFournisseurs(term, page = 0, size = 10, sort = 'nomFournisseur,asc', all = false) {
    try {
      const endpoint = all ? '/fournisseurs/search/all' : '/fournisseurs/search';
      const response = await api.get(endpoint, {
        params: { term, page, size, sort }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStats() {
    try {
      const response = await api.get('/fournisseurs/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'Une erreur est survenue';
      const errors = error.response.data?.errors;
      
      if (errors && Array.isArray(errors) && errors.length > 0) {
        return new Error(`Validation échouée: ${errors.join(', ')}`);
      }
      
      switch (error.response.status) {
        case 400:
          return new Error(`Données invalides: ${message}`);
        case 401:
          return new Error('Non authentifié. Veuillez vous connecter.');
        case 403:
          return new Error('Accès non autorisé.');
        case 404:
          return new Error('Fournisseur non trouvé.');
        case 409:
          return new Error(`Conflit: ${message}`);
        default:
          return new Error(message);
      }
    } else if (error.request) {
      return new Error('Impossible de contacter le serveur');
    } else {
      return new Error(`Erreur: ${error.message}`);
    }
  }
}

export default new FournisseurService();