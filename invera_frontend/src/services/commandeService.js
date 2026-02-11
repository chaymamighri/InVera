
// src/services/commandeService.js
import api from './api'; 
import { authHeader } from './authHeader';

export const commandeService = {
  // Récupérer toutes les commandes
  async getAllCommandes() {
    try {
      const response = await api.get('/commandes/getAllCommandes', { headers: authHeader() });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }
  },

  // NOUVELLE FONCTION : Récupérer uniquement les commandes validées
 getCommandesValidees: async () => {
    try {
      console.log('📡 Appel API: /api/commandes/validated');
      const response = await api.get('/commandes/validated');
      
      // Vérifiez la structure de la réponse
      console.log('📦 Réponse reçue:', response.data);
      
      // Retournez directement les commandes
      return response.data.commandes || response.data.data || response.data;
      
    } catch (error) {
      console.error('❌ Erreur getCommandesValidees:', error);
      
      // Fallback: utiliser getAllCommandes avec filtre
      console.warn('Fallback: utilisation de getAllCommandes avec filtre');
      try {
        const allResponse = await api.get('/commandes/getAllCommandes');
        const allCommandes = allResponse.data.commandes || allResponse.data.data || allResponse.data;
        
        // Filtrer côté client
        return allCommandes.filter(cmd => 
          cmd.statut === 'CONFIRMEE' || 
          cmd.statut === 'validée' ||
          cmd.status === 'CONFIRMEE'
        );
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError);
        throw error;
      }
    }
  },

  // Créer une nouvelle commande
  async createCommande(commandeData) {
    try {
      const response = await api.post('/commandes/creer', commandeData, { 
        headers: authHeader() 
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  },

  // Vérifier la disponibilité des produits
  async verifierDisponibilite(produits) {
    try {
      const response = await api.post('/commandes/verifier-disponibilite', 
        { produits }, 
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      throw error;
    }
  },

  // Obtenir la remise pour un type de client
  async getRemiseForClientType(typeClient) {
    try {
      const response = await api.get(`/commandes/remise-client/${typeClient}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la remise:', error);
      throw error;
    }
  },

  // Valider une commande
  async validerCommande(commandeId) {
    try {
      // Note: Vous devrez créer cet endpoint dans votre backend
      const response = await api.put(`/commandes/${commandeId}/valider`, {}, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation de la commande:', error);
      throw error;
    }
  },

  // Rejeter une commande
  async rejeterCommande(commandeId) {
    try {
      // Note: Vous devrez créer cet endpoint dans votre backend
      const response = await api.put(`/commandes/${commandeId}/rejeter`, {}, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du rejet de la commande:', error);
      throw error;
    }
  },

  // Obtenir les détails d'une commande
  async getCommandeDetails(commandeId) {
    try {
      const response = await api.get(`/commandes/${commandeId}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      throw error;
    }
  },


};