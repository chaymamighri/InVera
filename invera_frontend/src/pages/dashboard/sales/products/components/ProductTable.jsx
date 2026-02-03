// src/pages/dashboard/sales/products/components/ProductTable.jsx
import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ShoppingCartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const ProductTable = ({ 
  products, 
  selectedProducts, 
  handleSelectProduct, 
  sortField, 
  sortDirection, 
  handleSort, 
  getStatusColor,
  setSelectedProducts,
  checkDisponibilite,
  calculerTotaux
}) => {
  
  // Gérer la sélection/désélection de tous les produits
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Sélectionner seulement les produits disponibles (non en rupture)
      const produitsDisponibles = products.filter(p => p.statut !== 'Rupture');
      const nouveauxProduits = produitsDisponibles
        .filter(p => !selectedProducts.some(sp => sp.id === p.id))
        .map(p => ({ ...p, quantiteCommande: 1 }));
      setSelectedProducts([...selectedProducts, ...nouveauxProduits]);
    } else {
      // Désélectionner tous les produits affichés
      const produitsAffichésIds = products.map(p => p.id);
      setSelectedProducts(selectedProducts.filter(sp => 
        !produitsAffichésIds.includes(sp.id)
      ));
    }
  };

  // Modifier la quantité d'un produit sélectionné
  const handleChangeQuantite = (productId, newQuantite) => {
    const updatedProducts = selectedProducts.map(p => 
      p.id === productId 
        ? { ...p, quantiteCommande: Math.max(1, Math.min(newQuantite, p.quantiteStock)) }
        : p
    );
    setSelectedProducts(updatedProducts);
  };

  // Retirer un produit de la sélection
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Vérifier si un produit spécifique est disponible
  const checkDisponibiliteProduit = (product) => {
    const selectedProduct = selectedProducts.find(p => p.id === product.id);
    if (!selectedProduct) return true;
    return product.quantiteStock >= selectedProduct.quantiteCommande;
  };

  // Calculer si tous les produits affichés sont sélectionnés
  const allProductsSelected = products.length > 0 && 
    products.every(p => 
      p.statut === 'Rupture' || selectedProducts.some(sp => sp.id === p.id)
    );

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={allProductsSelected}
                    onChange={handleSelectAll}
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('libelle')}
              >
                <div className="flex items-center">
                  Produit
                  {sortField === 'libelle' && (
                    sortDirection === 'asc' ? 
                      <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                      <ArrowDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('prix')}
              >
                <div className="flex items-center">
                  Prix et remise
                  {sortField === 'prix' && (
                    sortDirection === 'asc' ? 
                      <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                      <ArrowDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantiteStock')}
              >
                <div className="flex items-center">
                  Stock
                  {sortField === 'quantiteStock' && (
                    sortDirection === 'asc' ? 
                      <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                      <ArrowDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sélection
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const isSelected = selectedProducts.some(p => p.id === product.id);
              const selectedProduct = selectedProducts.find(p => p.id === product.id);
              const quantiteCommande = selectedProduct?.quantiteCommande || 1;
              const isAvailable = checkDisponibiliteProduit(product);
              
              return (
                <tr key={product.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-25' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={isSelected}
                        onChange={() => handleSelectProduct(product)}
                        disabled={product.statut === 'Rupture'}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
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
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{product.libelle}</div>
                      <div className="text-sm text-gray-500">
                        {product.categorie} • {product.uniteMesure}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Types clients: {product.typeClientAutorise?.join(', ') || 'Tous'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900">
                        {product.prix.toFixed(2)} dt
                      </div>
                      {product.remise > 0 && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 line-through mr-2">
                            {product.prixInitial.toFixed(2)} dt
                          </span>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            -{product.remise}%
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className={`font-medium ${
                        product.quantiteStock > product.seuilMinimum ? 'text-green-600' :
                        product.quantiteStock > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.quantiteStock} {product.uniteMesure}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.statut)}`}>
                        {product.statut}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isSelected ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm flex items-center"
                          title="Retirer de la commande"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Retirer
                        </button>
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleChangeQuantite(product.id, quantiteCommande - 1)}
                            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={quantiteCommande <= 1}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.quantiteStock}
                            value={quantiteCommande}
                            onChange={(e) => handleChangeQuantite(product.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center py-1.5 border-x focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleChangeQuantite(product.id, quantiteCommande + 1)}
                            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={quantiteCommande >= product.quantiteStock}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {!isAvailable && (
                          <div className="flex items-center text-red-600 text-xs">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Stock insuffisant
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectProduct(product)}
                        disabled={product.statut === 'Rupture'}
                        className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center ${
                          product.statut === 'Rupture'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                        }`}
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        {product.statut === 'Rupture' ? 'Rupture' : 'Sélectionner'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 text-gray-300">📦</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun produit trouvé</h3>
          <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {/* Aperçu des produits sélectionnés */}
      {selectedProducts.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{selectedProducts.length}</span> produit(s) sélectionné(s) • 
              Total: <span className="font-bold text-blue-600">
                {calculerTotaux(selectedProducts).sousTotal} dt
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center text-sm ${checkDisponibilite(selectedProducts) ? 'text-green-600' : 'text-red-600'}`}>
                {checkDisponibilite(selectedProducts) ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Tous disponibles
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 mr-1" />
                    Stock insuffisant
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;