// src/pages/dashboard/sales/orders/components/ProductSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import useProducts from '../../../../../hooks/useProducts';

const ProductSelectionModal = ({
  show,
  onClose,
  existingProduits = [],
  onConfirmSelection,
  toNumber
}) => {
  const {
    products,
    loading,
    error,
    pagination,
    searchProducts,
    loadProducts
  } = useProducts({ limit: 5 });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('libelle');
  const [sortDirection, setSortDirection] = useState('asc');

  // Réinitialiser la sélection quand le modal s'ouvre
  useEffect(() => {
    if (show) {
      setSelectedProducts([]);
      setSearchTerm('');
    }
  }, [show]);

  // Charger les produits quand le modal s'ouvre
  useEffect(() => {
    if (show) {
      loadProducts(1);
    }
  }, [show, loadProducts]);

  // Recherche avec debounce
  useEffect(() => {
    if (!show) return;
    
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchProducts(searchTerm);
      } else {
        loadProducts(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, show, searchProducts, loadProducts]);

  if (!show) return null;

  // ✅ Sécurité : s'assurer que existingProduits est un tableau
  const produitsExistants = Array.isArray(existingProduits) ? existingProduits : [];
  
  // Exclure les produits déjà dans la commande
  const produitsExistantIds = produitsExistants
    .map(p => p.produitId)
    .filter(id => id != null);
    
  const produitsDisponibles = products.filter(p => 
    !produitsExistantIds.includes(p.idProduit)
  );

  // Trier les produits
  const produitsTries = [...produitsDisponibles].sort((a, b) => {
    let aVal, bVal;
    
    switch(sortField) {
      case 'libelle':
        aVal = a.libelle || '';
        bVal = b.libelle || '';
        break;
      case 'prixVente':
        aVal = a.prixVente || 0;
        bVal = b.prixVente || 0;
        break;
      case 'quantiteStock':
        aVal = a.quantiteStock || 0;
        bVal = b.quantiteStock || 0;
        break;
      default:
        aVal = a[sortField] || '';
        bVal = b[sortField] || '';
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Gérer la sélection/désélection d'un produit
  const handleSelectProduct = (produit) => {
    const exists = selectedProducts.some(p => p.idProduit === produit.idProduit);
    
    if (exists) {
      setSelectedProducts(selectedProducts.filter(p => p.idProduit !== produit.idProduit));
    } else {
      setSelectedProducts([...selectedProducts, {
        ...produit,
        quantiteCommande: 1
      }]);
    }
  };

  // Gérer la sélection de tous les produits de la page
  const handleSelectAll = () => {
    const allSelected = produitsTries.every(p => 
      selectedProducts.some(sp => sp.idProduit === p.idProduit)
    );

    if (allSelected) {
      setSelectedProducts(selectedProducts.filter(p => 
        !produitsTries.some(pp => pp.idProduit === p.idProduit)
      ));
    } else {
      const nouveaux = produitsTries
        .filter(p => !selectedProducts.some(sp => sp.idProduit === p.idProduit))
        .map(p => ({ ...p, quantiteCommande: 1 }));
      
      setSelectedProducts([...selectedProducts, ...nouveaux]);
    }
  };

  // Modifier la quantité d'un produit sélectionné
  const handleQuantityChange = (produitId, newQuantity) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.idProduit === produitId) {
        const quantite = Math.max(1, parseInt(newQuantity) || 1);
        const stock = p.quantiteStock || 0;
        return {
          ...p,
          quantiteCommande: Math.min(quantite, stock)
        };
      }
      return p;
    }));
  };

  // Retirer un produit de la sélection
  const handleRemoveSelected = (produitId) => {
    setSelectedProducts(selectedProducts.filter(p => p.idProduit !== produitId));
  };

  const isSelected = (produitId) => {
    return selectedProducts.some(p => p.idProduit === produitId);
  };

  const allProductsSelected = produitsTries.length > 0 && 
    produitsTries.every(p => isSelected(p.idProduit));

  const totalSelection = selectedProducts.reduce((sum, p) => 
    sum + (p.prixVente || 0) * (p.quantiteCommande || 1), 0
  );

  const handleConfirm = () => {
    if (selectedProducts.length > 0) {
      onConfirmSelection(selectedProducts);
      onClose();
    }
  };

  const handlePageChange = (newPage) => {
    if (searchTerm) {
      searchProducts(searchTerm, { page: newPage });
    } else {
      loadProducts(newPage);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <CubeIcon className="h-5 w-5 mr-2" />
                Sélectionner des produits
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {selectedProducts.length} produit(s) sélectionné(s) • Total: {totalSelection.toFixed(3)} dt
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Tableau des produits */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des produits...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      checked={allProductsSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortField('libelle');
                      setSortDirection(sortField === 'libelle' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      Produit
                      {sortField === 'libelle' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="ml-1 h-3 w-3" /> : 
                          <ArrowDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortField('prixVente');
                      setSortDirection(sortField === 'prixVente' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      Prix unit.
                      {sortField === 'prixVente' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="ml-1 h-3 w-3" /> : 
                          <ArrowDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortField('quantiteStock');
                      setSortDirection(sortField === 'quantiteStock' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      Stock
                      {sortField === 'quantiteStock' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="ml-1 h-3 w-3" /> : 
                          <ArrowDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produitsTries.map((produit) => {
                  const selected = isSelected(produit.idProduit);
                  const selectedProduct = selectedProducts.find(p => p.idProduit === produit.idProduit);
                  
                  return (
                    <tr key={produit.idProduit} className={`hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          checked={selected}
                          onChange={() => handleSelectProduct(produit)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                            {produit.imageUrl ? (
                              <img
                                src={produit.imageUrl}
                                alt={produit.libelle}
                                className="h-full w-full object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                <CubeIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{produit.libelle}</div>
                            <div className="text-xs text-gray-500">{produit.categorieNom || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {toNumber(produit.prixVente).toFixed(3)} dt
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          (produit.quantiteStock || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {produit.quantiteStock || 0} {produit.uniteMesure || 'unité(s)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {selected && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(produit.idProduit, selectedProduct.quantiteCommande - 1)}
                              disabled={selectedProduct.quantiteCommande <= 1}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={produit.quantiteStock || 1}
                              value={selectedProduct.quantiteCommande}
                              onChange={(e) => handleQuantityChange(produit.idProduit, e.target.value)}
                              className="w-16 text-center py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleQuantityChange(produit.idProduit, selectedProduct.quantiteCommande + 1)}
                              disabled={selectedProduct.quantiteCommande >= (produit.quantiteStock || 0)}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveSelected(produit.idProduit)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {!selected && (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!loading && produitsTries.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <CubeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">Aucun produit trouvé</p>
                      <p className="text-sm mt-1">Essayez de modifier votre recherche</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} sur {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Pied avec boutons d'action */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-600">
            <ShoppingCartIcon className="h-4 w-4 mr-2 text-blue-600" />
            <span>
              <span className="font-bold">{selectedProducts.length}</span> produit(s) sélectionné(s)
            </span>
            {selectedProducts.length > 0 && (
              <span className="ml-3 font-medium text-blue-600">
                Total: {totalSelection.toFixed(3)} dt
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedProducts.length === 0}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Ajouter {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;