// services/commandeFournisseurService.js
import api from './api';

class CommandeFournisseurService {
  /**
   * Récupère toutes les commandes - GET /All
   */
  async getAllCommandes() {
    try {
      const response = await api.get('/commandes-fournisseurs/All');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      throw error;
    }
  }

  /**
   * Récupère une commande par son ID - GET /{id}
   */
  async getCommandeById(id) {
    try {
      const response = await api.get(`/commandes-fournisseurs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle commande - POST /add
   */
  async createCommande(commandeData) {
    try {
      const response = await api.post('/commandes-fournisseurs/add', commandeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  }

  /**
   * Met à jour une commande - PUT /update/{id}
   */
  async updateCommande(id, commandeData) {
    try {
      const response = await api.put(`/commandes-fournisseurs/update/${id}`, commandeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  }

  /**
   * Supprime une commande (hard delete) - DELETE /delete/{id}
   */
  async deleteCommande(id) {
    try {
      await api.delete(`/commandes-fournisseurs/delete/${id}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw error;
    }
  }

  /**
   * Valide une commande - PUT /{id}/valider
   */
  async validerCommande(id) {
    try {
      const response = await api.put(`/commandes-fournisseurs/${id}/valider`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation de la commande:', error);
      throw error;
    }
  }

  /**
 * Rejette une commande (Admin uniquement)
 * BROUILLON → REJETEE
 * PUT /api/commandes-fournisseurs/{id}/rejeter?motifRejet=...
 */
async rejeterCommande(id, motifRejet) {
  try {
    const response = await api.put(`/commandes-fournisseurs/${id}/rejeter`, null, {
      params: { motifRejet }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du rejet de la commande:', error);
    throw error;
  }
}

/**
 * Renvoie une commande rejetée en attente (Responsable ou Admin)
 * REJETEE → BROUILLON
 * PUT /api/commandes-fournisseurs/{id}/renvoyer-attente
 */
async renvoyerAttente(id) {
  try {
    const response = await api.put(`/commandes-fournisseurs/${id}/renvoyer-attente`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du renvoi en attente:', error);
    throw error;
  }
}

  /**
   * Envoie une commande au fournisseur - PUT /{id}/envoyer
   */
  async envoyerCommande(id) {
    try {
      const response = await api.put(`/commandes-fournisseurs/${id}/envoyer`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error);
      throw error;
    }
  }

  /**
* Enregistre la réception d'une commande - PUT /{id}/recevoir
 * @param {Integer} id - ID de la commande
 * @param {Object} receptionData - Données de réception (quantitesRecues, produitsAReactiver, numeroBL, notes)
 * 
 **/
 async recevoirCommande(id, receptionData) {
  try {
    const response = await api.put(`/commandes-fournisseurs/${id}/recevoir`, receptionData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la réception:', error);
    throw error;
  }
}


  /**
   * Recherche une commande par son numéro - GET /recherche/numero?numero=
   */
  async searchByNumero(numero) {
    try {
      const response = await api.get('/commandes-fournisseurs/recherche/numero', {
        params: { numero }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche par numéro:', error);
      throw error;
    }
  }

  /**
   * Recherche des commandes par période - GET /recherche/periode?debut=&fin=
   */
  async searchByPeriode(debut, fin) {
    try {
      const response = await api.get('/commandes-fournisseurs/recherche/periode', {
        params: { 
          debut: debut.toISOString(), 
          fin: fin.toISOString() 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche par période:', error);
      throw error;
    }
  }

  /**
   * Récupère les commandes archivées - GET /archived
   */
  async getArchivedCommandes() {
    try {
      const response = await api.get('/commandes-fournisseurs/archived');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des archives:', error);
      throw error;
    }
  }

  
}

export default new CommandeFournisseurService();