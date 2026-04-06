/**
 * SalesPage - Page principale de gestion des commandes validées
 * 
 * Rôle : Gérer l'affichage, le filtrage et la facturation des commandes validées.
 * Route : /dashboard/sales/sales
 * 
 * Fonctionnalités :
 * - Chargement des commandes validées depuis l'API
 * - Filtrage (recherche texte, date)
 * - Tri (date, numéro, client, montant)
 * - Génération de factures
 * - Consultation de factures existantes
 * - Téléchargement de PDF
 * - Suivi du statut des factures
 * 
 * Sous-composants :
 * - SalesFilters : Barre de filtres
 * - SalesTable : Tableau des commandes
 * - InvoiceModal : Modal d'affichage facture
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCartIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import SalesFilters from './components/SalesFilter'; 
import SalesTable from './components/SalesTable'; 
import InvoiceModal from '../invoicing/components/invoiceModal'; 
import { commandeService } from '../../../../services/commandeService'; 

const SalesPage = () => {
  // ===== ÉTATS =====
  const [commandes, setCommandes] = useState([]);           // Liste des commandes
  const [loading, setLoading] = useState(true);             // État de chargement
  const [error, setError] = useState(null);                 // Message d'erreur
  const [invoiceStatus, setInvoiceStatus] = useState({});   // Statut des factures { commandeId: boolean }
  
  // Filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { from: '' }, 
    sortBy: 'date_creation',
    sortOrder: 'desc'
  });

  // États modaux
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState({});
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  
  // ============================================
  //  VÉRIFICATION DES FACTURES EXISTANTES
  // ============================================
  
  /**
   * Vérifie pour chaque commande si une facture existe déjà
   * @param {Array} commandesList - Liste des commandes
   */
  const checkInvoicesStatus = useCallback(async (commandesList) => {
    const status = {};
    
    await Promise.all(
      commandesList.map(async (cmd) => {
        const commandeId = cmd.id || cmd.idCommandeClient || cmd.idCommande;
        if (!commandeId) return;
        
        try {
          const result = await commandeService.checkInvoiceExistsForCommande(commandeId);
          status[commandeId] = result.exists;
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
  
  /**
   * Charge les commandes validées depuis l'API
   * Transforme les données pour les adapter au composant
   */
  const loadCommandesValidees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const commandesData = await commandeService.getCommandesValidees();
      
      // Transformation des données (normalisation des champs)
      const commandesTransformees = commandesData.map(cmd => ({
        // Identifiants
        id: cmd.id || cmd.idCommandeClient || cmd.idCommande,
        idCommandeClient: cmd.idCommandeClient,
        idCommande: cmd.idCommande,
        
        // Référence commande
        referenceCommandeClient: cmd.referenceCommandeClient,
        numeroCommande: cmd.referenceCommandeClient || cmd.numeroCommande || cmd.reference || `CMD-${cmd.id || 'N/A'}`,
        numero: cmd.referenceCommandeClient || cmd.numero || cmd.numeroCommande,
        
        // Dates
        dateCreation: cmd.dateCreation || cmd.dateCommande || cmd.createdAt,
        dateCommande: cmd.dateCommande || cmd.dateCreation,
        dateValidation: cmd.dateValidation || cmd.dateConfirmation,
        dateLivraisonPrevue: cmd.dateLivraison || cmd.dateLivraisonPrevue,
        
        // Statut
        statut: cmd.statut || cmd.status,
        
        // Montants
        montantTotal: cmd.montantTotal || cmd.total || cmd.totalTTC || 0,
        total: cmd.total || cmd.montantTotal || 0,
        sousTotal: cmd.sousTotal || cmd.totalHT || 0,
        remiseTotal: cmd.remise || cmd.tauxRemise || 0,
        
        // Informations complémentaires
        modeLivraison: cmd.modeLivraison || 'Standard',
        modePaiement: cmd.modePaiement || 'Non spécifié',
        notes: cmd.notes || cmd.remarques || '',
        
        // Produits
        produits: cmd.produits || cmd.items || cmd.ligneCommandes || [],
        
        // Client (avec fallbacks)
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
      
      console.log('📦 Commandes transformées:', commandesTransformees.length);
      setCommandes(commandesTransformees);
      
      // Vérification des factures existantes
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
  //  GESTION DES FILTRES
  // ============================================
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      if (key === 'dateRange') {
        return { ...prev, dateRange: { from: value.from || '' } };
      }
      return { ...prev, [key]: value };
    });
  };

  // ============================================
  //  FONCTIONS DE TRI
  // ============================================
  
  /**
   * Extrait la valeur de tri pour un client
   * @param {Object} client - Données client
   * @param {string} sortOrder - Ordre de tri (asc/desc)
   */
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

  // ============================================
  //  FILTRAGE ET TRI DES COMMANDES
  // ============================================
  
  const filteredCommandes = useCallback(() => {
    let result = [...commandes];

    // 1. Filtre par recherche (n° commande, client, produits)
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

    // 2. Filtre par date (jour exact)
    if (filters.dateRange?.from) {
      const fromDate = new Date(filters.dateRange.from);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        
        result = result.filter(cmd => {
          const dateStr = cmd.dateCreation || cmd.createdAt;
          if (!dateStr) return false;
          
          const cmdDate = new Date(dateStr);
          if (isNaN(cmdDate.getTime())) return false;
          
          cmdDate.setHours(0, 0, 0, 0);
          return cmdDate.getTime() === fromDate.getTime();
        });
      }
    }

    // 3. Tri
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
            aValue = getClientSortValue(a.client, filters.sortOrder);
            bValue = getClientSortValue(b.client, filters.sortOrder);
            break;
          case 'numero_commande':
            aValue = (a.numeroCommande || `CMD-${a.id || ''}`).toString().toLowerCase();
            bValue = (b.numeroCommande || `CMD-${b.id || ''}`).toString().toLowerCase();
            break;
          default:
            aValue = a[filters.sortBy] || '';
            bValue = b[filters.sortBy] || '';
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return result;
  }, [commandes, filters]);

  // ============================================
  //  GESTION DES FACTURES
  // ============================================
  
  /**
   * Affiche la facture dans le modal
   * @param {Object} invoiceData - Données de la facture
   * @param {string|number} commandeId - ID de la commande associée
   */
  const displayInvoiceInModal = useCallback((invoiceData, commandeId) => {
    const commande = commandes.find(c => c.id === commandeId || c.idCommandeClient === commandeId);
    
    console.log('📄 Données facture reçues:', invoiceData);
    
    // Calcul de la date d'échéance (date facture + 30 jours)
    let dueDate = null;
    if (invoiceData.dateFacture) {
      try {
        const dateFacture = new Date(invoiceData.dateFacture);
        if (!isNaN(dateFacture.getTime())) {
          const dueDateObj = new Date(dateFacture);
          dueDateObj.setDate(dueDateObj.getDate() + 30);
          dueDate = dueDateObj.toISOString();
        }
      } catch (error) {
        console.error('Erreur calcul date échéance:', error);
      }
    }
    
    // Construction de l'objet facture pour le modal
    const factureData = {
      id: invoiceData.idFactureClient || invoiceData.id || invoiceData.factureId || `FAC-${commandeId}`,
      referenceFactureClient: invoiceData.referenceFactureClient || invoiceData.reference || `FAC-${commandeId}`,
      reference: invoiceData.referenceFactureClient || invoiceData.reference || `FAC-${commandeId}`,
      invoiceNumber: invoiceData.referenceFactureClient || invoiceData.reference || `FAC-${commandeId}`,
      dateFacture: invoiceData.dateFacture,
      date: invoiceData.dateFacture,
      dueDate: dueDate,
      
      client: {
        nomComplet: commande?.client?.nomComplet || 
                    (commande?.client?.prenom ? `${commande.client.prenom} ${commande.client.nom}`.trim() : 'Client'),
        email: commande?.client?.email || invoiceData.client?.email || '',
        telephone: commande?.client?.telephone || invoiceData.client?.telephone || '',
        adresse: commande?.client?.adresse || invoiceData.client?.adresse || '',
        typeClient: commande?.client?.typeClient || invoiceData.client?.typeClient || 'PARTICULIER'
      },
      
      commande: commande ? {
        id: commande.id,
        reference: commande.referenceCommandeClient || commande.numeroCommande,
        lignesCommande: commande.produits?.map(p => ({
          produit: { libelle: p.libelle || 'Produit' },
          quantite: p.quantite,
          prix_unitaire: p.prixUnitaire,
          total: p.sousTotal || (p.quantite * p.prixUnitaire)
        })) || []
      } : null,
      
      montantTotal: invoiceData.montantTotal || commande?.montantTotal || 0,
      total: invoiceData.montantTotal || commande?.total || 0,
      
      items: commande?.produits?.map(p => ({
        description: p.libelle || 'Produit',
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
    setIsInvoiceModalOpen(true);
    
    // Mise à jour du statut de la facture
    setInvoiceStatus(prev => ({ ...prev, [commandeId]: true }));
  }, [commandes]);

  /**
   * Génère une nouvelle facture pour une commande
   * @param {string|number} commandeId - ID de la commande
   */
  const handleGenerateInvoice = async (commandeId) => {
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
    
    try {
      console.log('📄 Génération facture pour commande:', commandeId);
      const result = await commandeService.generateOrGetInvoice(commandeId);
      console.log('✅ Résultat API:', result);
      
      if (result && result.facture) {
        const commande = commandes.find(c => c.id === commandeId || c.idCommandeClient === commandeId);
        const factureComplete = { ...result.facture, items: commande?.produits || [] };
        displayInvoiceInModal(factureComplete, commandeId);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur génération facture:', error);
      alert('Erreur lors de la génération de la facture');
      throw error;
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [commandeId]: false }));
    }
  };

  /**
   * Consulte une facture existante
   * @param {string|number} commandeId - ID de la commande
   */
  const handleViewInvoice = useCallback(async (commandeId) => {
    try {
      console.log('📄 Consultation facture pour commande:', commandeId);
      const result = await commandeService.generateOrGetInvoice(commandeId);
      console.log('✅ Facture existante récupérée:', result);
      
      if (result && result.facture) {
        const commande = commandes.find(c => c.id === commandeId || c.idCommandeClient === commandeId);
        const factureComplete = { ...result.facture, items: commande?.produits || [] };
        displayInvoiceInModal(factureComplete, commandeId);
      }
    } catch (error) {
      console.error('❌ Erreur consultation facture:', error);
      alert('Erreur lors de la consultation de la facture');
    }
  }, [commandes, displayInvoiceInModal]);

  /**
   * Télécharge la facture au format PDF
   * @param {string|number} factureId - ID de la facture
   */
  const handleDownloadPDF = async (factureId) => {
    try {
      const pdfResponse = await commandeService.downloadInvoicePDF(factureId);
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

  // ============================================
  //  RENDU PRINCIPAL
  // ============================================

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
          
          {/* Message d'erreur */}
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
      
      {/* Barre de filtres */}
      <SalesFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
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
        filters={filters} 
      />

      {/* Modal d'affichage de la facture */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
        }}
        facture={selectedFacture}
        onStatusChange={async (factureId, newStatus) => {
          console.log('Statut changé pour facture:', factureId, newStatus);
          const commandeId = selectedFacture?.commandeId;
          
          if (commandeId) {
            // Mise à jour de la facture sélectionnée
            setSelectedFacture(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                statut: newStatus === 'payée' ? 'PAYE' : 'NON_PAYE',
                status: newStatus
              };
            });
            
            // Mise à jour du statut de la facture
            setInvoiceStatus(prev => ({ ...prev, [commandeId]: true }));
            
            // Mise à jour de la commande dans la liste
            setCommandes(prev => 
              prev.map(cmd => 
                cmd.id === commandeId 
                  ? { ...cmd, facturePayee: newStatus === 'payée' }
                  : cmd
              )
            );
          } else {
            console.error('❌ Impossible de trouver commandeId pour facture', factureId);
          }
        }}
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