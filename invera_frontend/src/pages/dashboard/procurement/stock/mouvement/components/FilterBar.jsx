// components/stock/FilterBar.jsx
import React from 'react';

const FilterBar = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-700 mb-4">Filtres</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date début</label>
          <input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => onFilterChange('dateDebut', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date fin</label>
          <input
            type="date"
            value={filters.dateFin}
            onChange={(e) => onFilterChange('dateFin', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="ENTREE">Entrées</option>
            <option value="SORTIE">Sorties</option>
          </select>
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            onClick={onReset}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;