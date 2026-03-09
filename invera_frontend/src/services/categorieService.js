// src/services/categorieService.js
import api from './api';
const categorieService = {
  /**
   * Récupérer toutes les catégories
   * GET /api/categories/all
   */
  getAllCategories: async () => {
    try {
      console.log('📤 Récupération des catégories...');
      const response = await api.get('/categories/all');
      
      console.log('📥 Réponse catégories:', response.data);
      
      // Format: { success: true, count: number, categories: [] }
      if (response.data?.success && Array.isArray(response.data?.categories)) {
        return response.data.categories;
      }
      
      // Fallback si le format est différent
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      
      // ✅ GESTION DES ERREURS 403 (non autorisé)
      if (error.response?.status === 403) {
        console.warn('⚠️ Accès non autorisé aux catégories - utilisation du fallback');
        // Retourner un tableau vide au lieu de propager l'erreur
        return [];
      }
      
      // Pour les autres erreurs, on laisse propager
      throw error;
    }
  },

  /**
   * Récupérer une catégorie par ID
   * GET /api/categories/{id}
   * Réponse: { success: true, categorie: {} }
   */
  getCategorieById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      
      if (response.data?.success && response.data?.categorie) {
        return response.data.categorie;
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur chargement catégorie ${id}:`, error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle catégorie (admin seulement)
   * POST /api/categories/add
   * Réponse: { success: true, message: string, categorie: {} }
   */
  createCategorie: async (categorieData) => {
    try {
      const response = await api.post('/categories/add', categorieData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une catégorie (admin seulement)
   * PUT /api/categories/update/{id}
   * Réponse: { success: true, message: string, categorie: {} }
   */
  updateCategorie: async (id, categorieData) => {
    try {
      const response = await api.put(`/categories/update/${id}`, categorieData);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur mise à jour catégorie ${id}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer une catégorie (admin seulement)
   * DELETE /api/categories/delete/{id}
   * Réponse: { success: true, message: string }
   */
  deleteCategorie: async (id) => {
    try {
      const response = await api.delete(`/categories/delete/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur suppression catégorie ${id}:`, error);
      throw error;
    }
  },

  /**
   * Rechercher des catégories par nom
   * GET /api/categories/search?keyword=
   * Réponse: { success: true, count: number, categories: [] }
   */
  searchCategories: async (keyword) => {
    try {
      const response = await api.get(`/categories/search?keyword=${encodeURIComponent(keyword)}`);
      
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