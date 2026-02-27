// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ DONNÉES VIDES PAR DÉFAUT
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
  
  // ✅ UNIQUEMENT les dates pour le filtre
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  const fetchDashboardData = useCallback(async (start = null, end = null, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let url = '/dashboard/summary';
      const params = new URLSearchParams();
      
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
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
  }, []); // ← Dépendances vides car n'utilise que des setters stables

  // ✅ Chargement initial - NE RIEN CHARGER (données vides)
  useEffect(() => {
    setLoading(false);
    // Pas de dépendances car on veut que ça s'exécute une seule fois
  }, []);
  
  // ✅ Appliquer un filtre personnalisé
  const applyCustomRange = (startDate, endDate) => {
    if (startDate && endDate) {
      setDateRange({ startDate, endDate });
      setFilterActive(true);
      fetchDashboardData(startDate, endDate);
    } else {
      // ✅ Si dates vides → retour aux données vides
      resetFilter();
    }
    setShowDatePicker(false);
  };

  // ✅ Réinitialiser le filtre (retour aux données vides)
  const resetFilter = () => {
    setDateRange({ startDate: null, endDate: null });
    setFilterActive(false);
    
    // ✅ Remettre les données vides
    setData({
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
    
    toast.success('Filtre réinitialisé');
  };

  // ✅ Rafraîchir les données actuelles
  const refresh = () => {
    if (filterActive && dateRange.startDate && dateRange.endDate) {
      fetchDashboardData(dateRange.startDate, dateRange.endDate, true);
    } else {
      // ✅ Si pas de filtre actif, on reste sur données vides
      toast.info('Aucun filtre actif à rafraîchir');
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