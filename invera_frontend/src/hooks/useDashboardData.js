// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const fetchDashboardData = useCallback(async (period = selectedPeriod, customDates = null, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let url = `/dashboard/summary?period=${period}`;
      
      // Si c'est une période personnalisée avec des dates
      if (period === 'custom' && customDates) {
        url = `/dashboard/summary?startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
      }

      console.log('📡 Appel API:', url);
      const response = await api.get(url);
      
      if (response.data && response.data.success) {
        setData(response.data);
        setError(null);
      } else {
        throw new Error('Erreur de chargement des données');
      }
    } catch (err) {
      console.error('❌ Erreur dashboard:', err);
      setError('Impossible de charger les données du tableau de bord');
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  // Chargement initial
  useEffect(() => {
    fetchDashboardData();
    
    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(() => {
      if (selectedPeriod === 'custom' && customDateRange.startDate) {
        fetchDashboardData('custom', customDateRange, true);
      } else {
        fetchDashboardData(selectedPeriod, null, true);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData, selectedPeriod, customDateRange]);

  const changePeriod = (period) => {
    setSelectedPeriod(period);
    setShowCustomPicker(period === 'custom');
    
    // Pour 'year', on peut définir automatiquement les dates de l'année en cours
    if (period === 'year') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setCustomDateRange({
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay)
      });
      
      fetchDashboardData('custom', {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay)
      });
    } else if (period !== 'custom') {
      fetchDashboardData(period);
    }
  };

  const applyCustomRange = (startDate, endDate) => {
    setCustomDateRange({ startDate, endDate });
    fetchDashboardData('custom', { startDate, endDate });
    setShowCustomPicker(false);
  };

  const refresh = () => {
    if (selectedPeriod === 'custom' && customDateRange.startDate) {
      fetchDashboardData('custom', customDateRange, true);
    } else {
      fetchDashboardData(selectedPeriod, null, true);
    }
    toast.success('Données mises à jour');
  };

  const formatCurrency = (value) => {
    // Format Dinar Tunisien
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format((value || 0) / 100);
  };

  return {
    loading,
    refreshing,
    error,
    data,
    selectedPeriod,
    customDateRange,
    showCustomPicker,
    changePeriod,
    applyCustomRange,
    setShowCustomPicker,
    refresh,
    formatCurrency,
    formatPercentage
  };
};