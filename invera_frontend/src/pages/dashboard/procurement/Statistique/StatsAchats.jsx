/**
 * StatsAchats - Page des statistiques achats
 * 
 * RÔLE : Afficher les indicateurs de performance du module achats
 * ROUTE : /dashboard/procurement/stats
 * 
 * FONCTIONNALITÉS :
 * - Cartes KPI (commandes, produits, stock, factures)
 * - Graphique évolution des commandes (ligne)
 * - Graphique mouvements de stock (barres)
 * - Répartition produits par catégorie (donut)
 * - Alertes stock (rupture, critique)
 * - Commandes à traiter (en attente, en cours)
 * - Filtrage par période (DateRangeSelectorAchats)
 * - Rafraîchissement des données
 * 
 * HOOK UTILISÉ : useStatsAchat(startDate, endDate)
 * COMPOSANTS : DateRangeSelectorAchats
 */
import React, { useState } from 'react';
import {
  ShoppingCartIcon,
  CubeIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useStatsAchat } from '../../../../hooks/useStatsAchat';
import DateRangeSelectorAchats from './componentes/DateRangeSelectorAchats';

const StatsAchats = () => {
  // État local pour les dates
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);

  const {
    loading,
    error,
    stats,
    evolutionCommandes,
    mouvementsStock,
    repartitionCategories,
    alertesStock,
    commandesATraiter,
    refetch
  } = useStatsAchat(selectedStartDate, selectedEndDate);

  // Fonction pour formater les dates au format YYYY-MM-DD
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fonction appelée quand on applique les dates
  const handleApplyDates = (start, end) => {
    const formattedStart = formatDateForAPI(start);
    const formattedEnd = formatDateForAPI(end);
    setSelectedStartDate(formattedStart);
    setSelectedEndDate(formattedEnd);
    // Refetch avec les nouvelles dates
    refetch({ startDate: formattedStart, endDate: formattedEnd });
  };

  // Fonction pour rafraîchir avec les dates actuelles
  const handleRefresh = () => {
    if (selectedStartDate && selectedEndDate) {
      refetch({ startDate: selectedStartDate, endDate: selectedEndDate });
    } else {
      refetch({});
    }
  };

  // Composant graphique à barres simple
  const SimpleBarChart = ({ data, labels, title }) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data);
    
    return (
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="space-y-3">
          {labels.map((label, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-800 font-medium">{data[index]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data[index] / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Composant graphique linéaire simple
  const SimpleLineChart = ({ data, labels, title }) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const height = 150;
    const width = 500;
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - minValue) / (maxValue - minValue || 1)) * height,
    }));

    return (
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="relative" style={{ height: `${height}px` }}>
          <svg width="100%" height={height} className="overflow-visible">
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              className="transition-all duration-500"
            />
            {points.map((point, idx) => (
              <circle key={idx} cx={point.x} cy={point.y} r="4" fill="#3B82F6" />
            ))}
          </svg>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {labels.map((label, idx) => (
              <span key={idx}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Composant donut simple
  const SimpleDonutChart = ({ data, labels, colors, title }) => {
    if (!data || data.length === 0 || data.reduce((a, b) => a + b, 0) === 0) return null;
    const total = data.reduce((a, b) => a + b, 0);
    let currentAngle = 0;
    const size = 150;
    const center = size / 2;
    const radius = 60;

    const getPath = (startAngle, endAngle) => {
      const start = {
        x: center + radius * Math.cos(startAngle),
        y: center + radius * Math.sin(startAngle),
      };
      const end = {
        x: center + radius * Math.cos(endAngle),
        y: center + radius * Math.sin(endAngle),
      };
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    };

    return (
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex flex-col items-center">
          <svg width={size} height={size} className="mb-4">
            {data.map((value, index) => {
              const angle = (value / total) * 2 * Math.PI;
              const start = currentAngle;
              const end = start + angle;
              const path = getPath(start, end);
              currentAngle = end;
              return <path key={index} d={path} fill={colors[index]} stroke="white" strokeWidth="2" />;
            })}
          </svg>
          <div className="grid grid-cols-2 gap-2 w-full">
            {labels.map((label, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-800 font-medium ml-auto">{data[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {typeof value === 'number' && title.includes('Valeur')
              ? `${value.toLocaleString()} DH`
              : value.toLocaleString()}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && trend !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend)}% vs mois dernier
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const StockAlert = ({ type, count, message, onViewDetails }) => (
    <div className={`flex items-center justify-between p-3 ${type === 'rupture' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} rounded-lg border`}>
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon className={`w-5 h-5 ${type === 'rupture' ? 'text-red-600' : 'text-orange-600'}`} />
        <div>
          <p className="text-sm font-medium text-gray-800">{message}</p>
          <p className="text-xs text-gray-500">{count} produit(s) concerné(s)</p>
        </div>
      </div>
      <button onClick={onViewDetails} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
        Voir détails →
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const evolutionLabels = evolutionCommandes.map(item => item.label);
  const evolutionValues = evolutionCommandes.map(item => item.valeur);
  
  const mouvementsLabels = mouvementsStock.map(item => item.label);
  const mouvementsEntrees = mouvementsStock.map(item => item.entrees);
  
  const categoriesLabels = repartitionCategories.map(item => item.categorie);
  const categoriesValues = repartitionCategories.map(item => item.nombreProduits);
  const categoriesColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6'];

  // Compter les alertes par type
  const alertesRupture = alertesStock.filter(a => a.typeAlerte === 'RUPTURE').length;
  const alertesCritique = alertesStock.filter(a => a.typeAlerte === 'CRITIQUE').length;

  return (
    <div className="space-y-6">
      {/* En-tête avec filtre et bouton rafraîchir */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Aperçu général</h2>
          <p className="text-sm text-gray-500 mt-1">
            Synthèse des activités d'achat et de gestion de stock
          </p>
        </div>
        
        {/* Groupe filtre + rafraîchissement */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <DateRangeSelectorAchats
              onApply={handleApplyDates}
              onRefresh={handleRefresh}
              refreshing={loading}
              currentStartDate={selectedStartDate}
              currentEndDate={selectedEndDate}
            />
          </div>
        </div>
      </div>

      {/* Cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Bons de commande"
          value={stats.commandes?.total || 0}
          icon={ShoppingCartIcon}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle={`${stats.commandes?.enAttente || 0} en attente · ${stats.commandes?.livre || 0} livrés`}
          trend={stats.commandes?.tendance}
        />
        <StatCard
          title="Produits actifs"
          value={stats.produits?.actifs || 0}
          icon={CubeIcon}
          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle={`${stats.produits?.rupture || 0} en rupture · ${stats.produits?.alerte || 0} stock bas`}
          trend={stats.produits?.tendance}
        />
        <StatCard
          title="Valeur du stock"
          value={stats.stock?.valeurTotale || 0}
          icon={ArchiveBoxIcon}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle={`Rotation: ${stats.stock?.rotation || 0} tours/an`}
          trend={stats.stock?.tendance}
        />
        <StatCard
          title="Factures"
          value={stats.factures?.total || 0}
          icon={DocumentTextIcon}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          subtitle={`${stats.factures?.payees || 0} payées · ${stats.factures?.impayees || 0} impayées`}
          trend={stats.factures?.tendance}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <SimpleLineChart
            data={evolutionValues}
            labels={evolutionLabels}
            title="Évolution des commandes"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <SimpleBarChart
            data={mouvementsEntrees}
            labels={mouvementsLabels}
            title="Mouvements de stock (entrées)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <SimpleDonutChart
            data={categoriesValues}
            labels={categoriesLabels}
            colors={categoriesColors}
            title="Produits par catégorie"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Alertes stock</h3>
          <div className="space-y-3">
            {alertesRupture > 0 && (
              <StockAlert
                type="rupture"
                count={alertesRupture}
                message="Produits en rupture"
                onViewDetails={() => console.log('Voir détails rupture')}
              />
            )}
            {alertesCritique > 0 && (
              <StockAlert
                type="alerte"
                count={alertesCritique}
                message="Stock critique (seuil minimum)"
                onViewDetails={() => console.log('Voir détails critique')}
              />
            )}
            {alertesRupture === 0 && alertesCritique === 0 && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Stock sain</p>
                  <p className="text-xs text-gray-500">Aucune alerte à signaler</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <button className="w-full px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
              Gérer les réapprovisionnements
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Commandes à traiter</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">En attente de validation</p>
                  <p className="text-xs text-gray-500">À approuver</p>
                </div>
              </div>
              <p className="text-xl font-bold text-yellow-600">{commandesATraiter.enAttente || 0}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">En cours de livraison</p>
                  <p className="text-xs text-gray-500">Commandes expédiées</p>
                </div>
              </div>
              <p className="text-xl font-bold text-blue-600">{commandesATraiter.enCours || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <button className="w-full px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Voir toutes les commandes
            </button>
          </div>
        </div>
      </div>

      {/* Indicateurs supplémentaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Rotation des stocks</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.stock?.rotation || 0}</p>
          <p className="text-xs text-blue-600 mt-1">tours par an</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Mouvements (mois)</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.stock?.mouvementsMois || 0}</p>
          <p className="text-xs text-emerald-600 mt-1">entrées + sorties</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Factures impayées</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{stats.factures?.impayees || 0}</p>
          <p className="text-xs text-purple-600 mt-1">
            {stats.factures?.total ? ((stats.factures.impayees / stats.factures.total) * 100).toFixed(1) : 0}% du total
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">Montant facturé</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{(stats.factures?.montantTotal || 0).toLocaleString()} DH</p>
          <p className="text-xs text-orange-600 mt-1">en cours</p>
        </div>
      </div>
    </div>
  );
};

export default StatsAchats;