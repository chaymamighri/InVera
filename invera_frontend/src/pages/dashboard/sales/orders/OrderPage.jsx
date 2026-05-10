// src/pages/dashboard/sales/orders/OrdersPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useLanguage } from '../../../../context/LanguageContext';

const FALLBACK_TEXTS = {
  'salesPages.orderManagementTitle': 'Gestion des commandes',
  'salesPages.orderManagementDescription': 'Consultez et gérez toutes les commandes clients',
  'salesPages.newOrder': 'Nouvelle commande',
  'salesPages.searchOrders': 'Rechercher une commande...',
  'salesPages.allStatuses': 'Tous les statuts',
  'salesPages.totalOrders': 'Commandes totales',
  'salesPages.pendingOrders': 'En attente',
  'salesPages.confirmedOrders': 'Confirmées',
  'salesPages.rejectedOrders': 'Rejetées',
  'salesPages.orderNumber': 'N° commande',
  'salesPages.client': 'Client',
  'salesPages.creationDate': 'Date de création',
  'salesPages.products': 'Produits',
  'salesPages.finalAmount': 'Montant total',
  'salesPages.status': 'Statut',
  'salesPages.actions': 'Actions',
  'salesPages.noOrdersFound': 'Aucune commande trouvée',
  'salesPages.noOrdersMatch': 'Aucune commande ne correspond à vos critères de recherche.',
  'salesPages.pending': 'En attente',
  'salesPages.confirmed': 'Confirmée',
  'salesPages.rejected': 'Refusée',
  'salesPages.view': 'Voir',
  'salesPages.edit': 'Modifier',
  'salesPages.delete': 'Supprimer',
  'salesPages.of': 'de',
  'salesPages.orders': 'commandes',
  'salesPages.show': 'Afficher',
  'salesPages.perPage': 'par page',
  'salesPages.loading': 'Chargement...',
  'salesPages.validate': 'Valider',
  'salesPages.reject': 'Rejeter',
  'salesPages.viewOrder': 'Voir commande',
  'salesPages.createOrder': 'Créer commande',
  'salesPages.orderDetails': 'Détails commande',
  'salesPages.orderSummary': 'Récapitulatif commande',
  'salesPages.quantity': 'Quantité',
  'salesPages.unitPrice': 'Prix unitaire',
  'salesPages.totalPrice': 'Prix total',
  'salesPages.discount': 'Remise',
  'salesPages.finalTotal': 'Total final',
  'salesPages.confirmOrder': 'Confirmer commande',
  'salesPages.cancel': 'Annuler',
  'salesPages.amount': 'Montant',
  'salesPages.orderDate': 'Date commande',
  'salesPages.orderId': 'N° Commande'
};

const OrdersPage = () => {
  const { t } = useLanguage();
  
  const safeT = (key) => {
    const translated = t(key);
    if (!translated || translated === key) {
      return FALLBACK_TEXTS[key] || key;
    }
    return translated;
  };
  
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedClientId, setSelectedClientId] = useState('Tous');
  const [selectedClientType, setSelectedClientType] = useState('Tous');
  const [clientTypes, setClientTypes] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Charger les données initiales UNE SEULE FOIS
  useEffect(() => {
    const init = async () => {
      if (!initialized) {
        console.log('🚀 Initialisation OrdersPage...');
        await chargerDonnees();
        await chargerTypesClient();
        setInitialized(true);
      }
    };
    
    init();
  }, [chargerDonnees, initialized]);

  const chargerTypesClient = useCallback(async () => {
    try {
      const response = await clientService.getClientTypes();
      if (response.success && response.types) {
        setClientTypes(response.types);
      } else {
        setClientTypes(['VIP', 'ENTREPRISE', 'FIDELE', 'PARTICULIER']);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de client:', error);
      setClientTypes(['VIP', 'ENTREPRISE', 'FIDELE', 'PARTICULIER']);
    }
  }, []);

  // ✅ CORRECTION: Utiliser useMemo pour le filtrage (pas de setState)
  const filteredCommandes = useMemo(() => {
    const filtered = commandes.filter(commande => {
      const matchesSearch = searchTerm === '' || 
        (commande.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         commande.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         commande.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'Tous' || 
        commande.statut === selectedStatus ||
        (selectedStatus === safeT('salesPages.pending') && commande.statut === 'EN_ATTENTE') ||
        (selectedStatus === safeT('salesPages.confirmed') && commande.statut === 'CONFIRMEE') ||
        (selectedStatus === safeT('salesPages.rejected') && commande.statut === 'ANNULEE');
      
      const matchesClient = selectedClientId === 'Tous' || 
        commande.client?.id === parseInt(selectedClientId);
      
      const matchesClientType = selectedClientType === 'Tous' || 
        (commande.client?.typeClient && 
         commande.client.typeClient.toUpperCase() === selectedClientType.toUpperCase());
      
      return matchesSearch && matchesStatus && matchesClient && matchesClientType;
    });

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
        
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    return filtered;
  }, [commandes, searchTerm, selectedStatus, selectedClientId, selectedClientType, sortField, sortDirection, toNumber, safeT]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedStatus('Tous');
    setSelectedClientId('Tous');
    setSelectedClientType('Tous');
  }, []);

  const handleSort = useCallback((field) => {
    const fieldMap = {
      'client': 'clientNom',        
      'dateCreation': 'dateCommande' 
    };
    
    const actualField = fieldMap[field] || field;
    
    setSortField(prevSortField => {
      if (prevSortField === actualField) {
        if (sortDirection === 'desc') {
          setSortDirection('asc');
        } else if (sortDirection === 'asc') {
          return null;
        }
        return prevSortField;
      } else {
        setSortDirection('asc');
        return actualField;
      }
    });
  }, [sortDirection]);

  const ajouterNouvelleCommande = useCallback((nouvelleCommande) => {
    setCommandes(prevCommandes => [nouvelleCommande, ...prevCommandes]);
  }, []);

  const handleOrderUpdated = useCallback(async (updatedCommande) => {
    console.log('📝 Mise à jour reçue:', updatedCommande);
    
    setCommandes(prev => prev.map(c => 
      c.id === updatedCommande?.id ? { ...c, ...updatedCommande } : c
    ));
    
    if (selectedCommande && updatedCommande?.id === selectedCommande.id) {
      setSelectedCommande(updatedCommande);
    }
    
    toast.success('Commande mise à jour');
  }, [selectedCommande]);

  const handleSelectProduct = useCallback((produit) => {
    setSelectedProducts(prev => [...prev, produit]);
  }, []);

  const handleModifierQuantite = useCallback((produitId, nouvelleQuantite) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === produitId ? { ...p, quantite: Math.max(1, nouvelleQuantite) } : p
      )
    );
  }, []);

  const handleSupprimerProduit = useCallback((produitId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== produitId));
  }, []);

  const handleCreerCommandeAPI = useCallback(async (clientId, notes) => {
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

      const response = await commandeService.createCommande(commandeData);
      
      if (response.success) {
        toast.success('✅ Commande créée avec succès !');
        await chargerDonnees();
        resetSelection();
        setShowCreateModal(false);
      } else {
        toast.error('❌ Erreur: ' + (response.message || 'Impossible de créer la commande'));
      }
    } catch (error) {
      let errorMessage = 'Erreur lors de la création de la commande';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error('❌ Erreur: ' + errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [selectedProducts, toNumber, resetSelection, chargerDonnees]);

  const handleValiderCommandeAPI = useCallback(async (commandeId) => {
    try {
      await handleValiderCommande(commandeId);
      toast.success(safeT('salesPages.orderValidated') || 'Commande validée avec succès !');
      await chargerDonnees();
    } catch (error) {
      toast.error('Erreur lors de la validation de la commande: ' + error.message);
    }
  }, [handleValiderCommande, chargerDonnees, safeT]);

  const handleRejeterCommandeAPI = useCallback(async (commandeId) => {
    try {
      await handleRejeterCommande(commandeId);
      toast.success(safeT('salesPages.orderRejected') || 'Commande rejetée avec succès !');
      await chargerDonnees();
    } catch (error) {
      toast.error('Erreur lors du rejet de la commande: ' + error.message);
    }
  }, [handleRejeterCommande, chargerDonnees, safeT]);

  const handleVoirDetails = useCallback((commande) => {
    setSelectedCommande(commande);
    setShowDetailModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetSelection();
  }, [resetSelection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{safeT('salesPages.loading')}</p>
        </div>
      </div>
    );
  }

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
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{safeT('salesPages.orderManagementTitle')}</h1>
            <p className="text-gray-600 mt-2">{safeT('salesPages.orderManagementDescription')}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {safeT('salesPages.newOrder')}
            </button>
          </div>
        </div>

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
          t={safeT}
        />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">{safeT('salesPages.totalOrders')}</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{commandes.length}</p>
            </div>
            <ShoppingBagIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">{safeT('salesPages.pendingOrders')}</p>
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
              <p className="text-sm text-green-600 font-medium">{safeT('salesPages.confirmedOrders')}</p>
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
              <p className="text-sm text-red-600 font-medium">{safeT('salesPages.rejectedOrders')}</p>
              <p className="text-2xl font-bold text-red-800 mt-1">
                {commandes.filter(c => c.statut === 'ANNULEE' || c.statut === 'Refusé').length}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Tableau - Utilisation directe de filteredCommandes */}
      <OrderTable
        commandes={filteredCommandes}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onValider={handleValiderCommandeAPI}
        onRejeter={handleRejeterCommandeAPI}
        onVoirDetails={handleVoirDetails}
        toNumber={toNumber}
        t={safeT}
      />

      {/* Modal de création */}
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
          onOrderCreated={ajouterNouvelleCommande}
          isCreating={isCreating}
          t={safeT}
        />
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedCommande && (
        <OrderDetailsModal
          show={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          commande={selectedCommande}
          toNumber={toNumber}
          onUpdateSuccess={handleOrderUpdated}
          onRefresh={async (commandeId) => {
            const refreshed = await commandeService.getCommandeById(commandeId);
            return refreshed;
          }}
          t={safeT}
        />
      )}
    </div>
  );
};

export default OrdersPage;