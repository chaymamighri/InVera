// src/pages/dashboard/sales/products/components/OrderModal/ClientSelectionSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import ExistingClientsList from './ExistingClientsList';

const ClientSelectionSection = ({
  clients,
  selectedClient,
  setSelectedClient,
  remiseAppliquee,
  handleSelectClient,
  loadingClients,
  applyRemiseByClientType
}) => {
  const [searchClientTerm, setSearchClientTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients);
  const searchInputRef = useRef(null);

  // 🔍 LOG de l'état initial
  useEffect(() => {
    console.log('📌 ClientSelectionSection - selectedClient INITIAL:', selectedClient);
    console.log('📌 ClientSelectionSection - selectedClient est null?', selectedClient === null);
    console.log('📌 ClientSelectionSection - selectedClient est objet vide?', 
      selectedClient && typeof selectedClient === 'object' && Object.keys(selectedClient).length === 0);
  }, []);

  // 🔍 LOG des changements de selectedClient
  useEffect(() => {
    console.log('🔄 ClientSelectionSection - selectedClient CHANGÉ:', selectedClient);
  }, [selectedClient]);

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
      'PARTICULIER': 'Particulier',
      'VIP': 'VIP',
      'ENTREPRISE': 'Entreprise',
      'PROFESSIONNEL': 'Entreprise',
      'FIDELE': 'Fidèle'
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'VIP': return 'bg-purple-100 text-purple-700';
      case 'ENTREPRISE': return 'bg-blue-100 text-blue-700';
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

  const isClientSelected = selectedClient !== null && Object.keys(selectedClient || {}).length > 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-800">Client</h3>
        <div className="text-xs text-gray-400">
          <UserIcon className="h-3 w-3 inline mr-1" />
          {clients.length} client(s)
        </div>
      </div>

      {/* Bouton pour changer de client */}
      {isClientSelected && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => {
              console.log('🗑️ Réinitialisation du client sélectionné');
              setSelectedClient(null);
              setSearchClientTerm('');
            }}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <XMarkIcon className="h-3 w-3" />
            Changer de client
          </button>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={isClientSelected ? "Client déjà sélectionné" : "Rechercher un client..."}
          className={`w-full pl-9 pr-8 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isClientSelected ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'border-gray-200'
          }`}
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

      {/* Liste des clients */}
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
      />
    </div>
  );
};

export default ClientSelectionSection;