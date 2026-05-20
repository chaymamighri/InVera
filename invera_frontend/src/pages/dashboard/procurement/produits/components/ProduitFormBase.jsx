// produits/ProduitFormBase.jsx - Version SANS remise temporaire
import React from 'react';
import { 
  XMarkIcon, 
  EnvelopeIcon,    
  PhoneIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const UNITE_MESURE_OPTIONS = [
  { value: 'PIECE', labelKey: 'unitPiece' },
  { value: 'KILOGRAMME', labelKey: 'unitKilogram' },
  { value: 'GRAMME', labelKey: 'unitGram' },
  { value: 'LITRE', labelKey: 'unitLiter' },
  { value: 'MILLILITRE', labelKey: 'unitMilliliter' },
  { value: 'METRE', labelKey: 'unitMeter' },
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
  const { t, isArabic } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            title={t('dashboard.procurementProductsPage.cancel')}
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {t('dashboard.procurementProductsPage.productGeneralInfo')}
            </h3>

            <FieldErrorTextInput
              label={t('dashboard.procurementProductsPage.productNameLabel')}
              name="libelle"
              value={formData.libelle || ''}
              error={errors.libelle}
              onChange={handleChange}
              required
            />

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

              <FieldErrorTextInput
                label={`${t('dashboard.procurementProductsPage.salesPriceLabel')} DT`}
                name="prixVente"
                value={formData.prixVente || ''}
                error={errors.prixVente}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.procurementProductsPage.categoryLabel')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categorie?.idCategorie || ''}
                onChange={handleCategorieChange}
                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  errors.categorie ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('dashboard.procurementProductsPage.categorySelectPlaceholder')}</option>
                {categories?.map((cat) => (
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
            <h3 className="text-lg font-semibold text-gray-700">
              {t('dashboard.procurementProductsPage.supplierSectionTitle')}
            </h3>

            <div className="rounded-lg border bg-gray-50 p-4">
              {loadingFournisseurs ? (
                <div className="py-4 text-center text-gray-500">
                  {t('dashboard.procurementProductsPage.loadingSuppliers')}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('dashboard.procurementProductsPage.supplierLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fournisseurId"
                    value={formData.fournisseurId || ''}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.fournisseurId ? 'border-red-500' : ''
                    }`}
                    required
                  >
                    <option value="">{t('dashboard.procurementProductsPage.selectSupplierPlaceholder')}</option>
                    {fournisseursDisponibles.map((fournisseur) => (
                      <option key={fournisseur.idFournisseur} value={fournisseur.idFournisseur}>
                        {fournisseur.nomFournisseur} - {fournisseur.email}
                      </option>
                    ))}
                  </select>
                  
                  {formData.fournisseurId && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="mb-1 text-xs text-blue-600">
                        {t('dashboard.procurementProductsPage.supplierInfoTitle')}
                      </p>
                      {(() => {
                        const fournisseur = fournisseursDisponibles.find(
                          (item) => String(item.idFournisseur) === String(formData.fournisseurId)
                        );
                        if (!fournisseur) return null;
                        return (
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-1">
                              <EnvelopeIcon className="h-3 w-3 text-gray-500" />
                              {fournisseur.email || t('dashboard.procurementProductsPage.emailNotProvided')}
                            </p>
                            <p className="flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3 text-gray-500" />
                              {fournisseur.telephone || t('dashboard.procurementProductsPage.phoneNotProvided')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fournisseur.adresse
                                ? `${fournisseur.adresse}, ${fournisseur.ville || ''} ${fournisseur.pays || ''}`
                                : t('dashboard.procurementProductsPage.addressNotProvided')}
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {t('dashboard.procurementProductsPage.stockManagementTitle')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('dashboard.procurementProductsPage.currentStockLabel')}
                </label>
                <input
                  type="number"
                  name="quantiteStock"
                  value={formData.quantiteStock || 0}
                  onChange={handleChange}
                  disabled={stockDisabled}
                  min="0"
                  step="1"
                  className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                    stockDisabled ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('dashboard.procurementProductsPage.minimumThresholdLabel')}
                </label>
                <input
                  type="number"
                  name="seuilMinimum"
                  value={formData.seuilMinimum || 3}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                    errors.seuilMinimum ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.seuilMinimum && <p className="mt-1 text-sm text-red-600">{errors.seuilMinimum}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('dashboard.procurementProductsPage.measurementUnitLabel')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="uniteMesure"
                  value={formData.uniteMesure || 'PIECE'}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {UNITE_MESURE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`dashboard.procurementProductsPage.${option.labelKey}`)}
                    </option>
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

          <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('dashboard.procurementProductsPage.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-6 py-2 text-white transition-colors hover:bg-emerald-700"
            >
              {isEditMode
                ? t('dashboard.procurementProductsPage.updateProductButton')
                : t('dashboard.procurementProductsPage.createProductButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FieldErrorTextInput = ({ label, name, value, error, onChange, placeholder, required }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      placeholder={placeholder}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default ProduitFormBase;
