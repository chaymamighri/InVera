// src/pages/dashboard/sales/products/components/OrderModal/ExistingClientsList.jsx
import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

const ExistingClientsList = ({
  filteredClients,
  allClients,  // ← NOUVELLE PROP : tous les clients
  loadingClients,
  searchClientTerm,
  selectedClient,
  remiseAppliquee,
  getTypeDisplayName,
  getTypeBadgeColor,
  handleSelectClientLocal,
  clientCreeEtSelectionne,
  newClientMode
}) => {
  const [showAllClients, setShowAllClients] = useState(false);
  
  // Vérifier si le client sélectionné vient d'être créé
  const clientEstNouveau = clientCreeEtSelectionne && 
                          selectedClient && 
                          selectedClient.id === clientCreeEtSelectionne.id;

  // Déterminer quelle liste afficher
  const clientsToDisplay = () => {
    if (loadingClients) return [];
    
    if (searchClientTerm.trim()) {
      // Recherche active : afficher les résultats filtrés
      return filteredClients;
    } else {
      // Pas de recherche : afficher tous les clients ou seulement les 10 premiers
      if (showAllClients) {
        return allClients;
      } else {
        return allClients.slice(0, 10); // Limiter à 10 par défaut
      }
    }
  };

  const displayedClients = clientsToDisplay();

  return (
    <div className="space-y-4">
      {/* Section spéciale pour le client créé */}
      {clientEstNouveau && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Client créé et sélectionné</span>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Nouveau
            </span>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-green-100">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-green-600 mr-2" />
              <span className="font-medium text-gray-800">{selectedClient.nom} {selectedClient.prenom}</span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Téléphone :</span>
                <span className="font-medium ml-1">{selectedClient.telephone}</span>
              </div>
              <div>
                <span className="text-gray-500">Type :</span>
                <span className="font-medium ml-1">{getTypeDisplayName(selectedClient.typeClient || selectedClient.type)}</span>
              </div>
              {selectedClient.email && (
                <div className="col-span-2">
                  <span className="text-gray-500">Email :</span>
                  <span className="font-medium ml-1">{selectedClient.email}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-green-100">
              <p className="text-xs text-green-600">
                ✅ Ce client est maintenant sélectionné pour passer la commande
              </p>
              <p className="text-xs text-gray-500 mt-1">
                La remise applicable a été automatiquement calculée
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informations sur la liste */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center">
          <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
          {searchClientTerm.trim() ? (
            <span>Résultats de recherche ({filteredClients.length}/{allClients.length})</span>
          ) : (
            <span>Tous les clients ({allClients.length})</span>
          )}
        </div>
        {!searchClientTerm.trim() && allClients.length > 10 && (
          <button
            onClick={() => setShowAllClients(!showAllClients)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAllClients ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-1" />
                Voir tous ({allClients.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Liste des clients existants */}
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        {loadingClients ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des clients...</p>
          </div>
        ) : displayedClients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4 text-gray-300">👤</div>
            <p className="text-gray-700 font-medium">
              {searchClientTerm.trim() ? 'Aucun client trouvé' : 'Aucun client disponible'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {searchClientTerm.trim() ? 'Essayez une autre recherche' : 'Ajoutez un nouveau client'}
            </p>
          </div>
        ) : (
          <>
            {displayedClients.map(client => (
              <div
                key={client.id}
                onClick={() => handleSelectClientLocal(client)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-blue-50 ${
                  selectedClient?.id === client.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {client.nom} {client.prenom ? client.prenom : ''}
                      {selectedClient?.id === client.id && clientEstNouveau && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      📞 {client.telephone}
                    </div>
                    {client.email && (
                      <div className="text-sm text-gray-600 mt-1">
                        ✉️ {client.email}
                      </div>
                    )}
                    {client.adresse && (
                      <div className="text-xs text-gray-500 mt-1">
                        📍 {client.adresse}
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(client.typeClient || client.type)}`}>
                    {getTypeDisplayName(client.typeClient || client.type)}
                  </span>
                </div>
                {selectedClient?.id === client.id && remiseAppliquee > 0 && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    Remise appliquée: {remiseAppliquee}%
                  </div>
                )}
                
                {/* Indicateur que le client est prêt pour la commande */}
                {selectedClient?.id === client.id && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <span className="font-medium">✓ Prêt pour la commande</span>
                    <p className="text-gray-600 mt-0.5">
                      Vous pouvez maintenant ajouter des produits à la commande
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Message si certains clients sont masqués */}
            {!searchClientTerm.trim() && !showAllClients && allClients.length > 10 && (
              <div className="p-4 text-center bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Affichage de 10 clients sur {allClients.length}
                </p>
                <button
                  onClick={() => setShowAllClients(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center w-full"
                >
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                  Voir tous les clients
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Message si un client est sélectionné */}
      {selectedClient && !clientEstNouveau && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">
              Client sélectionné : {selectedClient.nom} {selectedClient.prenom}
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            ✓ Prêt à passer la commande
          </p>
        </div>
      )}
    </div>
  );
};

export default ExistingClientsList;