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
  t,
  isArabic = false
}) => {
  const iconSide = isArabic ? 'right-3' : 'left-3';
  const inputPadding = isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4';

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Barre de recherche */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder={t('salesPages.searchOrders') || "Rechercher une commande..."}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('salesPages.searchOrders')}
            className={`w-full ${inputPadding} py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={`absolute ${iconSide} top-3 text-gray-400`}>
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 flex-wrap">
        {/* ✅ Filtre par statut - valeurs corrigées */}
        <div className="relative">
          <FunnelIcon className={`absolute ${iconSide} top-3 h-5 w-5 text-gray-400`} />
          <select
            className={`${inputPadding} py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]`}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="CONFIRMEE">Confirmée</option>
            <option value="ANNULEE">Annulée</option>
            <option value="Tous">{t('salesPages.allStatuses')}</option>
            <option value="EN_ATTENTE">{t('salesPages.pending')}</option>
            <option value="CONFIRMEE">{t('salesPages.confirmed')}</option>
            <option value="ANNULEE">{t('salesPages.rejected')}</option>
          </select>
        </div>
      
        {/* Filtre par type de client */}
        <div className="relative">
          <BuildingLibraryIcon className={`absolute ${iconSide} top-3 h-5 w-5 text-gray-400`} />
          <select
            className={`${inputPadding} py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]`}
            value={selectedClientType}
            onChange={(e) => setSelectedClientType(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="Tous">{t('salesPages.allTypes')}</option>
            {clientTypes && clientTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {/* Bouton reset */}
        <button
          onClick={onReset}
          className="p-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          title={t('salesPages.resetFilters')}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;
