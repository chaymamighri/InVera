// src/pages/dashboard/sales/orders/components/OrderFilters.jsx
import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const OrderFilters = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedClient,
  setSelectedClient,
  clients,
  onReset
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par numéro de commande ou client..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-3 text-gray-400">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Tous">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="Confirmé">Confirmé</option>
            <option value="Refusé">Refusé</option>
          </select>
        </div>
        
        <div className="relative">
          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="Tous">Tous les clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.nom}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={onReset}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;