// src/hooks/useReports.js - Version simple
import { useState, useCallback } from 'react';
import api from '../services/api'; // Votre api.js inclut déjà authHeader

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Récupérer un rapport
   */
  const fetchReport = useCallback(async (type, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Construire les paramètres
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.clientType && filters.clientType !== 'all') 
        params.append('clientType', filters.clientType);
      if (filters.status && filters.status !== 'all') 
        params.append('status', filters.status);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Votre api.js va automatiquement utiliser authHeader()
      const response = await api.get(`/api/reports/${type}${queryString}`);
      
      setData(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur de chargement';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    if (data) {
      fetchReport(type, filters);
    }
  }, [fetchReport, type, filters]);

  return {
    loading,
    error,
    data,
    fetchReport,
    refresh,
    setData
  };
};