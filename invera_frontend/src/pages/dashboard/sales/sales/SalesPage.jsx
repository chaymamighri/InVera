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
import { useLanguage } from '../../../../context/LanguageContext';

const localeByLanguage = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
};

const SalesPage = () => {
  const { t, language, isArabic } = useLanguage();
  const locale = localeByLanguage[language] || localeByLanguage.fr;
  const tr = (key, params) => t(`salesPages.${key}`, params);
  
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
  
  /**
   * Vérifie pour chaque commande si une facture existe déjà
   * @param {Array} commandesList - Liste des commandes
   */

const checkInvoicesStatus = useCallback(async (commandesList) => {
  if (!commandesList || commandesList.length === 0) return;
  
  const commandeIds = commandesList.map(cmd => cmd.id || cmd.idCommandeClient).filter(Boolean);
  
  if (commandeIds.length === 0) return;
  
  try {
    // ✅ UN SEUL APPEL POUR TOUTES LES COMMANDES
    const status = await commandeService.checkInvoicesBatch(commandeIds);
    setInvoiceStatus(status);
    console.log(`📊 Statuts factures batch:`, status);
  } catch (error) {
    console.error('Erreur vérification batch:', error);
    // Fallback: méthode ancienne une par une
    const status = {};
    for (const cmd of commandesList) {
      const commandeId = cmd.id || cmd.idCommandeClient;
      if (!commandeId) continue;
      try {
        const hasInvoice = await commandeService.checkInvoiceExistsForCommande(commandeId);
        status[commandeId] = hasInvoice;
      } catch (e) {
        status[commandeId] = false;
      }
    }
    setInvoiceStatus(status);
  }
}, []);

  // ============================================
  //  CHARGEMENT DES COMMANDES
  // ============================================

const loadCommandesValidees = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Chargement des commandes validées...');
    const commandesData = await commandeService.getCommandesValidees();
    
    console.log('📦 Commandes reçues:', commandesData?.length || 0);
    
    if (!commandesData || commandesData.length === 0) {
      setCommandes([]);
      setLoading(false);
      return;
    }
    
    // Transformer les données SIMPLEMENT
    const commandesTransformees = commandesData.map(cmd => ({
      id: cmd.id || cmd.idCommandeClient,
      idCommandeClient: cmd.idCommandeClient || cmd.id,
      referenceCommandeClient: cmd.referenceCommandeClient,
      numeroCommande: cmd.referenceCommandeClient,
      dateCreation: cmd.dateCommande || cmd.dateCreation,
      statut: cmd.statut,
      montantTotal: cmd.total || cmd.montantTotal || 0,
      total: cmd.total || cmd.montantTotal || 0,
      produits: cmd.produits || [],
      client: cmd.client ? {
        nom: cmd.client.nom || '',
        prenom: cmd.client.prenom || '',
        nomComplet: `${cmd.client.prenom || ''} ${cmd.client.nom || ''}`.trim() || 'Client',
        typeClient: cmd.client.typeClient || 'PARTICULIER',
        telephone: cmd.client.telephone || '',
        email: cmd.client.email || ''
      } : null
    }));
    
    console.log('✅ Commandes transformées:', commandesTransformees.length);
    setCommandes(commandesTransformees);
    
    // Vérifier les factures
    await checkInvoicesStatus(commandesTransformees);
    
  } catch (err) {
    console.error('❌ Erreur:', err);
    setError(tr('validatedOrdersLoadError'));
    setCommandes([]);
  } finally {
    setLoading(false);
  }
}, []); 

  // Chargement initial
  useEffect(() => {
    loadCommandesValidees();
  }, [loadCommandesValidees]);

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
                    (commande?.client?.prenom ? `${commande.client.prenom} ${commande.client.nom}`.trim() : tr('client')),
        email: commande?.client?.email || invoiceData.client?.email || '',
        telephone: commande?.client?.telephone || invoiceData.client?.telephone || '',
        adresse: commande?.client?.adresse || invoiceData.client?.adresse || '',
        typeClient: commande?.client?.typeClient || invoiceData.client?.typeClient || 'PARTICULIER'
      },
      
      commande: commande ? {
        id: commande.id,
        reference: commande.referenceCommandeClient || commande.numeroCommande,
        lignesCommande: commande.produits?.map(p => ({
          produit: { libelle: p.libelle || tr('product') },
          quantite: p.quantite,
          prix_unitaire: p.prixUnitaire,
          total: p.sousTotal || (p.quantite * p.prixUnitaire)
        })) || []
      } : null,
      
      montantTotal: invoiceData.montantTotal || commande?.montantTotal || 0,
      total: invoiceData.montantTotal || commande?.total || 0,
      
      items: commande?.produits?.map(p => ({
        description: p.libelle || tr('product'),
        quantity: p.quantite,
        unitPrice: p.prixUnitaire,
        total: p.sousTotal || (p.quantite * p.prixUnitaire)
      })) || [],
      
      statut: invoiceData.statut || 'NON_PAYE',
      status: invoiceData.statut === 'NON_PAYE' ? 'en_attente' : 'payée',
      commandeId: commandeId,
      paymentMethod: commande?.modePaiement || tr('notSpecified'),
      notes: commande?.notes || ''
    };
    
    console.log('✅ Facture préparée pour le modal:', factureData);
    
    setSelectedFacture(factureData);
    setSelectedCommandeId(commandeId);
    setIsInvoiceModalOpen(true);
    
    // Mise à jour du statut de la facture
    setInvoiceStatus(prev => ({ ...prev, [commandeId]: true }));
  }, [commandes, tr]);

  /**
   * Génère une nouvelle facture pour une commande
   * @param {string|number} commandeId - ID de la commande
   */
  const handleGenerateInvoice = async (commandeId) => {
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
    
    try {
      console.log('📄 Génération facture pour commande:', commandeId);
      
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

  /**
   * Consulte une facture existante
   * @param {string|number} commandeId - ID de la commande
   */
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
      toast.error('Erreur lors du téléchargement');
    }
  };

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
    <div className={`space-y-6 p-4 md:p-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-sm">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {tr('validatedOrdersTitle')}
                </h1>
              </div>
              <p className="text-gray-600 flex items-center gap-2">
                <span>{tr('ordersDisplayed', { count: filteredResult.length })}</span>
                {hasActiveFilters && filteredResult.length === 0 && (
                  <span className="text-amber-600 text-sm">({tr('noResult')})</span>
                )}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 text-sm font-medium">{tr('error')}</p>
                <p className="text-red-500 text-xs">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  {tr('hide')}
                </button>
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
        t={tr}
        locale={locale}
        isArabic={isArabic}
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
        t={tr}
        locale={locale}
        isArabic={isArabic}
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
        t={tr}
        isArabic={isArabic}
        onDownloadPDF={handleDownloadPDF}
        onStatusChange={handleInvoiceStatusChange}
      />
    </div>
  );
};

export default SalesPage;