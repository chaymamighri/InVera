// src/services/productService.js
import api from './api';
import { authHeader } from './authHeader';


  // Récupérer tous les produits
 const productService = {
  // Récupérer tous les produits
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/product/getallproduct', { // ⬅️ Changé
        params,
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  },

  // Récupérer un produit par ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/product/getproductbyid/${id}`, { // ⬅️ Changé
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des produits
  searchProducts: async (searchTerm, filters = {}) => {
    try {
      const params = { q: searchTerm, ...filters };
      const response = await api.get('/product/search', { // ⬅️ Changé
        params,
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de produits:', error);
      throw error;
    }
  },

  // Créer un nouveau produit
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  },

  // Mettre à jour un produit
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du produit ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un produit
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du produit ${id}:`, error);
      throw error;
    }
  },

 

  // Récupérer les statistiques des produits
  getProductStats: async () => {
    try {
      const response = await api.get('/products/stats', {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Synchroniser les stocks
   syncStock: async (productId, quantity) => {
    console.log(`⚠️ Synchronisation stock désactivée pour produit ${productId}`);
    return {
      success: true,
      message: 'Synchronisation désactivée - Stock non mis à jour',
      productId,
      quantity
    };
  },

  // Importer des produits
  importProducts: async (productsData) => {
    try {
      const response = await api.post('/products/import', productsData, {
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
      const response = await api.get('/products/export', {
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

  // Vérifier la disponibilité des produits
  checkAvailability: async (productIds) => {
    try {
      const response = await api.post(
        '/products/check-availability',
        { productIds },
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
