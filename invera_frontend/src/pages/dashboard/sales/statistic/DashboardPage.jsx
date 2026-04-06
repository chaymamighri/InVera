/**
 * DashboardPage - Page d'accueil du module Ventes
 * 
 * Affiche les statistiques et graphiques des ventes.
 * Route : /dashboard/sales/dashboard
 * 
 * Composants utilisés :
 * - KPICard : Cartes CA et commandes
 * - EvolutionChart : Graphique évolution du CA
 * - OrdersEvolutionChart : Graphique évolution commandes
 * - TopProducts : Classement des produits
 * - StatusDonutChart : Répartition par statut
 * - ClientTypeChart : Répartition par type de client
 * - DateRangeSelector : Filtre par période
 * - SkeletonLoader : Écran de chargement
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { useDashboardData } from '../../../../hooks/useDashboardData';
import KPICard from './components/KPICard';
import EvolutionChart from './components/EvolutionChart';
import TopProducts from './components/TopProducts';
import StatusDonutChart from './components/StatusDonutChart';
import OrdersEvolutionChart from './components/OrdersEvolutionChart';
import ClientTypeChart from './components/ClientTypeChart';
import SkeletonLoader from './components/SkeletonLoader';
import DateRangeSelector from './components/DateRangeSelector';

const DashboardPage = () => {
  // ===== RÉCUPÉRATION DES DONNÉES DEPUIS LE HOOK =====
  const {
    loading,           // État de chargement
    error,             // Message d'erreur
    data,              // Données du dashboard (kpi, charts, etc.)
    applyCustomRange,  // Appliquer une période personnalisée
    refresh,           // Rafraîchir les données
    formatCurrency,    // Formater un montant en euros
    refreshing,        // État de rafraîchissement
    dateRange,         // Période sélectionnée
    filterActive: hookFilterActive  // Indique si un filtre est actif
  } = useDashboardData();

  // ===== ÉTATS LOCAUX =====
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  // ===== SYNCHRONISATION AVEC LE HOOK =====
  
  // Synchronise les dates lorsque le hook change
  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      setStartDate(dateRange.startDate);
      setEndDate(dateRange.endDate);
      setFilterActive(true);
    } else {
      setStartDate('');
      setEndDate('');
      setFilterActive(false);
    }
  }, [dateRange]);

  // Synchronise l'état du filtre
  useEffect(() => {
    setFilterActive(hookFilterActive);
  }, [hookFilterActive]);

  // ===== VALEURS PAR DÉFAUT (évite les erreurs si data est vide) =====
  const defaultKPI = {
    caJour: 0,
    commandesJour: 0,
    variationJour: 0
  };

  const defaultCharts = {
    evolutionCA: [],
    topProduits: []
  };

  // ============================================
  //  PRÉPARATION DES DONNÉES POUR LES GRAPHIQUES
  // ============================================

  // Données pour le donut chart des statuts
  const statusData = useMemo(() => data?.statusRepartition || [], [data]);

  // Données pour l'évolution des commandes
  const ordersEvolutionData = useMemo(() => {
    if (data?.ordersEvolution && data.ordersEvolution.length > 0) {
      return data.ordersEvolution;
    }
    return [];
  }, [data]);

  // Données pour la répartition par type de client
  const clientTypeData = useMemo(() => {
    if (data?.clientTypeRepartition && data.clientTypeRepartition.length > 0) {
      return data.clientTypeRepartition;
    }
    return [];
  }, [data]);

  // ============================================
  //  GESTION DES ÉTATS DE CHARGEMENT / ERREUR
  // ============================================

  // Affichage du skeleton loader pendant le chargement
  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader />
      </div>
    );
  }

  // Affichage du message d'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <span className="text-4xl mb-4 block">😕</span>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Données finales avec valeurs par défaut
  const kpi = data?.kpi || defaultKPI;
  const charts = data?.charts || defaultCharts;

  // ============================================
  //  RENDU PRINCIPAL
  // ============================================

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* ===== SECTION 1: SÉLECTEUR DE PÉRIODE ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Période :</span>
            <DateRangeSelector 
              onApplyCustom={applyCustomRange}
              onRefresh={refresh}
              refreshing={refreshing}
              currentStartDate={startDate}
              currentEndDate={endDate}
            />
          </div>
        </div>

        {/* Indicateur de filtre actif */}
        {filterActive && (startDate || endDate) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            Filtre actif : 
            {startDate && <span> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
            {startDate && endDate && <span> au </span>}
            {endDate && <span>{new Date(endDate).toLocaleDateString('fr-FR')}</span>}
          </div>
        )}
      </div>

      {/* ===== SECTION 2: INDICATEURS CLÉS (KPI) ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          Indicateurs clés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Carte Chiffre d'Affaires */}
          <KPICard
            title="Chiffre d'Affaires"
            value={kpi.caJour}
            icon="💰"
            color="blue"
            trend={kpi.variationJour}
            formatValue={formatCurrency}
          />
          
          {/* Carte Commandes */}
          <KPICard
            title="Commandes"
            value={kpi.commandesJour}
            icon="📦"
            color="green"
            trend={kpi.variationJour}
          />
        </div>
      </section>

      {/* ===== SECTION 3: GRAPHIQUES D'ANALYSE ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
          Analyse des ventes
        </h2>
        
        {/* Ligne 1: Évolution CA + Top produits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Graphique Évolution du CA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Évolution du Chiffre d'Affaires
              </h3>
              <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                {filterActive && (startDate || endDate) ? 'Période filtrée' : '30 derniers jours'}
              </span>
            </div>
            <EvolutionChart 
              data={charts.evolutionCA} 
              formatCurrency={formatCurrency}
            />
          </motion.div>

          {/* Top 5 Produits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Top 5 Produits
              </h3>
              <span className="text-xs bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full">
                Meilleures ventes
              </span>
            </div>
            <TopProducts 
              products={charts.topProduits} 
              formatCurrency={formatCurrency}
            />
          </motion.div>
        </div>

        {/* Ligne 2: Répartition statut + Évolution commandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Donut chart - Répartition par statut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Répartition par statut
              </h3>
              <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                {statusData.reduce((sum, s) => sum + s.nombre, 0)} commandes
              </span>
            </div>
            <StatusDonutChart 
              data={statusData} 
              formatCurrency={formatCurrency}
            />
          </motion.div>

          {/* Graphique - Évolution des commandes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Évolution des commandes
              </h3>
              <div className="flex space-x-2">
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                  CA
                </span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  Volume
                </span>
              </div>
            </div>
            {ordersEvolutionData.length > 0 ? (
              <OrdersEvolutionChart 
                data={ordersEvolutionData} 
                formatCurrency={formatCurrency}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm">Aucune donnée pour cette période</p>
                  <p className="text-xs mt-1">Sélectionnez une période pour voir l'évolution</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Ligne 3: Répartition par type de client */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Répartition par type de client
            </h3>
            <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
              Analyse clientèle
            </span>
          </div>
          {clientTypeData.length > 0 ? (
            <ClientTypeChart 
              data={clientTypeData} 
              formatCurrency={formatCurrency}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <p className="text-sm">Aucune donnée pour cette période</p>
                <p className="text-xs mt-1">Sélectionnez une période pour voir la répartition</p>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ===== SECTION 4: FOOTER AVEC RÉSUMÉ PÉRIODE ===== */}
      {filterActive && (startDate || endDate) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-right border-t pt-4"
        >
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Période sélectionnée : 
            {startDate && <span> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
            {startDate && endDate && <span> au </span>}
            {endDate && <span>{new Date(endDate).toLocaleDateString('fr-FR')}</span>}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardPage;