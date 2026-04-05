// src/hooks/useReports.js
import { useState, useCallback, useEffect, useRef } from 'react';
import reportService from '../services/ReportService';

export const useReports = (reportType, initialFilters = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  
  const filtersRef = useRef(filters);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Préparer les filtres pour l'API
   */
  const prepareFiltersForApi = (rawFilters) => {
    const apiFilters = { ...rawFilters };
    
    // Supprimer period si présent (on utilise startDate/endDate)
    delete apiFilters.period;
    
    // Nettoyer les valeurs undefined et null
    Object.keys(apiFilters).forEach(key => {
      if (apiFilters[key] === undefined || apiFilters[key] === null || apiFilters[key] === '') {
        delete apiFilters[key];
      }
    });
    
    // Convertir les valeurs spéciales
    if (apiFilters.clientType === 'all') delete apiFilters.clientType;
    if (apiFilters.status === 'all') delete apiFilters.status;
    
    console.log(`📡 API Filters for ${reportType}:`, apiFilters);
    return apiFilters;
  };

  /**
   * Récupérer un rapport
   */
  const fetchReport = useCallback(async (customFilters = null) => {
    // Éviter les appels multiples simultanés
    if (isLoadingRef.current) {
      console.log(`⏭️ useReports[${reportType}] - Déjà en chargement, ignoré`);
      return;
    }

    try {
      isLoadingRef.current = true;
      if (isMountedRef.current) setLoading(true);
      if (isMountedRef.current) setError(null);

      const filtersToUse = customFilters || filtersRef.current;
      
      // Préparer les filtres pour l'API
      const apiFilters = prepareFiltersForApi(filtersToUse);
      
      console.log(`📡 useReports[${reportType}] - Chargement avec filtres:`, apiFilters);
      
      let response;
      switch(reportType) {
        case 'sales':
          response = await reportService.getSalesReport(apiFilters);
          break;
        case 'invoices':
          response = await reportService.getInvoicesReport(apiFilters);
          break;
        case 'clients':
          response = await reportService.getClientsReport(apiFilters);
          break;
        default:
          response = await reportService.getReport(reportType, apiFilters);
      }
      
      // Vérifier la structure de la réponse
      console.log(`📡 useReports[${reportType}] - Réponse reçue:`, response);
      
      // Normaliser la réponse
      let normalizedData = response;
      if (response && !response.factures && Array.isArray(response)) {
        // Si la réponse est un tableau direct
        normalizedData = {
          factures: response,
          summary: calculateSummary(response)
        };
      } else if (response && !response.factures && response.data && Array.isArray(response.data)) {
        // Si la réponse est dans data
        normalizedData = {
          factures: response.data,
          summary: response.summary || calculateSummary(response.data)
        };
      }
      
      if (isMountedRef.current) {
        setData(normalizedData);
        console.log(`✅ useReports[${reportType}] - ${normalizedData.factures?.length || 0} éléments chargés`);
      }
      
      return normalizedData;
    } catch (err) {
      const message = err.message || 'Erreur de chargement';
      console.error(`❌ useReports[${reportType}] - Erreur:`, err);
      if (isMountedRef.current) setError(message);
      throw err;
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, [reportType]);

  // Calcul du summary si non fourni par l'API
  const calculateSummary = (factures) => {
    if (!factures || !Array.isArray(factures)) {
      return {
        totalFactures: 0,
        montantTotal: 0,
        payees: 0,
        impayees: 0,
        montantPaye: 0,
        montantImpaye: 0,
        enRetard: 0,
        tauxRecouvrement: 0
      };
    }
    
    const totalFactures = factures.length;
    const montantTotal = factures.reduce((sum, f) => sum + (f.montant || 0), 0);
    const payees = factures.filter(f => f.statut === 'PAYE' || f.statut === 'Payée').length;
    const impayees = factures.filter(f => f.statut === 'NON_PAYE' || f.statut === 'Impayée').length;
    const montantPaye = factures
      .filter(f => f.statut === 'PAYE' || f.statut === 'Payée')
      .reduce((sum, f) => sum + (f.montant || 0), 0);
    const montantImpaye = montantTotal - montantPaye;
    
    return {
      totalFactures,
      montantTotal,
      payees,
      impayees,
      montantPaye,
      montantImpaye,
      enRetard: 0,
      tauxRecouvrement: totalFactures > 0 ? (payees / totalFactures) * 100 : 0
    };
  };

  // ✅ Chargement initial
  useEffect(() => {
    fetchReport();
  }, []); // Dépendance vide pour ne charger qu'une fois

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    console.log(`🔄 useReports[${reportType}] - Rafraîchissement`);
    return fetchReport();
  }, [fetchReport, reportType]);

  /**
   * Mettre à jour les filtres ET recharger
   */
  const updateFilters = useCallback((newFilters) => {
    console.log(`📝 useReports[${reportType}] - Mise à jour filtres:`, newFilters);
    
    // Fusionner les nouveaux filtres avec les existants
    const updatedFilters = { ...filtersRef.current, ...newFilters };
    
    // Mettre à jour l'état et la ref
    setFilters(updatedFilters);
    filtersRef.current = updatedFilters;
    
    // Recharger avec les nouveaux filtres
    return fetchReport(updatedFilters);
  }, [fetchReport, reportType]);

  /**
   * Réinitialiser les filtres
   */
  const resetFilters = useCallback(() => {
    console.log(`🔄 useReports[${reportType}] - Réinitialisation des filtres`);
    
    // Mettre à jour l'état et la ref
    setFilters(initialFilters);
    filtersRef.current = initialFilters;
    
    // Recharger
    return fetchReport(initialFilters);
  }, [fetchReport, initialFilters, reportType]);

  return {
    loading,
    error,
    data,
    filters,
    setFilters: updateFilters,
    resetFilters,          
    fetchReport,
    refresh,
    setData
  };
};