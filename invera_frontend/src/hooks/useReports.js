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

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Préparer les filtres pour l'API
   */
  const prepareFiltersForApi = (rawFilters) => {
    const apiFilters = { ...rawFilters };
    
    // Si on a des dates, on s'assure que l'API comprend qu'on est en mode personnalisé
    if (rawFilters.startDate && rawFilters.endDate) {
      // On peut ajouter un flag ou garder tel quel selon ce qu'attend votre API
      console.log('📅 Filtres avec dates personnalisées:', rawFilters);
    }
    
    // Nettoyer les valeurs undefined
    Object.keys(apiFilters).forEach(key => {
      if (apiFilters[key] === undefined) {
        delete apiFilters[key];
      }
    });
    
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
      setLoading(true);
      setError(null);

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
      
      setData(response);
      return response;
    } catch (err) {
      const message = err.message || 'Erreur de chargement';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [reportType]);

  // ✅ Chargement initial (TOUJOURS APPELÉ)
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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
    
    // Calculer les nouveaux filtres
    const updatedFilters = { ...filtersRef.current, ...newFilters };
    
    // Mettre à jour l'état et la ref
    setFilters(updatedFilters);
    filtersRef.current = updatedFilters;
    
    // Recharger avec les nouveaux filtres
    fetchReport(updatedFilters);
    
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
    fetchReport(initialFilters);
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