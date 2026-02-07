import React, { useState, useEffect } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ShoppingCartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
  CubeIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const ProductTable = ({ 
  products, 
  selectedProducts, 
  handleSelectProduct, 
  handleCreateOrder,
  sortField, 
  sortDirection, 
  handleSort, 
  setSelectedProducts,
  checkDisponibilite,
  calculerTotaux,
  loading = false,
  error = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange = null,
  itemsPerPage = 5
}) => {
  
  // Calculer les produits à afficher pour la page courante
  const [currentProducts, setCurrentProducts] = useState([]);
  
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCurrentProducts(products.slice(startIndex, endIndex));
  }, [products, currentPage, itemsPerPage]);

  // Gérer la sélection/désélection de tous les produits pour la page courante
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Sélectionner seulement les produits disponibles (non en rupture) de la page courante
      const produitsDisponibles = currentProducts.filter(p => 
        p.status !== 'RUPTURE' && 
        (p.quantiteStock || 0) > 0
      );
      
      const nouveauxProduits = produitsDisponibles
        .filter(p => !selectedProducts.some(sp => sp.idProduit === p.idProduit))
        .map(p => ({ 
          idProduit: p.idProduit,
          libelle: p.libelle,
          prixVente: p.prixVente || 0,
          quantiteStock: p.quantiteStock || 0,
          uniteMesure: p.uniteMesure || 'unité',
          imageUrl: p.imageUrl,
          categorie: p.categorie,
          quantiteCommande: 1,
          prix: p.prixVente || 0,
          remiseTemporaire: p.remiseTemporaire || 0,
          status: p.status
        }));
      
      setSelectedProducts([...selectedProducts, ...nouveauxProduits]);
    } else {
      // Désélectionner tous les produits affichés de la page courante
      const produitsAffichésIds = currentProducts.map(p => p.idProduit);
      setSelectedProducts(selectedProducts.filter(sp => 
        !produitsAffichésIds.includes(sp.idProduit)
      ));
    }
  };

  // Modifier la quantité d'un produit sélectionné
  const handleChangeQuantite = (productId, newQuantite) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.idProduit === productId) {
        const maxStock = p.quantiteStock || 0;
        return { 
          ...p, 
          quantiteCommande: Math.max(1, Math.min(newQuantite, maxStock)) 
        };
      }
      return p;
    });
    setSelectedProducts(updatedProducts);
  };

  // Retirer un produit de la sélection
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.idProduit !== productId));
  };

  // Vérifier si un produit spécifique est disponible
  const checkDisponibiliteProduit = (product) => {
    const selectedProduct = selectedProducts.find(p => p.idProduit === product.idProduit);
    if (!selectedProduct) return true;
    
    const stockDisponible = product.quantiteStock || 0;
    const quantiteDemandee = selectedProduct.quantiteCommande || 1;
    
    return stockDisponible >= quantiteDemandee;
  };

  // Calculer si tous les produits de la page courante sont sélectionnés
  const allProductsSelected = currentProducts.length > 0 && 
    currentProducts.every(p => {
      const productId = p.idProduit;
      const isOutOfStock = p.status === 'RUPTURE' || (p.quantiteStock || 0) <= 0;
      return isOutOfStock || selectedProducts.some(sp => sp.idProduit === productId);
    });

  // Normaliser les données du produit pour l'affichage
  const normalizeProductData = (product) => {
    const productId = product.idProduit;
    
    // Gérer les URLs d'image invalides
    let imageUrl = product.imageUrl;
    if (!imageUrl || 
        (typeof imageUrl === 'string' && (
          imageUrl.includes('iphone-15-pro-finish') ||
          imageUrl.includes('undefined') ||
          imageUrl.trim() === ''
        ))) {
      imageUrl = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
    }
    
    // Calculer la remise applicable
    const remiseApplicable = product.remiseTemporaire || 0;
    
    // Calculer le prix avec remise
    const prixDeBase = product.prixVente || 0;
    const prixAvecRemise = remiseApplicable > 0 
      ? prixDeBase * (1 - remiseApplicable / 100)
      : prixDeBase;
    
    return {
      idProduit: productId,
      libelle: product.libelle || 'Produit sans nom',
      imageUrl: imageUrl,
      categorie: product.categorie || 'Non catégorisé',
      uniteMesure: product.uniteMesure || 'unité',
      // Prix et remises
      prixVente: Number(product.prixVente) || 0,
      remiseTemporaire: Number(product.remiseTemporaire) || 0,
      // Prix calculés
      prix: prixAvecRemise,
      prixInitial: prixDeBase,
      remise: remiseApplicable,
      // Stock
      quantiteStock: Number(product.quantiteStock) || 0,
      seuilMinimum: Number(product.seuilMinimum) || 5,
      status: product.status || 'EN_STOCK',
      // Pour affichage
      statut: getStatusText(product.status)
    };
  };

  // Convertir le statut ENUM en texte
  const getStatusText = (status) => {
    switch(status) {
      case 'EN_STOCK': return 'En stock';
      case 'RUPTURE': return 'Rupture';
      case 'FAIBLE': return 'Stock faible';
      case 'CRITIQUE': return 'Stock critique';
      default: return 'Inconnu';
    }
  };

  // Obtenir la couleur du badge de statut
  const getStatusBadgeColor = (product) => {
    switch(product.status) {
      case 'EN_STOCK': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'RUPTURE': return 'bg-red-100 text-red-800 border border-red-200';
      case 'FAIBLE': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'CRITIQUE': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Pagination simplifiée (5 produits par page)
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700 mb-3 sm:mb-0">
          Page <span className="font-semibold">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
          {' • '}
          <span className="font-semibold">{products.length}</span> produit{products.length !== 1 ? 's' : ''} au total
          {' • '}
          Affichage de <span className="font-semibold">{Math.min(itemsPerPage, currentProducts.length)}</span> produit{currentProducts.length !== 1 ? 's' : ''} par page
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Précédent
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => onPageChange && onPageChange(totalPages)}
                  className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center">
        <div className="text-red-500 mb-4">
          <XCircleIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="mb-3 sm:mb-0">
            <h2 className="text-lg font-semibold text-gray-800">Catalogue Produits</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedProducts.length > 0 ? (
                <span className="font-medium text-blue-600">
                  {selectedProducts.length} produit{selectedProducts.length !== 1 ? 's' : ''} sélectionné{selectedProducts.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>{products.length} produit{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-700">
                    Total: <span className="font-bold text-blue-600 text-lg">
                      {calculerTotaux(selectedProducts).sousTotal.toFixed(2)} dt
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau simplifié */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    checked={allProductsSelected}
                    onChange={handleSelectAll}
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <CubeIcon className="h-4 w-4 mr-1" />
                  Produit
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('prixVente')}
              >
                <div className="flex items-center">
                  Prix
                  {sortField === 'prixVente' && (
                    sortDirection === 'asc' ? 
                      <ArrowUpIcon className="ml-1 h-3 w-3" /> : 
                      <ArrowDownIcon className="ml-1 h-3 w-3" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantiteStock')}
              >
                <div className="flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  Stock
                  {sortField === 'quantiteStock' && (
                    sortDirection === 'asc' ? 
                      <ArrowUpIcon className="ml-1 h-3 w-3" /> : 
                      <ArrowDownIcon className="ml-1 h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product, index) => {
              const normalizedProduct = normalizeProductData(product);
              const productId = normalizedProduct.idProduit;
              
              const safeProductId = productId || `prod-temp-${index}`;
              
              const isSelected = selectedProducts.some(p => p.idProduit === safeProductId);
              const selectedProduct = selectedProducts.find(p => p.idProduit === safeProductId);
              const quantiteCommande = selectedProduct?.quantiteCommande || 1;
              const isAvailable = checkDisponibiliteProduit(normalizedProduct);
              
              return (
                <tr key={safeProductId} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        checked={isSelected}
                        onChange={() => handleSelectProduct(normalizedProduct)}
                        disabled={normalizedProduct.status === 'RUPTURE' || normalizedProduct.quantiteStock <= 0}
                      />
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={normalizedProduct.imageUrl}
                          alt={normalizedProduct.libelle}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">
                          {normalizedProduct.libelle}
                        </h3>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(normalizedProduct)}`}>
                            {normalizedProduct.statut}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {normalizedProduct.uniteMesure}
                          {normalizedProduct.remiseTemporaire > 0 && (
                            <span className="ml-2 text-red-600 font-medium">
                              🔥 Remise {normalizedProduct.remiseTemporaire}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-gray-900">
                        {normalizedProduct.prix.toFixed(2)} dt
                      </div>
                      {normalizedProduct.remise > 0 && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 line-through mr-2">
                            {normalizedProduct.prixInitial.toFixed(2)} dt
                          </span>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            -{normalizedProduct.remise}%
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className={`text-sm font-medium ${
                        normalizedProduct.quantiteStock > normalizedProduct.seuilMinimum 
                          ? 'text-green-600' 
                          : normalizedProduct.quantiteStock > 0 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {normalizedProduct.quantiteStock} unités
                      </div>
                      <div className="text-xs text-gray-500">
                        Seuil: {normalizedProduct.seuilMinimum} unités
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {isSelected ? (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleRemoveProduct(safeProductId)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center transition-colors"
                          title="Retirer de la commande"
                        >
                          <TrashIcon className="h-4 w-4 mr-1.5" />
                          Retirer
                        </button>
                        
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleChangeQuantite(safeProductId, quantiteCommande - 1)}
                            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            disabled={quantiteCommande <= 1}
                          >
                            <MinusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          <input
                            type="number"
                            min="1"
                            max={normalizedProduct.quantiteStock}
                            value={quantiteCommande}
                            onChange={(e) => handleChangeQuantite(safeProductId, parseInt(e.target.value) || 1)}
                            className="w-14 text-center py-1.5 bg-white border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                          />
                          
                          <button
                            onClick={() => handleChangeQuantite(safeProductId, quantiteCommande + 1)}
                            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            disabled={quantiteCommande >= normalizedProduct.quantiteStock}
                          >
                            <PlusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                        
                        {!isAvailable && (
                          <div className="flex items-center text-red-600 text-xs">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Stock insuffisant
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectProduct(normalizedProduct)}
                        disabled={normalizedProduct.status === 'RUPTURE' || normalizedProduct.quantiteStock <= 0}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors ${
                          normalizedProduct.status === 'RUPTURE' || normalizedProduct.quantiteStock <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        {normalizedProduct.status === 'RUPTURE' || normalizedProduct.quantiteStock <= 0 ? 'Rupture' : 'Ajouter'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* États de chargement et vide */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des produits...</p>
          </div>
        )}

        {currentProducts.length === 0 && !loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 text-gray-300">📦</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}

        {currentProducts.length === 0 && !loading && products.length > 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 text-gray-300">📄</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Page vide</h3>
            <p className="text-gray-500">Aucun produit sur cette page</p>
          </div>
        )}
      </div>

      {/* Pagination au dessous du tableau */}
      {renderPagination()}

      {/* Footer avec résumé de sélection */}
      {selectedProducts.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-3 sm:mb-0">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    <span className="font-bold">{selectedProducts.length}</span> produit{selectedProducts.length !== 1 ? 's' : ''} sélectionné{selectedProducts.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    Total: {calculerTotaux(selectedProducts).sousTotal.toFixed(2)} dt
                  </p>
                </div>
              </div>
              
              {!checkDisponibilite(selectedProducts) && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  <span>Stock insuffisant pour certains produits</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedProducts([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Vider le panier
              </button>
              
          
<button
  onClick={() => {
    if (typeof handleCreateOrder === 'function') {
      handleCreateOrder(); // Cette fonction devrait ouvrir le modal
    }
  }}
  disabled={!checkDisponibilite(selectedProducts) || selectedProducts.length === 0}
  className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
    checkDisponibilite(selectedProducts) && selectedProducts.length > 0
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
  }`}
>
  Passer commande
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;