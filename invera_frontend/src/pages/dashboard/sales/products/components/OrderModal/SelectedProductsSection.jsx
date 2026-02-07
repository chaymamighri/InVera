// src/pages/dashboard/sales/products/components/OrderModal/SelectedProductsSection.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SelectedProductsSection = ({ 
  selectedProducts, 
  setSelectedProducts, 
  remiseAppliquee 
}) => {
  // Fonction pour modifier la quantité
  const handleChangeQuantite = (productId, newQuantite) => {
    const updatedProducts = selectedProducts.map(p => 
      p.idProduit === productId 
        ? { ...p, quantiteCommande: Math.max(1, Math.min(newQuantite, p.quantiteStock)) }
        : p
    );
    setSelectedProducts(updatedProducts);
  };

  // Fonction pour retirer un produit
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.idProduit !== productId));
  };

  // Calculer les totaux
  const calculateTotals = (products, remise) => {
    const sousTotal = products.reduce((sum, p) => 
      sum + ((p.prix || p.prixVente || 0) * (p.quantiteCommande || 1)), 0
    );
    const montantRemise = sousTotal * (remise / 100);
    const total = sousTotal - montantRemise;
    
    return {
      sousTotal: sousTotal.toFixed(2),
      montantRemise: montantRemise.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const totaux = calculateTotals(selectedProducts, remiseAppliquee);

  return (
    <div className="mb-8">
      <h3 className="font-bold text-gray-800 mb-4">Produits Sélectionnés</h3>
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedProducts.map(product => (
            <div key={product.idProduit || product.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={product.imageUrl} 
                    alt={product.libelle} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{product.libelle}</div>
                  <div className="text-sm text-gray-600">
                    {product.prix?.toFixed(2) || product.prixVente?.toFixed(2) || '0.00'} dt
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Stock: {product.quantiteStock || 0} {product.uniteMesure || 'unité'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleChangeQuantite(product.idProduit || product.id, (product.quantiteCommande || 1) - 1)}
                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    disabled={(product.quantiteCommande || 1) <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.quantiteStock}
                    value={product.quantiteCommande || 1}
                    onChange={(e) => handleChangeQuantite(product.idProduit || product.id, parseInt(e.target.value) || 1)}
                    className="w-14 text-center py-1.5 bg-white border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                  <button
                    onClick={() => handleChangeQuantite(product.idProduit || product.id, (product.quantiteCommande || 1) + 1)}
                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    disabled={(product.quantiteCommande || 1) >= (product.quantiteStock || 0)}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.idProduit || product.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Retirer"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-gray-700 font-medium">Sous-total</div>
            <div className="font-bold text-gray-900 text-lg">{totaux.sousTotal} dt</div>
          </div>
          {remiseAppliquee > 0 && (
            <>
              <div className="flex justify-between items-center mt-2">
                <div className="text-gray-700">
                  Remise ({remiseAppliquee}%)
                </div>
                <div className="font-medium text-red-600">-{totaux.montantRemise} dt</div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <div className="text-gray-700 font-bold">Total</div>
                <div className="font-bold text-green-600 text-xl">{totaux.total} dt</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedProductsSection;