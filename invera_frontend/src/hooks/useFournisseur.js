// hooks/useFournisseur.js - Version avec fonction utilitaire

import { useState, useEffect, useCallback } from 'react';
import fournisseurService from '../services/fournisseurService';

// Fonction utilitaire pour normaliser un fournisseur
const normalizeFournisseur = (fournisseur) => {
  if (!fournisseur) return null;
  return {
    idFournisseur: fournisseur.idFournisseur,
    nomFournisseur: fournisseur.nomFournisseur,
    matriculeFiscale: fournisseur.matriculeFiscale || fournisseur.matricule_fiscale,
    email: fournisseur.email,
    telephone: fournisseur.telephone,
    adresse: fournisseur.adresse,
    ville: fournisseur.ville,
    pays: fournisseur.pays,
    actif: fournisseur.actif
  };
};

// Fonction pour normaliser un tableau de fournisseurs
const normalizeFournisseurs = (fournisseurs) => {
  if (!Array.isArray(fournisseurs)) return [];
  return fournisseurs.map(normalizeFournisseur);
};

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
  const [allFournisseurs, setAllFournisseurs] = useState([]);

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
      const normalizedData = normalizeFournisseurs(data);
      setFournisseurs(normalizedData);
      setAllFournisseurs(normalizedData);
      return normalizedData;
    });
  }, []);

  const fetchActiveFournisseurs = useCallback(async () => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getActiveFournisseurs();
      const normalizedData = normalizeFournisseurs(data);
      setActiveFournisseurs(normalizedData);
      return normalizedData;
    });
  }, []);

  const fetchInactiveFournisseurs = useCallback(async () => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getInactiveFournisseurs();
      const normalizedData = normalizeFournisseurs(data);
      setInactiveFournisseurs(normalizedData);
      return normalizedData;
    });
  }, []);

  // ==================== FETCH BY ID ====================

  const fetchFournisseurById = useCallback(async (id, admin = false) => {
    return handleAsyncOperation(async () => {
      const data = await fournisseurService.getFournisseurById(id, admin);
      const normalizedData = normalizeFournisseur(data);
      setSelectedFournisseur(normalizedData);
      return normalizedData;
    });
  }, []);

  // ==================== CREATE ====================

  const createFournisseur = useCallback(async (fournisseurData) => {
    return handleAsyncOperation(async () => {
      const newFournisseur = await fournisseurService.createFournisseur(fournisseurData);
      await fetchAllFournisseurs();
      await fetchActiveFournisseurs();
      return newFournisseur;
    });
  }, [fetchAllFournisseurs, fetchActiveFournisseurs]);

  // ==================== UPDATE ====================

  const updateFournisseur = useCallback(async (id, fournisseurData) => {
    return handleAsyncOperation(async () => {
      const updated = await fournisseurService.updateFournisseur(id, fournisseurData);
      await fetchAllFournisseurs();
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      if (selectedFournisseur?.idFournisseur === id) {
        setSelectedFournisseur(normalizeFournisseur(updated));
      }
      return updated;
    });
  }, [selectedFournisseur, fetchAllFournisseurs, fetchActiveFournisseurs, fetchInactiveFournisseurs]);

  // ==================== SOFT DELETE ====================

  const softDeleteFournisseur = useCallback(async (id) => {
    return handleAsyncOperation(async () => {
      const result = await fournisseurService.softDeleteFournisseur(id);
      await fetchAllFournisseurs();
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
      await fetchAllFournisseurs();
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
      await fetchAllFournisseurs();
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
    fetchAllFournisseurs();
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
    fetchAllFournisseurs,
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
        setFournisseur(normalizeFournisseur(data));
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