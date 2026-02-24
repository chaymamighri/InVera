// src/pages/dashboard/sales/reports/tabs/InvoicesTab.jsx
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Filter, Calendar, X } from 'lucide-react';
import { useReports } from '../../../../../hooks/useReports';

const InvoicesTab = () => {
  // ✅ Récupérer seulement le refreshTrigger depuis le contexte
  const { refreshTrigger } = useOutletContext();
  
  // ✅ État pour TOUS les filtres
  const [filters, setFilters] = useState({
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

  // ✅ Périodes prédéfinies
  const periods = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: 'Cette semaine' },
    { id: 'month', label: 'Ce mois' },
    { id: 'year', label: 'Cette année' },
  ];

  // ✅ Types de clients
  const clientTypes = [
    { id: undefined, label: 'Tous les clients' },  // undefined pour "tous"
    { id: 'VIP', label: 'VIP' },
    { id: 'PROFESSIONNEL', label: 'Professionnel' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ];

  // ✅ Statuts des factures
  const statusOptions = [
    { id: undefined, label: 'Tous les statuts' },  // undefined pour "tous"
    { id: 'PAYE', label: 'Payée' },
    { id: 'NON_PAYE', label: 'Impayée' },
  ];

  // ✅ Utiliser le hook useReports
  const { 
    loading, 
    error, 
    data, 
    refresh,
    setFilters: updateReportsFilters 
  } = useReports('invoices', filters);

  // ✅ Effet pour le refreshTrigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 InvoicesTab - Rafraîchissement global');
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // ✅ Gestionnaire de changement de période
  const handlePeriodChange = (periodId) => {
    const newFilters = {
      ...filters,
      period: periodId,
      ...(periodId !== 'custom' && { startDate: null, endDate: null })
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);  // ✅ Met à jour dans le hook
  };

  // ✅ Appliquer la période personnalisée
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

  // ✅ Gestionnaire pour les filtres spécifiques
  const handleSpecificFilterChange = (key, value) => {
    // ✅ value peut être undefined pour "Tous"
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // ✅ Réinitialiser TOUS les filtres
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
    
    console.log('✅ Filtres réinitialisés');
  };

  

  if (loading && !data) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement des factures...</p>
      </div>
    );
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Détail des factures</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.factures?.length || 0} factures trouvées
          </p>
        </div>
      
      </div>

      {/* ✅ SECTION FILTRES */}
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
  className="px-4 py-2 border rounded-lg text-sm hover:bg-green-100 bg-green-50 text-green-700 border-green-200 ml-auto"
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

        {/* ✅ FILTRES SPÉCIFIQUES */}
        {showSpecificFilters && (
          <div className="p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtres factures</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type de client */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type de client</label>
                <select
                  value={filters.clientType ?? 'all'}  // ?? 'all' pour l'affichage
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

              {/* Statut facture */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Statut facture</label>
                <select
                  value={filters.status ?? 'all'}  // ?? 'all' pour l'affichage
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
          <p className="text-sm text-blue-600">Total factures</p>
          <p className="text-2xl font-bold">{data.summary?.totalFactures || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <p className="text-sm text-green-600">Payées</p>
          <p className="text-2xl font-bold">{data.summary?.payees || 0}</p>
          <p className="text-xs text-green-500">{data.summary?.montantPaye || 0} DT</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl">
          <p className="text-sm text-yellow-600">En retard</p>
          <p className="text-2xl font-bold">{data.summary?.enRetard || 0}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl">
          <p className="text-sm text-red-600">Impayées</p>
          <p className="text-2xl font-bold">{data.summary?.impayees || 0}</p>
          <p className="text-xs text-red-500">{data.summary?.montantImpaye || 0} DT</p>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Facture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.factures?.map((facture, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-800">{facture.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{facture.client}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{facture.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{facture.montant} DT</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
  facture.statut === 'Payée' ? 'bg-green-100 text-green-700' :
  facture.statut === 'En attente' ? 'bg-yellow-100 text-yellow-700' :
  facture.statut === 'Annulée' ? 'bg-gray-100 text-gray-700' :
  'bg-red-100 text-red-700'
}`}>
  {facture.statut === 'Payée' ? 'Payée' :
   facture.statut === 'En attente' ? 'En attente' :
   facture.statut === 'Annulée' ? 'Annulée' :
   'Impayée'}
</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!data.factures || data.factures.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Aucune facture trouvée pour cette période
          </div>
        )}
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

export default InvoicesTab;