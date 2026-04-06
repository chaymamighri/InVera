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
      
      // Toast de succès - utilisera la configuration de App.jsx (6000ms)
      toast.success(' Fournisseur créé avec succès !', {
        id: toastId,
        icon: '🎉',
      });
    } catch (error) {
      // Toast d'erreur - utilisera la configuration de App.jsx (8000ms)
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
      
      // Toast de succès
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
      
      // Toast de succès
      toast.success(
        isActive 
          ? ' Fournisseur désactivé avec succès !' 
          : ' Fournisseur réactivé avec succès !',
        { 
          id: toastId,
        }
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
    // Trier aussi les résultats de recherche
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
  
  // Trier par date de création (le plus récent en premier)
  return [...filtered].sort((a, b) => {
    const dateA = new Date(a.dateCreation || a.createdAt || 0);
    const dateB = new Date(b.dateCreation || b.createdAt || 0);
    return dateB - dateA;
  });
};

  const displayedFournisseurs = getDisplayedFournisseurs();

  return (
    <div className="p-6">
      {/* Bouton Nouveau à droite */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openAddModal}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau
        </button>
      </div>

      {/* Search et Filtres */}
      <div className="mb-4">
        <FournisseurSearch 
          onSearchResults={handleSearchResults}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 p-2 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Info recherche */}
      {activeSearchTerm && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {searchResults.length} résultat(s) pour "{activeSearchTerm}"
          </span>
          <button
            onClick={() => {
              setActiveSearchTerm('');
              setSearchResults([]);
            }}
            className="text-xs text-emerald-600 hover:text-emerald-800"
          >
            Voir tous
          </button>
        </div>
      )}

      {/* Tableau */}
      {loading && !displayedFournisseurs.length ? (
        <div className="text-center py-8 text-gray-500">Chargement...</div>
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