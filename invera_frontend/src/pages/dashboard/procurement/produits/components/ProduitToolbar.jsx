// produits/ProduitToolbar.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

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
  onToggleFilters,
}) => {
  const { t, isArabic } = useLanguage();
  const [localSearch, setLocalSearch] = useState(searchInput);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    setLocalSearch(searchInput);
  }, [searchInput]);

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
  const iconSideClass = isArabic ? 'right-3' : 'left-3';
  const clearSideClass = isArabic ? 'left-3' : 'right-3';
  const inputPaddingClass = isArabic ? 'pr-10 pl-10' : 'pl-10 pr-10';

  const getStatutProduitLabel = (value) => {
    if (value === 'true') return t('dashboard.procurementProductsPage.activeOnly');
    if (value === 'false') return t('dashboard.procurementProductsPage.inactiveOnly');
    return '';
  };

  const getStockStatusLabel = (value) => {
    const labels = {
      EN_STOCK: t('dashboard.procurementProductsPage.inStockLabel'),
      FAIBLE: t('dashboard.procurementProductsPage.lowStockLabel'),
      CRITIQUE: t('dashboard.procurementProductsPage.criticalStockLabel'),
      RUPTURE: t('dashboard.procurementProductsPage.outOfStockLabel'),
    };
    return labels[value] || value;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon
              className={`absolute ${iconSideClass} top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400`}
            />
            <input
              type="text"
              placeholder={t('dashboard.procurementProductsPage.searchPlaceholder')}
              className={`${inputPaddingClass} w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                onClick={handleClearSearch}
                className={`absolute ${clearSideClass} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-end">
          <button
            onClick={onToggleFilters}
            className={`rounded-lg p-2.5 transition-colors ${
              showFilters || hasActiveFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title={t('dashboard.procurementProductsPage.filterButton')}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onRefresh}
            className="rounded-lg p-2.5 text-gray-600 transition-colors hover:bg-gray-200"
            title={t('dashboard.procurementProductsPage.refreshTooltip')}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onAddProduit}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5" />
            {t('dashboard.procurementProductsPage.newProductButton')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.procurementProductsPage.productStatusFilter')}
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={filters?.actif ?? ''}
                onChange={(e) => handleFilterChange('actif', e.target.value)}
              >
                <option value="">{t('dashboard.procurementProductsPage.allProductsOption')}</option>
                <option value="true">{t('dashboard.procurementProductsPage.activeOnly')}</option>
                <option value="false">{t('dashboard.procurementProductsPage.inactiveOnly')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.procurementProductsPage.stockLevelLabel')}
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={filters?.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Tous les niveaux</option>
                <option value="EN_STOCK">En stock</option>
                <option value="FAIBLE">Stock faible</option>
                <option value="RUPTURE">Rupture</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.procurementProductsPage.categoryFilterLabel')}
              </label>
              {loadingCategories ? (
                <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  {t('dashboard.procurementProductsPage.loading')}
                </div>
              ) : (
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={filters?.categorieId || ''}
                  onChange={(e) => handleFilterChange('categorieId', e.target.value)}
                >
                  <option value="">{t('dashboard.procurementProductsPage.allCategoriesOption')}</option>
                  {categories.map((cat) => (
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

      {hasActiveFilters && (
        <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-700">
              {t('dashboard.procurementProductsPage.activeFiltersLabel')}
            </span>

            {localSearch && (
              <FilterChip label={`"${localSearch}"`} onRemove={handleClearSearch} />
            )}

            {filters?.actif !== '' && filters?.actif !== undefined && (
              <FilterChip label={getStatutProduitLabel(filters.actif)} onRemove={() => handleRemoveFilter('actif')} />
            )}

            {filters?.status && (
              <FilterChip label={getStockStatusLabel(filters.status)} onRemove={() => handleRemoveFilter('status')} />
            )}

            {filters?.categorieId && (
              <FilterChip
                label={
                  categories.find((cat) => cat.idCategorie === parseInt(filters.categorieId))?.nomCategorie ||
                  t('dashboard.procurementProductsPage.categoryLabel')
                }
                onRemove={() => handleRemoveFilter('categorieId')}
              />
            )}
          </div>

          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-600 shadow-sm hover:text-blue-800"
          >
            <XMarkIcon className="h-4 w-4" />
            {t('dashboard.procurementProductsPage.resetFilters')}
          </button>
        </div>
      )}
    </div>
  );
};

const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-700">
    <span>{label}</span>
    <button onClick={onRemove} className="hover:text-blue-900">
      <XMarkIcon className="h-4 w-4" />
    </button>
  </span>
);

export default ProduitToolbar;
