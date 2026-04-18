/**
 * CommandesFournisseurs - Gestion des commandes fournisseurs
 * 
 * RÔLE : Gérer le cycle de vie des commandes fournisseurs (CRUD, statuts, réception)
 * ROUTE : /dashboard/procurement/commandes
 * 
 * FONCTIONNALITÉS :
 * - Liste des commandes avec filtres (recherche, statut)
 * - Création, modification, suppression de commande
 * - Changement de statut (brouillon → validée → envoyée → reçue)
 * - Recherche par numéro ou période
 * - Réception de commande avec gestion des stocks
 * - Focus sur commande prioritaire (depuis rappels)
 * - Cartes statistiques (total, en attente, montants)
 * 
 * HOOKS UTILISÉS :
 * - useCommandeFournisseur() : CRUD, statuts, recherche
 * - procurementReminderService : Gestion des rappels
 * 
 * COMPOSANTS :
 * - StatsCartes : Cartes statistiques
 * - BarreRecherche : Recherche et filtres
 * - TableauCommandes : Liste des commandes
 * - CommandeModal : Création/modification
 * - CommandeDetailsModal : Détails commande
 * - ReceptionModal : Réception commande
 * - ConfirmationModal : Confirmation suppression
 * 
 * STATUTS DISPONIBLES :
 * - BROUILLON → VALIDEE → ENVOYEE → RECUE 
 * - ANNULEE, REJETEE
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArchiveBoxIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCommandeFournisseur } from '../../../../hooks/useCommandeFournisseur';
import procurementReminderService from '../../../../services/procurementReminderService';
import CommandeModal from './components/commandeModal';
import CommandeDetailsModal from './components/CommandeDetailsModal';
import ReceptionModal from './components/ReceptionModal';
import StatsCartes from './components/StatsCartes';
import BarreRecherche from './components/BarreRecherche';
import TableauCommandes from './components/TableauCommandes';

export const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  ANNULEE: 'ANNULEE',
  REJETEE: 'REJETEE',
};

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

export const getStatusBadge = (statut) => {
  const colors = {
    [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800',
    [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800',
    [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800',
    [StatutCommande.RECUE]: 'bg-green-100 text-green-800',
    [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800',
    [StatutCommande.REJETEE]: 'bg-orange-100 text-orange-800',
  };

  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut]}`}>{statut}</span>;
};

const CommandesFournisseurs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedCommandeId = searchParams.get('focusCommande') || '';
  const focusedReminderStage = (searchParams.get('reminderStage') || '').toUpperCase();
  const focusedNotificationType = (searchParams.get('notificationType') || '').toUpperCase();

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
    rejeterCommande,      // ✅ NOUVEAU
    renvoyerAttente,      // ✅ NOUVEAU
    searchByNumero,
    searchByPeriode,
  } = useCommandeFournisseur();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    if (showArchives) {
      fetchArchivedCommandes();
    } else {
      fetchCommandes();
    }
  }, [showArchives, fetchArchivedCommandes, fetchCommandes]);

  useEffect(() => {
    if (showArchives || loading) return;
    procurementReminderService.syncCommandes(commandes);
  }, [commandes, loading, showArchives]);

  useEffect(() => {
    if (!focusedCommandeId || !focusedReminderStage) return;
    procurementReminderService.markReadByCommande(focusedCommandeId, focusedReminderStage);
  }, [focusedCommandeId, focusedReminderStage]);

  const clearFocus = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('focusCommande');
    nextParams.delete('reminderStage');
    nextParams.delete('notificationType');
    setSearchParams(nextParams, { replace: true });
  };

  const focusedCommande = useMemo(() => {
    return commandes.find((commande) => String(commande.idCommandeFournisseur) === String(focusedCommandeId)) || null;
  }, [commandes, focusedCommandeId]);

  const focusMessage = useMemo(() => {
    if (focusedNotificationType === 'APPROVED') {
      return 'Cette commande a ete confirmee par l administrateur. Vous pouvez maintenant l envoyer au fournisseur.';
    }

    if (focusedNotificationType === 'REJECTED') {
      return 'Cette commande a ete rejetee par l administrateur. Consultez le motif pour la corriger puis renvoyez-la.';
    }

    if (focusedReminderStage === StatutCommande.VALIDEE) {
      return 'Cette commande a ete validee mais elle doit encore etre envoyee au fournisseur.';
    }

    return 'Cette commande est en brouillon depuis plus de 24 heures et attend votre confirmation.';
  }, [focusedNotificationType, focusedReminderStage]);

  const stats = useMemo(() => {
    if (!commandes.length || showArchives) return null;

    return {
      total: commandes.length,
      enAttente: commandes.filter(
        (commande) => commande.statut === StatutCommande.BROUILLON || commande.statut === StatutCommande.VALIDEE
      ).length,
      totalHT: commandes.reduce((total, commande) => total + (commande.totalHT || 0), 0),
      totalTTC: commandes.reduce((total, commande) => total + (commande.totalTTC || 0), 0),
    };
  }, [commandes, showArchives]);

const filteredCommandes = useMemo(() => {
  console.log("=== FILTRAGE COMMANDES ===");
  console.log("selectedStatut:", selectedStatut);
  console.log("searchTerm:", searchTerm);
  console.log("Total commandes avant filtre:", commandes.length);
  console.log("Statuts disponibles:", commandes.map(c => c.statut));
  
  const filtered = commandes.filter((commande) => {
    const matchesSearch =
      commande.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.fournisseur?.nomFournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.fournisseur?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = !selectedStatut || commande.statut === selectedStatut;
    
    if (!matchesStatut && selectedStatut === 'VALIDEE') {
      console.log("Commande exclue:", commande.numeroCommande, "statut:", commande.statut);
    }
    
    return matchesSearch && matchesStatut;
  });
  
  console.log("Commandes après filtre:", filtered.length);
  console.log("Commandes VALIDEE dans le résultat:", filtered.filter(c => c.statut === 'VALIDEE').length);
  
  return filtered;
}, [commandes, searchTerm, selectedStatut]);

  const handleShowArchives = () => {
    setShowArchives((prev) => !prev);
    setSearchTerm('');
    setSelectedStatut('');
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    try {
      const result = await searchByNumero(searchTerm);
      if (result) {
        setSelectedCommande(result);
        setIsDetailsModalOpen(true);
      }
    } catch (searchError) {
      console.error('Erreur recherche commande:', searchError);
      toast.error('Aucune commande trouvee avec ce numero');
    }
  };

  const handleSearchByPeriode = async () => {
    if (!dateDebut || !dateFin) return;

    try {
      await searchByPeriode(new Date(dateDebut), new Date(dateFin));
      toast.success('Recherche par periode effectuee');
    } catch (searchError) {
      console.error('Erreur recherche periode:', searchError);
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleRecevoirClick = (commande) => {
    setSelectedCommande(commande);
    setIsReceptionModalOpen(true);
  };

  const handleReceptionConfirm = async (receptionData) => {
    try {
      setActionInProgress(`reception-${selectedCommande.idCommandeFournisseur}`);
      await recevoirCommande(selectedCommande.idCommandeFournisseur, receptionData);
      toast.success('Reception enregistree avec succes');
      setIsReceptionModalOpen(false);

      if (focusedCommandeId && String(selectedCommande.idCommandeFournisseur) === String(focusedCommandeId)) {
        clearFocus();
      }

      await fetchCommandes();
    } catch (receiveError) {
      console.error('Erreur reception:', receiveError);
      toast.error('Erreur lors de la reception');
    } finally {
      setActionInProgress(null);
    }
  };

  // handleStatusChange pour gérer toutes les actions
const handleStatusChange = async (id, action) => {
  try {
    setActionInProgress(`${action}-${id}`);

    switch (action) {
      case 'envoyer':
        await envoyerCommande(id);
        toast.success('Commande envoyee avec succes');
        break;
      
      case 'renvoyer_attente':  
        await renvoyerAttente(id);
        toast.success('Commande renvoyee en attente apres correction');
        break;
      
      case 'annuler':
        await annulerCommande(id);
        toast.success('Commande annulee avec succes');
        break;
      
      default:
        console.warn('Action non reconnue:', action);
        return;
    }

    if (focusedCommandeId && String(id) === String(focusedCommandeId)) {
      clearFocus();
    }

    await fetchCommandes();
  } catch (statusError) {
    console.error('Erreur changement statut:', statusError);
    toast.error(`Erreur lors de ${action === 'annuler' ? "l'annulation" : "l'action"}`);
  } finally {
    setActionInProgress(null);
  }
};

  const handleRestore = async (id) => {
    try {
      setActionInProgress(`restore-${id}`);
      await restoreCommande(id);
      toast.success('Commande restauree avec succes');

      if (showArchives) {
        await fetchArchivedCommandes();
      }
    } catch (restoreError) {
      console.error('Erreur restauration:', restoreError);
      toast.error('Erreur lors de la restauration');
    } finally {
      setActionInProgress(null);
    }
  };

  // ✅ MODIFICATION : handleDelete - Permet suppression pour BROUILLON et REJETEE
  const handleDelete = (commande) => {
    if (showArchives) {
      toast.info('Utilisez le bouton de restauration pour reactiver la commande');
      return;
    }

    // Permettre suppression pour BROUILLON et REJETEE
    if (commande.statut !== StatutCommande.BROUILLON && commande.statut !== StatutCommande.REJETEE) {
      toast.error('Seules les commandes en brouillon ou rejetees peuvent etre supprimees');
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
      toast.success('Commande supprimee avec succes');
      setIsDeleteModalOpen(false);
      setSelectedCommande(null);

      if (focusedCommandeId && String(selectedCommande.idCommandeFournisseur) === String(focusedCommandeId)) {
        clearFocus();
      }

      await fetchCommandes();
    } catch (deleteError) {
      console.error('Erreur suppression commande:', deleteError);
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRetry = () => {
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
            Reessayer
          </button>
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
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
      {showArchives && (
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 font-medium">Mode Archives - Commandes supprimees</span>
            </div>
            <button onClick={handleShowArchives} className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              Retour aux commandes actives
            </button>
          </div>
        </div>
      )}

      {!showArchives && focusedCommande && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Commande a traiter en priorite</p>
            <p className="text-sm text-amber-800 mt-1">
              <span className="font-semibold">{focusedCommande.numeroCommande}</span> - {focusMessage}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCommande(focusedCommande);
                setIsDetailsModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100 text-sm font-medium"
            >
              Voir details
            </button>
            <button
              onClick={clearFocus}
              className="px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-sm font-medium"
            >
              Retirer le focus
            </button>
          </div>
        </div>
      )}

      {!showArchives && focusedCommandeId && !focusedCommande && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700">La commande ciblee n a pas ete trouvee dans la liste active.</p>
          <button onClick={clearFocus} className="px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 text-sm">
            Fermer
          </button>
        </div>
      )}

      {!showArchives && <StatsCartes stats={stats} />}

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

      <TableauCommandes
        commandes={filteredCommandes}
        onView={(commande) => {
          setSelectedCommande(commande);
          setIsDetailsModalOpen(true);
        }}
        onEdit={
          !showArchives
            ? (commande) => {
                setSelectedCommande(commande);
                setIsModalOpen(true);
              }
            : undefined
        }
        onDelete={handleDelete}
        onRestore={showArchives ? handleRestore : undefined}
        onStatusChange={!showArchives ? handleStatusChange : undefined}
        onRecevoir={!showArchives ? handleRecevoirClick : undefined}
        actionInProgress={actionInProgress}
        statuts={StatutCommande}
        onNouvelleCommande={() => {
          setSelectedCommande(null);
          setIsModalOpen(true);
        }}
        showArchives={showArchives}
        highlightedCommandeId={focusedCommandeId}
        highlightedReminderStage={focusedReminderStage}
      />

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

      <ReceptionModal
        isOpen={isReceptionModalOpen}
        onClose={() => setIsReceptionModalOpen(false)}
        commande={selectedCommande}
        onConfirm={handleReceptionConfirm}
      />

  
    </div>
  );
};

export default CommandesFournisseurs;
