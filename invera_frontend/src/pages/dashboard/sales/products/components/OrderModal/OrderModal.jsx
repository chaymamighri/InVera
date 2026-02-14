// src/pages/dashboard/sales/products/components/OrderModal/index.jsx
import React from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import SelectedProductsSection from './SelectedProductsSection';
import ClientSelectionSection from './ClientSelectionSection';
import { useNavigate } from 'react-router-dom';

const OrderModal = ({
  showCreateOrder,
  setShowCreateOrder,
  selectedProducts,
  setSelectedProducts,
  clients,
  selectedClient,
  setSelectedClient,
  newClientMode,
  setNewClientMode,
  nouveauClient,
  setNouveauClient,
  remiseAppliquee,
  handleSelectClient,
  handleCreateCommande,
  checkDisponibilite,
  clientTypes,
  loadClients,
  loadingClients,
  applyRemiseByClientType,
  onOrderCreated
}) => {
  const navigate = useNavigate();
  
  if (!showCreateOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Créer une Commande Client ({selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''})
            </h2>
            <button
              onClick={() => setShowCreateOrder(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Section Produits Sélectionnés */}
          <SelectedProductsSection 
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            remiseAppliquee={remiseAppliquee}
          />

          {/* Section Sélection Client */}
          <ClientSelectionSection
            clients={clients}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            newClientMode={newClientMode}
            setNewClientMode={setNewClientMode}
            nouveauClient={nouveauClient}
            setNouveauClient={setNouveauClient}
            remiseAppliquee={remiseAppliquee}
            handleSelectClient={handleSelectClient}
            clientTypes={clientTypes}
            loadingClients={loadingClients}
            applyRemiseByClientType={applyRemiseByClientType}
            loadClients={loadClients}
          />

          {/* Vérification de disponibilité */}
          <div className="mb-8">
            <div className={`p-4 rounded-xl ${checkDisponibilite(selectedProducts) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {checkDisponibilite(selectedProducts) ? (
                  <>
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <span className="text-green-700 font-medium">Tous les produits sont disponibles</span>
                      <p className="text-sm text-green-600 mt-1">
                        La commande peut être traitée immédiatement
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                      <span className="text-red-700 font-medium">Problème de disponibilité</span>
                      <p className="text-sm text-red-600 mt-1">
                        {selectedProducts.filter(p => (p.quantiteStock || 0) < (p.quantiteCommande || 1)).length} 
                        produit(s) avec stock insuffisant
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Boutons Créer/Annuler */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowCreateOrder(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateCommande}
              disabled={!selectedClient || !checkDisponibilite(selectedProducts)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center shadow-sm hover:shadow-md transition-all"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Créer la Commande
              {remiseAppliquee > 0 && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
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