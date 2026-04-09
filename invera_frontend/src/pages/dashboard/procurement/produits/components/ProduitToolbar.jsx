// produits/ProduitToolbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const ProduitToolbar = ({
  searchInput,
  onSearchChange,
  onSearch,
  filters,
  onFilterChange,
  onResetFilters,
  onAddProduit,
  categories = [],
  loadingCategories = false,
  onRefresh,
  showFilters,
  onToggleFilters
}) => {
  const [localSearch, setLocalSearch] = useState(searchInput);
  const searchTimeoutRef = useRef(null);

  // Synchroniser avec l'input externe
  useEffect(() => {
    setLocalSearch(searchInput);
  }, [searchInput]);

  // Debounce pour la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (localSearch !== searchInput) {
        onSearchChange(localSearch);
        onSearch(localSearch);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch, onSearch, onSearchChange, searchInput]);

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
    onSearch('');
  };

  const handleFilterChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handleRemoveFilter = (key) => {
    onFilterChange(key, '');
  };

  const hasActiveFilters = filters?.status || filters?.categorieId || filters?.actif || localSearch;

  const getStatutProduitLabel = (value) => {
    if (value === 'true') return 'Actifs';
    if (value === 'false') return 'Inactifs';
    return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête avec recherche */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50/50 border-b border-gray-200">
        {/* Barre de recherche */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit par nom..."
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={localSearch}
              onChange={handleSearchChange}
            />
            {localSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 sm:self-end">
          <button
            onClick={onToggleFilters}
            className={`p-2.5 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Filtres"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={onRefresh}
            className="p-2.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onAddProduit}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FILTRE 1: Statut produit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut produit
              </label>
              <select
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters?.actif ?? ''}
                onChange={(e) => handleFilterChange('actif', e.target.value)}
              >
                <option value="">Tous les produits</option>
                <option value="true">Actifs uniquement</option>
                <option value="false">Inactifs uniquement</option>
              </select>
            </div>

            {/* FILTRE 2: Statut stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de stock
              </label>
              <select
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters?.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Tous les niveaux</option>
                <option value="EN_STOCK">En stock</option>
                <option value="FAIBLE">Stock faible</option>
                <option value="CRITIQUE">Stock critique</option>
                <option value="RUPTURE">Rupture</option>
              </select>
            </div>

            {/* FILTRE 3: Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              {loadingCategories ? (
                <div className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                  Chargement...
                </div>
              ) : (
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={filters?.categorieId || ''}
                  onChange={(e) => handleFilterChange('categorieId', e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(cat => (
  <option key={cat.idCategorie} value={cat.idCategorie}>
    {cat.nomCategorie} 
  </option>
))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-700">Filtres actifs:</span>
            
            {localSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                <span>"{localSearch}"</span>
                <button onClick={handleClearSearch} className="hover:text-blue-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            
            {filters?.actif !== '' && filters?.actif !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                <span>{getStatutProduitLabel(filters.actif)}</span>
                <button onClick={() => handleRemoveFilter('actif')} className="hover:text-blue-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            
            {filters?.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                <span>
                  {filters.status === 'EN_STOCK' ? 'En stock' :
                   filters.status === 'FAIBLE' ? 'Faible' :
                   filters.status === 'CRITIQUE' ? 'Critique' : 'Rupture'}
                </span>
                <button onClick={() => handleRemoveFilter('status')} className="hover:text-blue-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            
            {filters?.categorieId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                <span>
                  {categories.find(c => c.idCategorie === parseInt(filters.categorieId))?.libelle}
                </span>
                <button onClick={() => handleRemoveFilter('categorieId')} className="hover:text-blue-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={onResetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-3 py-1 bg-white rounded-md border border-blue-200 shadow-sm"
          >
            <XMarkIcon className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
};

export default ProduitToolbar;