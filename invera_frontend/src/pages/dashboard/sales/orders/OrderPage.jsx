// src/pages/dashboard/sales/orders/OrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import OrderFilters from './components/OrderFilters';
import OrderTable from './components/OrderTable';
import CreateOrderModal from './components/CreateOrderModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import { 
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

import useOrders from '../../../../hooks/useOrders';
import clientService from '../../../../services/clientService';

const OrdersPage = () => {
  // Utiliser le hook personnalisé
  const {
    commandes,
    clients,
    produits,
    loading,
    error,
    selectedProducts,
    setSelectedProducts,
    selectedClient,
    setSelectedClient,
    toNumber,
    chargerDonnees,
    handleCreerCommande,
    handleValiderCommande,
    handleRejeterCommande,
    handleSelectProduct,
    handleModifierQuantite,
    handleSupprimerProduit,
    resetSelection
  } = useOrders();

  // États locaux pour le composant
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedClientId, setSelectedClientId] = useState('Tous'); // Changé de selectedClientFilter
  const [selectedClientType, setSelectedClientType] = useState('Tous');
  const [clientTypes, setClientTypes] = useState([]);
  const [sortField, setSortField] = useState('dateCreation');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);

  // Charger les données initiales
  useEffect(() => {
    chargerDonnees();
    chargerTypesClient();
  }, []);

  // Fonction pour charger les types de client
  const chargerTypesClient = useCallback(async () => {
    try {
      const response = await clientService.getClientTypes();
      if (response.success && response.types) {
        setClientTypes(response.types);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de client:', error);
    }
  }, []);

  // Filtrer les commandes - CORRIGÉ
  useEffect(() => {
    const filtered = commandes
      .filter(commande => {
        // Filtre par recherche
        const matchesSearch = 
          commande.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          commande.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par statut
        const matchesStatus = selectedStatus === 'Tous' || commande.statut === selectedStatus;
        
        // Filtre par client spécifique
        const matchesClient = selectedClientId === 'Tous' || 
          commande.client?.id === parseInt(selectedClientId);
        
        // Filtre par type de client - CORRIGÉ
        const matchesClientType = selectedClientType === 'Tous' || 
          commande.client?.type === selectedClientType;
        
        return matchesSearch && matchesStatus && matchesClient && matchesClientType;
      })
      .sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (sortField === 'dateCreation') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortField === 'client') {
          aValue = a.client?.nom || '';
          bValue = b.client?.nom || '';
        }
        
        if (sortField === 'total' || sortField === 'sousTotal') {
          aValue = toNumber(aValue);
          bValue = toNumber(bValue);
        }
        
        return sortDirection === 'asc' 
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      });
    
    setFilteredCommandes(filtered);
  }, [commandes, searchTerm, selectedStatus, selectedClientId, selectedClientType, sortField, sortDirection, toNumber]);

  // Fonction de réinitialisation des filtres
  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedStatus('Tous');
    setSelectedClientId('Tous');
    setSelectedClientType('Tous');
  }, []);

  // Fonctions stabilisées avec useCallback
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handleValiderCommandeAPI = useCallback(async (commandeId) => {
    try {
      await handleValiderCommande(commandeId);
      alert('Commande validée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation de la commande');
    }
  }, [handleValiderCommande]);

  const handleRejeterCommandeAPI = useCallback(async (commandeId) => {
    try {
      await handleRejeterCommande(commandeId);
      alert('Commande rejetée.');
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('Erreur lors du rejet de la commande');
    }
  }, [handleRejeterCommande]);

  const handleVoirDetails = useCallback((commande) => {
    setSelectedCommande(commande);
    setShowDetailModal(true);
  }, []);

  const handleCreerCommandeAPI = useCallback(async (clientId, remarques) => {
    try {
      if (!clientId || selectedProducts.length === 0) {
        alert('Veuillez sélectionner un client et ajouter au moins un produit');
        return;
      }

      const produitsMap = {};
      selectedProducts.forEach(produit => {
        produitsMap[produit.id] = produit.quantite;
      });

      const commandeData = {
        clientId: parseInt(clientId),
        produits: produitsMap,
        notes: remarques || '',
        typeVente: 'SUR_COMMANDE'
      };

      await handleCreerCommande(commandeData);
      
      resetSelection();
      setShowCreateModal(false);
      alert('Commande créée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la commande: ' + error.message);
    }
  }, [selectedProducts, handleCreerCommande, resetSelection]);

  // Fonctions pour les icônes et couleurs
  const getStatusIcon = useCallback((statut) => {
    switch(statut) {
      case 'Confirmé': return <CheckCircleIcon className="h-5 w-5" />;
      case 'En attente': return <ClockIcon className="h-5 w-5" />;
      case 'Refusé': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  }, []);

  const getStatusColor = useCallback((statut) => {
    switch(statut) {
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetSelection();
  }, [resetSelection]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des Commandes Clients</h1>
            <p className="text-gray-600 mt-2">Consultez et gérez toutes les commandes clients</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvelle Commande
            </button>
          </div>
        </div>

        {/* Mettre à jour OrderFilters avec les bonnes props */}
        <OrderFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedClient={selectedClientId} // Changé ici
          setSelectedClient={setSelectedClientId} // Changé ici
          selectedClientType={selectedClientType}
          setSelectedClientType={setSelectedClientType}
          clients={clients}
          clientTypes={clientTypes}
          onReset={handleResetFilters}
        />
      </div>

      {/* Tableau */}
      <OrderTable
        commandes={filteredCommandes}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onValider={handleValiderCommandeAPI}
        onRejeter={handleRejeterCommandeAPI}
        onVoirDetails={handleVoirDetails}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        toNumber={toNumber}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          show={showCreateModal}
          onClose={handleCloseCreateModal}
          clients={clients}
          produits={produits}
          selectedProducts={selectedProducts}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          onSelectProduct={handleSelectProduct}
          onModifierQuantite={handleModifierQuantite}
          onSupprimerProduit={handleSupprimerProduit}
          onCreateCommande={handleCreerCommandeAPI}
          toNumber={toNumber}
        />
      )}

      {showDetailModal && selectedCommande && (
        <OrderDetailsModal
          show={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          commande={selectedCommande}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          toNumber={toNumber}
        />
      )}
    </div>
  );
};

export default OrdersPage;