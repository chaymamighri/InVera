// src/services/productService.js
import api from './api';

const productService = {
  // Récupérer tous les produits
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/produits/all', {params});
      
      // La réponse du backend a la structure: { success, count, produits }
      // On extrait les produits pour simplifier l'utilisation
      if (response.data && response.data.success) {
        return {
          data: response.data.produits || [],
          total: response.data.count || 0,
          success: true
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  },

  // Récupérer un produit par ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/produits/${id}`);
      
      // La réponse du backend: { success, produit }
      if (response.data && response.data.success) {
        return response.data.produit;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des produits
  searchProducts: async (keyword, filters = {}) => {
    try {
      // Construction des paramètres de recherche
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (filters.status) params.append('status', filters.status);
      if (filters.categorieId) params.append('categorieId', filters.categorieId);
      
      const response = await api.get(`/produits/search?${params.toString()}`);
      
      // La réponse du backend: { success, count, produits }
      if (response.data && response.data.success) {
        return {
          data: response.data.produits || [],
          count: response.data.count || 0,
          success: true
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de produits:', error);
      throw error;
    }
  },

  // Créer un nouveau produit
  createProduct: async (productData) => {
    try {
    const response = await api.post('/produits/add', productData);
      return response.data; // { success, message, produit }
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  },

  // Mettre à jour un produit
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/produits/update/${id}`, productData);
      return response.data; // { success, message, produit }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du produit ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un produit
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/produits/delete/${id}`);
      return response.data; // { success, message }
    } catch (error) {
      console.error(`Erreur lors de la suppression du produit ${id}:`, error);
      throw error;
    }
  },

  // Mettre à jour le stock
  updateStock: async (id, quantite) => {
    try {
      const response = await api.patch(`/produits/${id}/stock?quantite=${quantite}`);
      return response.data; // { success, message, produit, nouveauStock, status }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du stock ${id}:`, error);
      throw error;
    }
  },

  // Décrémenter le stock (après vente)
  decrementerStock: async (id, quantite) => {
    try {
      const response = await api.post(`/produits/${id}/decrementer-stock?quantite=${quantite}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la décrémentation du stock ${id}:`, error);
      throw error;
    }
  },

  // Incrémenter le stock (réapprovisionnement)
  incrementerStock: async (id, quantite) => {
    try {
      const response = await api.post(`/produits/${id}/incrementer-stock?quantite=${quantite}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'incrémentation du stock ${id}:`, error);
      throw error;
    }
  },

  // Vérifier la disponibilité d'un produit
  verifierDisponibilite: async (id, quantite) => {
    try {
      const response = await api.get(`/produits/${id}/verifier-disponibilite?quantite=${quantite}`);
      return response.data; // { success, disponible, message, ... }
    } catch (error) {
      console.error(`Erreur lors de la vérification de disponibilité ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les produits par catégorie
  getProductsByCategorie: async (categorieId) => {
    try {
      const response = await api.get(`/produits/categorie/${categorieId}`);
      
      if (response.data && response.data.success) {
        return {
          data: response.data.produits || [],
          count: response.data.count || 0
        };
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des produits de la catégorie ${categorieId}:`, error);
      throw error;
    }
  },

  // Récupérer les produits avec stock faible
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/produits/low-stock');
      
      if (response.data && response.data.success) {
        return {
          data: response.data.produits || [],
          count: response.data.count || 0
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits à stock faible:', error);
      throw error;
    }
  },

  // Récupérer les statistiques des produits
  getProductStats: async () => {
    try {
      const response = await api.get('/produits/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Synchroniser les stocks
  syncStock: async (productId, quantity) => {
    console.log(`⚠️ Synchronisation via updateStock pour produit ${productId}`);
    return updateStock(productId, quantity);
  },

  // Importer des produits
  importProducts: async (productsData) => {
    try {
      const response = await api.post('/produits/import', productsData, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'importation des produits:", error);
      throw error;
    }
  },

  // Exporter des produits
  exportProducts: async (filters = {}) => {
    try {
      const response = await api.get('/produits/export', {
        params: filters,
        responseType: 'blob',
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'exportation des produits:", error);
      throw error;
    }
  },

  // Vérifier la disponibilité de plusieurs produits
  checkAvailability: async (productIds) => {
    try {
      const response = await api.post(
        '/commandes/verifier-disponibilite',
        { produits: productIds.map(id => ({ produitId: id, quantite: 1 })) }, // Format attendu par le backend
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      throw error;
    }
  }
};

export default productService;