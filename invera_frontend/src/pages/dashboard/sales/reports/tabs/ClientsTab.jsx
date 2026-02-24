// src/pages/dashboard/sales/reports/tabs/ClientsTab.jsx
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useReports } from '../../../../../hooks/useReports';

const ClientsTab = () => {
  // ✅ État pour TOUS les filtres
  const [filters, setFilters] = useState({
    period: 'month',
    clientType: undefined,
    commercialStatus: undefined
  });

  const [showSpecificFilters, setShowSpecificFilters] = useState(false);

  // ✅ Périodes prédéfinies
  const periods = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: 'Cette semaine' },
    { id: 'month', label: 'Ce mois' },
    { id: 'year', label: 'Cette année' }
  ];

  // ✅ Types de clients
  const clientTypes = [
    { id: undefined, label: 'Tous les types' },
    { id: 'VIP', label: 'VIP' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ];

  // ✅ Statuts commerciaux
  const commercialStatusOptions = [
    { id: undefined, label: 'Tous les statuts' },
    { id: 'Normal', label: 'Normal' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'VIP', label: 'VIP' }
  ];

  // ✅ Fonction pour obtenir le badge de statut commercial
  const getCommercialStatusBadge = (status) => {
    const badges = {
      'Normal': 'bg-blue-100 text-blue-700',
      'FIDELE': 'bg-purple-100 text-purple-700',
      'VIP': 'bg-yellow-100 text-yellow-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  // ✅ Fonction pour obtenir le libellé du statut commercial
  const getCommercialStatusLabel = (status) => {
    const labels = {
      'Normal': 'Normal',
      'FIDELE': 'Fidèle',
      'VIP': 'VIP'
    };
    return labels[status] || status;
  };

  // ✅ Utiliser le hook useReports avec tous les filtres
  const { 
    loading, 
    error, 
    data, 
    setFilters: updateReportsFilters
  } = useReports('clients', filters);

  // ✅ Gestionnaire de changement de période
  const handlePeriodChange = (periodId) => {
    const newFilters = {
      ...filters,
      period: periodId
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // ✅ Gestionnaire pour les filtres spécifiques
  const handleSpecificFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // ✅ Réinitialiser TOUS les filtres (sans fermer le panneau)
  const resetAllFilters = () => {
    const defaultFilters = {
      period: 'month',
      clientType: undefined,
      commercialStatus: undefined
    };
    
    setFilters(defaultFilters);
    updateReportsFilters(defaultFilters);
    // ✅ NE PAS FERMER showSpecificFilters
  };

  if (loading && !data) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement des données clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ En-tête */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Analyse clientèle</h2>
        <p className="text-sm text-gray-500 mt-1">
          {data.summary?.totalClients || 0} clients au total
        </p>
      </div>

      {/* ✅ SECTION FILTRES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Barre principale des filtres */}
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Sélecteur de période */}
          <select
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          {/* Bouton Filtres spécifiques */}
          <button
            onClick={() => setShowSpecificFilters(!showSpecificFilters)}
            className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors
              ${showSpecificFilters ? 'bg-purple-50 border-purple-300 text-purple-600' : 'hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres clients</span>
          </button>

          {/* Bouton Réinitialiser tout */}
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-purple-100 bg-purple-50 text-purple-700 border-purple-200 ml-auto"
          >
            Réinitialiser
          </button>
        </div>

        {/* Filtres spécifiques - TOUJOURS affiché selon showSpecificFilters */}
        {showSpecificFilters && (
          <div className="p-4 border-t bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtres clients</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type de client */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type de client</label>
                <select
                  value={filters.clientType ?? 'all'}
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? undefined : e.target.value;
                    handleSpecificFilterChange('clientType', value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {clientTypes.map(type => (
                    <option key={type.id || 'all'} value={type.id ?? 'all'}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut commercial */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Statut commercial</label>
                <select
                  value={filters.commercialStatus ?? 'all'}
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? undefined : e.target.value;
                    handleSpecificFilterChange('commercialStatus', value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {commercialStatusOptions.map(option => (
                    <option key={option.id || 'all'} value={option.id ?? 'all'}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Cartes résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-xl">
          <p className="text-sm text-blue-600">Total clients</p>
          <p className="text-2xl font-bold">{data.summary?.totalClients || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <p className="text-sm text-green-600">Nouveaux clients</p>
          <p className="text-2xl font-bold">{data.summary?.nouveauxClients || 0}</p>
          <p className="text-xs text-green-500">dans la période</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl">
          <p className="text-sm text-purple-600">Clients actifs</p>
          <p className="text-2xl font-bold">{data.summary?.clientsActifs || 0}</p>
          <p className="text-xs text-purple-500">ont passé commande</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl">
          <p className="text-sm text-orange-600">CA total</p>
          <p className="text-2xl font-bold">{data.summary?.caTotal || 0} DT</p>
        </div>
      </div>

      {/* ✅ Statistiques par statut commercial */}
      {data.repartitionParStatutCommercial && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold">Répartition par statut commercial</h3>
            <p className="text-xs text-gray-500 mt-1">Analyse du cycle de vie client</p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.repartitionParStatutCommercial).map(([status, count]) => (
                <div key={status} className="bg-gray-50 p-4 rounded-lg">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${getCommercialStatusBadge(status)}`}>
                    {getCommercialStatusLabel(status)}
                  </span>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">clients</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top clients avec statut commercial */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold">Top 10 clients</h3>
          <span className="text-xs text-gray-500">Basé sur le CA total</span>
        </div>
        
        <div className="overflow-x-auto">
          {data.topClients?.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut commercial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commandes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CA total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Panier moyen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topClients.map((client, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{client.nom}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {client.statutCommercial && (
                        <span className={`px-2 py-1 rounded-full text-xs ${getCommercialStatusBadge(client.statutCommercial)}`}>
                          {getCommercialStatusLabel(client.statutCommercial)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.commandes}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{client.ca} DT</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.panierMoyen || 0} DT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée client disponible
            </div>
          )}
        </div>
      </div>

      {/* ✅ Répartition par type */}
      {data.repartitionParType && Object.keys(data.repartitionParType).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold">Répartition par type de client</h3>
            <p className="text-xs text-gray-500 mt-1">Analyse détaillée par catégorie</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data.repartitionParType).map(([type, stats]) => {
                const totalClients = data.summary?.totalClients || 1;
                const percentage = ((stats.nombre / totalClients) * 100).toFixed(1);
                
                const getTypeColor = (type) => {
                  const colors = {
                    'VIP': 'bg-yellow-500',
                    'ENTREPRISE': 'bg-purple-500',
                    'FIDELE': 'bg-green-500',
                    'PARTICULIER': 'bg-orange-500',
                    'NON_DEFINI': 'bg-gray-500'
                  };
                  return colors[type] || 'bg-indigo-500';
                };

                return (
                  <div key={type} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></div>
                        <h4 className="font-semibold text-gray-800">{type}</h4>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Part des clients</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${getTypeColor(type)} h-2.5 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Clients</p>
                        <p className="text-lg font-bold">{stats.nombre}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-xs text-gray-500">CA</p>
                        <p className="text-sm font-semibold text-green-600">{stats.ca} DT</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Panier</p>
                        <p className="text-sm font-semibold">{stats.panierMoyen || 0} DT</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsTab;