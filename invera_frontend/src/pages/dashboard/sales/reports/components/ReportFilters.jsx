// src/pages/dashboard/sales/reports/components/ReportFilters.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X, RefreshCw } from 'lucide-react';

const periods = [
  { id: 'today', label: 'Aujourd\'hui' },
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois' },
  { id: 'quarter', label: 'Ce trimestre' },
  { id: 'year', label: 'Cette année' },
  { id: 'custom', label: 'Personnalisé' }
];

// Types de clients (commun à tous)
const clientTypes = [
  { id: 'all', label: 'Tous les clients' },
  { id: 'VIP', label: 'VIP' },
  { id: 'PROFESSIONNEL', label: 'Professionnel' },
  { id: 'ENTREPRISE', label: 'Entreprise' },
  { id: 'FIDELE', label: 'Fidèle' },
  { id: 'PARTICULIER', label: 'Particulier' }
];

// Statuts spécifiques par type de rapport
const statusOptions = {
  sales: [
    { id: 'all', label: 'Tous les statuts' },
    { id: 'CONFIRMEE', label: 'Confirmée' },
    { id: 'EN_ATTENTE', label: 'En attente' },
    { id: 'ANNULEE', label: 'Annulée' }
  ],
  invoices: [
    { id: 'all', label: 'Tous les statuts' },
    { id: 'PAYE', label: 'Payée' },
    { id: 'NON_PAYE', label: 'Impayée' }
  ],
  clients: [
    { id: 'all', label: 'Tous les clients' },
    { id: 'VIP', label: 'VIP' },
    { id: 'PROFESSIONNEL', label: 'Professionnel' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ],
  global: [
    { id: 'all', label: 'Tous les statuts' },
    { id: 'CONFIRMEE', label: 'Confirmée' },
    { id: 'EN_ATTENTE', label: 'En attente' },
    { id: 'ANNULEE', label: 'Annulée' },
    { id: 'PAYE', label: 'Payée' },
    { id: 'NON_PAYE', label: 'Impayée' }
  ]
};

const ReportFilters = ({ 
  filters,
  setFilters,
  onRefresh,
  loading = false,
  reportType = 'global'  // 'sales', 'invoices', 'clients', ou 'global'
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localDates, setLocalDates] = useState({
    startDate: filters?.startDate || '',
    endDate: filters?.endDate || ''
  });

  useEffect(() => {
    if (filters?.period === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  }, [filters?.period]);

  const handlePeriodChange = (periodId) => {
    setFilters({ 
      ...filters, 
      period: periodId,
      ...(periodId !== 'custom' && { startDate: null, endDate: null })
    });
  };

  const handleApplyCustom = () => {
    if (localDates.startDate && localDates.endDate) {
      setFilters({
        ...filters,
        period: 'custom',
        startDate: localDates.startDate,
        endDate: localDates.endDate
      });
      setShowCustom(false);
    }
  };

  const handleAdvancedChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      period: 'month',
      startDate: null,
      endDate: null,
      clientType: 'all',
      status: 'all'
    });
    setLocalDates({ startDate: '', endDate: '' });
    setShowCustom(false);
    setShowAdvanced(false);
  };

  // Obtenir les options de statut selon le type de rapport
  const getStatusOptions = () => {
    return statusOptions[reportType] || statusOptions.global;
  };

  // Savoir si on doit afficher le filtre client
  const showClientFilter = () => {
    return ['sales', 'invoices', 'global'].includes(reportType);
  };

  // Savoir si on doit afficher le filtre statut
  const showStatusFilter = () => {
    return ['sales', 'invoices', 'global'].includes(reportType);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Barre principale */}
      <div className="p-4 flex flex-wrap items-center gap-4">
        {/* Sélecteur de période */}
        <select
          value={filters?.period || 'month'}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
        >
          {periods.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Bouton filtres avancés - seulement si nécessaire */}
          {(showClientFilter() || showStatusFilter()) && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-4 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors
                ${showAdvanced ? 'bg-blue-50 border-blue-300 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {reportType === 'clients' ? 'Filtres clients' : 'Filtres avancés'}
              </span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={resetFilters}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Période personnalisée */}
      {showCustom && (
        <div className="p-4 border-t bg-gray-50">
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

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="p-4 border-t bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {reportType === 'clients' ? 'Filtres clients' : 'Filtres avancés'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type de client - pour sales, invoices, global */}
            {showClientFilter() && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type de client</label>
                <select
                  value={filters?.clientType || 'all'}
                  onChange={(e) => handleAdvancedChange('clientType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {clientTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Statut - adapté au type de rapport */}
            {showStatusFilter() && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {reportType === 'invoices' ? 'Statut facture' : 'Statut commande'}
                </label>
                <select
                  value={filters?.status || 'all'}
                  onChange={(e) => handleAdvancedChange('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {getStatusOptions().map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pour les clients, on peut ajouter des filtres spécifiques */}
            {reportType === 'clients' && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 italic">
                  Les filtres avancés ne sont pas disponibles pour le rapport clients.
                  Utilisez la période pour filtrer les données.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportFilters;