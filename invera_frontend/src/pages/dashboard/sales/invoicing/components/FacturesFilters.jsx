import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const FilterChip = ({ label, onClear }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
    {label}
    <button onClick={onClear} className="hover:text-blue-900">
      <XMarkIcon className="h-4 w-4" />
    </button>
  </span>
);

const FacturesFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  hasActiveFilters,
  onClearSearch,
  onClearStatus,
  onClearDate,
  filteredCount,
  currentPage,
  totalPages,
  formatDate
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une facture..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="relative">
          <FunnelIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="tous">Tous les statuts</option>
            <option value="PAYE">Payées</option>
            <option value="NON_PAYE">Non payées</option>
          </select>
        </div>

        <div className="relative">
          <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="date"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Filtres actifs:</span>
          {searchTerm && (
            <FilterChip label={`Recherche: ${searchTerm}`} onClear={onClearSearch} />
          )}
          {statusFilter !== 'tous' && (
            <FilterChip 
              label={`Statut: ${
                statusFilter === 'PAYE' ? 'Payée' : 
                statusFilter === 'NON_PAYE' ? 'Non payée' : 'Annulée'
              }`} 
              onClear={onClearStatus} 
            />
          )}
          {dateFilter && (
            <FilterChip label={`Date: ${formatDate(dateFilter)}`} onClear={onClearDate} />
          )}
        </div>
      )}

      {/* Résultats */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-4">
        <span>
          <span className="font-medium text-gray-900">{filteredCount}</span> facture{filteredCount !== 1 ? 's' : ''} trouvée{filteredCount !== 1 ? 's' : ''}
        </span>
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
          Page {currentPage} / {totalPages || 1}
        </span>
      </div>
    </div>
  );
};

export default FacturesFilters;