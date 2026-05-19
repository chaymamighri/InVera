// src/pages/dashboard/sales/products/components/OrderModal/ExistingClientsList.jsx
import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon
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
  handleSelectClientLocal
}) => {
  const [showAllClients, setShowAllClients] = useState(false);

  const clientsToDisplay = () => {
    if (loadingClients) return [];
    const clients = Array.isArray(allClients) ? allClients : [];
    if (searchClientTerm && searchClientTerm.trim()) return filteredClients || [];
    if (showAllClients) return clients;
    return clients.slice(0, 10);
  };

  const displayedClients = clientsToDisplay();

  // ✅ Fonction pour obtenir un ID fiable
  const getClientId = (client) => {
    return client?.id ?? client?.idClient ?? null;
  };

  // ✅ Fonction pour comparer les clients
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
        <p className="text-gray-500 mt-2 text-sm">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* En-tête */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-gray-500">
          {searchClientTerm?.trim() 
            ? `${filteredClients?.length || 0} résultat(s)`
            : `${allClients?.length || 0} client(s)`
          }
        </span>
        {!searchClientTerm?.trim() && (allClients?.length || 0) > 10 && (
          <button
            onClick={() => setShowAllClients(!showAllClients)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            {showAllClients ? (
              <>Voir moins <ChevronUpIcon className="h-3 w-3" /></>
            ) : (
              <>Voir tout <ChevronDownIcon className="h-3 w-3" /></>
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
              {searchClientTerm?.trim() ? 'Aucun résultat' : 'Aucun client disponible'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {displayedClients.map((client, index) => {
              if (!client) return null;
              
              const clientId = getClientId(client);
              const isSelected = selectedClient !== null && isSameClient(selectedClient, client);
              
              if (!clientId) {
                console.warn(`⚠️ Client sans ID: ${client.nom}`);
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
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                              <CheckCircleIcon className="h-2.5 w-2.5" />
                              Sélectionné
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
                      
                      <div className="text-right ml-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(client.typeClient || client.type)}`}>
                          {getTypeDisplayName(client.typeClient || client.type)}
                        </span>
                        {isSelected && remiseAppliquee > 0 && (
                          <div className="mt-1 text-xs font-medium text-green-600">
                            -{remiseAppliquee}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExistingClientsList;