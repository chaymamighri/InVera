import api from './api';

const buildFailure = (error, fallback) => ({
  success: false,
  data: fallback,
  status: error.response?.status ?? null,
  error:
    error.response?.data?.message ||
    error.message ||
    'Erreur de chargement',
});
 


const buildSuccess = (data) => ({
  success: true,
  data,
  status: 200,
  error: null,
});

const statsAchatService = {
  async getDashboardStats(startDate = '', endDate = '') {
    try {
      const response = await api.get('/procurement/stats/dashboard', {
        params: { startDate, endDate },
      });
      return buildSuccess(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard stats:', error);
      return buildFailure(error, null);
    }
  },

  async getEvolutionCommandes(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/evolution-commandes', { params });
      return buildSuccess(response.data);
    } catch (error) {
      console.error('Erreur chargement evolution commandes:', error);
      return buildFailure(error, []);
    }
  },

  async getMouvementsStock(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/mouvements-stock', { params });
      return buildSuccess(response.data);
    } catch (error) {
      console.error('Erreur chargement mouvements stock:', error);
      return buildFailure(error, []);
    }
  },

  async getRepartitionCategories(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/repartition-categories', { params });
      return buildSuccess(response.data);
    } catch (error) {
      console.error('Erreur chargement repartition categories:', error);
      return buildFailure(error, []);
    }
  },

  async getAlertesStock(startDate = '', endDate = '') {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/procurement/stats/alertes-stock', { params });
      return buildSuccess(response.data);
    } catch (error) {
      console.error('Erreur chargement alertes stock:', error);
      return buildFailure(error, []);
    }
  },

getCommandesATraiter: async () => {
  try {
    const response = await api.get('/procurement/stats/commandes-attente');
    console.log('Réponse brute commandes-attente:', response.data);
    return {
      success: true,
      data: response.data  
    };
  } catch (error) {
    console.error('Erreur getCommandesATraiter:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
},


  async getKPIs() {
    try {
      const response = await api.get('/procurement/stats/kpis');
      return buildSuccess(response.data);
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      return buildFailure(error, null);
    }
  },
};

export default statsAchatService;
