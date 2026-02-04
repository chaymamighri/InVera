// src/pages/dashboard/sales/products/components/ProductStats.jsx
import React from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const ProductStats = ({ stats, selectedProducts, handleCreateOrder }) => {
  if (selectedProducts) {
    return (
      <div className="mt-4 md:mt-0 flex items-center space-x-4">
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
          <span className="font-medium">{selectedProducts.length}</span> produit(s) sélectionné(s)
        </div>
        <button
          onClick={handleCreateOrder}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium flex items-center"
        >
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Créer Commande ({selectedProducts.length})
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm text-blue-600 font-medium">Total</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalProduits}</p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
        <p className="text-sm text-green-600 font-medium">En Stock</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{stats.enStock}</p>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
        <p className="text-sm text-yellow-600 font-medium">Faible</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{stats.stockFaible}</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
        <p className="text-sm text-orange-600 font-medium">Critique</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{stats.stockCritique}</p>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
        <p className="text-sm text-red-600 font-medium">Rupture</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{stats.rupture}</p>
      </div>
    </div>
  );
};

export default ProductStats;