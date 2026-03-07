import React, { useEffect, useState } from 'react';
import { useFournisseur } from '../../../../hooks/useFournisseur';
import FournisseurSearch from './components/FournisseurSearch';
import FournisseurTable from './components/FournisseurTable';
import FournisseurModal from './components/FournisseurModal';
import FournisseurForm from './components/FournisseurForm';

const FournisseurManagement = () => {
  const {
    activeFournisseurs,
    inactiveFournisseurs,
    allFournisseurs, // Vous devez avoir cette fonction dans votre hook
    loading,
    error,
    fetchActiveFournisseurs,
    fetchInactiveFournisseurs,
    fetchAllFournisseurs, // Vous devez avoir cette fonction dans votre hook
    softDeleteFournisseur,
    reactivateFournisseur,
    createFournisseur,
    updateFournisseur
  } = useFournisseur();

  const [viewMode, setViewMode] = useState('all'); // 'all' par défaut
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState(null);

  useEffect(() => {
    // Charger toutes les données au démarrage
    if (fetchAllFournisseurs) {
      fetchAllFournisseurs();
    }
    fetchActiveFournisseurs();
    fetchInactiveFournisseurs();
  }, [fetchAllFournisseurs, fetchActiveFournisseurs, fetchInactiveFournisseurs]);

  const handleSearchResults = (results, term) => {
    setSearchResults(results);
    setActiveSearchTerm(term);
  };

  const handleCreate = async (data) => {
    try {
      await createFournisseur(data);
      setShowModal(false);
      // Recharger les listes
      if (fetchAllFournisseurs) fetchAllFournisseurs();
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      setSearchResults([]);
      setActiveSearchTerm('');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateFournisseur(editingFournisseur.idFournisseur, data);
      setShowModal(false);
      setEditingFournisseur(null);
      // Recharger les listes
      if (fetchAllFournisseurs) fetchAllFournisseurs();
      await fetchActiveFournisseurs();
      await fetchInactiveFournisseurs();
      setSearchResults([]);
      setActiveSearchTerm('');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

 // Cherchez cette fonction
const handleToggleStatus = async (id, isActive) => {
    if (isActive) {
      await softDeleteFournisseur(id);
    } else {
      await reactivateFournisseur(id);
    }
    // Recharger les listes
    await fetchActiveFournisseurs();
    await fetchInactiveFournisseurs();
    setSearchResults([]);
    setActiveSearchTerm('');

};

  const openAddModal = () => {
    setEditingFournisseur(null);
    setShowModal(true);
  };

  const openEditModal = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setShowModal(true);
  };

  // Déterminer les fournisseurs à afficher
  const getDisplayedFournisseurs = () => {
    if (activeSearchTerm) {
      return searchResults;
    }
    
    switch(viewMode) {
      case 'active':
        return activeFournisseurs;
      case 'inactive':
        return inactiveFournisseurs;
      case 'all':
      default:
        return allFournisseurs || [...activeFournisseurs, ...inactiveFournisseurs];
    }
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
          Nouveau fournisseur
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
        title={editingFournisseur ? 'Modifier' : 'Nouveau fournisseur'}
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