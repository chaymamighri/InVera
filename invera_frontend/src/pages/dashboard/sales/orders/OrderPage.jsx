// src/pages/dashboard/sales/orders/OrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import OrderFilters from './components/OrderFilters';
import OrderTable from './components/OrderTable';
import toast from 'react-hot-toast';
import CreateOrderModal from './components/CreateOrderModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import { 
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon, 
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

import useOrders from '../../../../hooks/useOrders';
import clientService from '../../../../services/clientService';
import { commandeService } from '../../../../services/commandeService';

const OrdersPage = () => {
  // Utiliser le hook personnalisé
  const {
    commandes,
    setCommandes, 
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
    handleValiderCommande,
    handleRejeterCommande,
    resetSelection
  } = useOrders();

  // États locaux pour le composant
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedClientId, setSelectedClientId] = useState('Tous');
  const [selectedClientType, setSelectedClientType] = useState('Tous');
  const [clientTypes, setClientTypes] = useState([]);
  const [sortField, setSortField] = useState('null');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    const init = async () => {
      console.log('🚀 Initialisation OrdersPage...');
      await chargerDonnees();
      await chargerTypesClient();
    };
    
    init();
  }, []);

  // ✅ Fonction pour ajouter la nouvelle commande en PREMIÈRE position
  const ajouterNouvelleCommande = (nouvelleCommande) => {
    setCommandes(prevCommandes => {
      // Ajoute la nouvelle commande en PREMIÈRE position
      return [nouvelleCommande, ...prevCommandes];
    });
  };

  // Fonction pour charger les types de client
  const chargerTypesClient = useCallback(async () => {
    try {
      const response = await clientService.getClientTypes();
      if (response.success && response.types) {
        setClientTypes(response.types);
      } else {
        setClientTypes(['VIP', 'ENTREPRISE', 'PROFESSIONNEL', 'FIDELE', 'PARTICULIER']);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de client:', error);
      setClientTypes(['VIP', 'ENTREPRISE', 'PROFESSIONNEL', 'FIDELE', 'PARTICULIER']);
    }
  }, []);

  // Filtrer les commandes
useEffect(() => {
  // 1. D'abord on filtre
  const filtered = commandes.filter(commande => {
    const matchesSearch = searchTerm === '' || 
      (commande.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       commande.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       commande.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'Tous' || 
      commande.statut === selectedStatus ||
      (selectedStatus === 'En attente' && commande.statut === 'EN_ATTENTE') ||
      (selectedStatus === 'Confirmé' && commande.statut === 'CONFIRMEE') ||
      (selectedStatus === 'Refusé' && commande.statut === 'ANNULEE');
    
    const matchesClient = selectedClientId === 'Tous' || 
      commande.client?.id === parseInt(selectedClientId);
    
    const matchesClientType = selectedClientType === 'Tous' || 
      (commande.client?.typeClient && 
       commande.client.typeClient.toUpperCase() === selectedClientType.toUpperCase());
    
    return matchesSearch && matchesStatus && matchesClient && matchesClientType;
  });

  // 2. Appliquer le tri si nécessaire
  if (sortField) {
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortField) {
        case 'clientNom':
          aValue = `${a.client?.nom || ''} ${a.client?.prenom || ''}`.trim().toLowerCase();
          bValue = `${b.client?.nom || ''} ${b.client?.prenom || ''}`.trim().toLowerCase();
          break;
          
        case 'dateCommande':
          aValue = a.dateCommande ? new Date(a.dateCommande).getTime() : 0;
          bValue = b.dateCommande ? new Date(b.dateCommande).getTime() : 0;
          break;
          
        case 'total':
          aValue = toNumber(a.total);
          bValue = toNumber(b.total);
          break;
          
        case 'sousTotal':
          aValue = toNumber(a.sousTotal);
          bValue = toNumber(b.sousTotal);
          break;
          
        case 'numero':
        case 'referenceCommandeClient':
          aValue = a.numero || '';
          bValue = b.numero || '';
          break;
          
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }
      
      // Gestion des valeurs null/undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Comparaison
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
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
  // Mapping des champs d'affichage vers les champs réels
  const fieldMap = {
    'client': 'clientNom',        
    'dateCreation': 'dateCommande' 
  };
  
  const actualField = fieldMap[field] || field;
  
  if (sortField === actualField) {
    // Si on clique sur le même champ
    if (sortDirection === 'desc') {
      // Passer de desc → asc
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      // Passer de asc → null (pas de tri)
      setSortField(null);
      setSortDirection('desc'); // reset
    }
  } else {
    // Nouveau champ de tri
    setSortField(actualField);
    setSortDirection('asc');
  }
}, [sortField, sortDirection]);

  // Fonctions pour gérer les produits sélectionnés
  const handleSelectProduct = useCallback((produit) => {
    setSelectedProducts(prev => [...prev, produit]);
  }, [setSelectedProducts]);

  const handleModifierQuantite = useCallback((produitId, nouvelleQuantite) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === produitId ? { ...p, quantite: Math.max(1, nouvelleQuantite) } : p
      )
    );
  }, [setSelectedProducts]);

  const handleSupprimerProduit = useCallback((produitId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== produitId));
  }, [setSelectedProducts]);

// Fonction pour créer la commande - CORRIGÉE
const handleCreerCommandeAPI = useCallback(async (clientId, notes) => {
  console.log('🔴 handleCreerCommandeAPI DÉBUT');

  if (!clientId || selectedProducts.length === 0) {
    alert('Veuillez sélectionner un client et ajouter au moins un produit');
    return;
  }

  setIsCreating(true);

  try {
    const parsedClientId = parseInt(clientId, 10);
    
    if (isNaN(parsedClientId) || parsedClientId <= 0) {
      throw new Error(`ID client invalide: "${clientId}"`);
    }

    const commandeData = {
      clientId: parsedClientId,  
      produits: selectedProducts.map(p => {
        console.log('📦 Préparation produit:', p.id, p.libelle);
        
        const produitId = parseInt(p.id, 10);
        if (isNaN(produitId) || produitId <= 0) {
          throw new Error(`ID produit invalide pour "${p.libelle}": ${p.id}`);
        }
        
        return {
          produitId: produitId,  
          quantite: parseInt(p.quantite, 10),  
          prixUnitaire: parseFloat(toNumber(p.prix) || toNumber(p.prixUnitaire) || 0), 
          remisePourcentage: 0 
        };
      }),
      remarques: notes || '',
      statut: 'EN_ATTENTE'
    };

    console.log('📤 Données envoyées:', JSON.stringify(commandeData, null, 2));
    
    const response = await commandeService.createCommande(commandeData);
    console.log('📥 Réponse brute:', response);
    
    if (response.success) {
      alert('✅ Commande créée avec succès !');
      
      // ✅ Extraire la commande de la réponse
      const commandeBrute = response.data || response;
      console.log('📦 Commande brute à transformer:', commandeBrute);
      
      // ✅ Vérifier toutes les sources possibles pour la référence
      console.log('🔍 Recherche de la référence:', {
        referenceCommandeClient: commandeBrute.referenceCommandeClient,
        reference: commandeBrute.reference,
        numero: commandeBrute.numero,
        id: commandeBrute.id,
        idCommandeClient: commandeBrute.idCommandeClient
      });
      
      // ✅ Essayer différentes sources pour la référence
      let referenceBackend = 
        commandeBrute.referenceCommandeClient || 
        commandeBrute.reference || 
        commandeBrute.numero;
      
      // ✅ Si pas de référence, générer une avec le format du backend
      if (!referenceBackend) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const random = Math.floor(Math.random() * 1000);
        referenceBackend = `CMD-${today}-${random}`;
        console.log('📋 Référence générée localement:', referenceBackend);
      }
      
      // ✅ Récupérer le client sélectionné
      const clientSelectionne = clients.find(c => c.id === parsedClientId);
      
      // Calculer les totaux
      const sousTotal = selectedProducts.reduce((sum, p) => 
        sum + (toNumber(p.prix) * p.quantite), 0
      );
      
      const remise = clientSelectionne ? 
        (clientSelectionne.typeClient === 'VIP' ? 0.15 :
         clientSelectionne.typeClient === 'FIDELE' ? 0.10 :
         clientSelectionne.typeClient === 'ENTREPRISE' ? 0.08 :
         clientSelectionne.typeClient === 'PROFESSIONNEL' ? 0.05 : 0) : 0;
      
      const total = sousTotal * (1 - remise);
      
      // Construire la commande transformée - ✅ CORRIGÉ pour la référence
      const commandeTransformee = {
        idCommandeClient: commandeBrute.idCommandeClient || commandeBrute.id || Date.now(),
        id: commandeBrute.idCommandeClient || commandeBrute.id || Date.now(),
        referenceCommandeClient: referenceBackend,  // ✅ Utiliser la référence trouvée
        numero: referenceBackend,                   // ✅ Utiliser la référence trouvée
        
        client: clientSelectionne ? {
          idClient: clientSelectionne.id,
          id: clientSelectionne.id,
          nom: clientSelectionne.nom || '',
          prenom: clientSelectionne.prenom || '',
          typeClient: clientSelectionne.typeClient || 'PARTICULIER',
          telephone: clientSelectionne.telephone || '',
          email: clientSelectionne.email || '',
          adresse: clientSelectionne.adresse || ''
        } : null,
        
        dateCommande: commandeBrute.dateCommande || new Date().toISOString(),
        
        // Produits à partir de la sélection
        produits: selectedProducts.map(p => ({
          id: p.id,
          ligneId: p.id,
          produitId: p.id,
          libelle: p.libelle,
          prixUnitaire: toNumber(p.prix),
          quantite: p.quantite,
          sousTotal: toNumber(p.prix) * p.quantite,
          imageUrl: p.imageUrl,
          uniteMesure: p.uniteMesure,
          categorie: p.categorie,
          categorieNom: p.categorieNom
        })),
        
        sousTotal: sousTotal,
        tauxRemise: remise * 100,
        total: total,
        
        statut: 'EN_ATTENTE',
        statutDisplay: 'En attente'
      };
      
      console.log('✅ Commande transformée avec numéro:', commandeTransformee.numero);
      
      // ✅ Ajouter la commande transformée
      ajouterNouvelleCommande(commandeTransformee);
      
      // ✅ Réinitialiser la sélection
      resetSelection();
      
      // ✅ Fermer le modal
      setShowCreateModal(false);
      
    } else {
      alert('❌ Erreur: ' + (response.message || 'Impossible de créer la commande'));
    }
  } catch (error) {
    console.error('❌ ERREUR DÉTAILLÉE:', error);
    
    let errorMessage = 'Erreur lors de la création de la commande';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    alert('❌ Erreur: ' + errorMessage);
  } finally {
    setIsCreating(false);
  }
}, [selectedProducts, toNumber, resetSelection, ajouterNouvelleCommande, clients]);

  // Fonction pour valider une commande
  const handleValiderCommandeAPI = useCallback(async (commandeId) => {
    try {
      console.log('Validation commande:', commandeId);
      
      await handleValiderCommande(commandeId);
      
       toast.success('Commande créée avec succès !');
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation de la commande: ' + error.message);
    }
  }, [handleValiderCommande, chargerDonnees]);

  // Fonction pour rejeter une commande
  const handleRejeterCommandeAPI = useCallback(async (commandeId) => {
    try {
      console.log(' Rejet commande:', commandeId);
      
      await handleRejeterCommande(commandeId);
      
      alert(' Commande rejetée avec succès !');
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('Erreur lors du rejet de la commande: ' + error.message);
    }
  }, [handleRejeterCommande, chargerDonnees]);

  const handleVoirDetails = useCallback((commande) => {
    setSelectedCommande(commande);
    setShowDetailModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetSelection();
  }, [resetSelection]);

  const [modalProduits, setModalProduits] = useState([]);
  const [modalClients, setModalClients] = useState([]);

  // Charger les données pour le modal de création
  useEffect(() => {
    if (showCreateModal) {
      setModalProduits(produits || []);
      setModalClients(clients || []);
    }
  }, [showCreateModal, produits, clients]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={chargerDonnees}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Chargement...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nouvelle Commande
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filtres */}
        <OrderFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedClient={selectedClientId}
          setSelectedClient={setSelectedClientId}
          selectedClientType={selectedClientType}
          setSelectedClientType={setSelectedClientType}
          clients={clients}
          clientTypes={clientTypes}
          onReset={handleResetFilters}
        />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total commandes</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{commandes.length}</p>
            </div>
            <ShoppingBagIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">En attente</p>
              <p className="text-2xl font-bold text-yellow-800 mt-1">
                {commandes.filter(c => c.statut === 'EN_ATTENTE' || c.statut === 'En attente').length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Confirmées</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                {commandes.filter(c => c.statut === 'CONFIRMEE' || c.statut === 'Confirmé').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Refusées</p>
              <p className="text-2xl font-bold text-red-800 mt-1">
                {commandes.filter(c => c.statut === 'ANNULEE' || c.statut === 'Refusé').length}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
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
        toNumber={toNumber}
      />

      {/* Modal de création */}
      {showCreateModal && (
        <CreateOrderModal
          show={showCreateModal}
          onClose={handleCloseCreateModal}
          clients={modalClients}
          produits={modalProduits}
          selectedProducts={selectedProducts}
          selectedClient={selectedClient}
          onValider={handleValiderCommandeAPI}  
          onRejeter={handleRejeterCommandeAPI}  
          onVoirDetails={handleVoirDetails} 
          onSelectClient={setSelectedClient}
          onSelectProduct={handleSelectProduct}
          onModifierQuantite={handleModifierQuantite}
          onSupprimerProduit={handleSupprimerProduit}
          onCreateCommande={handleCreerCommandeAPI}
          toNumber={toNumber}
          onOrderCreated={ajouterNouvelleCommande}
          isCreating={isCreating}
        />
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedCommande && (
        <OrderDetailsModal
          show={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          commande={selectedCommande}
          toNumber={toNumber}
        />
      )}
    </div>
  );
};

export default OrdersPage;