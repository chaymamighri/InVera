// src/pages/dashboard/sales/products/components/ProductFilters.jsx
import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ProductFilters = ({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories, t = (key) => key, isArabic = false }) => {
  const iconSide = isArabic ? 'right-3' : 'left-3';
  const inputPadding = isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4';

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchProductsByNameOrCategory')}
            className={`w-full ${inputPadding} py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={`absolute ${iconSide} top-3 text-gray-400`}>
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="relative">
          <FunnelIcon className={`absolute ${iconSide} top-3 h-5 w-5 text-gray-400`} />
          <select
            className={`${inputPadding} py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'Tous' ? t('allCategories') : cat}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
