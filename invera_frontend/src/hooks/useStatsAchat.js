// src/hooks/useStatsAchat.js
import { useState, useEffect, useCallback } from 'react';
import statsAchatService from '../services/statsAchatService';

export const useStatsAchat = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    commandes: { total: 0, enAttente: 0, enCours: 0, livre: 0, tendance: 0 },
    produits: { total: 0, actifs: 0, rupture: 0, alerte: 0, tendance: 0 },
    stock: { valeurTotale: 0, mouvementsMois: 0, rotation: 0, tendance: 0 },
    factures: { total: 0, payees: 0, impayees: 0, montantTotal: 0, tendance: 0 },
  });
  const [evolutionCommandes, setEvolutionCommandes] = useState([]);
  const [mouvementsStock, setMouvementsStock] = useState([]);
  const [repartitionCategories, setRepartitionCategories] = useState([]);
  const [alertesStock, setAlertesStock] = useState([]);
  const [commandesATraiter, setCommandesATraiter] = useState({ enAttente: 0, enCours: 0 });
  const [kpis, setKpis] = useState(null);
  const [currentStartDate, setCurrentStartDate] = useState('');
  const [currentEndDate, setCurrentEndDate] = useState('');

  const fetchAllStats = useCallback(async (startDateParam = '', endDateParam = '') => {
    setLoading(true);
    setError(null);

    const startDate = startDateParam;
    const endDate = endDateParam;

    try {
      const [
        dashboardResult,
        evolutionData,
        mouvementsData,
        categoriesData,
        alertesData,
        commandesData,
        kpisData
      ] = await Promise.all([
        statsAchatService.getDashboardStats(startDate, endDate),
        statsAchatService.getEvolutionCommandes(startDate, endDate),
        statsAchatService.getMouvementsStock(startDate, endDate),
        statsAchatService.getRepartitionCategories(startDate, endDate),
        statsAchatService.getAlertesStock(startDate, endDate),
        statsAchatService.getCommandesATraiter(startDate, endDate),
        statsAchatService.getKPIs(startDate, endDate)
      ]);

      // Mettre à jour les dates courantes
      if (startDateParam) setCurrentStartDate(startDateParam);
      if (endDateParam) setCurrentEndDate(endDateParam);

      // Dashboard stats
      if (dashboardResult && dashboardResult.success && dashboardResult.data) {
        const d = dashboardResult.data;
        setStats({
          commandes: {
            total: d.commandes?.total ?? 0,
            enAttente: d.commandes?.enAttente ?? 0,
            enCours: d.commandes?.enCours ?? 0,
            livre: d.commandes?.livre ?? 0,
            tendance: d.commandes?.tendance ?? 0,
          },
          produits: {
            total: d.produits?.total ?? 0,
            actifs: d.produits?.actifs ?? 0,
            rupture: d.produits?.rupture ?? 0,
            alerte: d.produits?.alerte ?? 0,
            tendance: d.produits?.tendance ?? 0,
          },
          stock: {
            valeurTotale: d.stock?.valeurTotale ?? 0,
            mouvementsMois: d.stock?.mouvementsMois ?? 0,
            rotation: d.stock?.rotation ?? 0,
            tendance: d.stock?.tendance ?? 0,
          },
          factures: {
            total: d.factures?.total ?? 0,
            payees: d.factures?.payees ?? 0,
            impayees: d.factures?.impayees ?? 0,
            montantTotal: d.factures?.montantTotal ?? 0,
            tendance: d.factures?.tendance ?? 0,
          },
        });
      }

      // Évolution commandes
      setEvolutionCommandes(Array.isArray(evolutionData)
        ? evolutionData.map(item => ({ label: item.label ?? '', valeur: item.valeur ?? 0 }))
        : []
      );

      // Mouvements stock
     // ✅ LIGNE 73 - Corrigé (bon)
setMouvementsStock(Array.isArray(mouvementsData)
  ? mouvementsData.map(item => ({ 
      label: item.label ?? '', 
      entrees: item.entrees ?? 0,
      sorties: item.sorties ?? 0,    
      max: item.max ?? 0,           
      dateRange: item.dateRange ?? '' 
    }))
  : []
);

      // Répartition catégories
      setRepartitionCategories(Array.isArray(categoriesData)
        ? categoriesData.map(item => ({ categorie: item.categorie ?? 'N/A', nombreProduits: item.nombreProduits ?? 0 }))
        : []
      );

      // Alertes stock
      setAlertesStock(Array.isArray(alertesData)
        ? alertesData.map(a => ({ typeAlerte: a.typeAlerte ?? 'N/A', count: a.count ?? 0 }))
        : []
      );

      // Commandes à traiter
      setCommandesATraiter(commandesData
        ? { enAttente: commandesData.enAttente ?? 0, enCours: commandesData.enCours ?? 0 }
        : { enAttente: 0, enCours: 0 }
      );

      // KPIs
      setKpis(kpisData ?? null);

    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial sans dates
  useEffect(() => {
    fetchAllStats();
  }, []);

  // Fonction refetch qui accepte des paramètres de dates
  const refetch = useCallback((dateParams = {}) => {
    const { startDate, endDate } = dateParams;
    return fetchAllStats(startDate || '', endDate || '');
  }, [fetchAllStats]);

  return {
    loading,
    error,
    stats,
    evolutionCommandes,
    mouvementsStock,
    repartitionCategories,
    alertesStock,
    commandesATraiter,
    kpis,
    refetch,
    currentStartDate,
    currentEndDate
  };
};