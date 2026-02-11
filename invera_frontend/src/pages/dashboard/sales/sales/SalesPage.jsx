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
import CreateSalesModal from './components/CreateSalesModal';
import InvoiceModal from './components/InvoiceModal'; 
import { commandeService } from '../../../../services/commandeService'; 

const SalesPage = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Filtres - structure simplifiée
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { from: '' }, // ✅ Uniquement 'from' pour la date
    sortBy: 'date_creation',
    sortOrder: 'desc'
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // ✅ Chargement des commandes
  const loadCommandesValidees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const commandesData = await commandeService.getCommandesValidees();
      
      // Transformation des données
      const commandesTransformees = commandesData.map(cmd => ({
        id: cmd.id || cmd.idCommande,
        numeroCommande: cmd.numeroCommande || cmd.reference || `CMD-${cmd.id || 'N/A'}`,
        dateCreation: cmd.dateCreation || cmd.dateCommande || cmd.createdAt,
        dateValidation: cmd.dateValidation || cmd.dateConfirmation,
        dateLivraisonPrevue: cmd.dateLivraison || cmd.dateLivraisonPrevue,
        statut: cmd.statut || cmd.status,
        montantTotal: cmd.montantTotal || cmd.total || cmd.totalTTC || 0,
        sousTotal: cmd.sousTotal || cmd.totalHT || cmd.total || 0,
        remiseTotal: cmd.remise || cmd.discount || 0,
        modeLivraison: cmd.modeLivraison || 'Standard',
        modePaiement: cmd.modePaiement || 'Non spécifié',
        notes: cmd.notes || cmd.remarques || '',
        produits: cmd.produits || cmd.items || cmd.ligneCommandes || [],
        client: cmd.client || {
          id: cmd.clientId,
          nomComplet: cmd.clientNom || `${cmd.clientPrenom || ''} ${cmd.clientNom || ''}`.trim(),
          entreprise: cmd.clientEntreprise || cmd.clientSociete || '',
          type: cmd.clientType || 'STANDARD',
          telephone: cmd.clientTelephone || '',
          email: cmd.clientEmail || '',
          adresse: cmd.clientAdresse || ''
        }
      }));
      
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

  // ✅ Génération de facture
  const handleGenerateInvoice = async (commandeId) => {
    try {
      setInvoiceLoading(true);
      const response = await commandeService.generateInvoice(commandeId);
      
      if (response?.data) {
        // Téléchargement PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `facture-${commandeId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Prévisualisation
        const commande = commandes.find(c => c.id === commandeId);
        if (commande) {
          const nouvelleFacture = {
            id: Date.now(),
            numeroFacture: `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            dateFacture: new Date().toISOString().split('T')[0],
            commandeId: commande.id,
            client: commande.client,
            produits: commande.produits,
            sousTotal: commande.sousTotal || 0,
            remiseTotal: commande.remiseTotal || 0,
            tva: ((commande.sousTotal || 0) - (commande.remiseTotal || 0)) * 0.19,
            montantTotal: commande.montantTotal || commande.total || 0,
            statut: 'à payer',
            modePaiement: commande.modePaiement || 'Non spécifié'
          };
          
          setSelectedFacture(nouvelleFacture);
          setIsInvoiceModalOpen(true);
        }
        
        return { success: true, message: 'Facture générée avec succès' };
      }
    } catch (err) {
      console.error('Erreur facture:', err);
      setError('Erreur lors de la génération de la facture');
      return { success: false, message: err.message };
    } finally {
      setInvoiceLoading(false);
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
        
        <div className="flex items-center gap-3">
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                     px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 
                     transition-all flex items-center justify-center gap-2 
                     shadow-sm hover:shadow-md disabled:opacity-50 
                     disabled:cursor-not-allowed active:scale-95"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouvelle Commande</span>
          </button>
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
        loading={loading || invoiceLoading}
        onGenerateInvoice={handleGenerateInvoice}
        filters={filters} 
      />

      {/* Modals */}
      <CreateSalesModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSale}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
        }}
        facture={selectedFacture}
      />

      {/* Styles pour animations */}
      <style jsx>{`
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