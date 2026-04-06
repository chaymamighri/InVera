/**
 * ClientsTab - Onglet d'analyse des clients dans les rapports
 * 
 * Rôle : Afficher les statistiques et l'analyse détaillée des clients
 * Route : /dashboard/sales/reports/clients
 * 
 * Fonctionnalités :
 * - Filtrage par période (dates personnalisées)
 * - Filtrage par type de client (VIP, Entreprise, Fidèle, Particulier)
 * - Filtrage par statut commercial (Normal, Fidèle, VIP)
 * - Affichage des KPIs (total clients, actifs, inactifs)
 * - Répartition par statut commercial
 * - Top 10 des meilleurs clients (CA total)
 * 
 * Sous-composants : Aucun (composant autonome)
 * Hook utilisé : useReports('clients', filters)
 */

import React, { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { useReports } from '../../../../../hooks/useReports';

const ClientsTab = () => {
  // ===== ÉTATS =====
  const [filters, setFilters] = useState({
    period: 'custom',        // Période fixée à 'custom'
    startDate: null,         // Date de début
    endDate: null,           // Date de fin
    clientType: undefined,   // Type de client (VIP, ENTREPRISE, etc.)
    commercialStatus: undefined // Statut commercial (Normal, FIDELE, VIP)
  });

  const [showSpecificFilters, setShowSpecificFilters] = useState(false); // Afficher/masquer filtres avancés
  const [localDates, setLocalDates] = useState({ startDate: '', endDate: '' }); // Dates temporaires

  // ===== DONNÉES STATIQUES POUR LES FILTRES =====
  
  // Types de clients disponibles
  const clientTypes = [
    { id: undefined, label: 'Tous les types' },
    { id: 'VIP', label: 'VIP' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ];

  // Statuts commerciaux disponibles
  const commercialStatusOptions = [
    { id: undefined, label: 'Tous les statuts' },
    { id: 'Normal', label: 'Normal' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'VIP', label: 'VIP' }
  ];

  // ===== FONCTIONS UTILITAIRES =====
  
  // Retourne la classe CSS du badge selon le statut commercial
  const getCommercialStatusBadge = (status) => {
    const badges = {
      'Normal': 'bg-blue-100 text-blue-700',
      'FIDELE': 'bg-purple-100 text-purple-700',
      'VIP': 'bg-yellow-100 text-yellow-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  // Retourne le libellé du statut commercial
  const getCommercialStatusLabel = (status) => {
    const labels = {
      'Normal': 'Normal',
      'FIDELE': 'Fidèle',
      'VIP': 'VIP'
    };
    return labels[status] || status;
  };

  // ===== HOOK useReports =====
  const { 
    loading,     // État de chargement
    error,       // Message d'erreur
    data,        // Données des clients (summary, topClients, repartitionParStatutCommercial)
    setFilters: updateReportsFilters
  } = useReports('clients', filters);

  // ============================================
  //  GESTIONNAIRES DE FILTRES
  // ============================================
  
  // Applique la période personnalisée (dates début/fin)
  const handleApplyCustom = () => {
    if (localDates.startDate && localDates.endDate) {
      console.log('📅 Application dates personnalisées:', localDates);
      
      const newFilters = {
        ...filters,
        period: 'custom',
        startDate: localDates.startDate,
        endDate: localDates.endDate
      };
      
      setFilters(newFilters);
      updateReportsFilters(newFilters);
    }
  };

  // Gère les changements de filtres spécifiques (type client, statut commercial)
  const handleSpecificFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // Réinitialise TOUS les filtres
  const resetAllFilters = () => {
    const defaultFilters = {
      period: 'custom',
      startDate: null,
      endDate: null,
      clientType: undefined,
      commercialStatus: undefined
    };
    
    setFilters(defaultFilters);
    updateReportsFilters(defaultFilters);
    setLocalDates({ startDate: '', endDate: '' });
  };

  // ============================================
  //  GESTION DES ÉTATS DE CHARGEMENT/ERREUR
  // ============================================
  
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

  // ============================================
  //  RENDU PRINCIPAL
  // ============================================

  return (
    <div className="space-y-6">
      
      {/* ===== EN-TÊTE ===== */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Analyse clientèle</h2>
        <p className="text-sm text-gray-500 mt-1">
          {data.summary?.totalClients || 0} clients au total
        </p>
      </div>

      {/* ===== SECTION FILTRES ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4">
          
          {/* En-tête des filtres */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium text-gray-700">Filtres</h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton filtres clients (affiche/masque les filtres avancés) */}
              <button
                onClick={() => setShowSpecificFilters(!showSpecificFilters)}
                className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors
                  ${showSpecificFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres clients</span>
              </button>

              {/* Bouton réinitialisation */}
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-100 bg-blue-50 text-blue-700 border-blue-200"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Calendrier - Période personnalisée */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Sélectionner une période
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                <input
                  type="date"
                  value={localDates.startDate}
                  onChange={(e) => setLocalDates({ ...localDates, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={localDates.endDate}
                  min={localDates.startDate}
                  onChange={(e) => setLocalDates({ ...localDates, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleApplyCustom}
                disabled={!localDates.startDate || !localDates.endDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Appliquer
              </button>

              {/* Indicateur des dates actives */}
              {filters.startDate && filters.endDate && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Période active: du {filters.startDate} au {filters.endDate}
                </div>
              )}
            </div>
          </div>

          {/* FILTRES SPÉCIFIQUES (type client + statut commercial) - Affichage conditionnel */}
          {showSpecificFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Filtres clients</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sélecteur type de client */}
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

                {/* Sélecteur statut commercial */}
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
      </div>

      {/* ===== CARTES RÉSUMÉ (KPIs) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total clients */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-blue-700 mb-1">Total clients</p>
            <span className="text-2xl text-blue-600">👥</span>
          </div>
          <p className="text-3xl font-bold text-blue-800">{data.summary?.totalClients || 0}</p>
          <p className="text-xs text-blue-600/70 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Base totale de clients
          </p>
        </div>
        
        {/* Clients inactifs (aucune commande) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 p-6 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-amber-700 mb-1">Clients inactifs</p>
            <span className="text-2xl text-amber-600">😴</span>
          </div>
          <p className="text-3xl font-bold text-amber-800">{data.summary?.clientsInactifs || 0}</p>
          <p className="text-xs text-amber-600/70 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            Aucune commande passée
          </p>
        </div>
        
        {/* Clients actifs (ont passé commande) */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-purple-700 mb-1">Clients actifs</p>
            <span className="text-2xl text-purple-600">🛒</span>
          </div>
          <p className="text-3xl font-bold text-purple-800">{data.summary?.clientsActifs || 0}</p>
          <p className="text-xs text-purple-600/70 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            Ont passé commande
          </p>
        </div>
      </div>

      {/* ===== STATISTIQUES PAR STATUT COMMERCIAL ===== */}
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

      {/* ===== TOP 10 CLIENTS ===== */}
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

    </div>
  );
};

export default ClientsTab;