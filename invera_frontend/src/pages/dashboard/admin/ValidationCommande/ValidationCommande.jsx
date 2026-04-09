/**
 * ValidationCommande - Page des commandes en attente de validation (Admin)
 * ROUTE : /dashboard/admin/validation-commande
 * 
 * RÔLE : Permettre à l'administrateur de valider ou rejeter les commandes créées
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import commandeFournisseurService from '../../../../services/commandeFournisseurService';
import CommandeDetailsModal from '../../procurement/commandeFournisseur/components/CommandeDetailsModal';
import ValidationConfirmModal from './components/ValidationConfirmModal';
import RejectModal from './components/RejectModal';

const ValidationCommande = () => {
  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [rawCommandes, setRawCommandes] = useState([]);
  
  // États pour les modaux
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedCommandeData, setSelectedCommandeData] = useState(null);
  const [modalError, setModalError] = useState('');

  // Récupérer les commandes depuis l'API
  const fetchCommandes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await commandeFournisseurService.getAllCommandes();
      
      let allCommandes = [];
      if (response && response.data) {
        allCommandes = response.data;
      } else if (Array.isArray(response)) {
        allCommandes = response;
      } else {
        allCommandes = response?.commandes || [];
      }
      
      setRawCommandes(allCommandes);
      
      const commandesEnAttente = allCommandes.filter(
        cmd => cmd.statut === 'BROUILLON'
      );
      
      const formattedCommandes = commandesEnAttente.map(cmd => ({
        id: cmd.idCommandeFournisseur,
        reference: cmd.numeroCommande || `CMD-${cmd.idCommandeFournisseur}`,
        fournisseur: cmd.fournisseur?.nomFournisseur || cmd.nomFournisseur || 'Non spécifié',
        dateCreation: cmd.dateCommande ? new Date(cmd.dateCommande).toLocaleDateString('fr-FR') : 'Date inconnue',
        dateLivraisonPrevue: cmd.dateLivraisonPrevue ? new Date(cmd.dateLivraisonPrevue).toLocaleDateString('fr-FR') : 'Non définie',
        totalHT: cmd.totalHT || 0,
        totalTTC: cmd.totalTTC || 0,
        statut: cmd.statut,
        adresseLivraison: cmd.adresseLivraison || 'Non spécifiée',
        nbProduits: cmd.lignesCommande?.length || 0,
        produits: cmd.lignesCommande || []
      }));
      
      setCommandes(formattedCommandes);
      setFilteredCommandes(formattedCommandes);
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      setError('Impossible de charger les commandes. Veuillez réessayer.');
      toast.error('Erreur de chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  // Filtrer les commandes par recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCommandes(commandes);
    } else {
      const filtered = commandes.filter(c => 
        c.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommandes(filtered);
    }
  }, [searchTerm, commandes]);

  // Ouvrir le modal de validation
  const openValidateModal = (commande) => {
    setSelectedCommandeData(commande);
    setModalError('');
    setIsValidateModalOpen(true);
  };

  // Confirmer la validation
  const confirmValidation = async () => {
    if (!selectedCommandeData) return;
    
    setActionInProgress(`valider-${selectedCommandeData.id}`);
    setModalError('');
    
    try {
      await commandeFournisseurService.validerCommande(selectedCommandeData.id);
      toast.success(`Commande ${selectedCommandeData.reference} validée avec succès !`);
      await fetchCommandes();
      setIsValidateModalOpen(false);
      setSelectedCommandeData(null);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de la validation';
      setModalError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Ouvrir le modal de rejet
  const openRejectModal = (commande) => {
    setSelectedCommandeData(commande);
    setModalError('');
    setIsRejectModalOpen(true);
  };

  // Confirmer le rejet
  const confirmRejection = async (motif) => {
    if (!selectedCommandeData) return;
    
    setActionInProgress(`rejeter-${selectedCommandeData.id}`);
    setModalError('');
    
    try {
      await commandeFournisseurService.rejeterCommande(selectedCommandeData.id, motif);
      toast.success(`Commande ${selectedCommandeData.reference} rejetée avec succès !`);
      await fetchCommandes();
      setIsRejectModalOpen(false);
      setSelectedCommandeData(null);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erreur lors du rejet';
      setModalError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Ouvrir le modal des détails
  const handleViewDetails = (formattedCommande) => {
    const rawCommande = rawCommandes.find(c => c.idCommandeFournisseur === formattedCommande.id);
    if (rawCommande) {
      setSelectedCommande(rawCommande);
      setIsDetailsModalOpen(true);
    } else {
      toast.error('Impossible de charger les détails de la commande');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCommandes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par numéro de commande ou fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Indicateur du nombre de commandes */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {filteredCommandes.length} commande(s) en attente de validation
        </p>
      </div>

      {/* Liste des commandes */}
      {filteredCommandes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">Aucune commande en attente</h3>
          <p className="text-gray-500 mt-1">Toutes les commandes ont été traitées</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCommandes.map((commande) => (
            <div key={commande.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {commande.reference}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      En attente
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="flex items-start gap-2">
                      <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Fournisseur</p>
                        <p className="text-sm font-medium">{commande.fournisseur}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Date création</p>
                        <p className="text-sm font-medium">{commande.dateCreation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CurrencyEuroIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Total TTC</p>
                        <p className="text-sm font-medium text-blue-600">
                          {commande.totalTTC?.toLocaleString()} DH
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CubeIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Produits</p>
                        <p className="text-sm font-medium">{commande.nbProduits}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(commande)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir détails"
                    disabled={actionInProgress !== null}
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openValidateModal(commande)}
                    disabled={actionInProgress !== null}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Valider"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openRejectModal(commande)}
                    disabled={actionInProgress !== null}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Rejeter"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modaux externes */}
      <ValidationConfirmModal
        isOpen={isValidateModalOpen}
        onClose={() => {
          setIsValidateModalOpen(false);
          setSelectedCommandeData(null);
          setModalError('');
        }}
        onConfirm={confirmValidation}
        commandeReference={selectedCommandeData?.reference}
        isLoading={actionInProgress !== null}
        errorMessage={modalError}
      />

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedCommandeData(null);
          setModalError('');
        }}
        onConfirm={confirmRejection}
        commandeReference={selectedCommandeData?.reference}
        isLoading={actionInProgress !== null}
        errorMessage={modalError}
      />

      {/* Modal des détails */}
      <CommandeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCommande(null);
        }}
        commande={selectedCommande}
      />
    </div>
  );
};

export default ValidationCommande;