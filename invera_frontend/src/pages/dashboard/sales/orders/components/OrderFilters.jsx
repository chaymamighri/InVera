// src/pages/dashboard/sales/orders/components/OrderFilters.jsx
import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const OrderFilters = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedClientType,
  setSelectedClientType,
  clientTypes,
  onReset,
  t,
  isArabic = false,
}) => {
  const iconSide = isArabic ? 'right-3' : 'left-3';
  const inputPadding = isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4';

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder={t('salesPages.searchOrders') || 'Rechercher une commande...'}
            className={`w-full ${inputPadding} rounded-lg border border-gray-300 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={`absolute ${iconSide} top-3 text-gray-400`}>
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative">
          <FunnelIcon className={`absolute ${iconSide} top-3 h-5 w-5 text-gray-400`} />
          <select
            className={`${inputPadding} min-w-[180px] rounded-lg border border-gray-300 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Tous">{t('salesPages.allStatuses')}</option>
            <option value="EN_ATTENTE">{t('salesPages.pending')}</option>
            <option value="CONFIRMEE">{t('salesPages.confirmed')}</option>
            <option value="ANNULEE">{t('salesPages.rejected')}</option>
          </select>
        </div>

        <div className="relative">
          <BuildingLibraryIcon className={`absolute ${iconSide} top-3 h-5 w-5 text-gray-400`} />
          <select
            className={`${inputPadding} min-w-[180px] rounded-lg border border-gray-300 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
            value={selectedClientType}
            onChange={(e) => setSelectedClientType(e.target.value)}
          >
            <option value="Tous">{t('salesPages.allTypes')}</option>
            {clientTypes?.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 p-2.5 text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          title={t('salesPages.resetFilters')}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;
