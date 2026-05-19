// produits/ProduitFormBase.jsx - Version SANS remise temporaire
import React from 'react';
import { 
  XMarkIcon, 
  EnvelopeIcon,    
  PhoneIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const UNITE_MESURE_OPTIONS = [
  { value: 'PIECE', label: 'Pièce' },
  { value: 'KILOGRAMME', label: 'Kilogramme' },
  { value: 'GRAMME', label: 'Gramme' },
  { value: 'LITRE', label: 'Litre' },
  { value: 'MILLILITRE', label: 'Millilitre' },
  { value: 'METRE', label: 'Mètre' },
];

const ProduitFormBase = ({
  formData,
  errors,
  categories,
  handleChange,
  handleImageChange,    
  handleRemoveImage,      
  imagePreview,       
  handleCategorieChange,
  handleSubmit,
  onClose,
  isEditMode,
  title,
  stockDisabled = false,
  fournisseursDisponibles = [],
  loadingFournisseurs = false,
  categorieRemiseStandard = 0,
  prixApresRemise = 0,
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle || ''}
                onChange={handleChange}
                className={`w-full border ${errors.libelle ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.libelle && <p className="mt-1 text-sm text-red-600">{errors.libelle}</p>}
            </div>

            {/* Prix d'achat et Prix de vente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix d'achat <span className="text-red-500">*</span> DT
                </label>
                <input
                  type="text"
                  name="prixAchat"
                  value={formData.prixAchat || ''}
                  onChange={handleChange}
                  className={`w-full border ${errors.prixAchat ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="0"
                />
                {errors.prixAchat && <p className="mt-1 text-sm text-red-600">{errors.prixAchat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de vente <span className="text-red-500">*</span> DT
                </label>
                <input
                  type="text"
                  name="prixVente"
                  value={formData.prixVente || ''}
                  onChange={handleChange}
                  className={`w-full border ${errors.prixVente ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="0"
                />
                {errors.prixVente && <p className="mt-1 text-sm text-red-600">{errors.prixVente}</p>}
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categorie?.idCategorie || ''}
                onChange={handleCategorieChange}
                className={`w-full border ${errors.categorie ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories && categories.map(cat => (
                  <option key={cat.idCategorie} value={cat.idCategorie}>
                    {cat.nomCategorie || cat.libelle || 'Sans catégorie'}
                    {cat.remiseStandard > 0 ? ` (remise: ${cat.remiseStandard}%)` : ''}
                  </option>
                ))}
              </select>
              {errors.categorie && <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>}
            </div>

          {/* Affichage de la remise standard - Version champ désactivé */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Remise standard (%)
    </label>
    <div className="relative">
      <input
        type="number"
        value={categorieRemiseStandard}
        disabled
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="text-gray-400 text-sm">%</span>
      </div>
    </div>
  </div>


</div>
          </div>

          {/* SECTION FOURNISSEUR */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">🏢 Fournisseur</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              {loadingFournisseurs ? (
                <div className="text-center py-4 text-gray-500">Chargement des fournisseurs...</div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fournisseur <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fournisseurId"
                    value={formData.fournisseurId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Sélectionner un fournisseur --</option>
                    {fournisseursDisponibles.map(f => (
                      <option key={f.idFournisseur} value={f.idFournisseur}>
                        {f.nomFournisseur} - {f.email}
                      </option>
                    ))}
                  </select>
                  
                  {formData.fournisseurId && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Informations du fournisseur</p>
                      {(() => {
                        const fournisseur = fournisseursDisponibles.find(f => f.idFournisseur === formData.fournisseurId);
                        if (!fournisseur) return null;
                        return (
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-1">
                              <EnvelopeIcon className="h-3 w-3 text-gray-500" />
                              {fournisseur.email || 'Email non renseigné'}
                            </p>
                            <p className="flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3 text-gray-500" />
                              {fournisseur.telephone || 'Téléphone non renseigné'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fournisseur.adresse ? `${fournisseur.adresse}, ${fournisseur.ville || ''} ${fournisseur.pays || ''}` : 'Adresse non renseignée'}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gestion du stock */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Gestion du stock</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock actuel
                </label>
                <input
                  type="number"
                  name="quantiteStock"
                  value={formData.quantiteStock || 0}
                  onChange={handleChange}
                  disabled={stockDisabled}
                  min="0"
                  step="1"
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    stockDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seuil minimum</label>
                <input
                  type="number"
                  name="seuilMinimum"
                  value={formData.seuilMinimum || 3}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité de mesure <span className="text-red-500">*</span>
                </label>
                <select
                  name="uniteMesure"
                  value={formData.uniteMesure || 'PIECE'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {UNITE_MESURE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Informations commerciales - Statut uniquement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Statut</h3>

            <div className="flex items-center gap-4">
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

          {/* Image du produit */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Image du produit</h3>
            
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              {imagePreview && (
                <div className="relative flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="h-20 w-20 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                    onError={(e) => {
                      console.error('Erreur chargement image:', imagePreview);
                      e.target.src = '/placeholder-image.png'; 
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
                    title="Supprimer l'image"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
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
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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