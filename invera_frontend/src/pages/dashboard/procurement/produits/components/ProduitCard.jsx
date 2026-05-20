// produits/components/ProduitCard.jsx
import React, { useState } from 'react';
import {
  CheckCircleIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const getLocale = (language) => (language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR');

const ProduitCard = ({
  produit,
  onEdit,
  onToggleActive,
  getStatusColor,
  getStatusLabel,
  isFocused = false,
  focusedBadgeText = '',
}) => {
  const { t, language, isArabic } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation();

    e.nativeEvent?.stopImmediatePropagation?.();

    if (e.target instanceof HTMLButtonElement) {
      e.target.blur();
    }

    onToggleActive(produit.idProduit, produit.active);
    return false;
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!produit) {
      console.error('Erreur: produit est null');
      return;
    }

    const productId = produit.idProduit || produit.id;
    if (!productId) {
      console.error('Erreur: produit.id est manquant');
      return;
    }

    onEdit(produit);
  };

  const getImageUrl = () => {
    if (!produit.imageUrl) return null;

    if (produit.imageUrl.startsWith('http')) {
      return produit.imageUrl;
    }

    const cleanPath = produit.imageUrl.replace(/^\/+|\/+$/g, '');
    return `http://localhost:8081/${cleanPath}`;
  };

  const handleImageError = () => {
    console.error('Erreur chargement image:', produit.imageUrl);
    setImageError(true);
  };

  const formatPrice = (price) => {
    const amount = Number(price);

    return new Intl.NumberFormat(getLocale(language), {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  // ========== RÉCUPÉRATION DE LA REMISE ==========
  // La remise peut être soit remiseTemporaire (spécifique au produit) 
  // soit remiseStandard (de la catégorie)
  const getRemiseValue = () => {
    // Priorité à la remise temporaire du produit
    if (produit.remiseTemporaire && produit.remiseTemporaire > 0) {
      return { value: produit.remiseTemporaire, type: 'temporaire' };
    }
    // Sinon utiliser la remise standard de la catégorie
    if (produit.remiseStandard && produit.remiseStandard > 0) {
      return { value: produit.remiseStandard, type: 'standard' };
    }
    // Fallback pour compatibilité
    if (produit.remise && produit.remise > 0) {
      return { value: produit.remise, type: 'standard' };
    }
    return null;
  };

  const remise = getRemiseValue();

  const imageUrl = getImageUrl();
  const hasValidImage = imageUrl && !imageError;
  const actionSideClass = isArabic ? 'right-3' : 'left-3';
  const statusSideClass = isArabic ? 'left-4' : 'right-4';

  return (
    <div
      className={`relative flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
        !produit.active ? 'bg-gray-50 opacity-75' : ''
      } ${isFocused ? 'border-amber-300 bg-amber-50/80 ring-2 ring-amber-200 shadow-xl' : ''}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className={`absolute top-3 ${actionSideClass} z-10 flex gap-1`}>
        <button
          type="button"
          onClick={handleEditClick}
          className="group rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm transition-colors hover:bg-blue-50"
          title={t('dashboard.procurementProductsPage.editProductTooltip')}
        >
          <PencilSquareIcon className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
        </button>

        <button
          type="button"
          onClick={handleToggleClick}
          className={`rounded-lg border bg-white p-1.5 shadow-sm transition-colors ${
            produit.active
              ? 'border-gray-200 hover:border-red-200 hover:bg-red-50'
              : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
          }`}
          title={
            produit.active
              ? t('dashboard.procurementProductsPage.deactivateProductTooltip')
              : t('dashboard.procurementProductsPage.activateProductTooltip')
          }
        >
          {produit.active ? (
            <XCircleIcon className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          )}
        </button>
      </div>

      <div className={`absolute top-4 ${statusSideClass} z-10`}>
        <span
          className={`inline-block h-3 w-3 rounded-full ${produit.active ? 'animate-pulse bg-green-500' : 'bg-red-500'}`}
          title={
            produit.active
              ? t('dashboard.procurementProductsPage.activeProductTooltip')
              : t('dashboard.procurementProductsPage.inactiveProductTooltip')
          }
        />
      </div>

      <div className="flex flex-1 flex-col p-4 pt-12">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-blue-100 to-cyan-100">
            {hasValidImage ? (
              <img
                src={imageUrl}
                alt={produit.libelle}
                className="h-full w-full object-cover"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                <span className="text-lg font-bold text-white">{produit.libelle?.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900">{produit.libelle}</h3>
            <p className="truncate text-xs text-gray-600">
              {produit.categorieNom || t('dashboard.procurementProductsPage.noCategory')}
            </p>
            {isFocused && focusedBadgeText && (
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                {focusedBadgeText}
              </div>
            )}
          </div>
        </div>

<<<<<<< HEAD
        {/* ========== INFORMATIONS PRIX ========== */}
=======
>>>>>>> 8d698ff8e43b12120212d9a31aa24519819153a9
        <div className="mb-3">
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-600">{t('dashboard.procurementProductsPage.salesPriceShort')}</p>
            <p className="truncate text-base font-semibold text-blue-700">{formatPrice(produit.prixVente)}</p>
          </div>
        </div>

        <div className="mb-3 space-y-1">
          <InfoRow
            label={t('dashboard.procurementProductsPage.currentStockLabel')}
            value={`${produit.quantiteStock} ${produit.uniteMesure}`}
            valueClassName="font-bold text-gray-900"
          />
          <InfoRow
            label={t('dashboard.procurementProductsPage.minimumThresholdLabel')}
            value={`${produit.seuilMinimum} ${produit.uniteMesure}`}
            valueClassName="font-medium text-gray-800"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('dashboard.procurementProductsPage.stockStatusLabel')}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(produit.status)}`}>
              {getStatusLabel(produit.status)}
            </span>
          </div>
        </div>

<<<<<<< HEAD
        {/* ========== REMISE CORRIGÉE ========== */}
        {remise && (
          <div className={`p-2 rounded-lg border mb-3 ${
            remise.type === 'temporaire' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-xs ${
              remise.type === 'temporaire' ? 'text-green-700' : 'text-blue-700'
            }`}>
              {remise.type === 'temporaire' ? 'Remise temporaire' : 'Remise standard'}
            </p>
            <p className={`text-sm font-semibold ${
              remise.type === 'temporaire' ? 'text-green-800' : 'text-blue-800'
            }`}>
              {remise.value}%
            </p>
=======
        {produit.remise > 0 && (
          <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2">
            <p className="text-xs text-green-700">{t('dashboard.procurementProductsPage.temporaryDiscountShort')}</p>
            <p className="text-sm font-semibold text-green-800">{produit.remise}%</p>
>>>>>>> 8d698ff8e43b12120212d9a31aa24519819153a9
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, valueClassName }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className={valueClassName}>{value}</span>
  </div>
);

export default ProduitCard;
