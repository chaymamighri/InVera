// src/services/commandeService.js
import api from './api'; 
import { authHeader } from './authHeader';

export const commandeService = {
  // Récupérer toutes les commandes
  async getAllCommandes() {
    try {
      console.log('📡 Appel API: /commandes/getAllCommandes');
      const response = await api.get('/commandes/getAllCommandes', { headers: authHeader() });
      
      if (response.data && response.data.success && response.data.commandes) {
        return response.data.commandes;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllCommandes:', error);
      throw error;
    }
  },

  // Récupérer les commandes validées
  getCommandesValidees: async () => {
    try {
      console.log('📡 Appel API: /commandes/validated');
      const response = await api.get('/commandes/validated', { headers: authHeader() });
      
      if (response.data && response.data.success && response.data.commandes) {
        return response.data.commandes;
      }
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getCommandesValidees:', error);
      throw error;
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
      console.error('❌ Erreur createCommande:', error);
      throw error;
    }
  },

  // Récupérer une commande par ID
  async getCommandeById(id) {
    try {
      const response = await api.get(`/commandes/${id}`, {
        headers: authHeader()
      });
      
      if (response.data && response.data.success && response.data.commande) {
        return response.data.commande;
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur getCommandeById ${id}:`, error);
      throw error;
    }
  },

  // 🔥 CORRECTION: Vérifier le bon endpoint pour valider
  async validerCommande(commandeId) {
    try {
      console.log(`✅ Tentative validation commande ${commandeId}`);
      
      // Essayer différents endpoints possibles
      const endpoints = [
        `/commandes/${commandeId}/valider`,           // Format 1
        `/api/commandes/${commandeId}/valider`,       // Format 2
        `/commandes/valider/${commandeId}`            // Format 3
      ];
      
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Essai endpoint: ${endpoint}`);
          const response = await api.put(endpoint, {}, { 
            headers: authHeader() 
          });
          
          console.log(`✅ Succès avec endpoint: ${endpoint}`);
          return response.data;
        } catch (err) {
          console.log(`❌ Échec endpoint ${endpoint}:`, err.response?.status);
          lastError = err;
          // Continuer avec le prochain endpoint
        }
      }
      
      // Si tous les endpoints échouent
      throw lastError || new Error('Aucun endpoint de validation trouvé');
      
    } catch (error) {
      console.error('❌ Erreur validerCommande:', error);
      
      // Message d'erreur plus explicite
      if (error.response?.status === 403) {
        console.error('⛔ ACCÈS REFUSÉ: Votre rôle n\'a pas la permission de valider des commandes');
      }
      
      throw error;
    }
  },

  // 🔥 CORRECTION: Même chose pour rejeter
  async rejeterCommande(commandeId) {
    try {
      console.log(`❌ Tentative rejet commande ${commandeId}`);
      
      const endpoints = [
        `/commandes/${commandeId}/rejeter`,
        `/api/commandes/${commandeId}/rejeter`,
        `/commandes/rejeter/${commandeId}`
      ];
      
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Essai endpoint: ${endpoint}`);
          const response = await api.put(endpoint, {}, { 
            headers: authHeader() 
          });
          
          console.log(`✅ Succès avec endpoint: ${endpoint}`);
          return response.data;
        } catch (err) {
          console.log(`❌ Échec endpoint ${endpoint}:`, err.response?.status);
          lastError = err;
        }
      }
      
      throw lastError || new Error('Aucun endpoint de rejet trouvé');
      
    } catch (error) {
      console.error('❌ Erreur rejeterCommande:', error);
      throw error;
    }
  },


  /**
   * Générer une facture pour une commande validée
   * @param {number} commandeId - ID de la commande
   */
  async generateInvoice(commandeId) {
    try {
      const response = await api.post(`/factures/generer/${commandeId}`);
      console.log('📥 Réponse génération facture:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur generateInvoice:', error);
      throw error.response?.data || error;
    }
  },

   // récuperation de facture
  async getAllInvoices() {
    try {
      const response = await api.get('/factures/all');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllInvoices:', error);
      throw error;
    }
  },
  
  /**
   * Télécharger une facture au format PDF
   * @param {number} factureId - ID de la facture
   */
  async downloadInvoicePDF(factureId) {
    try {
      const response = await api.get(`/factures/telecharger/${factureId}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur downloadInvoicePDF:', error);
      throw error;
    }
  },
  
  /**
   * Récupérer les détails d'une facture
   * @param {number} factureId - ID de la facture
   */
  async getInvoiceDetails(factureId) {
    try {
      const response = await api.get(`/factures/${factureId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getInvoiceDetails:', error);
      throw error;
    }
  },
 async getInvoiceByCommandeId(commandeId) {
    try {
      // Si vous avez un endpoint spécifique
      const response = await api.get(`/factures/commande/${commandeId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getInvoiceByCommandeId:', error);
      
      // Option de secours: chercher dans toutes les factures
      try {
        const allInvoices = await api.get('/factures');
        const invoice = allInvoices.data.find(f => 
          f.commande?.id === commandeId || 
          f.commande?.idCommandeClient === commandeId
        );
        return invoice;
      } catch (e) {
        return null;
      }
    }
  },

};