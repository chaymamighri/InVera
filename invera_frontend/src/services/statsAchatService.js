// src/services/statsAchatService.js
import api from './api';

const statsAchatService = {
  /**
   * Récupère toutes les statistiques du tableau de bord
   */
  async getDashboardStats(startDate = '', endDate = '') {
    try {
      const response = await api.get('/procurement/stats/dashboard', {
        params: { startDate, endDate }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur chargement dashboard stats:', error);
      return { success: false, error: error.response?.data?.message || 'Erreur de chargement' };
    }
  },

  /**
   * Récupère l'évolution des commandes
   */
  async getEvolutionCommandes(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/evolution-commandes', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement evolution commandes:', error);
      return [];
    }
  },

  /**
   * Récupère les mouvements de stock
   */
  async getMouvementsStock(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/mouvements-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement mouvements stock:', error);
      return [];
    }
  },

  /**
   * Récupère la répartition des produits par catégorie
   */
  async getRepartitionCategories(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/repartition-categories', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement repartition categories:', error);
      return [];
    }
  },

  /**
   * Récupère les alertes stock
   */
  async getAlertesStock(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/alertes-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement alertes stock:', error);
      return [];
    }
  },

  /**
   * Récupère les commandes à traiter
   */
  async getCommandesATraiter(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/commandes-attente', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement commandes attente:', error);
      return { enAttente: 0, enCours: 0 };
    }
  },

  /**
   * Récupère les KPIs
   */
  async getKPIs(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/kpis', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      return null;
    }
  }
};

export default statsAchatService;