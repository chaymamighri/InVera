// src/services/clientAbonneService.js
import api from './api';

/**
 * Service de gestion des clients abonnés (entreprises/particuliers)
 * Utilisé par le profil pour afficher les informations du client connecté
 */
export const clientAbonneService = {
  
  /**
   * Récupère les informations du client par son ID
   * @param {number|string} clientId - ID du client
   * @returns {Promise} - Promesse avec les données du client
   */
  async getClientById(clientId) {
    try {
      const response = await api.get(`/platform/clients/${clientId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur getClientById:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors du chargement du client' 
      };
    }
  },

  /**
   * Récupère le client actuellement connecté (via le token)
   * @returns {Promise} - Promesse avec les données du client
   */
  async getCurrentClient() {
    try {
      // Récupérer l'ID du client depuis le localStorage (stocké lors du login)
      let clientId = localStorage.getItem('clientId');
      
      // Si pas dans localStorage, essayer de le récupérer depuis l'API /me
      if (!clientId) {
        const meResponse = await api.get('/auth/me');
        if (meResponse.data && meResponse.data.clientId) {
          clientId = meResponse.data.clientId;
          localStorage.setItem('clientId', clientId);
        }
      }
      
      if (!clientId) {
        return { success: false, error: 'Aucun client connecté' };
      }
      
      const result = await this.getClientById(clientId);
      
      // Enrichir avec les données de session
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          connexionsRestantes: localStorage.getItem('connexionsRestantes') || result.data.connexionsRestantes,
          connexionsMax: localStorage.getItem('connexionsMax') || result.data.connexionsMax,
          hasActiveSubscription: localStorage.getItem('hasActiveSubscription') === 'true',
          typeInscription: result.data.typeInscription,
          statut: result.data.statut,
          estActif: result.data.statut === 'ACTIF'
        };
      }
      
      return result;
    } catch (error) {
      console.error('Erreur getCurrentClient:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour les informations du client
   * @param {number|string} clientId - ID du client
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise} - Promesse avec le résultat
   */
  async updateClient(clientId, data) {
    try {
      const response = await api.put(`/platform/clients/${clientId}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur updateClient:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la mise à jour' 
      };
    }
  },

  /**
   * Récupère l'abonnement actif du client
   * @param {number|string} clientId - ID du client
   * @returns {Promise} - Promesse avec les données de l'abonnement
   */
  async getClientAbonnement(clientId) {
    try {
      // ✅ Correction: utiliser le bon endpoint
      const response = await api.get(`/platform/clients/${clientId}/abonnement`);
      const abonnement = response.data;
      
      // Vérifier si l'abonnement est actif (non expiré)
      let isActive = false;
      if (abonnement && abonnement.statut === 'ACTIF') {
        const dateFin = new Date(abonnement.dateFin);
        isActive = dateFin > new Date();
      }
      
      return { 
        success: true, 
        data: abonnement,
        isActive: isActive
      };
    } catch (error) {
      console.error('Erreur getClientAbonnement:', error);
      return { success: false, error: error.message, data: null, isActive: false };
    }
  },

  /**
   * Récupère les statistiques du client (connexions, documents, etc.)
   * @param {number|string} clientId - ID du client
   * @returns {Promise} - Promesse avec les statistiques
   */
  async getClientStats(clientId) {
    try {
      const [clientData, abonnementData] = await Promise.all([
        this.getClientById(clientId),
        this.getClientAbonnement(clientId)
      ]);
      
      if (!clientData.success) {
        throw new Error(clientData.error);
      }
      
      const client = clientData.data;
      
      // Calculer les statistiques
      const stats = {
        // Informations générales
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        typeCompte: client.typeCompte,
        typeInscription: client.typeInscription,
        statut: client.statut,
        
        // Période d'essai / abonnement
        estEnPeriodeEssai: client.typeInscription === 'ESSAI' || (!abonnementData.isActive && client.connexionsRestantes > 0),
        aAbonnementActif: abonnementData.isActive,
        abonnement: abonnementData.data,
        
        // Connexions
        connexionsRestantes: client.connexionsRestantes,
        connexionsMax: client.connexionsMax,
        pourcentageConnexionsUtilisees: client.connexionsMax > 0 
          ? ((client.connexionsMax - client.connexionsRestantes) / client.connexionsMax) * 100 
          : 0,
        
        // Documents
        documentsSoumis: {
          cin: !!client.cinUrl,
          rne: !!client.rneUrl,
          patente: !!client.patenteUrl,
          gerantCin: !!client.gerantCinUrl
        },
        documentsRequis: client.typeCompte === 'ENTREPRISE' 
          ? ['rne', 'patente', 'gerantCin'] 
          : ['cin'],
        documentsComplets: client.typeCompte === 'ENTREPRISE'
          ? (!!client.rneUrl && !!client.patenteUrl && !!client.gerantCinUrl)
          : !!client.cinUrl,
        
        // Dates
        dateInscription: client.dateInscription,
        dateValidation: client.dateValidation,
        dateActivation: client.dateActivation,
        
        // Base de données
        baseDonnees: {
          nom: client.nomBaseDonnees,
          existe: !!client.nomBaseDonnees,
          active: client.statutBaseDonnees === 'ACTIVE'
        }
      };
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Erreur getClientStats:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Vérifie si le client peut accéder aux services
   * @param {number|string} clientId - ID du client
   * @returns {Promise} - Promesse avec le statut d'accès
   */
  async checkAccess(clientId) {
    try {
      const response = await api.get(`/platform/clients/${clientId}/check-access`);
      return { 
        success: true, 
        data: response.data,
        hasAccess: response.data.hasAccess,
        reason: response.data.reason
      };
    } catch (error) {
      console.error('Erreur checkAccess:', error);
      return { 
        success: false, 
        hasAccess: false,
        reason: error.response?.data?.error || 'Erreur de vérification'
      };
    }
  },

  /**
   * Pour les clients DEFINITIF: renvoie le statut des documents
   * @param {number|string} clientId - ID du client
   * @returns {Promise} - Promesse avec le statut des documents
   */
  async getDocumentStatus(clientId) {
    try {
      const response = await api.get(`/platform/clients/${clientId}/documents/status`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur getDocumentStatus:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors du chargement des documents'
      };
    }
  },

  /**
   * Pour les clients DEFINITIF: soumet un document
   * @param {number|string} clientId - ID du client
   * @param {File} file - Fichier à uploader
   * @param {string} typeDocument - Type de document (CIN, RNE, PATENTE, GERANT_CIN)
   * @returns {Promise} - Promesse avec le résultat
   */
  async uploadDocument(clientId, file, typeDocument) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('typeDocument', typeDocument);
      
      const response = await api.post(`/platform/clients/${clientId}/justificatifs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur uploadDocument:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de l\'upload'
      };
    }
  }
};

// Exports individuels
export const getClientById = (clientId) => clientAbonneService.getClientById(clientId);
export const getCurrentClient = () => clientAbonneService.getCurrentClient();
export const updateClient = (clientId, data) => clientAbonneService.updateClient(clientId, data);
export const getClientAbonnement = (clientId) => clientAbonneService.getClientAbonnement(clientId);
export const getClientStats = (clientId) => clientAbonneService.getClientStats(clientId);
export const checkAccess = (clientId) => clientAbonneService.checkAccess(clientId);
export const getDocumentStatus = (clientId) => clientAbonneService.getDocumentStatus(clientId);
export const uploadDocument = (clientId, file, typeDocument) => clientAbonneService.uploadDocument(clientId, file, typeDocument);

export default clientAbonneService;