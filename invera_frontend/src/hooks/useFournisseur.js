// hooks/useFournisseur.js - CORRIGÉ

import { useState, useEffect, useCallback } from 'react';
import fournisseurService from '../services/fournisseurService';

export const useFournisseur = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [activeFournisseurs, setActiveFournisseurs] = useState([]);
  const [inactiveFournisseurs, setInactiveFournisseurs] = useState([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10
  });
  const [allFournisseurs, setAllFournisseurs] = useState([]); // ← À utiliser peut-être

  // ==================== LOADING STATE ====================

  const handleAsyncOperation = async (operation) => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH ALL ====================

  const fetchAllFournisseurs = useCallback(async () => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getAllFournisseurs();
      // Normaliser les données pour garantir les noms de propriétés
      const normalizedData = data.map(f => ({
        idFournisseur: f.idFournisseur,
        nomFournisseur: f.nomFournisseur,
        email: f.email,
        telephone: f.telephone,
        adresse: f.adresse,
        ville: f.ville,
        pays: f.pays,
        actif: f.actif
      }));
      setFournisseurs(normalizedData);
      setAllFournisseurs(normalizedData); // ← Met à jour aussi allFournisseurs
      return normalizedData;
    });
  }, []);

  const fetchActiveFournisseurs = useCallback(async () => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getActiveFournisseurs();
      setActiveFournisseurs(data);
      return data;
    });
  }, []);

  const fetchInactiveFournisseurs = useCallback(async () => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getInactiveFournisseurs();
      setInactiveFournisseurs(data);
      return data;
    });
  }, []);

  // ==================== FETCH BY ID ====================

  const fetchFournisseurById = useCallback(async (id, admin = false) => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getFournisseurById(id, admin);
      setSelectedFournisseur(data);
      return data;
    });
  }, []);

  // ==================== CREATE ====================

  const createFournisseur = useCallback(async (fournisseurData) => {
    return handleAsyncOperation(async () => {
      const newFournisseur = await fournisseurService.createFournisseur(fournisseurData);
      // Mettre à jour les listes
      await fetchAllFournisseurs();  // ← Utilise fetchAllFournisseurs au lieu de fetchAllFournisseursList
      await fetchActiveFournisseurs();
      return newFournisseur;
    });
  }, [fetchAllFournisseurs, fetchActiveFournisseurs]);

  // ==================== UPDATE ====================

  const updateFournisseur = useCallback(async (id, fournisseurData) => {
    return handleAsyncOperation(async () => {
      const updated = await fournisseurService.updateFournisseur(id, fournisseurData);
      // Mettre à jour les listes
      await fetchAllFournisseurs();  // ← Corrigé
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      if (selectedFournisseur?.idFournisseur === id) {
        setSelectedFournisseur(updated);
      }
      return updated;
    });
  }, [selectedFournisseur, fetchAllFournisseurs, fetchActiveFournisseurs, fetchInactiveFournisseurs]);

  // ==================== SOFT DELETE ====================

  const softDeleteFournisseur = useCallback(async (id) => {
    return handleAsyncOperation(async () => {
      const result = await fournisseurService.softDeleteFournisseur(id);
      // Mettre à jour les listes
      await fetchAllFournisseurs();  // ← Corrigé
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      if (selectedFournisseur?.idFournisseur === id) {
        setSelectedFournisseur(null);
      }
      return result;
    });
  }, [selectedFournisseur, fetchAllFournisseurs, fetchActiveFournisseurs, fetchInactiveFournisseurs]);

  // ==================== HARD DELETE ====================

  const hardDeleteFournisseur = useCallback(async (id) => {
    return handleAsyncOperation(async () => {
      const result = await fournisseurService.hardDeleteFournisseur(id);
      // Mettre à jour les listes
      await fetchAllFournisseurs();  // ← Corrigé
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      if (selectedFournisseur?.idFournisseur === id) {
        setSelectedFournisseur(null);
      }
      return result;
    });
  }, [selectedFournisseur, fetchAllFournisseurs, fetchActiveFournisseurs, fetchInactiveFournisseurs]);

  // ==================== REACTIVATE ====================

  const reactivateFournisseur = useCallback(async (id) => {
    return handleAsyncOperation(async () => {
      const result = await fournisseurService.reactivateFournisseur(id);
      // Mettre à jour les listes
      await fetchAllFournisseurs();  // ← Corrigé
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      return result;
    });
  }, [fetchAllFournisseurs, fetchActiveFournisseurs, fetchInactiveFournisseurs]);

  // ==================== SEARCH ====================

  const searchFournisseurs = useCallback(async (term, page = 0, size = 10, sort = 'nomFournisseur,asc', all = false) => {
    return handleAsyncOperation(async () => {
      const result = await fournisseurService.searchFournisseurs(term, page, size, sort, all);
      setPagination({
        currentPage: result.number || page,
        totalPages: result.totalPages || 0,
        totalElements: result.totalElements || 0,
        pageSize: result.size || size
      });
      return result.content || result;
    });
  }, []);

  // ==================== STATS ====================

  const fetchStats = useCallback(async () => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getStats();
      setStats(data);
      return data;
    });
  }, []);

  // ==================== CLEAR SELECTED ====================

  const clearSelectedFournisseur = useCallback(() => {
    setSelectedFournisseur(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    fetchStats();
    fetchAllFournisseurs();  // ← Utilise fetchAllFournisseurs au lieu de fetchAllFournisseursList
  }, [fetchStats, fetchAllFournisseurs]);

  return {
    // Data
    fournisseurs,
    activeFournisseurs,
    inactiveFournisseurs,
    selectedFournisseur,
    allFournisseurs,
    stats,
    loading,
    error,
    pagination,

    // CRUD Operations
    fetchAllFournisseurs,      // ← C'est la même fonction partout
    fetchActiveFournisseurs,
    fetchInactiveFournisseurs,
    fetchFournisseurById,
    createFournisseur,
    updateFournisseur,
    softDeleteFournisseur,
    hardDeleteFournisseur,
    reactivateFournisseur,
    searchFournisseurs,
    fetchStats,

    // Utils
    clearSelectedFournisseur,
    clearError
  };
};

// Hook pour la gestion d'un fournisseur spécifique
export const useFournisseurDetail = (id, admin = false) => {
  const [fournisseur, setFournisseur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFournisseur = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await fournisseurService.getFournisseurById(id, admin);
        setFournisseur(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFournisseur();
  }, [id, admin]);

  return { fournisseur, loading, error };
};