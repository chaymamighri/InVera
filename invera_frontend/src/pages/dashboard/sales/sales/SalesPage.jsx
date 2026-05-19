/**
 * SalesPage - Page principale de gestion des commandes validées
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCartIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import SalesFilters from './components/SalesFilter'; 
import SalesTable from './components/SalesTable'; 
import InvoiceModal from '../invoicing/components/InvoiceModal'; 
import { commandeService } from '../../../../services/commandeService'; 

const SalesPage = () => {
  // ===== ÉTATS =====
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState({});
  const [invoiceLoading, setInvoiceLoading] = useState({});
  
  // États pour le modal facture
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [selectedCommandeId, setSelectedCommandeId] = useState(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { from: '' }, 
    sortBy: 'date_creation',
    sortOrder: 'desc'
  });

  // ============================================
  //  VÉRIFICATION DES FACTURES EXISTANTES
  // ============================================
  
  const checkInvoicesStatus = useCallback(async (commandesList) => {
    const status = {};
    
    await Promise.all(
      commandesList.map(async (cmd) => {
        const commandeId = cmd.id || cmd.idCommandeClient;
        if (!commandeId) return;
        
        try {
          const hasInvoice = await commandeService.checkInvoiceExistsForCommande(commandeId);
          status[commandeId] = hasInvoice;
          console.log(`📊 Commande ${commandeId} - Facture existe: ${hasInvoice}`);
        } catch (error) {
          console.error(`Erreur vérification facture pour commande ${commandeId}:`, error);
          status[commandeId] = false;
        }
      })
    );
    
    setInvoiceStatus(status);
  }, []);

  // ============================================
  //  CHARGEMENT DES COMMANDES
  // ============================================
  
  const loadCommandesValidees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const commandesData = await commandeService.getCommandesValidees();
      
      const commandesTransformees = commandesData.map(cmd => ({
        id: cmd.id || cmd.idCommandeClient,
        referenceCommandeClient: cmd.referenceCommandeClient,
        numeroCommande: cmd.referenceCommandeClient || `CMD-${cmd.id}`,
        dateCreation: cmd.dateCreation || cmd.dateCommande,
        montantTotal: cmd.montantTotal || cmd.total || 0,
        produits: cmd.produits || cmd.items || [],
        client: cmd.client ? {
          id: cmd.client.id || cmd.client.idClient,
          nomComplet: `${cmd.client.prenom || ''} ${cmd.client.nom || ''}`.trim() || 'Client',
          entreprise: cmd.client.entreprise || '',
          typeClient: cmd.client.typeClient || 'STANDARD',
          telephone: cmd.client.telephone || '',
          email: cmd.client.email || '',
          adresse: cmd.client.adresse || ''
        } : null
      }));
      
      console.log('📦 Commandes transformées:', commandesTransformees.length);
      setCommandes(commandesTransformees);
      
      await checkInvoicesStatus(commandesTransformees);
      
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      setError('Impossible de charger les commandes validées.');
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  }, [checkInvoicesStatus]);

  // Chargement initial
  useEffect(() => {
    loadCommandesValidees();
  }, [loadCommandesValidees]);

  // ============================================
  //  GESTION DES FACTURES
  // ============================================
  
  // Affiche la facture dans le modal
  const displayInvoiceInModal = useCallback((invoiceData, commandeId) => {
    const commande = commandes.find(c => c.id === commandeId || c.idCommandeClient === commandeId);
    
    console.log('📄 Données facture reçues:', invoiceData);
    
    // Construction de l'objet facture pour le modal
    const factureData = {
      id: invoiceData.idFactureClient,
      idFactureClient: invoiceData.idFactureClient,
      referenceFactureClient: invoiceData.referenceFactureClient,
      reference: invoiceData.referenceFactureClient,
      invoiceNumber: invoiceData.referenceFactureClient,
      dateFacture: invoiceData.dateFacture,
      date: invoiceData.dateFacture,
      
      client: {
        nomComplet: commande?.client?.nomComplet || 'Client',
        email: commande?.client?.email || '',
        telephone: commande?.client?.telephone || '',
        adresse: commande?.client?.adresse || '',
        typeClient: commande?.client?.typeClient || 'PARTICULIER'
      },
      
      commande: commande ? {
        id: commande.id,
        reference: commande.referenceCommandeClient || commande.numeroCommande,
        lignesCommande: commande.produits?.map(p => ({
          produit: { libelle: p.libelle || p.nom || 'Produit' },
          quantite: p.quantite,
          prix_unitaire: p.prixUnitaire,
          total: p.sousTotal || (p.quantite * p.prixUnitaire)
        })) || []
      } : null,
      
      montantTotal: invoiceData.montantTotal || commande?.montantTotal || 0,
      total: invoiceData.montantTotal || commande?.total || 0,
      
      items: commande?.produits?.map(p => ({
        description: p.libelle || p.nom || 'Produit',
        quantity: p.quantite,
        unitPrice: p.prixUnitaire,
        total: p.sousTotal || (p.quantite * p.prixUnitaire)
      })) || [],
      
      statut: invoiceData.statut || 'NON_PAYE',
      status: invoiceData.statut === 'NON_PAYE' ? 'en_attente' : 'payée',
      commandeId: commandeId,
      paymentMethod: commande?.modePaiement || 'Non spécifié',
      notes: commande?.notes || ''
    };
    
    console.log('✅ Facture préparée pour le modal:', factureData);
    
    setSelectedFacture(factureData);
    setSelectedCommandeId(commandeId);
    setIsInvoiceModalOpen(true);
    
    setInvoiceStatus(prev => ({ ...prev, [commandeId]: true }));
  }, [commandes]);

  // Génère ou récupère une facture et l'affiche dans le modal
  const handleGenerateInvoice = async (commandeId) => {
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
    
    try {
      console.log('📄 Génération/récupération facture pour commande:', commandeId);
      
      // 1. Vérifier si une facture existe déjà
      let invoice = await commandeService.getInvoiceByCommandeId(commandeId);
      
      if (!invoice) {
        // 2. Générer la facture
        const result = await commandeService.generateOrGetInvoice(commandeId);
        console.log('✅ Résultat génération:', result);
        
        if (result?.success) {
          // 3. Récupérer la facture fraîchement créée
          invoice = await commandeService.getInvoiceByCommandeId(commandeId);
        }
      }
      
      if (invoice) {
        // 4. Afficher la facture dans le modal
        displayInvoiceInModal(invoice, commandeId);
        
        // 5. Mettre à jour le statut local
        setInvoiceStatus(prev => ({ ...prev, [commandeId]: true }));
        
        // 6. Rafraîchir la liste
        await loadCommandesValidees();
        
        toast.success('Facture prête');
      } else {
        throw new Error('Facture non trouvée');
      }
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [commandeId]: false }));
    }
  };

  // Consulte une facture existante (l'affiche dans le modal)
  const handleViewInvoice = useCallback(async (commandeId) => {
    try {
      console.log('📄 Consultation facture pour commande:', commandeId);
      
      const invoice = await commandeService.getInvoiceByCommandeId(commandeId);
      
      if (invoice) {
        displayInvoiceInModal(invoice, commandeId);
      } else {
        toast.error('Facture non trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur consultation facture:', error);
      toast.error(error.message || 'Erreur lors de la consultation');
    }
  }, [displayInvoiceInModal]);

  // Mise à jour du statut de la facture
  const handleInvoiceStatusChange = async (factureId, newStatus) => {
    console.log('Statut facture mis à jour:', factureId, newStatus);
    // Rafraîchir la liste des commandes
    await loadCommandesValidees();
  };

  // ============================================
  //  FILTRAGE ET TRI
  // ============================================
  
  const getClientSortValue = (client, sortOrder = 'asc') => {
    if (!client) return sortOrder === 'asc' ? '~~~~~~~~~~' : '';
    return (client.nomComplet || client.entreprise || client.email || '').toLowerCase();
  };

  const filteredCommandes = useCallback(() => {
    let result = [...commandes];

    if (filters.searchTerm?.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      result = result.filter(cmd => 
        cmd.numeroCommande?.toLowerCase().includes(term) ||
        cmd.client?.nomComplet?.toLowerCase().includes(term) ||
        cmd.client?.entreprise?.toLowerCase().includes(term)
      );
    }

    if (filters.dateRange?.from) {
      const fromDate = new Date(filters.dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(cmd => {
        const cmdDate = new Date(cmd.dateCreation);
        cmdDate.setHours(0, 0, 0, 0);
        return cmdDate.getTime() === fromDate.getTime();
      });
    }

    result.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'date_creation':
          aValue = new Date(a.dateCreation).getTime();
          bValue = new Date(b.dateCreation).getTime();
          break;
        case 'montant':
          aValue = a.montantTotal;
          bValue = b.montantTotal;
          break;
        case 'client':
          aValue = getClientSortValue(a.client);
          bValue = getClientSortValue(b.client);
          break;
        default:
          aValue = a.numeroCommande || '';
          bValue = b.numeroCommande || '';
      }
      return filters.sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return result;
  }, [commandes, filters]);

  const filteredResult = filteredCommandes();
  const hasActiveFilters = filters.searchTerm?.trim() !== '' || filters.dateRange?.from !== '';

  return (
    <div className="space-y-6 p-4 md:p-6">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-sm">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Commandes Validées
              </h1>
              <p className="text-gray-600">
                {filteredResult.length} commande{filteredResult.length !== 1 ? 's' : ''} affichée{filteredResult.length !== 1 ? 's' : ''}
                {hasActiveFilters && filteredResult.length === 0 && (
                  <span className="text-amber-600 text-sm ml-2">(aucun résultat)</span>
                )}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-600 text-sm font-medium">Erreur</p>
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Filtres */}
      <SalesFilters 
        filters={filters} 
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        totalFiltered={filteredResult.length} 
      />

      {/* Tableau des commandes */}
      <SalesTable 
        commandes={filteredResult}
        loading={loading}
        invoiceLoading={invoiceLoading}
        invoiceStatus={invoiceStatus}
        onGenerateInvoice={handleGenerateInvoice}
        onViewInvoice={handleViewInvoice}
      />

      {/* Modal de facture */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
          setSelectedCommandeId(null);
        }}
        facture={selectedFacture}
        commandeId={selectedCommandeId}
        onStatusChange={handleInvoiceStatusChange}
      />
    </div>
  );
};

export default SalesPage;