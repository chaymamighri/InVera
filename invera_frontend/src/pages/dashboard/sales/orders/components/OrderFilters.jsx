// src/pages/dashboard/sales/orders/components/OrderFilters.jsx
import React from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  UserIcon, 
  ArrowPathIcon,
  BuildingLibraryIcon 
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
  t
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder={t('salesPages.searchOrders')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-3 text-gray-400">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Tous">{t('salesPages.allStatuses')}</option>
            <option value="En attente">{t('salesPages.pending')}</option>
            <option value="Confirmé">{t('salesPages.confirmed')}</option>
            <option value="Refusé">{t('salesPages.rejected')}</option>
          </select>
        </div>
      
        
        <div className="relative">
          <BuildingLibraryIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
            value={selectedClientType}
            onChange={(e) => setSelectedClientType(e.target.value)}
          >
            <option value="Tous">Tous les types</option>
            {clientTypes && clientTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
           <button
          onClick={onReset}
          className="p-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          title="Réinitialiser les filtres"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;