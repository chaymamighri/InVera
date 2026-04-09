/**
 * FournisseurManagement - Gestion des fournisseurs (administration)
 * 
 * RÔLE : Gérer les fournisseurs (CRUD, activation/désactivation)
 * ROUTE : /dashboard/admin/fournisseurs
 * 
 * FONCTIONNALITÉS :
 * - Liste des fournisseurs (actifs, inactifs, tous)
 * - Recherche par nom, email, téléphone
 * - Création de fournisseur (modal)
 * - Modification de fournisseur (modal)
 * - Désactivation/réactivation (soft delete)
 * - Tri par date de création (récent en premier)
 * 
 * COMPOSANTS :
 * - FournisseurSearch : Barre de recherche et filtres
 * - FournisseurTable : Tableau des fournisseurs
 * - FournisseurModal : Modal générique
 * - FournisseurForm : Formulaire création/modification
 * 
 * HOOK UTILISÉ : useFournisseur()
 */

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useFournisseur } from '../../../../hooks/useFournisseur';
import FournisseurSearch from './components/FournisseurSearch';
import FournisseurTable from './components/FournisseurTable';
import FournisseurModal from './components/FournisseurModal';
import FournisseurForm from './components/FournisseurForm';

const FournisseurManagement = () => {
  const {
    allFournisseurs,
    loading,
    error,
    fetchAllFournisseurs,
    softDeleteFournisseur,
    reactivateFournisseur,
    createFournisseur,
    updateFournisseur
  } = useFournisseur();

  const [viewMode, setViewMode] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState(null);

  // Charger toutes les données au démarrage
  useEffect(() => {
    if (fetchAllFournisseurs) {
      fetchAllFournisseurs();
    }
  }, [fetchAllFournisseurs]);

  const handleSearchResults = (results, term) => {
    setSearchResults(results);
    setActiveSearchTerm(term);
  };

  const refreshData = async () => {
    if (fetchAllFournisseurs) {
      await fetchAllFournisseurs();
    }
  };

  const handleCreate = async (data) => {
    const toastId = toast.loading('Création du fournisseur en cours...');
    
    try {
      await createFournisseur(data);
      setShowModal(false);
      await refreshData();
      setSearchResults([]);
      setActiveSearchTerm('');
      
      toast.success(' Fournisseur créé avec succès !', {
        id: toastId,
        icon: '🎉',
      });
    } catch (error) {
      toast.error('❌ Erreur: ' + error.message, {
        id: toastId,
      });
    }
  };

  const handleUpdate = async (data) => {
    const toastId = toast.loading('Mise à jour du fournisseur en cours...');
    
    try {
      await updateFournisseur(editingFournisseur.idFournisseur, data);
      setShowModal(false);
      setEditingFournisseur(null);
      await refreshData();
      setSearchResults([]);
      setActiveSearchTerm('');
      
      toast.success(' Fournisseur modifié avec succès !', {
        id: toastId,
      });
    } catch (error) {
      toast.error('❌ Erreur: ' + error.message, {
        id: toastId,
      });
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    const action = isActive ? 'désactivation' : 'réactivation';
    const toastId = toast.loading(`${action} du fournisseur en cours...`);
    
    try {
      if (isActive) {
        await softDeleteFournisseur(id);
      } else {
        await reactivateFournisseur(id);
      }
      await refreshData();
      setSearchResults([]);
      setActiveSearchTerm('');
      
      toast.success(
        isActive 
          ? ' Fournisseur désactivé avec succès !' 
          : ' Fournisseur réactivé avec succès !',
        { id: toastId }
      );
    } catch (error) {
      toast.error(`❌ Erreur lors de la ${action}: ` + error.message, {
        id: toastId,
      });
    }
  };

  const openAddModal = () => {
    setEditingFournisseur(null);
    setShowModal(true);
  };

  const openEditModal = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setShowModal(true);
  };

  // Filtrer les fournisseurs selon le mode d'affichage
  const getDisplayedFournisseurs = () => {
    if (activeSearchTerm) {
      return [...searchResults].sort((a, b) => 
        new Date(b.dateCreation) - new Date(a.dateCreation)
      );
    }
    
    if (!allFournisseurs) return [];
    
    let filtered = [];
    switch(viewMode) {
      case 'active':
        filtered = allFournisseurs.filter(f => f.actif === true);
        break;
      case 'inactive':
        filtered = allFournisseurs.filter(f => f.actif === false);
        break;
      case 'all':
      default:
        filtered = allFournisseurs;
    }
    
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.dateCreation || a.createdAt || 0);
      const dateB = new Date(b.dateCreation || b.createdAt || 0);
      return dateB - dateA;
    });
  };

  const displayedFournisseurs = getDisplayedFournisseurs();

  return (
    <div className="p-6">
      {/* Search, Filtres et Bouton Nouveau sur la même ligne */}
      <div className="mb-6">
        <FournisseurSearch 
          onSearchResults={handleSearchResults}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
          onAddNew={openAddModal}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Info recherche */}
      {activeSearchTerm && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            🔍 {searchResults.length} résultat(s) pour "{activeSearchTerm}"
          </span>
          <button
            onClick={() => {
              setActiveSearchTerm('');
              setSearchResults([]);
            }}
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
          >
            Voir tous
          </button>
        </div>
      )}

      {/* Tableau */}
      {loading && !displayedFournisseurs.length ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-3 text-gray-500">Chargement des fournisseurs...</p>
        </div>
      ) : (
        <FournisseurTable
          fournisseurs={displayedFournisseurs}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modal */}
      <FournisseurModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingFournisseur(null);
        }}
      >
        <FournisseurForm
          initialData={editingFournisseur}
          onSubmit={editingFournisseur ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowModal(false);
            setEditingFournisseur(null);
          }}
          loading={loading}
        />
      </FournisseurModal>
    </div>
  );
};

export default FournisseurManagement;