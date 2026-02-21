// src/pages/dashboard/sales/DashboardPage.jsx
import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDashboardData } from '../../../../hooks/useDashboardData';
import KPICard from './components/KPICard';
import AdvancedPeriodSelector from './components/AdvancedPeriodSelector';
import EvolutionChart from './components/EvolutionChart';
import TopProducts from './components/TopProducts';
import StatusDonutChart from './components/StatusDonutChart';
import OrdersEvolutionChart from './components/OrdersEvolutionChart';
import ClientTypeChart from './components/ClientTypeChart';
import SkeletonLoader from './components/SkeletonLoader';

const DashboardPage = () => {
  const {
    loading,
    refreshing,
    error,
    data,
    selectedPeriod,
    showCustomPicker,
    changePeriod,
    applyCustomRange,
    setShowCustomPicker,
    refresh,
    formatCurrency,
    formatPercentage
  } = useDashboardData();

  // ============================================
  // 🧪 TESTS DE VÉRIFICATION DES DONNÉES BACKEND
  // ============================================
  useEffect(() => {
    if (data) {
      console.log('=================================');
      console.log('📦 DONNÉES REÇUES DU BACKEND');
      console.log('=================================');
      console.log('✅ statusRepartition:', data.statusRepartition);
      console.log('✅ ordersEvolution:', data.ordersEvolution);
      console.log('✅ clientTypeRepartition:', data.clientTypeRepartition);
      console.log('✅ kpi:', data.kpi);
      console.log('✅ charts:', data.charts);
      console.log('=================================');
      console.log('👥 ClientTypeRepartition brute:', data?.clientTypeRepartition);
    }
  }, [data]);

  // ============================================
  // 📊 PRÉPARATION DES DONNÉES POUR LES GRAPHIQUES
  // ============================================

  // ✅ Données pour StatusDonutChart (directement du backend)
  const statusData = useMemo(() => data?.statusRepartition || [], [data]);

  // ✅ Données pour OrdersEvolutionChart (du backend)
  const ordersEvolutionData = useMemo(() => {
    // Si les données backend existent, les utiliser
    if (data?.ordersEvolution && data.ordersEvolution.length > 0) {
      console.log('📈 Utilisation des données backend ordersEvolution:', data.ordersEvolution);
      return data.ordersEvolution;
    }
    
    // Sinon, tableau vide (pas de mock)
    console.log('⚠️ ordersEvolution non disponible dans le backend');
    return [];
  }, [data]);

  // ✅ Données pour ClientTypeChart (du backend)
  const clientTypeData = useMemo(() => {
    if (data?.clientTypeRepartition && data.clientTypeRepartition.length > 0) {
      console.log('👥 Utilisation des données backend clientTypeRepartition:', data.clientTypeRepartition);
      return data.clientTypeRepartition;
    }
    
    console.log('⚠️ clientTypeRepartition non disponible dans le backend');
    return [];
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader />
      </div>
    );
  }

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

  if (!data) {
    return null;
  }

  const { kpi, charts } = data;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
{/* ===== EN-TÊTE AVEC SÉLECTEUR UNIQUEMENT ===== */}
<div className="flex justify-end w-full">
  <div className="flex-shrink-0">
    <AdvancedPeriodSelector
      selectedPeriod={selectedPeriod}
      onChange={changePeriod}
      onRefresh={refresh}
      refreshing={refreshing}
      onApplyCustom={applyCustomRange}
      showCustomPicker={showCustomPicker}
      setShowCustomPicker={setShowCustomPicker}
    />
  </div>
</div>
      {/* ===== SECTION 1: KPI PRINCIPAUX ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          Indicateurs clés du jour
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Chiffre d'Affaires"
            value={kpi.caJour}
            icon="💰"
            color="blue"
            trend={kpi.variationJour}
            formatValue={formatCurrency}
          />
          
          <KPICard
            title="Commandes"
            value={kpi.commandesJour}
            icon="📦"
            color="green"
            trend={kpi.variationJour}
          />
          
          <KPICard
            title="Panier Moyen"
            value={kpi.panierMoyen}
            icon="🛒"
            color="purple"
            formatValue={formatCurrency}
          />
          
          <KPICard
            title="Taux de Transformation"
            value={kpi.tauxTransformation / 100}
            icon="📊"
            color="orange"
            formatValue={formatPercentage}
          />
        </div>
      </section>

      {/* ===== SECTION 2: KPI SECONDAIRES ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-red-500 rounded-full mr-3"></span>
          Gestion des risques & performances
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard
            title="Créances Clients"
            value={kpi.creancesTotal}
            icon="⚠️"
            color="red"
            formatValue={formatCurrency}
          />
          
          <KPICard
            title="Factures Impayées"
            value={kpi.creancesNombre}
            icon="📄"
            color="red"
          />
          
          <KPICard
            title="CA Mensuel"
            value={kpi.caMois}
            icon="📈"
            color="blue"
            trend={kpi.variationMois}
            formatValue={formatCurrency}
          />
        </div>
      </section>

      {/* ===== SECTION 3: GRAPHIQUES PRINCIPAUX ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
          Analyse des ventes
        </h2>
        
        {/* Ligne 1: Évolution CA et Top produits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 🔵 Évolution du CA (2/3) */}
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
                7 derniers jours
              </span>
            </div>
            <EvolutionChart 
              data={charts.evolutionCA} 
              formatCurrency={formatCurrency}
            />
          </motion.div>

          {/* 🏆 Top produits (1/3) */}
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

        {/* Ligne 2: Répartition par statut et Évolution des commandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 🔴 Répartition par statut - AVEC LES VRAIES DONNÉES */}
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

          {/* 🟢 Évolution des commandes - Données BACKEND uniquement */}
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
                  <p className="text-sm">Données non disponibles</p>
                  <p className="text-xs mt-1">Implémentez ordersEvolution dans le backend</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Ligne 3: Répartition par type de client - Données BACKEND uniquement */}
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
                <p className="text-sm">Données non disponibles</p>
                <p className="text-xs mt-1">Implémentez clientTypeRepartition dans le backend</p>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ===== SECTION 4: RÉSUMÉS ET COMPARATIFS ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
          Résumés périodiques
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
          >
            <p className="text-blue-100 text-sm flex items-center">
              <span className="mr-2">📊</span>
              Commandes cette semaine
            </p>
            <p className="text-3xl font-bold mt-2">{kpi.commandesSemaine || 0}</p>
            <div className="flex items-center justify-between mt-4">
              <p className="text-blue-100 text-xs">
                vs semaine dernière
              </p>
              <span className={`text-sm font-semibold ${
                kpi.variationSemaine > 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {kpi.variationSemaine > 0 ? '+' : ''}{kpi.variationSemaine?.toFixed(1)}%
              </span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
          >
            <p className="text-green-100 text-sm flex items-center">
              <span className="mr-2">💰</span>
              CA cette semaine
            </p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(kpi.caSemaine)}</p>
            <div className="flex items-center justify-between mt-4">
              <p className="text-green-100 text-xs">
                vs semaine dernière
              </p>
              <span className={`text-sm font-semibold ${
                kpi.variationSemaine > 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {kpi.variationSemaine > 0 ? '+' : ''}{kpi.variationSemaine?.toFixed(1)}%
              </span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
          >
            <p className="text-purple-100 text-sm flex items-center">
              <span className="mr-2">📈</span>
              CA ce mois
            </p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(kpi.caMois)}</p>
            <div className="flex items-center justify-between mt-4">
              <p className="text-purple-100 text-xs">
                vs mois dernier
              </p>
              <span className={`text-sm font-semibold ${
                kpi.variationMois > 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {kpi.variationMois > 0 ? '+' : ''}{kpi.variationMois?.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        </div>
      </section>

  
      {/* ===== FOOTER ===== */}
      {selectedPeriod === 'custom' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-right border-t pt-4"
        >
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Période personnalisée appliquée
          </span>
        </motion.div>
      )}

      {selectedPeriod === 'year' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-right border-t pt-4"
        >
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Analyse annuelle {new Date().getFullYear()}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardPage;