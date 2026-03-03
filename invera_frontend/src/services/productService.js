// src/services/productService.js
import api from './api';

// Fonction utilitaire pour récupérer le token (si vous avez besoin d'headers spécifiques)
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const productService = {
  /**
   * Récupérer tous les produits
   * GET /api/produits/all
   */
getAllProducts: async (params = {}) => {
  try {
    console.log('📤 Appel API /produits/all avec params:', params);
    const response = await api.get('/produits/all', { params });
    
    console.log('📥 Réponse API - status:', response.status);
    console.log('📥 Réponse API - data:', response.data);
    console.log('📥 Réponse API - data type:', typeof response.data);
    console.log('📥 Réponse API - isArray:', Array.isArray(response.data));
    
    return response.data; // Retourner directement response.data
  } catch (error) {
    console.error('❌ getAllProducts - Erreur:', error);
    throw error;
  }
},
  /**
   * Récupérer tous les produits actifs uniquement
   * GET /api/produits?actifs=true
   */
  getActiveProducts: async () => {
    try {
      const response = await api.get('/produits?actifs=true');
      
      if (response.data && response.data.success) {
        return {
          data: response.data.produits || [],
          total: response.data.count || 0,
          success: true
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits actifs:', error);
      throw error;
    }
  },

  /**
   * Récupérer un produit par son ID
   * GET /api/produits/{id}
   */
  getProductById: async (id) => {
    try {
      const response = await api.get(`/produits/${id}`);
      
      if (response.data && response.data.success) {
        return response.data.produit;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  },

  /**
   * Recherche avancée de produits avec filtres
   * GET /api/produits/search?keyword=&status=&categorieId=&actif=
   */
 searchProducts: async ({ keyword, status, categorieId, actif } = {}) => {
  try {
    // Construction des paramètres de recherche
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (categorieId) params.append('categorieId', categorieId);
    
    // ✅ IMPORTANT: N'ajouter actif que s'il est défini (pas undefined)
    if (actif !== undefined) {
      params.append('actif', actif);
    }
    
    console.log('🔍 Paramètres envoyés:', params.toString());
    
    const response = await api.get(`/produits/search?${params.toString()}`);
    
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

  /**
   * Créer un nouveau produit
   * POST /api/produits/add
   */
  createProduct: async (productData) => {
    try {
      const response = await api.post('/produits/add', productData);
      return response.data; // { success, message, produit }
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un produit
   * PUT /api/produits/update/{id}
   */
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/produits/update/${id}`, productData);
      return response.data; // { success, message, produit }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du produit ${id}:`, error);
      throw error;
    }
  },

  /**
   * Désactiver un produit (soft delete)
   * DELETE /api/produits/delete/{id}
   */
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/produits/delete/${id}`);
      return response.data; // { success, message }
    } catch (error) {
      console.error(`Erreur lors de la désactivation du produit ${id}:`, error);
      throw error;
    }
  },

  /**
   * Réactiver un produit
   * PATCH /api/produits/{id}/reactiver
   */
  reactivateProduct: async (id) => {
    try {
      const response = await api.patch(`/produits/${id}/reactiver`);
      return response.data; // { success, message, produit }
    } catch (error) {
      console.error(`Erreur lors de la réactivation du produit ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mettre à jour le stock d'un produit
   * PATCH /api/produits/{id}/stock?quantite=
   */
  updateStock: async (id, quantite) => {
    try {
      const response = await api.patch(`/produits/${id}/stock?quantite=${quantite}`);
      return response.data; // { success, message, produit, nouveauStock, status }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du stock ${id}:`, error);
      throw error;
    }
  },

  /**
   * Vérifier la disponibilité d'un produit
   * GET /api/produits/{id}/disponibilite?quantite=
   */
  checkAvailability: async (id, quantite) => {
    try {
      const response = await api.get(`/produits/${id}/disponibilite?quantite=${quantite}`);
      return response.data; // { success, disponible, message, quantiteDisponible }
    } catch (error) {
      console.error(`Erreur lors de la vérification de disponibilité ${id}:`, error);
      throw error;
    }
  },

  /**
   * Vérifier la disponibilité de plusieurs produits
   */
  checkMultipleAvailability: async (items) => {
    try {
      const results = await Promise.all(
        items.map(item => 
          productService.checkAvailability(item.produitId, item.quantite)
            .then(res => ({
              produitId: item.produitId,
              disponible: res.disponible,
              quantiteDisponible: res.quantiteDisponible,
              quantiteDemandee: item.quantite
            }))
        )
      );
      
      const allAvailable = results.every(r => r.disponible);
      
      return {
        success: true,
        allAvailable,
        results
      };
    } catch (error) {
      console.error('Erreur lors de la vérification multiple:', error);
      throw error;
    }
  },

  /**
   * Récupérer les produits par catégorie
   * GET /api/produits/categorie/{categorieId}
   */
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

  /**
   * Récupérer les produits avec stock faible
   * GET /api/produits/low-stock
   */
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

  /**
   * Récupérer les statistiques des produits
   * GET /api/produits/statistiques
   */
  getProductStats: async () => {
    try {
      const response = await api.get('/produits/statistiques');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  /**
   * Synchroniser le stock (alias pour updateStock)
   */
  syncStock: async (productId, quantity) => {
    console.log(`🔄 Synchronisation du stock pour produit ${productId} avec quantité ${quantity}`);
    return productService.updateStock(productId, quantity);
  }
};


export default productService;