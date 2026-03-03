// produits/ProduitToolbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ProduitToolbar = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  filters,
  onFilterChange,
  onResetFilters,
  onAddProduit,
  categories = [],
  loadingCategories = false
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const isFirstRender = useRef(true); 
  const filterTimeoutRef = useRef(null); 

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch);
        onSearchSubmit();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, onSearchSubmit, searchTerm]);

  // Appliquer les filtres avec debounce (ÉVITE LA BOUCLE)
  useEffect(() => {
    // Ignorer le premier rendu
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Nettoyer le timeout précédent
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Déclencher la recherche après un délai
    filterTimeoutRef.current = setTimeout(() => {
      if (filters.status !== '' || filters.categorieId !== '' || filters.actif !== '') {
        onSearchSubmit();
      }
    }, 300); // 300ms de debounce

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [filters.status, filters.categorieId, filters.actif, onSearchSubmit]);

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
    onSearchSubmit();
  };

  const handleFilterChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handleRemoveFilter = (key) => {
    onFilterChange(key, '');
  };

  const hasActiveFilters = filters.status || filters.categorieId || filters.actif || localSearch;

  const getStatutProduitLabel = (value) => {
    if (value === 'true') return 'Actifs';
    if (value === 'false') return 'Inactifs';
    return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-col gap-4">
        {/* Première ligne : Recherche + Nouveau produit */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Barre de recherche dynamique */}
          <div className="flex-1 w-full">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit... (tapez pour rechercher)"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Bouton nouveau produit */}
          <button
            onClick={onAddProduit}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap w-full md:w-auto justify-center"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau produit
          </button>
        </div>

        {/* Deuxième ligne : Filtres (3 colonnes) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* FILTRE 1: Statut produit */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut produit
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.actif ?? ''}
              onChange={(e) => handleFilterChange('actif', e.target.value)}
            >
              <option value="">Tous les produits</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>

          {/* FILTRE 2: Statut stock */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut stock
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="EN_STOCK">En stock</option>
              <option value="FAIBLE">Stock faible</option>
              <option value="CRITIQUE">Stock critique</option>
              <option value="RUPTURE">Rupture</option>
            </select>
          </div>

          {/* FILTRE 3: Catégorie */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            {loadingCategories ? (
              <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                Chargement...
              </div>
            ) : (
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.categorieId || ''}
                onChange={(e) => handleFilterChange('categorieId', e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.idCategorie} value={cat.idCategorie}>
                    {cat.libelle}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Indicateur de filtres actifs */}
       {/* Indicateur de filtres actifs avec bouton aligné */}
{hasActiveFilters && (
  <div className="flex items-center justify-between gap-4 pt-2 border-t">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">Filtres actifs:</span>
      
      {/* Badges des filtres */}
      {localSearch && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          <span>Recherche: "{localSearch}"</span>
          <button onClick={handleClearSearch} className="hover:text-blue-900">
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      )}
      
      {filters.actif !== '' && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          <span>Produits: {getStatutProduitLabel(filters.actif)}</span>
          <button onClick={() => handleRemoveFilter('actif')} className="hover:text-blue-900">
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      )}
      
      {filters.status && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          <span>
            Stock: {
              filters.status === 'EN_STOCK' ? 'En stock' :
              filters.status === 'FAIBLE' ? 'Faible' :
              filters.status === 'CRITIQUE' ? 'Critique' : 'Rupture'
            }
          </span>
          <button onClick={() => handleRemoveFilter('status')} className="hover:text-blue-900">
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      )}
      
      {filters.categorieId && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          <span>
            Catégorie: {categories.find(c => c.idCategorie === parseInt(filters.categorieId))?.libelle}
          </span>
          <button onClick={() => handleRemoveFilter('categorieId')} className="hover:text-blue-900">
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>

    {/* Bouton réinitialiser aligné à droite */}
    <button
      onClick={onResetFilters}
      className="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center gap-1 whitespace-nowrap shadow-sm"
    >
      <XMarkIcon className="h-3.5 w-3.5" />
      Réinitialiser
    </button>
  </div>
)}
      </div>
    </div>
  );
};

export default ProduitToolbar;