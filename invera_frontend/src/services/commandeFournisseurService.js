// services/commandeFournisseurService.js
import api from './api';

class CommandeFournisseurService {
  /**
   * Récupère toutes les commandes
   */
  async getAllCommandes() {
    try {
      const response = await api.get('/commandes-fournisseurs/all');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      throw error;
    }
  }

  /**
   * Récupère une commande par son ID avec tous ses détails
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
   * Crée une nouvelle commande
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
   * Met à jour une commande
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
   * Supprime une commande
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
   * Valide une commande
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
   * Envoie une commande au fournisseur
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
   * Enregistre la réception d'une commande
   */
  async recevoirCommande(id) {
    try {
      const response = await api.put(`/commandes-fournisseurs/${id}/recevoir`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réception:', error);
      throw error;
    }
  }

  /**
   * Annule une commande
   */
  async annulerCommande(id, raison) {
    try {
      const url = raison 
        ? `/commandes-fournisseurs/${id}/annuler?raison=${encodeURIComponent(raison)}`
        : `/commandes-fournisseurs/${id}/annuler`;
      const response = await api.put(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la commande:', error);
      throw error;
    }
  }

  /**
 * Marque une commande comme facturée
 */
async facturerCommande(id) {
  try {
    // À adapter selon votre endpoint backend
    const response = await api.put(`/commandes-fournisseurs/${id}/facturer`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la facturation de la commande:', error);
    throw error;
  }
}

  /**
   * Recherche une commande par son numéro
   */
  async searchByNumero(numero) {
    try {
      const response = await api.get(`/commandes-fournisseurs/recherche/numero`, {
        params: { numero }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche par numéro:', error);
      throw error;
    }
  }

  /**
   * Recherche des commandes par période
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
   * Récupère les commandes archivées (soft delete)
   */
  async getArchivedCommandes() {
    try {
      // À adapter selon votre endpoint backend
      const response = await api.get('/commandes-fournisseurs/archived');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des archives:', error);
      throw error;
    }
  }

  /**
   * Restaure une commande archivée
   */
  async restoreCommande(id) {
    try {
      // À adapter selon votre endpoint backend
      const response = await api.put(`/commandes-fournisseurs/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      throw error;
    }
  };

}

export default new CommandeFournisseurService();