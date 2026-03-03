// produits/ProduitFormBase.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const UNITE_MESURE_OPTIONS = [
  { value: 'pièce', label: 'Pièce' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'g', label: 'Gramme' },
  { value: 'L', label: 'Litre' },
  { value: 'ml', label: 'Millilitre' },
  { value: 'm', label: 'Mètre' },
  { value: 'boîte', label: 'Boîte' },
  { value: 'carton', label: 'Carton' },
  { value: 'palette', label: 'Palette' },
];

const ProduitFormBase = ({
  formData,
  errors,
  categories,
  handleChange,
  handleCategorieChange,
  handleSubmit,
  onClose,
  isEditMode,
  title
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Informations générales</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Libellé *</label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleChange}
                className={`w-full border ${errors.libelle ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.libelle && <p className="mt-1 text-sm text-red-600">{errors.libelle}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat * (F CFA)</label>
                <input
                  type="number"
                  name="prixAchat"
                  value={formData.prixAchat}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className={`w-full border ${errors.prixAchat ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.prixAchat && <p className="mt-1 text-sm text-red-600">{errors.prixAchat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente * (F CFA)</label>
                <input
                  type="number"
                  name="prixVente"
                  value={formData.prixVente}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className={`w-full border ${errors.prixVente ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.prixVente && <p className="mt-1 text-sm text-red-600">{errors.prixVente}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                value={formData.categorie?.idCategorie || ''}
                onChange={handleCategorieChange}
                className={`w-full border ${errors.categorie ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.idCategorie} value={cat.idCategorie}>{cat.libelle}</option>
                ))}
              </select>
              {errors.categorie && <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>}
            </div>
          </div>

          {/* Gestion du stock */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Gestion du stock</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité initiale</label>
                <input
                  type="number"
                  name="quantiteStock"
                  value={formData.quantiteStock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité de mesure *</label>
                <select
                  name="uniteMesure"
                  value={formData.uniteMesure}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {UNITE_MESURE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil minimum d'alerte *</label>
              <input
                type="number"
                name="seuilMinimum"
                value={formData.seuilMinimum}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                En dessous de ce seuil, le produit sera marqué comme "stock faible"
              </p>
            </div>
          </div>

          {/* Informations commerciales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Informations commerciales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remise temporaire (%)</label>
                <input
                  type="number"
                  name="remiseTemporaire"
                  value={formData.remiseTemporaire}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="active"
                      checked={formData.active === true}
                      onChange={() => handleChange({ target: { name: 'active', value: true } })}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Actif</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="active"
                      checked={formData.active === false}
                      onChange={() => handleChange({ target: { name: 'active', value: false } })}
                      className="text-red-600"
                    />
                    <span className="text-sm">Inactif</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditMode ? 'Modifier' : 'Créer'} le produit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProduitFormBase;