import { useState, useEffect, useCallback } from 'react';
import statsAchatService from '../services/statsAchatService';

const DEFAULT_STATS = {
  commandes: { total: 0, enAttente: 0, enCours: 0, livre: 0, tendance: 0 },
  produits: { total: 0, actifs: 0, rupture: 0, alerte: 0, tendance: 0 },
  stock: { valeurTotale: 0, mouvementsMois: 0, rotation: 0, tendance: 0 },
  factures: { total: 0, payees: 0, impayees: 0, montantTotal: 0, tendance: 0 },
};

const getReadableError = (result, fallback) => {
  if (!result || result.success) return null;
  if (result.status === 403) return 'Accès refusé aux statistiques achats pour ce rôle.';
  if (result.status === 401) return 'Session expirée. Veuillez vous reconnecter.';
  return result.error || fallback;
};

export const useStatsAchat = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
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
    setWarnings([]);

    try {
      const [
        dashboardResult,
        evolutionResult,
        mouvementsResult,
        categoriesResult,
        alertesResult,
        commandesResult,
        kpisResult,
      ] = await Promise.all([
        statsAchatService.getDashboardStats(startDateParam, endDateParam),
        statsAchatService.getEvolutionCommandes(startDateParam, endDateParam),
        statsAchatService.getMouvementsStock(startDateParam, endDateParam),
        statsAchatService.getRepartitionCategories(startDateParam, endDateParam),
        statsAchatService.getAlertesStock(startDateParam, endDateParam),
        statsAchatService.getCommandesATraiter(),
        statsAchatService.getKPIs(),
      ]);

      if (startDateParam || endDateParam) {
        setCurrentStartDate(startDateParam || '');
        setCurrentEndDate(endDateParam || '');
      }

      const primaryError = getReadableError(
        dashboardResult,
        'Impossible de charger les statistiques achats.'
      );
      if (primaryError) setError(primaryError);

      setWarnings(
        [
          getReadableError(evolutionResult, 'Évolution des commandes indisponible.'),
          getReadableError(mouvementsResult, 'Mouvements de stock indisponibles.'),
          getReadableError(categoriesResult, 'Répartition des catégories indisponible.'),
          getReadableError(alertesResult, 'Alertes de stock indisponibles.'),
          getReadableError(commandesResult, 'Commandes à traiter indisponibles.'),
          getReadableError(kpisResult, 'KPIs achats indisponibles.'),
        ].filter(Boolean)
      );

      const dashboardData = dashboardResult.success ? dashboardResult.data : null;
      setStats(
        dashboardData
          ? {
              commandes: {
                total: dashboardData.commandes?.total ?? 0,
                enAttente: dashboardData.commandes?.enAttente ?? 0,
                enCours: dashboardData.commandes?.enCours ?? 0,
                livre: dashboardData.commandes?.livre ?? 0,
                tendance: dashboardData.commandes?.tendance ?? 0,
              },
              produits: {
                total: dashboardData.produits?.total ?? 0,
                actifs: dashboardData.produits?.actifs ?? 0,
                rupture: dashboardData.produits?.rupture ?? 0,
                alerte: dashboardData.produits?.alerte ?? 0,
                tendance: dashboardData.produits?.tendance ?? 0,
              },
              stock: {
                valeurTotale: dashboardData.stock?.valeurTotale ?? 0,
                mouvementsMois: dashboardData.stock?.mouvementsMois ?? 0,
                rotation: dashboardData.stock?.rotation ?? 0,
                tendance: dashboardData.stock?.tendance ?? 0,
              },
              factures: {
                total: dashboardData.factures?.total ?? 0,
                payees: dashboardData.factures?.payees ?? 0,
                impayees: dashboardData.factures?.impayees ?? 0,
                montantTotal: dashboardData.factures?.montantTotal ?? 0,
                tendance: dashboardData.factures?.tendance ?? 0,
              },
            }
          : DEFAULT_STATS
      );

      setEvolutionCommandes(
        Array.isArray(evolutionResult.data)
          ? evolutionResult.data.map((item) => ({
              label: item.label ?? '',
              valeur: item.valeur ?? 0,
              total: item.total ?? 0,
            }))
          : []
      );

      setMouvementsStock(
        Array.isArray(mouvementsResult.data)
          ? mouvementsResult.data.map((item) => ({
              label: item.label ?? '',
              entrees: item.entrees ?? 0,
              sorties: item.sorties ?? 0,
              max: item.max ?? 0,
              dateRange: item.dateRange ?? '',
            }))
          : []
      );

      setRepartitionCategories(
        Array.isArray(categoriesResult.data)
          ? categoriesResult.data.map((item) => ({
              categorie: item.categorie ?? 'N/A',
              nombreProduits: item.nombreProduits ?? 0,
              pourcentage: item.pourcentage ?? 0,
            }))
          : []
      );

      setAlertesStock(
        Array.isArray(alertesResult.data)
          ? alertesResult.data.map((item) => ({
              produitId: item.produitId ?? null,
              produitNom: item.produitNom ?? 'Produit inconnu',
              stockActuel: item.stockActuel ?? 0,
              stockMin: item.stockMin ?? 0,
              typeAlerte: item.typeAlerte ?? 'N/A',
            }))
          : []
      );

      setCommandesATraiter(
        commandesResult.success
          ? {
              enAttente: commandesResult.data?.enAttente ?? 0,
              enCours: commandesResult.data?.enCours ?? 0,
            }
          : { enAttente: 0, enCours: 0 }
      );

      setKpis(kpisResult.success ? kpisResult.data ?? null : null);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const refetch = useCallback(
    (dateParams = {}) => {
      const { startDate, endDate } = dateParams;
      return fetchAllStats(startDate || '', endDate || '');
    },
    [fetchAllStats]
  );

  return {
    loading,
    error,
    warnings,
    stats,
    evolutionCommandes,
    mouvementsStock,
    repartitionCategories,
    alertesStock,
    commandesATraiter,
    kpis,
    refetch,
    currentStartDate,
    currentEndDate,
  };
};
