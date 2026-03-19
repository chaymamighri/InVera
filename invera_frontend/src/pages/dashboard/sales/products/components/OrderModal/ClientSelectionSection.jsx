// src/pages/dashboard/sales/products/components/OrderModal/ClientSelectionSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  UserIcon, 
  UserPlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ExistingClientsList from './ExistingClientsList';
import NewClientForm from './NewClientForm';

const ClientSelectionSection = ({
  clients,
  selectedClient,
  setSelectedClient,
  newClientMode,
  setNewClientMode,
  nouveauClient,
  setNouveauClient,
  remiseAppliquee,
  handleSelectClient,
  loadingClients,
  applyRemiseByClientType,
  loadClients 
}) => {
  const [searchClientTerm, setSearchClientTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients);
  const [clientCreeEtSelectionne, setClientCreeEtSelectionne] = useState(null);
  const searchInputRef = useRef(null);

  // Debug: Vérifier les clients reçus
  useEffect(() => {
    console.log('📊 Nombre total de clients reçus:', clients.length);
    console.log('📊 Liste des clients:', clients);
  }, [clients]);

  // Focus automatique sur le champ de recherche
  useEffect(() => {
    if (!newClientMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [newClientMode]);

  // Réinitialiser le client créé quand on change de mode
  useEffect(() => {
    if (!newClientMode) {
      setClientCreeEtSelectionne(null);
    }
  }, [newClientMode]);

  // Filtrer les clients par recherche
  useEffect(() => {
    console.log('🔍 Filtrage des clients. Terme:', searchClientTerm);
    
    if (!searchClientTerm.trim()) {
      // Afficher TOUS les clients quand pas de recherche
      console.log('📋 Affichage de TOUS les clients:', clients.length);
      setFilteredClients(clients);
    } else {
      const searchTerms = searchClientTerm.toLowerCase().split(' ').filter(term => term.trim() !== '');
      
      const filtered = clients.filter(client => {
        const clientFields = [
          client.nom?.toLowerCase() || '',
          client.prenom?.toLowerCase() || '',
          client.telephone?.replace(/\s/g, '') || '',
          client.email?.toLowerCase() || '',
          client.adresse?.toLowerCase() || '',
          getTypeDisplayName(client.typeClient || client.type).toLowerCase()
        ].join(' ');

        return searchTerms.every(term => clientFields.includes(term));
      });
      
      console.log('🔍 Clients filtrés:', filtered.length);
      setFilteredClients(filtered);
    }
  }, [searchClientTerm, clients]);

  // Convertir type ENUM en texte lisible
  const getTypeDisplayName = (type) => {
    const typeMap = {
      'PARTICULIER': 'Particulier',
      'VIP': 'VIP',
      'PROFESSIONNEL': 'Entreprise',
      'ENTREPRISE': 'Entreprise',
      'FIDELE': 'Fidèle',
      'GROSSISTE': 'Grossiste',
      'INTERNE': 'Interne'
    };
    return typeMap[type] || type;
  };

  // Obtenir la couleur du badge selon le type
  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'VIP': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'ENTREPRISE': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'PROFESSIONNEL': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'FIDELE': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'GROSSISTE': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'INTERNE': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  
  // Fonction UNIFIÉE pour sélectionner un client (utilisée pour les deux modes)
  const handleSelectClientUnified = (client) => {
    console.log('🔄 Sélection du client:', client.nom, client);
    
    // Stocker le client créé
    if (newClientMode) {
      setClientCreeEtSelectionne(client);
      console.log('📌 Client créé stocké pour affichage:', client.nom);
    }
    
    // Utiliser la fonction passée en prop si elle existe
    if (handleSelectClient && typeof handleSelectClient === 'function') {
      handleSelectClient(client);
    } else if (setSelectedClient && typeof setSelectedClient === 'function') {
      setSelectedClient(client);
    } else {
      console.error('⚠️ Aucune fonction setSelectedClient disponible');
    }
    
    // Appliquer la remise si le type de client est disponible
    if (applyRemiseByClientType && typeof applyRemiseByClientType === 'function' && client.typeClient) {
      applyRemiseByClientType(client.typeClient);
    }
    
    // Effacer la recherche après sélection
    if (!newClientMode) {
      setSearchClientTerm('');
    }
    
    console.log('✅ Client sélectionné avec succès');
  };

  // Fonction spécifique pour le mode client existant
  const handleSelectClientLocal = (client) => {
    console.log('📋 Sélection client existant:', client.nom);
    handleSelectClientUnified(client);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Sélection du Client</h3>
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
            Client existant
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
            Nouveau client
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
              placeholder="Rechercher par nom, prénom, téléphone, email, type, adresse..."
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
                {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Conseils de recherche */}
          {searchClientTerm && filteredClients.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                💡 <span className="font-medium">Astuces de recherche :</span>
              </p>
              <ul className="text-xs text-yellow-600 mt-1 ml-5 list-disc">
                <li>Essayez avec juste le prénom ou le nom</li>
                <li>Recherchez par numéro de téléphone (ex: 55 123 456)</li>
                <li>Essayez le type de client (Particulier, Professionnel, etc.)</li>
                <li>Ou <button 
                  onClick={() => setNewClientMode(true)} 
                  className="text-blue-600 hover:underline font-medium"
                >
                  ajoutez un nouveau client
                </button></li>
              </ul>
            </div>
          )}

          {/* Liste des clients existants */}
          <ExistingClientsList
            filteredClients={filteredClients}
            allClients={clients}  // ← PASSER TOUS LES CLIENTS
            loadingClients={loadingClients}
            searchClientTerm={searchClientTerm}
            selectedClient={selectedClient}
            remiseAppliquee={remiseAppliquee}
            getTypeDisplayName={getTypeDisplayName}
            getTypeBadgeColor={getTypeBadgeColor}
            handleSelectClientLocal={handleSelectClientLocal}
            clientCreeEtSelectionne={clientCreeEtSelectionne} // ← PASSER LE CLIENT CRÉÉ
            newClientMode={newClientMode} // ← PASSER LE MODE
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
        />
      )}
    </div>
  );
};

export default ClientSelectionSection;
