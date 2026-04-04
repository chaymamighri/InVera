// src/services/dashboardService.js
import api from './api';

class DashboardService {
  // Récupérer toutes les données du dashboard avec possibilité de filtre par dates
  async getDashboardData(startDate = null, endDate = null) {
    try {
      let url = '/dashboard/summary';
      const params = new URLSearchParams();
      
      // ✅ Ajouter les paramètres de date s'ils sont fournis
      if (startDate && startDate !== '') {
        params.append('startDate', startDate);
        console.log('📅 Date début:', startDate);
      }
      
      if (endDate && endDate !== '') {
        params.append('endDate', endDate);
        console.log('📅 Date fin:', endDate);
      }
      
      // Construire l'URL avec les paramètres
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
        console.log(`📡 Récupération données dashboard avec filtre: ${url}`);
      } else {
        console.log(`📡 Récupération données dashboard sans filtre (période par défaut)`);
      }
      
      const response = await api.get(url);
      
      // Vérifier la structure de la réponse
      if (!response.data) {
        throw new Error('Données non reçues du serveur');
      }
      
      // Si le serveur retourne directement les données (sans wrapper success)
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Erreur de chargement');
      }
      
      console.log('✅ Données dashboard reçues:', {
        evolutionCA: response.data?.charts?.evolutionCA?.length || 0,
        topProduits: response.data?.charts?.topProduits?.length || 0
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur récupération dashboard:', error);
      throw error;
    }
  }

  // Rafraîchir les données avec les mêmes paramètres
  async refreshDashboardData(startDate = null, endDate = null) {
    return this.getDashboardData(startDate, endDate);
  }
}

export default new DashboardService();