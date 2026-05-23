/**
 * GestionCategories - Gestion des categories de produits
 *
 * ROLE : Gerer les categories de produits (CRUD)
 * ROUTE : /dashboard/procurement/categories
 *
 * FONCTIONNALITÉS :
 * - Liste des catégories avec tableau
 * - Création de catégorie (nom, description, taux TVA, remise standard)
 * - Modification de catégorie
 * - Suppression avec confirmation
 * - Validation des champs
 * - Rafraîchissement automatique après action
 */
import React, { useState, useEffect } from 'react';
import { 
  TrashIcon, 
  PlusIcon, 
  PencilIcon, 
  XMarkIcon, 
  TagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../../context/LanguageContext';
import categorieService from '../../../../services/categorieService';

const GestionCategories = () => {
  const { t, isArabic } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomCategorie: '',
    description: '',
    tauxTVA: '',
    remiseStandard: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categorieService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Erreur lors du chargement des categories:', err);
      toast.error(err.message || t('dashboard.procurementCategoriesPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      nomCategorie: '',
      description: '',
      tauxTVA: '',
      remiseStandard: 0
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Pour les nombres, convertir en float/int
    if (name === 'tauxTVA' || name === 'remiseStandard') {
      parsedValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleEdit = (categorie) => {
    setFormData({
      nomCategorie: categorie.nomCategorie,
      description: categorie.description || '',
      tauxTVA: categorie.tauxTVA || '',
      remiseStandard: categorie.remiseStandard || 0
    });
    setIsEditing(true);
    setEditingId(categorie.idCategorie);
    document.getElementById('form-categorie')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nomCategorie.trim()) {
      toast.error(t('dashboard.procurementCategoriesPage.nameRequired'));
      return;
    }

    if (!formData.tauxTVA && formData.tauxTVA !== 0) {
      toast.error('Le taux de TVA est requis');
      return;
    }

    // Validation de la remise (0-100)
    const remiseValue = parseFloat(formData.remiseStandard) || 0;
    if (remiseValue < 0 || remiseValue > 100) {
      toast.error('La remise standard doit être comprise entre 0% et 100%');
      return;
    }

    try {
      const payload = {
        nomCategorie: formData.nomCategorie.trim(),
        description: formData.description.trim(),
        tauxTVA: parseFloat(formData.tauxTVA),
        remiseStandard: remiseValue
      };

      if (isEditing) {
        await categorieService.updateCategorie(editingId, payload);
        toast.success(`✏️ Catégorie "${formData.nomCategorie}" modifiée avec succès !`);
      } else {
        await categorieService.createCategorie(payload);
        toast.success(`✅ Catégorie "${formData.nomCategorie}" ajoutée avec succès !`);
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      console.error("Erreur lors de l'operation:", err);
      toast.error(err.message || t('dashboard.procurementCategoriesPage.operationError'));
    }
  };

  const openDeleteModal = (categorie) => {
    setCategoryToDelete(categorie);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await categorieService.deleteCategorie(categoryToDelete.idCategorie);
      toast.success(
        `🗑️ Catégorie "${categoryToDelete.nomCategorie}" supprimée avec succès !`
      );
      fetchCategories();
      closeDeleteModal();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error(err.message || t('dashboard.procurementCategoriesPage.deleteError'));
    }
  };

  const direction = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'text-right' : '';

  return (
    <div className={`space-y-6 ${textAlign}`} dir={direction}>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer la suppression
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer la catégorie{' '}
                <span className="font-semibold">{categoryToDelete?.nomCategorie}</span> ?
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Cette action est irréversible et peut affecter les produits associés.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      <div id="form-categorie" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            {isEditing ? (
              <>
                <PencilIcon className="h-5 w-5 text-yellow-600" />
                Modifier la catégorie
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5 text-green-600" />
                Ajouter une catégorie
              </>
            )}
          </h2>
          {isEditing && (
            <button
              onClick={resetForm}
              className="rounded-lg px-3 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              Annuler
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Nom de la catégorie */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nom de la catégorie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nomCategorie"
                value={formData.nomCategorie}
                onChange={handleInputChange}
                placeholder="Ex: Électronique, Vêtements..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Taux TVA */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Taux TVA (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="tauxTVA"
                value={formData.tauxTVA}
                onChange={handleInputChange}
                placeholder="Ex: 19, 20, 7"
                step="0.01"
                min="0"
                max="100"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Taux de TVA applicable aux produits de cette catégorie
              </p>
            </div>

            {/* Remise standard */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Remise standard (%) 
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="remiseStandard"
                  value={formData.remiseStandard}
                  onChange={handleInputChange}
                  placeholder="Ex: 10, 15, 20"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-green-500"
                />
                <TagIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Remise automatique appliquée à tous les produits de cette catégorie
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Description de la catégorie..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`flex items-center gap-2 rounded-lg px-6 py-2 text-white transition-all duration-200 ${
                isEditing
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
              }`}
            >
              {isEditing ? (
                <>
                  <PencilIcon className="h-5 w-5" />
                  <span>Modifier</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  <span>Ajouter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Liste des catégories */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Liste des catégories
            {categories.length > 0 && (
              <span className="mx-2 text-sm font-normal text-gray-500">
                ({categories.length} {categories.length > 1 ? 'catégories' : 'catégorie'})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune catégorie trouvée</p>
            <p className="mt-1 text-sm">Ajoutez votre première catégorie en utilisant le formulaire ci-dessus.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Remise
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {categories.map((categorie) => (
                  <tr key={categorie.idCategorie} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {categorie.idCategorie}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{categorie.nomCategorie}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-sm text-gray-500">
                        {categorie.description || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {categorie.tauxTVA ? `${categorie.tauxTVA}%` : '19%'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        categorie.remiseStandard && categorie.remiseStandard > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {categorie.remiseStandard ? `${categorie.remiseStandard}%` : '0%'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(categorie)}
                          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                          title="Modifier"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(categorie)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
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