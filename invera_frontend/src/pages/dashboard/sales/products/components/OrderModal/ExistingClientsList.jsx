// src/pages/dashboard/sales/products/components/OrderModal/ExistingClientsList.jsx
import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ExistingClientsList = ({
  filteredClients,
  allClients,
  loadingClients,
  searchClientTerm,
  selectedClient,
  remiseAppliquee,
  getTypeDisplayName,
  getTypeBadgeColor,
  handleSelectClientLocal,
  clientCreeEtSelectionne,
  newClientMode,
  t = (key) => key
}) => {
  const [showAllClients, setShowAllClients] = useState(false);

  // Déterminer si le client sélectionné est un nouveau client créé
  const clientEstNouveau = clientCreeEtSelectionne && selectedClient?.id === clientCreeEtSelectionne.id;

  const clientsToDisplay = () => {
    if (loadingClients) return [];
    const clients = Array.isArray(allClients) ? allClients : [];
    if (searchClientTerm && searchClientTerm.trim()) return filteredClients || [];
    if (showAllClients) return clients;
    return clients.slice(0, 10);
  };

  const displayedClients = clientsToDisplay();

  // Fonction pour obtenir un ID fiable
  const getClientId = (client) => {
    return client?.id ?? client?.idClient ?? null;
  };

  // Fonction pour comparer les clients
  const isSameClient = (client1, client2) => {
    if (!client1 || !client2) return false;
    const id1 = getClientId(client1);
    const id2 = getClientId(client2);
    return id1 !== null && id1 === id2;
  };

  if (loadingClients) {
    return (
      <div className="border border-gray-200 rounded-xl bg-white p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2 text-sm">{t('loadingClients') || 'Chargement des clients...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section spéciale pour le client créé */}
      {clientEstNouveau && !newClientMode && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">{t('clientCreatedAndSelected') || 'Client créé et sélectionné'}</span>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {t('new') || 'Nouveau'}
            </span>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-green-100">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-green-600 mr-2" />
              <span className="font-medium text-gray-800">{selectedClient?.nom} {selectedClient?.prenom}</span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">{t('phone') || 'Téléphone'}:</span>
                <span className="font-medium ml-1">{selectedClient?.telephone}</span>
              </div>
              {/* SUPPRIMÉ l'affichage du type client */}
              {selectedClient?.email && (
                <div className="col-span-2">
                  <span className="text-gray-500">{t('email') || 'Email'}:</span>
                  <span className="font-medium ml-1">{selectedClient.email}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-green-100">
              <p className="text-xs text-green-600">
                {t('clientNowSelected') || 'Client maintenant sélectionné'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('discountAutoCalculated') || 'La remise sera automatiquement calculée'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1">
          <MagnifyingGlassIcon className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">
            {searchClientTerm?.trim() 
              ? `${t('resultsCount', { count: filteredClients?.length || 0 }) || `${filteredClients?.length || 0} résultat(s)`}`
              : `${t('clientsCount', { count: allClients?.length || 0 }) || `${allClients?.length || 0} client(s)`}`
            }
          </span>
        </div>
        {!searchClientTerm?.trim() && (allClients?.length || 0) > 10 && (
          <button
            onClick={() => setShowAllClients(!showAllClients)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            {showAllClients ? (
              <>
                {t('showLess') || 'Voir moins'}
                <ChevronUpIcon className="h-3 w-3" />
              </>
            ) : (
              <>
                {t('showAll') || 'Voir tout'}
                <ChevronDownIcon className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Liste des clients */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {!displayedClients || displayedClients.length === 0 ? (
          <div className="p-8 text-center">
            <UserCircleIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">
              {searchClientTerm?.trim() 
                ? (t('noResults') || 'Aucun résultat')
                : (t('noClientsAvailable') || 'Aucun client disponible')
              }
            </p>
            {searchClientTerm?.trim() && (
              <p className="text-xs text-gray-400 mt-1">
                {t('tryDifferentSearch') || 'Essayez un autre terme de recherche'}
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {displayedClients.map((client, index) => {
              if (!client) return null;
              
              const clientId = getClientId(client);
              const isSelected = selectedClient !== null && isSameClient(selectedClient, client);
              
              if (!clientId) {
                console.warn(`⚠️ Client sans ID: ${client.nom}`);
                return null;
              }
              
              return (
                <div
                  key={clientId || `client-${index}`}
                  onClick={() => {
                    if (!clientId) {
                      console.error(`❌ Impossible de sélectionner client sans ID: ${client.nom}`);
                      return;
                    }
                    handleSelectClientLocal(client);
                  }}
                  className={`
                    cursor-pointer transition-all duration-150
                    ${isSelected 
                      ? 'bg-blue-50 !border-l-4 !border-l-blue-500' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }
                  `}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftStyle: 'solid'
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>
                            {client.prenom ? `${client.prenom} ${client.nom}` : client.nom || 'Client'}
                          </span>
                          {isSelected && clientEstNouveau && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                              <CheckCircleIcon className="h-2.5 w-2.5" />
                              {t('new') || 'Nouveau'}
                            </span>
                          )}
                          {isSelected && !clientEstNouveau && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                              <CheckCircleIcon className="h-2.5 w-2.5" />
                              {t('selected') || 'Sélectionné'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                          {client.telephone && <span>📞 {client.telephone}</span>}
                          {client.email && <span>✉️ {client.email}</span>}
                        </div>
                        
                        {client.adresse && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            📍 {client.adresse}
                          </div>
                        )}
                      </div>
                      
                      {/* SUPPRIMÉ complètement l'affichage du badge de type */}
                      {isSelected && remiseAppliquee > 0 && (
                        <div className="text-right ml-3">
                          <div className="text-xs font-medium text-green-600">
                            -{remiseAppliquee}%
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicateur que le client est prêt pour la commande */}
                    {isSelected && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <span className="font-medium">{t('readyForOrder') || 'Prêt pour la commande'}</span>
                        <p className="text-gray-600 mt-0.5">
                          {t('canAddProductsNow') || 'Vous pouvez maintenant ajouter des produits'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Message si un client est sélectionné */}
      {selectedClient && !clientEstNouveau && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">
              {t('selectedClient') || 'Client sélectionné'}: {selectedClient.nom} {selectedClient.prenom}
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            {t('readyToPlaceOrder') || 'Prêt à passer commande'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExistingClientsList;