// src/services/productService.js - Version ONE-TO-MANY
import api from './api';

const productService = {
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/produits/all', { params });
      return response.data;
    } catch (error) {
      console.error('❌ getAllProducts - Erreur:', error);
      throw error;
    }
  },

  getActiveProducts: async () => {
    try {
      const response = await api.get('/produits/actifs');
      if (response.data && response.data.success) {
        return {
          data: response.data.data || [],
          total: response.data.total || 0,
          success: true
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur récupération produits actifs:', error);
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await api.get(`/produits/${id}`);
      if (response.data && response.data.success) {
        return response.data.produit || response.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur récupération produit ${id}:`, error);
      throw error;
    }
  },
// recupére les produits d'un fournisseur pour passer une bon de commande
  getProduitsByFournisseur: async (fournisseurId) => {
  try {
    const response = await api.get(`/produits/fournisseur/${fournisseurId}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur récupération produits du fournisseur ${fournisseurId}:`, error);
    throw error;
  }
},

// rechercher les produit en general sans recupere fournisseur
searchProducts: async ({ keyword, status, categorieId, actif, page = 0, size = 10 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (categorieId) params.append('categorieId', categorieId);
    if (actif !== undefined) params.append('actif', actif);
    params.append('page', page);
    params.append('size', size);
    
    console.log('🔍 URL:', `/produits/search?${params.toString()}`);
    
    const response = await api.get(`/produits/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erreur recherche produits:', error);
    throw error;
  }
},

  //  un seul fournisseurId et un seul prixAchat
  createProduct: async (productData) => {
    try {
      let dataToSend;
      
      if (productData instanceof FormData) {
        dataToSend = productData;
      } else {
        dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            dataToSend.append(key, String(value));
          }
        });
        if (productData?.imageFile) {
          dataToSend.append('image', productData.imageFile);
        }
      }
      
      const response = await api.post('/produits/add', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      throw error;
    }
  },

  // ✅ ONE-TO-MANY : un seul fournisseurId et un seul prixAchat
  updateProduct: async (id, productData) => {
    try {
      let dataToSend;
      
      if (productData instanceof FormData) {
        dataToSend = productData;
      } else {
        dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            dataToSend.append(key, String(value));
          }
        });
        if (productData?.imageFile) {
          dataToSend.append('image', productData.imageFile);
        }
      }
      
      const response = await api.put(`/produits/update/${id}`, dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur updateProduct:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/produits/delete/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur désactivation produit ${id}:`, error);
      throw error;
    }
  },

  reactivateProduct: async (id) => {
    try {
      const response = await api.patch(`/produits/${id}/reactiver`);
      return response.data;
    } catch (error) {
      console.error(`Erreur réactivation produit ${id}:`, error);
      throw error;
    }
  },

  updateStock: async (id, quantite) => {
    try {
      const response = await api.patch(`/produits/${id}/stock`, null, {
        params: { quantite }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur mise à jour stock ${id}:`, error);
      throw error;
    }
  },

  checkAvailability: async (id, quantite) => {
    try {
      const response = await api.get(`/produits/${id}/disponibilite?quantite=${quantite}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur vérification disponibilité ${id}:`, error);
      throw error;
    }
  },

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
      console.error(`Erreur produits par catégorie ${categorieId}:`, error);
      throw error;
    }
  },

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
      console.error('Erreur produits stock faible:', error);
      throw error;
    }
  },

  getProductStats: async () => {
    try {
      const response = await api.get('/produits/statistiques');
      return response.data;
    } catch (error) {
      console.error('Erreur statistiques:', error);
      throw error;
    }
  },

  syncStock: async (productId, quantity) => {
    return productService.updateStock(productId, quantity);
  }
};

export default productService;