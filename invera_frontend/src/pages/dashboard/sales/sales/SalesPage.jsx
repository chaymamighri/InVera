// src/pages/dashboard/sales/SalesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCartIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import SalesFilters from './components/SalesFilter'; 
import SalesTable from './components/SalesTable'; 
import InvoiceModal from './components/InvoiceModal'; 
import { commandeService } from '../../../../services/commandeService'; 

const SalesPage = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Filtres - structure simplifiée
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { from: '' }, 
    sortBy: 'date_creation',
    sortOrder: 'desc'
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState({});
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  
  // Dans SalesPage.jsx - transformation des commandes
  const loadCommandesValidees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const commandesData = await commandeService.getCommandesValidees();
      
      // Transformation des données - CORRIGÉE
      const commandesTransformees = commandesData.map(cmd => ({
        // ✅ Garder tous les identifiants
        id: cmd.id || cmd.idCommandeClient || cmd.idCommande,
        idCommandeClient: cmd.idCommandeClient,
        idCommande: cmd.idCommande,
        
        // ✅ Référence commande - PRIORITAIRE
        referenceCommandeClient: cmd.referenceCommandeClient,
        numeroCommande: cmd.referenceCommandeClient || cmd.numeroCommande || cmd.reference || `CMD-${cmd.id || 'N/A'}`,
        numero: cmd.referenceCommandeClient || cmd.numero || cmd.numeroCommande,
        
        // ✅ Dates
        dateCreation: cmd.dateCreation || cmd.dateCommande || cmd.createdAt,
        dateCommande: cmd.dateCommande || cmd.dateCreation,
        dateValidation: cmd.dateValidation || cmd.dateConfirmation,
        dateLivraisonPrevue: cmd.dateLivraison || cmd.dateLivraisonPrevue,
        
        // ✅ Statut
        statut: cmd.statut || cmd.status,
        
        // ✅ Montants
        montantTotal: cmd.montantTotal || cmd.total || cmd.totalTTC || 0,
        total: cmd.total || cmd.montantTotal || 0,
        sousTotal: cmd.sousTotal || cmd.totalHT || 0,
        remiseTotal: cmd.remise || cmd.tauxRemise || 0,
        
        // ✅ Autres infos
        modeLivraison: cmd.modeLivraison || 'Standard',
        modePaiement: cmd.modePaiement || 'Non spécifié',
        notes: cmd.notes || cmd.remarques || '',
        
        // ✅ Produits
        produits: cmd.produits || cmd.items || cmd.ligneCommandes || [],
        
        // ✅ Client - enrichi
        client: cmd.client ? {
          ...cmd.client,
          id: cmd.client.id || cmd.client.idClient,
          nom: cmd.client.nom || '',
          prenom: cmd.client.prenom || '',
          nomComplet: cmd.client.nomComplet || 
                      `${cmd.client.prenom || ''} ${cmd.client.nom || ''}`.trim() ||
                      cmd.client.nom ||
                      'Client',
          entreprise: cmd.client.entreprise || cmd.client.societe || '',
          typeClient: cmd.client.typeClient || cmd.client.type || 'STANDARD',
          telephone: cmd.client.telephone || '',
          email: cmd.client.email || '',
          adresse: cmd.client.adresse || ''
        } : {
          id: cmd.clientId,
          nomComplet: cmd.clientNom || `${cmd.clientPrenom || ''} ${cmd.clientNom || ''}`.trim() || 'Client',
          entreprise: cmd.clientEntreprise || cmd.clientSociete || '',
          typeClient: cmd.clientType || 'STANDARD',
          telephone: cmd.clientTelephone || '',
          email: cmd.clientEmail || '',
          adresse: cmd.clientAdresse || ''
        }
      }));
      
      console.log('📦 Commandes transformées avec références:', 
        commandesTransformees.map(c => ({
          id: c.id,
          referenceCommandeClient: c.referenceCommandeClient,
          numero: c.numero,
          numeroCommande: c.numeroCommande
        }))
      );
      
      setCommandes(commandesTransformees);
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      setError('Impossible de charger les commandes validées.');
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadCommandesValidees();
  }, [loadCommandesValidees]);

  // ✅ Gestionnaire de filtre amélioré
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      // Cas spécial pour dateRange
      if (key === 'dateRange') {
        return {
          ...prev,
          dateRange: { from: value.from || '' }
        };
      }
      // Autres filtres
      return {
        ...prev,
        [key]: value
      };
    });
  };

  // ✅ Fonction pour extraire le nom du client (tri)
  const getClientSortValue = (client, sortOrder = 'asc') => {
    if (!client) return sortOrder === 'asc' ? '~~~~~~~~~~' : '';
    
    return (
      client.nomComplet ||
      [client.prenom, client.nom].filter(Boolean).join(' ') ||
      client.entreprise ||
      client.email ||
      `client-${client.id || 'inconnu'}`
    ).toLowerCase();
  };

  // ✅ FILTRAGE DES COMMANDES - CORRIGÉ ET OPTIMISÉ
  const filteredCommandes = useCallback(() => {
    let result = [...commandes];

    // 1️⃣ FILTRE PAR RECHERCHE
    if (filters.searchTerm?.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      result = result.filter(cmd => {
        const searchableFields = [
          cmd.numeroCommande,
          cmd.client?.nomComplet,
          cmd.client?.entreprise,
          cmd.client?.nom,
          cmd.client?.prenom,
          cmd.client?.email,
          ...(cmd.produits?.map(p => p.nom || p.designation || '') || [])
        ].filter(Boolean).map(field => field.toLowerCase());
        
        return searchableFields.some(field => field.includes(term));
      });
    }

    // 2️⃣ FILTRE PAR DATE - CORRIGÉ (STRICT)
    if (filters.dateRange?.from) {
      const fromDate = new Date(filters.dateRange.from);
      
      // Vérifier si la date est valide
      if (!isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        
        result = result.filter(cmd => {
          // Vérifier si la commande a une date valide
          const dateStr = cmd.dateCreation || cmd.createdAt;
          if (!dateStr) return false;
          
          const cmdDate = new Date(dateStr);
          if (isNaN(cmdDate.getTime())) return false;
          
          cmdDate.setHours(0, 0, 0, 0);
          return cmdDate.getTime() === fromDate.getTime();
        });
      }
    }

    // 3️⃣ TRI - CORRIGÉ AVEC TOUS LES CAS
    if (result.length > 0) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sortBy) {
          case 'date_creation':
            aValue = new Date(a.dateCreation || a.createdAt || 0).getTime();
            bValue = new Date(b.dateCreation || b.createdAt || 0).getTime();
            break;
            
          case 'montant':
            aValue = parseFloat(a.montantTotal || a.total || 0);
            bValue = parseFloat(b.montantTotal || b.total || 0);
            break;
            
          case 'client':
            // ✅ Tri client intelligent
            aValue = getClientSortValue(a.client, filters.sortOrder);
            bValue = getClientSortValue(b.client, filters.sortOrder);
            break;
            
          case 'numero_commande':
            // ✅ Tri alphabétique pur
            aValue = (a.numeroCommande || `CMD-${a.id || ''}`).toString().toLowerCase();
            bValue = (b.numeroCommande || `CMD-${b.id || ''}`).toString().toLowerCase();
            break;
            
          default:
            aValue = a[filters.sortBy] || '';
            bValue = b[filters.sortBy] || '';
        }

        // Application de l'ordre
        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return result;
  }, [commandes, filters]);

  // ✅ Création de commande
  const handleCreateSale = async (newSale) => {
    try {
      setLoading(true);
      const result = await commandeService.createCommande({
        ...newSale,
        statut: 'CONFIRMEE'
      });
      
      if (result.success || result.id) {
        await loadCommandesValidees();
        setIsCreateModalOpen(false);
        return { success: true, message: 'Commande créée avec succès' };
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur création commande: ' + err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };
const displayInvoiceInModal = useCallback((invoiceData, commandeId) => {
  // Récupérer la commande correspondante
  const commande = commandes.find(c => c.id === commandeId || c.idCommandeClient === commandeId);
  
  // Formater les données pour le modal
  const factureData = {
    id: invoiceData.idFactureClient || invoiceData.id,
    invoiceNumber: invoiceData.referenceFactureClient || `FAC-${invoiceData.id}`,
    date: invoiceData.dateFacture,
    dueDate: new Date(new Date(invoiceData.dateFacture).setDate(new Date(invoiceData.dateFacture).getDate() + 30)).toISOString(),
    
    // Informations client
    clientName: commande?.client?.nomComplet || 
                (commande?.client?.prenom ? `${commande.client.prenom} ${commande.client.nom}`.trim() : 'Client'),
    clientEmail: commande?.client?.email || invoiceData.client?.email || '',
    clientPhone: commande?.client?.telephone || invoiceData.client?.telephone || '',
    clientAddress: commande?.client?.adresse || invoiceData.client?.adresse || '',
    clientType: commande?.client?.typeClient || invoiceData.client?.typeClient || 'PARTICULIER',
    
    // Commande associée
    commandeId: commandeId,
    
    // Articles
    items: commande?.produits?.map(p => ({
      productId: p.produitId,
      productName: p.libelle || 'Produit',
      quantity: p.quantite,
      price: p.prixUnitaire,
      discount: 0,
      tax: 19,
      total: p.sousTotal
    })) || [],
    
    // Totaux
    subtotal: commande?.sousTotal || invoiceData.montantTotal || 0,
    discountTotal: (commande?.sousTotal || 0) - (commande?.total || 0),
    tax: ((commande?.total || 0) - ((commande?.sousTotal || 0) - ((commande?.sousTotal || 0) - (commande?.total || 0)))) * 0.19,
    total: invoiceData.montantTotal || commande?.total || 0,
    
    paymentMethod: commande?.modePaiement || 'Non spécifié',
    notes: commande?.notes || '',
    status: invoiceData.statut === 'NON_PAYE' ? 'en_attente' : 'payée'
  };
  
  setSelectedFacture(factureData);
  setIsInvoiceModalOpen(true);
}, [commandes]);

// ✅ Génération de facture - Version avec affichage des factures existantes
const handleGenerateInvoice = useCallback(async (commandeId) => {
  setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
  
  try {
    console.log('📄 Génération facture pour commande:', commandeId);
    
    // Essayer de générer une nouvelle facture
    const response = await commandeService.generateInvoice(commandeId);
    console.log('✅ Nouvelle facture générée:', response);
    
    if (response.success && response.data) {
      displayInvoiceInModal(response.data, commandeId);
      
      // Optionnel: Télécharger automatiquement le PDF
      await commandeService.downloadInvoicePDF(response.data.idFactureClient);
    }
    
  } catch (err) {
    console.error('❌ Erreur:', err);
    
    // Si l'erreur est "facture existe déjà", on récupère la facture existante
    if (err.response?.data?.message?.includes('existe déjà')) {
      console.log('📋 Facture existe déjà, récupération...');
      
      // Récupérer la facture existante
      const existingInvoice = await commandeService.getInvoiceByCommandeId(commandeId);
      
      if (existingInvoice) {
        console.log('✅ Facture existante récupérée:', existingInvoice);
        
        // Afficher la facture existante
        if (existingInvoice.data) {
          displayInvoiceInModal(existingInvoice.data, commandeId);
        } else {
          displayInvoiceInModal(existingInvoice, commandeId);
        }
        
        // Optionnel: Télécharger le PDF de la facture existante
        const factureId = existingInvoice.data?.idFactureClient || existingInvoice.id;
        if (factureId) {
          await commandeService.downloadInvoicePDF(factureId);
        }
        
      } else {
        alert('Une facture existe déjà mais impossible de la récupérer.');
      }
    } else {
      setError('Erreur lors de la génération de la facture: ' + err.message);
    }
  } finally {
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: false }));
  }
}, [commandes, displayInvoiceInModal]);

  // Fonction pour télécharger le PDF
  const handleDownloadPDF = async (factureId) => {
    try {
      const pdfResponse = await commandeService.downloadInvoicePDF(factureId);
      
      // Créer un blob et télécharger
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${factureId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error);
    }
  };

  const filteredResult = filteredCommandes();
  const hasActiveFilters = filters.searchTerm?.trim() !== '' || filters.dateRange?.from !== '';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-sm shadow-green-200">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Commandes Validées
                </h1>
              </div>
              <p className="text-gray-600 flex items-center gap-2">
                <span>{filteredResult.length} commande{filteredResult.length !== 1 ? 's' : ''} affichée{filteredResult.length !== 1 ? 's' : ''}</span>
                {hasActiveFilters && filteredResult.length === 0 && (
                  <span className="text-amber-600 text-sm">(aucun résultat)</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Affichage erreur */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-fadeIn">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 text-sm font-medium">Erreur</p>
                <p className="text-red-500 text-xs">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Masquer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
         
      {/* Filtres - avec totalFiltered */}
      <SalesFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
        totalFiltered={filteredResult.length} 
      />

      {/* Table des commandes */}
      <SalesTable 
        commandes={filteredResult}
        loading={loading}
        invoiceLoading={invoiceLoading}
        onGenerateInvoice={handleGenerateInvoice}
        filters={filters} 
      />

      {/* Modal de facture */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
        }}
        facture={selectedFacture}
      />

      {/* Styles pour animations */}
      <style >{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SalesPage;