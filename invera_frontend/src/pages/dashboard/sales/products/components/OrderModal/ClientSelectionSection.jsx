// src/pages/dashboard/sales/products/components/OrderModal/ClientSelectionSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import ExistingClientsList from './ExistingClientsList';
// Supprimer l'import de NewClientForm

const ClientSelectionSection = ({
  clients,
  selectedClient,
  setSelectedClient,
  remiseAppliquee,
  handleSelectClient,
  loadingClients,
  applyRemiseByClientType,
  loadClients,
  t = (key) => key,
  isArabic = false
}) => {
  const [searchClientTerm, setSearchClientTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!searchClientTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const searchLower = searchClientTerm.toLowerCase();
      const filtered = clients.filter(client => {
        const fullName = `${client.prenom || ''} ${client.nom || ''}`.toLowerCase();
        const phone = client.telephone?.replace(/\s/g, '') || '';
        const email = client.email?.toLowerCase() || '';
        const type = getTypeDisplayName(client.typeClient || client.type).toLowerCase();
        
        return fullName.includes(searchLower) || 
               phone.includes(searchLower.replace(/\s/g, '')) ||
               email.includes(searchLower) ||
               type.includes(searchLower);
      });
      setFilteredClients(filtered);
    }
  }, [searchClientTerm, clients]);

  const getTypeDisplayName = (type) => {
    const typeMap = {
      'PARTICULIER': t('salesPages.individual'),
      'VIP': t('salesPages.vip'),
      'ENTREPRISE': t('salesPages.company'),
      'PROFESSIONNEL': t('salesPages.company'),
      'FIDELE': t('salesPages.loyalCustomer')
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'VIP': return 'bg-purple-100 text-purple-700';
      case 'ENTREPRISE': return 'bg-blue-100 text-blue-700';
      case 'PROFESSIONNEL': return 'bg-blue-100 text-blue-700';
      case 'FIDELE': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSelectClientLocal = (client) => {
    console.log('🖱️ Sélection client local:', client?.nom, 'ID:', client?.id || client?.idClient);
    
    if (handleSelectClient && typeof handleSelectClient === 'function') {
      handleSelectClient(client);
    } else if (setSelectedClient && typeof setSelectedClient === 'function') {
      setSelectedClient(client);
    }
    
    if (applyRemiseByClientType && client?.typeClient) {
      applyRemiseByClientType(client.typeClient);
    }
    
    setSearchClientTerm('');
  };

  const isClientSelected = selectedClient !== null && selectedClient !== undefined && 
    (typeof selectedClient === 'object' ? Object.keys(selectedClient).length > 0 : true);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">{t('clientSelection') || 'Sélection du client'}</h3>
        <div className="text-xs text-gray-400">
          <UserIcon className="h-3 w-3 inline mr-1" />
          {clients.length} client(s)
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={t('searchClientLong') || "Rechercher un client par nom, téléphone..."}
          className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchClientTerm}
          onChange={(e) => setSearchClientTerm(e.target.value)}
          disabled={isClientSelected}
        />
        {searchClientTerm && !isClientSelected && (
          <button
            onClick={() => setSearchClientTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Indicateur client sélectionné */}
      {isClientSelected && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium text-gray-900">
                {selectedClient.nom} {selectedClient.prenom}
              </span>
              <span className="ml-2 text-xs text-gray-500">• {selectedClient.telephone}</span>
            </div>
            <button
              onClick={() => {
                setSelectedClient(null);
                setSearchClientTerm('');
              }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Changer
            </button>
          </div>
          {remiseAppliquee > 0 && (
            <div className="mt-2 text-xs text-green-600">
              Remise {remiseAppliquee}% applicable
            </div>
          )}
        </div>
      )}

      {/* Liste des clients existants */}
      {!isClientSelected && (
        <ExistingClientsList
          filteredClients={filteredClients}
          allClients={clients}
          loadingClients={loadingClients}
          searchClientTerm={searchClientTerm}
          selectedClient={selectedClient}
          remiseAppliquee={remiseAppliquee}
          getTypeDisplayName={getTypeDisplayName}
          getTypeBadgeColor={getTypeBadgeColor}
          handleSelectClientLocal={handleSelectClientLocal}
          t={t}
        />
      )}
    </div>
  );
};

export default ClientSelectionSection;