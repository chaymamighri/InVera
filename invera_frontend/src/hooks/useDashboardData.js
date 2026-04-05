// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/DashboardService ';
import { toast } from 'react-hot-toast';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [data, setData] = useState({
    success: true,
    kpi: {
      caJour: 0,
      caHier: 0,
      caSemaine: 0,
      caMois: 0,
      caAnnee: 0,
      variationJour: 0,
      variationSemaine: 0,
      variationMois: 0,
      variationAnnee: 0,
      commandesJour: 0,
      commandesHier: 0,
      commandesSemaine: 0,
      commandesMois: 0,
      commandesAnnee: 0,
      panierMoyen: 0,
      tauxTransformation: 0,
      creancesTotal: 0,
      creancesNombre: 0,
      facturesEnRetard: 0
    },
    charts: {
      evolutionCA: [],
      topProduits: []
    },
    statusRepartition: [],
    ordersEvolution: [],
    clientTypeRepartition: []
  });
  
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // ✅ Fonction pour obtenir les dates par défaut (30 derniers jours)
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // ✅ Fonction pour fetch les données (corrigée)
  const fetchDashboardData = useCallback(async (start = null, end = null, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // ✅ Gérer les dates par défaut si aucune n'est fournie
      let effectiveStart = start;
      let effectiveEnd = end;
      
      if ((!effectiveStart || effectiveStart === '') && (!effectiveEnd || effectiveEnd === '') && !filterActive) {
        // Chargement initial : utiliser les 30 derniers jours
        const defaultDates = getDefaultDates();
        effectiveStart = defaultDates.startDate;
        effectiveEnd = defaultDates.endDate;
        console.log('📅 Chargement initial - 30 derniers jours:', { effectiveStart, effectiveEnd });
      }
      
      // ✅ Appeler le service avec les dates
      const responseData = await dashboardService.getDashboardData(
        effectiveStart && effectiveStart !== '' ? effectiveStart : null,
        effectiveEnd && effectiveEnd !== '' ? effectiveEnd : null
      );
      
      if (responseData) {
        setData(responseData);
        setError(null);
        
        // ✅ Mettre à jour dateRange si on a utilisé des dates
        if (effectiveStart && effectiveEnd && effectiveStart !== '' && effectiveEnd !== '') {
          setDateRange({ startDate: effectiveStart, endDate: effectiveEnd });
          setFilterActive(true);
        } else if (!effectiveStart || !effectiveEnd) {
          // Si pas de dates valides, pas de filtre actif
          setFilterActive(false);
        }
      } else {
        throw new Error('Données non reçues du serveur');
      }
      
    } catch (err) {
      console.error('❌ Erreur dashboard:', err);
      setError(err.message || 'Impossible de charger les données du tableau de bord');
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterActive]);

  // ✅ Chargement initial des données
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✅ Appliquer un filtre personnalisé
  const applyCustomRange = (startDate, endDate) => {
    console.log('🔍 applyCustomRange appelé avec:', { startDate, endDate });
    
    // Cas 1: Les deux dates sont vides -> reset
    if ((!startDate || startDate === '') && (!endDate || endDate === '')) {
      resetFilter();
      return;
    }
    
    // Cas 2: Au moins une date est fournie
    const newStart = (startDate && startDate !== '') ? startDate : null;
    const newEnd = (endDate && endDate !== '') ? endDate : null;
    
    setDateRange({ startDate: newStart, endDate: newEnd });
    setFilterActive(true);
    fetchDashboardData(newStart, newEnd);
    setShowDatePicker(false);
  };

  // ✅ Réinitialiser le filtre
  const resetFilter = () => {
    console.log('🔄 Reset filter - chargement des 30 derniers jours');
    setDateRange({ startDate: null, endDate: null });
    setFilterActive(false);
    
    // Recharger les données par défaut (30 derniers jours)
    const defaultDates = getDefaultDates();
    fetchDashboardData(defaultDates.startDate, defaultDates.endDate);
    
    toast.success('Filtre réinitialisé - Affichage des 30 derniers jours');
  };

  // ✅ Rafraîchir les données actuelles
  const refresh = () => {
    if (filterActive && dateRange.startDate && dateRange.endDate) {
      console.log('🔄 Rafraîchissement avec filtre actif');
      fetchDashboardData(dateRange.startDate, dateRange.endDate, true);
    } else if (filterActive && (dateRange.startDate || dateRange.endDate)) {
      console.log('🔄 Rafraîchissement avec une seule date');
      fetchDashboardData(dateRange.startDate || null, dateRange.endDate || null, true);
    } else {
      console.log('🔄 Rafraîchissement sans filtre');
      const defaultDates = getDefaultDates();
      fetchDashboardData(defaultDates.startDate, defaultDates.endDate, true);
    }
  };

  // ✅ Formatage monétaire
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(value || 0);
  };

  // ✅ Formatage pourcentage
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
    dateRange,
    filterActive,
    showDatePicker,
    setShowDatePicker,
    applyCustomRange,
    resetFilter,
    refresh,
    formatCurrency,
    formatPercentage
  };
};