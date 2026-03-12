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
  const [stats, setStats] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return !!token;
  }, []);

  /**
   * Charge toutes les commandes avec gestion d'erreur améliorée
   */
  const fetchCommandes = useCallback(async (showErrorToast = true) => {
    // Vérifier l'authentification avant de faire l'appel
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
      setError(null);
    } catch (err) {
      console.error('❌ Erreur fetchCommandes:', err);
      
      // Gestion fine des erreurs
      let errorMessage = 'Erreur lors du chargement des commandes';
      
      if (err.response) {
        // Erreur avec réponse du serveur
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
        // Pas de réponse du serveur
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      } else {
        // Erreur de configuration
        errorMessage = err.message || 'Une erreur est survenue';
      }
      
      setError(errorMessage);
      
      // Ne pas afficher de toast pour les erreurs 401 (redirection gérée ailleurs)
      if (showErrorToast && err.response?.status !== 401) {
        showToast(errorMessage, 'error');
      }
      
      // En cas d'erreur 401, on vide les commandes
      if (err.response?.status === 401) {
        setCommandes([]);
      }
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, [checkAuth]);

  /**
   * Charge les statistiques
   */
  const fetchStats = useCallback(async () => {
    // Ne pas essayer de charger les stats si non authentifié
    if (!checkAuth()) {
      return;
    }

    try {
      const data = await commandeFournisseurService.getStats();
      setStats(data || null);
    } catch (err) {
      console.error('⚠️ Erreur stats (non bloquante):', err);
  
    }
  }, [checkAuth]);

  // Effet de chargement initial
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      if (!checkAuth()) {
        if (mounted) {
          setError('Session expirée. Veuillez vous reconnecter.');
          setInitialLoadDone(true);
        }
        return;
      }
      
      await fetchCommandes(false); 
      if (mounted) {
        await fetchStats();
      }
    };
    
    loadInitialData();
    
    return () => {
      mounted = false;
    };
  }, [fetchCommandes, fetchStats, checkAuth]);

  /**
   * Réessaie de charger les données
   */
  const retry = useCallback(() => {
    setError(null);
    fetchCommandes(true);
    fetchStats();
  }, [fetchCommandes, fetchStats]);

  /**
   * Rafraîchit les données
   */
  const refresh = useCallback(() => {
    fetchCommandes(true);
    fetchStats();
  }, [fetchCommandes, fetchStats]);

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
   * Supprime une commande
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
  const recevoirCommande = async (id) => {
    if (!checkAuth()) {
      showToast('Session expirée', 'error');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      const commande = await commandeFournisseurService.recevoirCommande(id);
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

    // Fonction pour charger les commandes archivées (soft delete)
  const fetchArchivedCommandes = useCallback(async () => {
    if (!checkAuth()) {
      return;
    }

    try {
      setLoading(true);
      const data = await commandeFournisseurService.getArchivedCommandes();
      setCommandes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement archives:', err);
      toast.error('Erreur lors du chargement des archives');
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  // Fonction pour restaurer une commande
  const restoreCommande = useCallback(async (id) => {
    if (!checkAuth()) {
      toast.error('Session expirée');
      throw new Error('Non authentifié');
    }

    try {
      setLoading(true);
      // À implémenter selon votre API backend
      const result = await commandeFournisseurService.restoreCommande(id);
      toast.success('Commande restaurée avec succès');
      return result;
    } catch (err) {
      console.error('Erreur restauration:', err);
      toast.error('Erreur lors de la restauration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  return {
    // Données
    commandes,
    loading,
    error,
    stats,
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
    
    // Recherches
    searchByNumero,
    searchByPeriode,
    
    // Utilitaires
    fetchStats,
    checkAuth,
    
    //Archive commande (commande qui sont avec "active = false" )
    fetchArchivedCommandes,
    restoreCommande,
  };
};