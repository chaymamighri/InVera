/**
 * GestionCategories - Gestion des catégories de produits
 * 
 * RÔLE : Gérer les catégories de produits (CRUD)
 * ROUTE : /dashboard/procurement/categories
 * 
 * FONCTIONNALITÉS :
 * - Liste des catégories avec tableau
 * - Création de catégorie (nom, description, taux TVA)
 * - Modification de catégorie
 * - Suppression avec confirmation
 * - Validation des champs (nom requis, TVA requis)
 * - Rafraîchissement automatique après action
 * 
 * SERVICES : categorieService
 */
import React, { useState, useEffect } from 'react';
import { TrashIcon, PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import categorieService from '../../../../services/categorieService';
import toast from 'react-hot-toast';

const GestionCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomCategorie: '',
    description: '',
    tauxTVA: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // États pour le modal de confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Récupérer toutes les catégories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categorieService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      toast.error(err.message || 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nomCategorie: '',
      description: '',
      tauxTVA: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Préparer le formulaire pour la modification
  const handleEdit = (categorie) => {
    setFormData({
      nomCategorie: categorie.nomCategorie,
      description: categorie.description || '',
      tauxTVA: categorie.tauxTVA || ''
    });
    setIsEditing(true);
    setEditingId(categorie.idCategorie);
    // Scroll vers le formulaire
    document.getElementById('form-categorie')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Annuler la modification
  const handleCancelEdit = () => {
    resetForm();
  };

  // Ajouter ou modifier une catégorie
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nomCategorie.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    if (!formData.tauxTVA) {
      toast.error('Le taux de TVA est requis');
      return;
    }

    try {
      if (isEditing) {
        // Mode modification
        await categorieService.updateCategorie(editingId, {
          nomCategorie: formData.nomCategorie.trim(),
          description: formData.description.trim(),
          tauxTVA: parseFloat(formData.tauxTVA)
        });
        toast.success(`✏️ Catégorie "${formData.nomCategorie}" modifiée avec succès !`);
      } else {
        // Mode création
        await categorieService.createCategorie({
          nomCategorie: formData.nomCategorie.trim(),
          description: formData.description.trim(),
          tauxTVA: parseFloat(formData.tauxTVA)
        });
        toast.success('✅ Catégorie ajoutée avec succès !');
      }
      
      // Réinitialiser le formulaire
      resetForm();
      // Rafraîchir la liste
      fetchCategories();
    } catch (err) {
      console.error('Erreur lors de l\'opération:', err);
      toast.error(err.message || 'Erreur lors de l\'opération');
    }
  };

  // Ouvrir le modal de confirmation de suppression
  const openDeleteModal = (categorie) => {
    setCategoryToDelete(categorie);
    setShowDeleteModal(true);
  };

  // Fermer le modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  // Supprimer une catégorie
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await categorieService.deleteCategorie(categoryToDelete.idCategorie);
      toast.success(`🗑️ Catégorie "${categoryToDelete.nomCategorie}" supprimée avec succès !`);
      fetchCategories();
      closeDeleteModal();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error(err.message || '❌ Erreur lors de la suppression de la catégorie');
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer la catégorie 
                <span className="font-semibold text-red-600"> "{categoryToDelete?.nomCategorie}"</span> ?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Cette action est irréversible. Les produits associés à cette catégorie ne seront pas supprimés.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      <div id="form-categorie" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center hover:text-green-600 transition-colors duration-200">
            {isEditing ? (
              <>
                <PencilIcon className="w-5 h-5 mr-2 text-yellow-600" />
                Modifier la catégorie
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2 text-green-600" />
                Ajouter une nouvelle catégorie
              </>
            )}
          </h2>
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom de la catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la catégorie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nomCategorie"
                value={formData.nomCategorie}
                onChange={handleInputChange}
                placeholder="Ex: Électronique, Vêtements, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Taux de TVA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux de TVA (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="tauxTVA"
                value={formData.tauxTVA}
                onChange={handleInputChange}
                placeholder="Ex: 20, 10, 5.5"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour utiliser le taux par défaut (19%)
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Description de la catégorie..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Bouton d'ajout/modification */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                isEditing
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
              } text-white`}
            >
              {isEditing ? (
                <>
                  <PencilIcon className="w-5 h-5" />
                  <span>Modifier la catégorie</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  <span>Ajouter la catégorie</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Liste des catégories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Liste des catégories
            {categories.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({categories.length} catégorie{categories.length > 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune catégorie trouvée</p>
            <p className="text-sm mt-1">Ajoutez votre première catégorie via le formulaire ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((categorie) => (
                  <tr key={categorie.idCategorie} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categorie.idCategorie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {categorie.nomCategorie}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {categorie.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {categorie.tauxTVA ? `${categorie.tauxTVA}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleEdit(categorie)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(categorie)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionCategories;