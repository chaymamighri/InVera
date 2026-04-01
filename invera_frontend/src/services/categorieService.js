// src/services/categorieService.js
import api from './api';

const categorieService = {
  /**
   * Récupérer toutes les catégories
   * GET /api/categories
   */
  getAllCategories: async () => {
    try {
      console.log('📤 Récupération des catégories...');
      const response = await api.get('/categories');
      
      console.log('📥 Réponse catégories:', response.data);
      
      // Le backend retourne directement un tableau de catégories
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Format alternatif avec wrapper
      if (response.data?.success && Array.isArray(response.data?.categories)) {
        return response.data.categories;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      
      // Gestion des erreurs 403 (non autorisé)
      if (error.response?.status === 403) {
        console.warn('⚠️ Accès non autorisé aux catégories - utilisation du fallback');
        return [];
      }
      
      // Pour les autres erreurs, on laisse propager
      throw error;
    }
  },

  /**
   * Récupérer une catégorie par ID
   * GET /api/categories/{id}
   */
  getCategorieById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      
      // Le backend retourne directement l'objet catégorie
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur chargement catégorie ${id}:`, error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle catégorie
   * POST /api/categories
   */
  createCategorie: async (categorieData) => {
    try {
      const response = await api.post('/categories', categorieData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      throw error;
    }
  },

  /**
   * Supprimer une catégorie
   * DELETE /api/categories/{id}
   */
  deleteCategorie: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur suppression catégorie ${id}:`, error);
      throw error;
    }
  },
  
    /**
   * Mettre à jour une catégorie (NOUVEAU)
   * PUT /api/categories/{id}
   */
  updateCategorie: async (id, categorieData) => {
    try {
      const response = await api.put(`/categories/${id}`, categorieData);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur mise à jour catégorie ${id}:`, error);
      throw error;
    }
  },

  /**
   * Rechercher des catégories par nom
   * GET /api/categories/search?keyword=
   */
  searchCategories: async (keyword) => {
    try {
      const response = await api.get(`/categories/search`, {
        params: { keyword: keyword || '' }
      });
      
      // Le backend retourne directement un tableau de catégories
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Format alternatif avec wrapper
      if (response.data?.success && Array.isArray(response.data?.categories)) {
        return response.data.categories;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur recherche catégories:', error);
      throw error;
    }
  }
};

export default categorieService;