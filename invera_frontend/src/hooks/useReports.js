// src/hooks/useReports.js
import { useState, useCallback, useEffect, useRef } from 'react';
import reportService from '../services/ReportService';

export const useReports = (reportType, initialFilters = {}) => {
  // ✅ TOUS LES HOOKS DOIVENT ÊTRE APPELÉS DANS LE MÊME ORDRE À CHAQUE RENDU
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  
  // ✅ Ref pour éviter les re-rendus inutiles
  const filtersRef = useRef(filters);
  
  // ✅ Ref pour suivre l'état de chargement (TOUJOURS DÉCLARÉE)
  const isLoadingRef = useRef(false);

  // ✅ Mettre à jour la ref quand filters change (TOUJOURS APPELÉ)
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

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
      
      console.log(`📡 useReports[${reportType}] - Chargement avec filtres:`, filtersToUse);
      
      let response;
      switch(reportType) {
        case 'sales':
          response = await reportService.getSalesReport(filtersToUse);
          break;
        case 'invoices':
          response = await reportService.getInvoicesReport(filtersToUse);
          break;
        case 'clients':
          response = await reportService.getClientsReport(filtersToUse);
          break;
        default:
          response = await reportService.getReport(reportType, filtersToUse);
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