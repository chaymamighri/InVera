// src/pages/dashboard/sales/products/components/OrderModal/index.jsx
import React, { useEffect } from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import SelectedProductsSection from './SelectedProductsSection';
import ClientSelectionSection from './ClientSelectionSection';

const OrderModal = ({
  showCreateOrder,
  setShowCreateOrder,
  selectedProducts,
  setSelectedProducts,
  clients,
  selectedClient,
  setSelectedClient,
  remiseAppliquee,
  handleSelectClient,
  handleCreateCommande,
  checkDisponibilite,
  loadingClients,
  applyRemiseByClientType,
  loadClients,
  onOrderCreated,
  t = (key) => key,
  isArabic = false
}) => {
  // Réinitialiser le client sélectionné quand le modal s'ouvre
  useEffect(() => {
    if (showCreateOrder) {
      setSelectedClient(null);
    }
  }, [showCreateOrder, setSelectedClient]);

  if (!showCreateOrder) return null;

  // Calculer le nombre de produits avec stock insuffisant
  const produitsAvecStockInsuffisant = selectedProducts.filter(p => {
    const quantiteCommande = p.quantiteCommande || p.quantite || 1;
    const stockDisponible = p.quantiteStock || 0;
    return stockDisponible < quantiteCommande;
  }).length;

  const isDisponible = checkDisponibilite ? checkDisponibilite(selectedProducts) : produitsAvecStockInsuffisant === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t('createClientOrderWithCount') || `Nouvelle commande (${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''})`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('selectedProductsCount', { count: selectedProducts.length }) || `${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''} sélectionné${selectedProducts.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setShowCreateOrder(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Section Produits Sélectionnés */}
          <SelectedProductsSection 
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            remiseAppliquee={remiseAppliquee}
            t={t}
          />

          {/* Section Sélection Client */}
          <ClientSelectionSection
            clients={clients}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            remiseAppliquee={remiseAppliquee}
            handleSelectClient={handleSelectClient}
            loadingClients={loadingClients}
            applyRemiseByClientType={applyRemiseByClientType}
            loadClients={loadClients}
            t={t}
            isArabic={isArabic}
          />

          {/* Vérification de disponibilité */}
          <div className="mb-6">
            <div className={`p-4 rounded-xl ${isDisponible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {isDisponible ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`font-medium ${isDisponible ? 'text-green-700' : 'text-red-700'}`}>
                    {isDisponible 
                      ? (t('allProductsAvailable') || 'Tous les produits sont disponibles')
                      : (t('availabilityProblem') || 'Problème de disponibilité')}
                  </span>
                  {!isDisponible && (
                    <p className="text-sm text-red-600 mt-1">
                      {t('productsWithInsufficientStock', { count: produitsAvecStockInsuffisant }) 
                        || `${produitsAvecStockInsuffisant} produit(s) avec stock insuffisant`}
                    </p>
                  )}
                  {isDisponible && (
                    <p className="text-sm text-green-600 mt-1">
                      {t('orderCanBeProcessed') || 'La commande peut être traitée'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Boutons Créer/Annuler */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCreateOrder(false)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {t('cancel') || 'Annuler'}
            </button>
            <button
              onClick={handleCreateCommande}
              disabled={!selectedClient || !isDisponible}
              className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-sm transition-all`}
            >
              <ShoppingCartIcon className="h-4 w-4" />
              {t('createOrder') || 'Créer la commande'}
              {remiseAppliquee > 0 && (
                <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  -{remiseAppliquee}%
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;