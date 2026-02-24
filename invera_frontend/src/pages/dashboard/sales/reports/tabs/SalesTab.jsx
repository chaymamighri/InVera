// src/pages/dashboard/sales/reports/tabs/SalesTab.jsx
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Filter, Calendar, X } from 'lucide-react';
import { useReports } from '../../../../../hooks/useReports';

const SalesTab = () => {
  //  Récupérer seulement le refreshTrigger depuis le contexte
  const { refreshTrigger } = useOutletContext();
  
  // État pour TOUS les filtres
  const [filters, setFilters] = useState({
    // Filtres de date
    period: 'month',
    startDate: null,
    endDate: null,
    clientType: undefined,
    status: undefined
  });

  const [showCustom, setShowCustom] = useState(false);
  const [showSpecificFilters, setShowSpecificFilters] = useState(false);
  const [localDates, setLocalDates] = useState({
    startDate: '',
    endDate: ''
  });

  //  Périodes prédéfinies
  const periods = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: 'Cette semaine' },
    { id: 'month', label: 'Ce mois' },
    { id: 'year', label: 'Cette année' },
  ];

  // Types de clients (avec undefined pour "tous")
  const clientTypes = [
    { id: undefined, label: 'Tous les clients' },
    { id: 'VIP', label: 'VIP' },
    { id: 'PROFESSIONNEL', label: 'Professionnel' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ];

  // Statuts des ventes (avec undefined pour "tous")
  const statusOptions = [
    { id: undefined, label: 'Tous les statuts' },
    { id: 'CONFIRMEE', label: 'Confirmée' },
    { id: 'EN_ATTENTE', label: 'En attente' },
    { id: 'ANNULEE', label: 'Annulée' },
  ];

  //  Fonction pour normaliser les statuts (comme dans InvoicesTab)
  const getStatutInfo = (statut) => {
    const statutMap = {
      // Confirmée
      'CONFIRMEE': { class: 'bg-green-100 text-green-700', label: 'Confirmée' },
      'Confirmée': { class: 'bg-green-100 text-green-700', label: 'Confirmée' },
      'Confirmé': { class: 'bg-green-100 text-green-700', label: 'Confirmée' },
      
      // En attente
      'EN_ATTENTE': { class: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      'En attente': { class: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      
      // Annulée
      'ANNULEE': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      'Annulée': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      'Annulé': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      
      // Livrée (optionnel)
      'LIVREE': { class: 'bg-blue-100 text-blue-700', label: 'Livrée' },
      'Livrée': { class: 'bg-blue-100 text-blue-700', label: 'Livrée' }
    };
    
    return statutMap[statut] || { class: 'bg-gray-100 text-gray-700', label: statut || 'Inconnu' };
  };

  // Utiliser le hook useReports avec tous les filtres
  const { 
    loading, 
    error, 
    data, 
    refresh,
    setFilters: updateReportsFilters
  } = useReports('sales', filters);

  // Effet pour le refreshTrigger (bouton rafraîchir global)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 SalesTab - Rafraîchissement global');
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // Effet pour la période personnalisée
  useEffect(() => {
    if (filters.period === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  }, [filters.period]);

  // Gestionnaire de changement de période
  const handlePeriodChange = (periodId) => {
    const newFilters = {
      ...filters,
      period: periodId,
      ...(periodId !== 'custom' && { startDate: null, endDate: null })
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // Appliquer la période personnalisée
  const handleApplyCustom = () => {
    if (localDates.startDate && localDates.endDate) {
      const newFilters = {
        ...filters,
        period: 'custom',
        startDate: localDates.startDate,
        endDate: localDates.endDate
      };
      setFilters(newFilters);
      updateReportsFilters(newFilters);
      setShowCustom(false);
    }
  };

  // Gestionnaire pour les filtres spécifiques
  const handleSpecificFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // Réinitialiser TOUS les filtres
  const resetAllFilters = () => {
    const defaultFilters = {
      period: 'month',
      startDate: null,
      endDate: null,
      clientType: undefined,
      status: undefined
    };
    
    setFilters(defaultFilters);
    updateReportsFilters(defaultFilters);
    setLocalDates({ startDate: '', endDate: '' });
    setShowCustom(false);
    
    console.log(' Filtres réinitialisés');
  };

  //  Rafraîchissement manuel
  const handleManualRefresh = () => {
    refresh();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement du rapport des ventes...</p>
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
      {/*  En-tête avec bouton Actualiser */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Détail des ventes</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.ventes?.length || 0} ventes trouvées
          </p>
        </div>
       
      </div>

      {/*  SECTION FILTRES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filtres de date - Barre principale */}
        <div className="p-4 flex flex-wrap items-center gap-4 border-b border-gray-200">
          {/* Sélecteur de période */}
          <select
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          {/* Bouton Filtres spécifiques */}
          <button
            onClick={() => setShowSpecificFilters(!showSpecificFilters)}
            className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors
              ${showSpecificFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres avancés</span>
          </button>

          {/* Bouton Réinitialiser tout */}
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-100 bg-blue-50 text-blue-700 border-blue-200 ml-auto"
          >
            Réinitialiser
          </button>
        </div>

        {/* Période personnalisée */}
        {showCustom && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Période personnalisée
              </h4>
              <button
                onClick={() => setShowCustom(false)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                <input
                  type="date"
                  value={localDates.startDate}
                  onChange={(e) => setLocalDates({ ...localDates, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={localDates.endDate}
                  onChange={(e) => setLocalDates({ ...localDates, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleApplyCustom}
                disabled={!localDates.startDate || !localDates.endDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}

        {/* FILTRES SPÉCIFIQUES */}
        {showSpecificFilters && (
          <div className="p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtres avancés</h4>
            
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

              {/* Statut commande */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Statut commande</label>
                <select
                  value={filters.status ?? 'all'}
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? undefined : e.target.value;
                    handleSpecificFilterChange('status', value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {statusOptions.map(option => (
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

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-xl">
          <p className="text-sm text-blue-600">CA Total</p>
          <p className="text-2xl font-bold">{data.summary?.totalCA || 0} DT</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <p className="text-sm text-green-600">Commandes</p>
          <p className="text-2xl font-bold">{data.summary?.totalCommandes || 0}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl">
          <p className="text-sm text-purple-600">Panier Moyen</p>
          <p className="text-2xl font-bold">{data.summary?.panierMoyen || 0} DT</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl">
          <p className="text-sm text-orange-600">Taux transformation</p>
          <p className="text-2xl font-bold">{data.summary?.tauxTransformation || 0}%</p>
        </div>
      </div>

      {/* Tableau des ventes */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold">Liste des ventes</h3>
        </div>
        
        <div className="overflow-x-auto">
          {data.ventes?.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.ventes.map((vente, i) => {
                  const statutInfo = getStatutInfo(vente.statut);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{vente.date}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-800">{vente.reference}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vente.client}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{vente.montant} DT</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutInfo.class}`}>
                          {statutInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vente.nbProduits || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune vente trouvée pour cette période
            </div>
          )}
        </div>
      </div>

      {/* Indicateur de chargement */}
      {loading && data && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 border border-gray-200">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Mise à jour...</span>
        </div>
      )}
    </div>
  );
};

export default SalesTab;