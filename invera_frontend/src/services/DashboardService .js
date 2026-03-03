// src/services/dashboardService.js
import api from './api';

class DashboardService {
  // Récupérer toutes les données du dashboard en un seul appel API
  async getDashboardData(period = 'today') {
    try {
      console.log(`Récupération données dashboard pour période: ${period}`);
      
      const response = await api.get(`/dashboard/summary?period=${period}`);
      
      // La réponse doit avoir la structure attendue par le frontend
      return response.data;
      
    } catch (error) {
      console.error('Erreur récupération dashboard:', error);
      throw error;
    }
  }

  // Rafraîchir les données (même endpoint)
  async refreshDashboardData(period = 'today') {
    return this.getDashboardData(period);
  }
}

export default new DashboardService();