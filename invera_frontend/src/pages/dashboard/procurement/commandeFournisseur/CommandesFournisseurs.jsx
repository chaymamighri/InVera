// CommandesFournisseurs.jsx - VERSION AVEC ARCHIVES
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCommandeFournisseur } from '../../../../hooks/useCommandeFournisseur';
import CommandeModal from './components/CommandeModal';
import CommandeDetailsModal from './components/CommandeDetailsModal';
import StatsCartes from './components/StatsCartes';
import BarreRecherche from './components/BarreRecherche';
import TableauCommandes from './components/TableauCommandes';
import ConfirmationModal from './components/ConfirmationModal';

// Constantes exportées pour les composants enfants
export const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  FACTUREE: 'FACTUREE',
  ANNULEE: 'ANNULEE',
};

// Fonctions de formatage exportées
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(price);
};

// Badge de statut exporté
export const getStatusBadge = (statut) => {
  const colors = {
    [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800',
    [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800',
    [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800',
    [StatutCommande.RECUE]: 'bg-green-100 text-green-800',
    [StatutCommande.FACTUREE]: 'bg-purple-100 text-purple-800',
    [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800',
    [StatutCommande.REJETEE]: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut]}`}>
      {statut}
    </span>
  );
};

const CommandesFournisseurs = () => {
  const {
    commandes,
    loading,
    error, 
    fetchCommandes,
    fetchArchivedCommandes, 
    restoreCommande,         
    createCommande,
    updateCommande,
    deleteCommande,
    validerCommande,
    envoyerCommande,
    recevoirCommande,
    annulerCommande,
    facturerCommande,
    searchByNumero,
    searchByPeriode,
  } = useCommandeFournisseur();

  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showArchives, setShowArchives] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ Charger les commandes selon le mode
  useEffect(() => {
    if (showArchives) {
      fetchArchivedCommandes();
    } else {
      fetchCommandes();
    }
  }, [showArchives, fetchCommandes, fetchArchivedCommandes]);


  // Statistiques (cachées en mode archives)
  const stats = useMemo(() => {
    if (!commandes.length || showArchives) return null;
    return {
      total: commandes.length,
      enAttente: commandes.filter(c => c.statut === StatutCommande.BROUILLON || c.statut === StatutCommande.VALIDEE).length,
      totalHT: commandes.reduce((acc, c) => acc + (c.totalHT || 0), 0),
      totalTTC: commandes.reduce((acc, c) => acc + (c.totalTTC || 0), 0),
    };
  }, [commandes, showArchives]);

  // Filtrage
  const filteredCommandes = useMemo(() => {
    return commandes.filter(commande => {
      const matchesSearch = 
        commande.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.fournisseur?.nomFournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.fournisseur?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatut = !selectedStatut || commande.statut === selectedStatut;
      return matchesSearch && matchesStatut;
    });
  }, [commandes, searchTerm, selectedStatut]);

  // Handlers
  const handleShowArchives = () => {
    setShowArchives(!showArchives);
    setSearchTerm('');
    setSelectedStatut('');
  };

  const handleSearch = async () => {
    if (searchTerm) {
      try {
        const result = await searchByNumero(searchTerm);
        if (result) {
          setSelectedCommande(result);
          setIsDetailsModalOpen(true);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Aucune commande trouvée avec ce numéro');
      }
    }
  };

  const handleSearchByPeriode = async () => {
    if (dateDebut && dateFin) {
      try {
        await searchByPeriode(new Date(dateDebut), new Date(dateFin));
        toast.success('Recherche par période effectuée');
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la recherche');
      }
    }
  };

  // CommandesFournisseurs.jsx - CORRIGÉ
const handleStatusChange = async (id, action) => {
  try {
    setActionInProgress(`${action}-${id}`);
    let result;
    switch (action) {
      case 'valider': 
        result = await validerCommande(id); 
        toast.success('Commande validée avec succès');
        break;
      case 'envoyer': 
        result = await envoyerCommande(id); 
        toast.success('Commande envoyée avec succès');
        break;
      case 'recevoir': 
        result = await recevoirCommande(id); 
        toast.success('Réception enregistrée avec succès');
        break;
      case 'facturer':   // ← AJOUTÉ !
        result = await facturerCommande(id); 
        toast.success('Commande facturée avec succès');
        break;
      case 'annuler': 
        result = await annulerCommande(id); 
        toast.success('Commande annulée avec succès');
        break;
      default:
        console.warn('Action inconnue:', action);
        return;
    }
    await fetchCommandes();
  } catch (error) {
    console.error('Erreur:', error);
    toast.error(`Erreur lors de ${action === 'annuler' ? 'l\'annulation' : 'l\'action'}`);
  } finally {
    setActionInProgress(null);
  }
};

  // ✅ Restaurer une commande archivée
  const handleRestore = async (id) => {
    try {
      setActionInProgress(`restore-${id}`);
      await restoreCommande(id);
      toast.success('Commande restaurée avec succès');
      if (showArchives) {
        await fetchArchivedCommandes();
      }
    } catch (error) {
      console.error('Erreur restauration:', error);
      toast.error('Erreur lors de la restauration');
    } finally {
      setActionInProgress(null);
    }
  };

  // ✅ HandleDelete adapté au mode archives
  const handleDelete = (commande) => {
    if (showArchives) {
      toast.info('Utilisez le bouton de restauration pour réactiver la commande');
      return;
    }
    
    if (commande.statut !== StatutCommande.BROUILLON) {
      toast.error('Seules les commandes en brouillon peuvent être supprimées');
      return;
    }
    
    setSelectedCommande(commande);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCommande) return;
    
    try {
      setActionInProgress('delete');
      await deleteCommande(selectedCommande.idCommandeFournisseur);
      toast.success('Commande supprimée avec succès');
      setIsDeleteModalOpen(false);
      setSelectedCommande(null);
      await fetchCommandes();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCommandes();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
        <p className="text-lg text-gray-700">Erreur de chargement</p>
        <p className="text-sm text-gray-500">{error}</p>
        <div className="flex space-x-3">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Réessayer
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Retour au login
          </button>
        </div>
      </div>
    );
  }

  if (loading && !commandes.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de mode archives */}
      {showArchives && (
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 font-medium">
                Mode Archives - Commandes supprimées
              </span>
            </div>
            <button
              onClick={handleShowArchives}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Retour aux commandes actives
            </button>
          </div>
        </div>
      )}

      {/* Statistiques (cachées en mode archives) */}
      {!showArchives && <StatsCartes stats={stats} />}

      {/* Barre de recherche et filtres */}
      <BarreRecherche
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatut={selectedStatut}
        setSelectedStatut={setSelectedStatut}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onSearch={handleSearch}
        onNouvelleCommande={() => {
          setSelectedCommande(null);
          setIsModalOpen(true);
        }}
        onShowArchives={handleShowArchives}
        showArchives={showArchives}
        statuts={StatutCommande}
        dateDebut={dateDebut}
        setDateDebut={setDateDebut}
        dateFin={dateFin}
        setDateFin={setDateFin}
        onSearchByPeriode={handleSearchByPeriode}
      />

      {/* Tableau des commandes */}
      <TableauCommandes
        commandes={filteredCommandes}
        onView={(commande) => {
          setSelectedCommande(commande);
          setIsDetailsModalOpen(true);
        }}
        onEdit={!showArchives ? (commande) => {
          setSelectedCommande(commande);
          setIsModalOpen(true);
        } : undefined}
        onDelete={handleDelete}
        onRestore={showArchives ? handleRestore : undefined}
        onStatusChange={!showArchives ? handleStatusChange : undefined}
        actionInProgress={actionInProgress}
        statuts={StatutCommande}
        onNouvelleCommande={() => {
          setSelectedCommande(null);
          setIsModalOpen(true);
        }}
        showArchives={showArchives}
      />

      {/* Modals */}
      <CommandeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        commande={selectedCommande}
        onSave={selectedCommande ? updateCommande : createCommande}
        onSuccess={fetchCommandes}
      />
      <CommandeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        commande={selectedCommande}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la commande"
        message={`Êtes-vous sûr de vouloir supprimer la commande ${selectedCommande?.numeroCommande || ''} ?`}
        isLoading={actionInProgress === 'delete'}
      />
    </div>
  );
};

export default CommandesFournisseurs;