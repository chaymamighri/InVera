// services/stockMovementService.js
import api from './api';

class StockMovementService {
  /**
   * Récupère tous les mouvements de stock avec filtres
   */
  async getAllMovements(filters = {}) {
    try {
      console.log('📡 Service - getAllMovements appelé avec:', filters);
      
      // ✅ Construire les paramètres pour l'API
      const params = new URLSearchParams();
      
      // ✅ Accepter les deux noms possibles (debut ou dateDebut)
      const debut = filters.debut || filters.dateDebut;
      const fin = filters.fin || filters.dateFin;
      const type = filters.type;
      
      if (debut) {
        params.append('debut', debut);
      }
      if (fin) {
        params.append('fin', fin);
      }
      if (type) {
        params.append('type', type);
      }
      
      const url = params.toString() 
        ? `/stock/mouvements?${params.toString()}`
        : '/stock/mouvements';
      
      console.log('📡 URL appelée:', url);
      
      const response = await api.get(url);
      console.log('✅ Réponse reçue:', response.data?.length || 0, 'éléments');
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur chargement mouvements:', error);
      throw error;
    }
  }

  /**
   * Récupère les mouvements d'un produit spécifique
   */
  async getMovementsByProduct(productId) {
    try {
      const response = await api.get(`/stock/mouvements/produit/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement mouvements produit:', error);
      throw error;
    }
  }

  /**
   * Récupère le stock théorique d'un produit
   */
  async getStockTheorique(productId) {
    try {
      const response = await api.get(`/stock/mouvements/stats/theorique/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement stock théorique:', error);
      throw error;
    }
  }
}

export default new StockMovementService();