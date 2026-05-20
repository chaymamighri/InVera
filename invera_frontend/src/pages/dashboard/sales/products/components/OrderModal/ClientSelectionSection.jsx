// src/pages/dashboard/sales/products/components/OrderModal/ClientSelectionSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import ExistingClientsList from './ExistingClientsList';
import NewClientForm from './NewClientForm';

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
  const [newClientMode, setNewClientMode] = useState(false);
  const [nouveauClient, setNouveauClient] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    typeClient: 'PARTICULIER'
  });
  const [clientCreeEtSelectionne, setClientCreeEtSelectionne] = useState(null);
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
    if (searchInputRef.current && !newClientMode) {
      searchInputRef.current.focus();
    }
  }, [newClientMode]);

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
    setNewClientMode(false);
  };

  const handleSelectClientUnified = (client) => {
    handleSelectClientLocal(client);
  };

  const isClientSelected = selectedClient !== null && selectedClient !== undefined && 
    (typeof selectedClient === 'object' ? Object.keys(selectedClient).length > 0 : true);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">{t('clientSelection') || 'Sélection du client'}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setNewClientMode(false);
              setTimeout(() => {
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }, 100);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !newClientMode 
                ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserIcon className="h-4 w-4 inline mr-2" />
            {t('existingClient') || 'Client existant'}
          </button>
          <button
            onClick={() => setNewClientMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              newClientMode 
                ? 'bg-green-100 text-green-600 border border-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserPlusIcon className="h-4 w-4 inline mr-2" />
            {t('newClient') || 'Nouveau client'}
          </button>
        </div>
      </div>

      {!newClientMode ? (
        <div className="space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('searchClientLong') || "Rechercher un client par nom, téléphone..."}
              className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchClientTerm}
              onChange={(e) => setSearchClientTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchClientTerm('');
                }
                if (e.key === 'Enter' && filteredClients.length === 1) {
                  handleSelectClientLocal(filteredClients[0]);
                }
              }}
            />
            {searchClientTerm && (
              <button
                onClick={() => setSearchClientTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            
            {/* Indicateur de résultats */}
            {searchClientTerm && filteredClients.length > 0 && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {t('resultsCount', { count: filteredClients.length }) || `${filteredClients.length} résultat(s)`}
              </div>
            )}
          </div>

          {/* Conseils de recherche */}
          {searchClientTerm && filteredClients.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">{t('searchTips') || 'Conseils de recherche:'}</span>
              </p>
              <ul className="text-xs text-yellow-600 mt-1 ml-5 list-disc">
                <li>{t('searchTipName') || 'Vérifiez le nom ou prénom'}</li>
                <li>{t('searchTipPhone') || 'Essayez le numéro de téléphone'}</li>
                <li>{t('searchTipType') || 'Vérifiez le type de client'}</li>
                <li>
                  {t('or') || 'Ou'} 
                  <button 
                    onClick={() => setNewClientMode(true)} 
                    className="text-blue-600 hover:underline font-medium ml-1"
                  >
                    {t('addNewClient') || 'ajoutez un nouveau client'}
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Liste des clients existants */}
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
            clientCreeEtSelectionne={clientCreeEtSelectionne}
            newClientMode={newClientMode}
            t={t}
          />
        </div>
      ) : (
        <NewClientForm
          nouveauClient={nouveauClient}
          setNouveauClient={setNouveauClient}
          getTypeDisplayName={getTypeDisplayName}
          setSelectedClient={handleSelectClientUnified}
          setNewClientMode={setNewClientMode}
          applyRemiseByClientType={applyRemiseByClientType}
          loadClients={loadClients}
          t={t}
        />
      )}
    </div>
  );
};

export default ClientSelectionSection;