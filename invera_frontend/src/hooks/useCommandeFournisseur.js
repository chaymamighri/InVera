// hooks/useCommandeFournisseur.js
import { useState, useEffect, useCallback } from 'react';
import commandeFournisseurService from '../services/commandeFournisseurService';

const showToast = (message, type = 'success') => {
  const event = new CustomEvent('showToast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

export const useCommandeFournisseur = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return !!token;
  }, []);

  /**
   * Charge toutes les commandes
   */
  const fetchCommandes = useCallback(async (showErrorToast = true) => {
    if (!checkAuth()) {
      console.warn('⚠️ Utilisateur non authentifié');
      setError('Session expirée. Veuillez vous reconnecter.');
      if (showErrorToast) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
      }
      setLoading(false);
      setInitialLoadDone(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Chargement des commandes...');
      const data = await commandeFournisseurService.getAllCommandes();
      console.log('✅ Commandes chargées:', data?.length || 0);
      
      setCommandes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Erreur fetchCommandes:', err);
      
      let errorMessage = 'Erreur lors du chargement des commandes';
      
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            break;
          case 403:
            errorMessage = 'Accès non autorisé.';
            break;
          case 404:
            errorMessage = 'Service non trouvé.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = `Erreur ${err.response.status}: ${err.response.data?.message || 'Inconnue'}`;
        }
      } else if (err.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      } else {
        errorMessage = err.message || 'Une erreur est survenue';
      }
      
      setError(errorMessage);
      
      if (showErrorToast && err.response?.status !== 401) {
        showToast(errorMessage, 'error');
      }
      
      if (err.response?.status === 401) {
        setCommandes([]);
      }
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, [checkAuth]);

  // Chargement initial
  useEffect(() => {
    if (initialLoadDone) return;
    
    const loadInitialData = async () => {
      if (!checkAuth()) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setInitialLoadDone(true);
        return;
      }
      await fetchCommandes(false);
    };
    
    loadInitialData();
  }, [fetchCommandes, checkAuth, initialLoadDone]);

  /**
   * Réessaie de charger les données
   */
  const retry = useCallback(() => {
    setError(null);
    fetchCommandes(true);
  }, [fetchCommandes]);

  /**
   * Rafraîchit les données
   */
  const refresh = useCallback(() => {
    fetchCommandes(true);
  }, [fetchCommandes]);

  /**
   * Crée une nouvelle commande
   */
  const createCommande = async (commandeData) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const newCommande = await commandeFournisseurService.createCommande(commandeData);
      showToast('Commande créée avec succès', 'success');
      await refresh();
      return newCommande;
    } catch (err) {
      console.error('❌ Erreur création:', err);
      
      let errorMessage = 'Erreur lors de la création';
      if (err.response?.status === 401) {
        errorMessage = 'Session expirée';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour une commande
   */
  const updateCommande = async (id, commandeData) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const updatedCommande = await commandeFournisseurService.updateCommande(id, commandeData);
      showToast('Commande modifiée avec succès', 'success');
      await refresh();
      return updatedCommande;
    } catch (err) {
      console.error('❌ Erreur modification:', err);
      
      let errorMessage = 'Erreur lors de la modification';
      if (err.response?.status === 401) {
        errorMessage = 'Session expirée';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime une commande (soft delete)
   */
  const deleteCommande = async (id) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      await commandeFournisseurService.deleteCommande(id);
      showToast('Commande supprimée avec succès', 'success');
      await refresh();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      
      let errorMessage = 'Erreur lors de la suppression';
      if (err.response?.status === 401) {
        errorMessage = 'Session expirée';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valide une commande
   */
  const validerCommande = async (id) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const commande = await commandeFournisseurService.validerCommande(id);
      showToast('Commande validée avec succès', 'success');
      await refresh();
      return commande;
    } catch (err) {
      console.error('❌ Erreur validation:', err);
      showToast('Erreur lors de la validation', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envoie une commande
   */
  const envoyerCommande = async (id) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const commande = await commandeFournisseurService.envoyerCommande(id);
      showToast('Commande envoyée avec succès', 'success');
      await refresh();
      return commande;
    } catch (err) {
      console.error('❌ Erreur envoi:', err);
      showToast("Erreur lors de l'envoi", 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enregistre la réception d'une commande
   */
const recevoirCommande = async (id, receptionData) => { 
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      // ✅ Passer receptionData au service
      const commande = await commandeFournisseurService.recevoirCommande(id, receptionData);
      showToast('Réception enregistrée avec succès', 'success');
      await refresh();
      return commande;
    } catch (err) {
      console.error('❌ Erreur réception:', err);
      showToast("Erreur lors de l'enregistrement", 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Annule une commande
   */
  const annulerCommande = async (id, raison) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const commande = await commandeFournisseurService.annulerCommande(id, raison);
      showToast('Commande annulée avec succès', 'success');
      await refresh();
      return commande;
    } catch (err) {
      console.error('❌ Erreur annulation:', err);
      showToast("Erreur lors de l'annulation", 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marque une commande comme facturée
   */
  const facturerCommande = async (id) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const commande = await commandeFournisseurService.facturerCommande(id);
      showToast('Commande facturée avec succès', 'success');
      await refresh();
      return commande;
    } catch (err) {
      console.error('❌ Erreur facturation:', err);
      showToast("Erreur lors de la facturation", 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recherche par numéro
   */
  const searchByNumero = async (numero) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const commande = await commandeFournisseurService.searchByNumero(numero);
      return commande;
    } catch (err) {
      console.error('❌ Erreur recherche:', err);
      showToast('Aucune commande trouvée', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recherche par période
   */
  const searchByPeriode = async (debut, fin) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const resultats = await commandeFournisseurService.searchByPeriode(debut, fin);
      setCommandes(resultats || []);
      showToast(`${resultats?.length || 0} commande(s) trouvée(s)`, 'success');
      return resultats;
    } catch (err) {
      console.error('❌ Erreur recherche période:', err);
      showToast('Erreur lors de la recherche', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les commandes archivées
   */
  const fetchArchivedCommandes = useCallback(async () => {
    if (!checkAuth()) {
      return;
    }

    try {
      setLoading(true);
      const data = await commandeFournisseurService.getArchivedCommandes();
      setCommandes(Array.isArray(data) ? data : []);
      showToast(`${data?.length || 0} commande(s) archivée(s)`, 'info');
    } catch (err) {
      console.error('Erreur chargement archives:', err);
      showToast('Erreur lors du chargement des archives', 'error');
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  /**
   * Restaure une commande archivée
   */
  const restoreCommande = useCallback(async (id) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const result = await commandeFournisseurService.restoreCommande(id);
      showToast('Commande restaurée avec succès', 'success');
      await refresh();
      return result;
    } catch (err) {
      console.error('Erreur restauration:', err);
      showToast('Erreur lors de la restauration', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkAuth, refresh]);

  return {
    // Données
    commandes,
    loading,
    error,
    initialLoadDone,
    
    // Actions
    fetchCommandes,
    refresh,
    retry,
    
    // CRUD
    createCommande,
    updateCommande,
    deleteCommande,
    
    // Actions statut
    validerCommande,
    envoyerCommande,
    recevoirCommande,
    annulerCommande,
    facturerCommande,  
    
    // Recherches
    searchByNumero,
    searchByPeriode,
    
    // Utilitaires
    checkAuth,
    
    // Archive commande
    fetchArchivedCommandes,
    restoreCommande,
  };
};