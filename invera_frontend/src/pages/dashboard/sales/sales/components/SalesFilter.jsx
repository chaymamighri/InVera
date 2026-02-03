// src/pages/dashboard/sales/sales/components/SalesFilters.jsx
import React from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SalesFilters = ({ filters, onFilterChange }) => {
  const sortOptions = [
    { value: 'date_creation', label: 'Date création' },
    { value: 'numero_commande', label: 'N° Commande' },
    { value: 'client', label: 'Client' },
    { value: 'montant', label: 'Montant' }
  ];

  const handleReset = () => {
    onFilterChange('searchTerm', '');
    onFilterChange('dateRange', { from: '', to: '' });
    onFilterChange('sortBy', 'date_creation');
    onFilterChange('sortOrder', 'desc');
  };

  const handleSortToggle = () => {
    onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <FunnelIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Filtres de commandes</h3>
            <p className="text-sm text-gray-500 mt-0.5">Filtrer les commandes validées</p>
          </div>
        </div>
        <button
  onClick={handleReset}
  className="flex items-center gap-1.5 px-3 py-1.5 text-sm 
             bg-emerald-50 text-emerald-700 border border-emerald-200
             hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300
             rounded-lg transition-all duration-200"
>
  <ArrowPathIcon className="h-4 w-4" />
  Réinitialiser
</button>
</div>

      {/* Champs de filtrage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recherche */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rechercher
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="N° commande, client, produit..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
              value={filters.searchTerm}
              onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date de création
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
              value={filters.dateRange?.from || ''}
              onChange={(e) => onFilterChange('dateRange', { 
                ...filters.dateRange, 
                from: e.target.value 
              })}
            />
          </div>
        </div>

        {/* Tri */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Trier par
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowsUpDownIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 appearance-none bg-white"
                value={filters.sortBy}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              onClick={handleSortToggle}
              className={`flex items-center justify-center w-12 px-3 py-2.5 border rounded-lg transition-all ${
                filters.sortOrder === 'desc' 
                  ? 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100' 
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
              title={filters.sortOrder === 'desc' ? 'Décroissant' : 'Croissant'}
            >
              {filters.sortOrder === 'desc' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtres actifs */}
      {(filters.searchTerm || filters.dateRange?.from) && (
        <div className="mt-6 pt-5 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Filtres appliqués</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-sm">
                <span className="font-medium">Recherche:</span>
                <span className="truncate max-w-[150px]">"{filters.searchTerm}"</span>
                <button
                  onClick={() => onFilterChange('searchTerm', '')}
                  className="ml-1 p-0.5 hover:bg-blue-100 rounded"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {filters.dateRange?.from && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm">
                <span className="font-medium">Date:</span>
                <span>{new Date(filters.dateRange.from).toLocaleDateString('fr-FR')}</span>
                <button
                  onClick={() => onFilterChange('dateRange', { from: '', to: '' })}
                  className="ml-1 p-0.5 hover:bg-emerald-100 rounded"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statut */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">
            Affichage des commandes
            <span className="ml-1 font-medium text-green-700">Validée ✓</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesFilters;