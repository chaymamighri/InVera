import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ShoppingCartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  XCircleIcon,
  CubeIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

// ========== CONSTANTES ==========
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';

const IMAGES_BY_CATEGORY = {
  'electronique': 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
  'informatique': 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
  'vetement': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
  'alimentation': 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
  'decoration': 'https://images.unsplash.com/photo-1513519245088-0e12902e35a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
  'jardin': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
};

// ========== FONCTIONS UTILITAIRES ==========
const getCategoryImage = (categorie) => {
  if (!categorie) return DEFAULT_IMAGE;
  
  const categorieLower = categorie.toLowerCase();
  for (const [key, url] of Object.entries(IMAGES_BY_CATEGORY)) {
    if (categorieLower.includes(key)) {
      return url;
    }
  }
  return DEFAULT_IMAGE;
};

const normalizeImageUrl = (imageUrl, categorie) => {
  if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl.trim() === '') {
    return getCategoryImage(categorie);
  }
  
  if (imageUrl.includes('undefined') || imageUrl.includes('null') || imageUrl.includes('iphone-15-pro-finish')) {
    return getCategoryImage(categorie);
  }
  
  // ✅ CORRECTION : Si l'URL contient déjà "uploads/produits/", l'utiliser directement
  if (imageUrl.includes('uploads/produits/')) {
    // Nettoyer l'URL pour éviter les doubles slashes
    let cleanUrl = imageUrl;
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `http://localhost:8081/${cleanUrl}`;
    }
    return cleanUrl;
  }
  
  // Si l'URL commence par /uploads/ (sans "produits")
  if (imageUrl.startsWith('/uploads/')) {
    return `http://localhost:8081${imageUrl}`;
  }
  
  // Pour les autres cas (juste le nom du fichier)
  if (!imageUrl.startsWith('http')) {
    return `http://localhost:8081/uploads/produits/${imageUrl}`;
  }
  
  return imageUrl;
};

// ========== COMPOSANT PRINCIPAL ==========
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
  
  const [currentProducts, setCurrentProducts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCurrentProducts(products.slice(startIndex, endIndex));
  }, [products, currentPage, itemsPerPage]);

  // Normaliser les données du produit (version simplifiée)
  const normalizeProductData = useCallback((product) => {
    const categorie = product.categorie?.nomCategorie || product.categorie || '';
    const imageUrl = normalizeImageUrl(product.imageUrl, categorie);
    
    const remise = product.remiseTemporaire || 0;
    const prixBase = product.prixVente || 0;
    const prixAvecRemise = remise > 0 ? prixBase * (1 - remise / 100) : prixBase;
    
    return {
      idProduit: product.idProduit,
      libelle: product.libelle || 'Produit sans nom',
      imageUrl: imageUrl,
      categorie: categorie,
      prixVente: Number(prixBase),
      remiseTemporaire: Number(remise),
      prix: prixAvecRemise,
      prixInitial: prixBase,
      remise: remise,
      quantiteStock: Number(product.quantiteStock) || 0,
    };
  }, []);

  const handleImageError = (productId, categorie) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const getImageUrl = (product) => {
    if (imageErrors[product.idProduit]) {
      return getCategoryImage(product.categorie);
    }
    return product.imageUrl;
  };

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const produitsDisponibles = currentProducts.filter(p => (p.quantiteStock || 0) > 0);
      
      const nouveauxProduits = produitsDisponibles
        .filter(p => !selectedProducts.some(sp => sp.idProduit === p.idProduit))
        .map(p => ({ 
          idProduit: p.idProduit,
          libelle: p.libelle,
          prixVente: p.prixVente || 0,
          quantiteStock: p.quantiteStock || 0,
          imageUrl: p.imageUrl,
          categorie: p.categorie,
          quantiteCommande: 1,
          prix: p.prixVente || 0,
          remiseTemporaire: p.remiseTemporaire || 0
        }));
      
      setSelectedProducts(prev => [...prev, ...nouveauxProduits]);
    } else {
      const produitsAffichésIds = currentProducts.map(p => p.idProduit);
      setSelectedProducts(prev => prev.filter(sp => 
        !produitsAffichésIds.includes(sp.idProduit)
      ));
    }
  }, [currentProducts, selectedProducts, setSelectedProducts]);

  const handleChangeQuantite = useCallback((productId, newQuantite) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.idProduit === productId) {
        const maxStock = p.quantiteStock || 0;
        return { 
          ...p, 
          quantiteCommande: Math.max(1, Math.min(newQuantite, maxStock)) 
        };
      }
      return p;
    }));
  }, [setSelectedProducts]);

  const handleRemoveProduct = useCallback((productId) => {
    setSelectedProducts(prev => prev.filter(p => p.idProduit !== productId));
  }, [setSelectedProducts]);

  const checkDisponibiliteProduit = useCallback((product) => {
    const selectedProduct = selectedProducts.find(p => p.idProduit === product.idProduit);
    if (!selectedProduct) return true;
    
    const stockDisponible = product.quantiteStock || 0;
    const quantiteDemandee = selectedProduct.quantiteCommande || 1;
    
    return stockDisponible >= quantiteDemandee;
  }, [selectedProducts]);

  const allProductsSelected = useMemo(() => {
    if (currentProducts.length === 0) return false;
    return currentProducts.every(p => {
      const isOutOfStock = (p.quantiteStock || 0) <= 0;
      return isOutOfStock || selectedProducts.some(sp => sp.idProduit === p.idProduit);
    });
  }, [currentProducts, selectedProducts]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700 mb-3 sm:mb-0">
          Page <span className="font-semibold">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
          {' • '}
          <span className="font-semibold">{products.length}</span> produit{products.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                  onClick={() => onPageChange?.(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
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
            <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 mt-3 sm:mt-0">
              <div className="flex items-center space-x-3">
                <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-700">
                  Total: <span className="font-bold text-blue-600 text-lg">
                    {calculerTotaux(selectedProducts).sousTotal.toFixed(2)} dt
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des produits simplifié */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left w-12">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  checked={allProductsSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => {
              const normalizedProduct = normalizeProductData(product);
              const isSelected = selectedProducts.some(p => p.idProduit === normalizedProduct.idProduit);
              const selectedProduct = selectedProducts.find(p => p.idProduit === normalizedProduct.idProduit);
              const quantiteCommande = selectedProduct?.quantiteCommande || 1;
              const isAvailable = checkDisponibiliteProduit(normalizedProduct);
              const imageUrl = getImageUrl(normalizedProduct);
              const isOutOfStock = normalizedProduct.quantiteStock <= 0;
              
              return (
                <tr key={normalizedProduct.idProduit} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      checked={isSelected}
                      onChange={() => handleSelectProduct(normalizedProduct)}
                      disabled={isOutOfStock}
                    />
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={normalizedProduct.libelle}
                            className="h-full w-full object-cover"
                            onError={() => handleImageError(normalizedProduct.idProduit, normalizedProduct.categorie)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200">
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{normalizedProduct.libelle}</h3>
                        {normalizedProduct.remiseTemporaire > 0 && (
                          <span className="inline-block mt-1 text-xs text-red-600 font-medium">
                            🔥 Remise {normalizedProduct.remiseTemporaire}%
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{normalizedProduct.prix.toFixed(2)} dt</div>
                    {normalizedProduct.remise > 0 && (
                      <div className="text-xs text-gray-500 line-through">{normalizedProduct.prixInitial.toFixed(2)} dt</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {normalizedProduct.quantiteStock} unités
                    </div>
                    {isOutOfStock && (
                      <span className="text-xs text-red-600">Rupture</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleChangeQuantite(normalizedProduct.idProduit, quantiteCommande - 1)}
                            disabled={quantiteCommande <= 1}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={normalizedProduct.quantiteStock}
                            value={quantiteCommande}
                            onChange={(e) => handleChangeQuantite(normalizedProduct.idProduit, parseInt(e.target.value) || 1)}
                            className="w-14 text-center py-1 border-x"
                          />
                          <button
                            onClick={() => handleChangeQuantite(normalizedProduct.idProduit, quantiteCommande + 1)}
                            disabled={quantiteCommande >= normalizedProduct.quantiteStock}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(normalizedProduct.idProduit)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Retirer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        {!isAvailable && (
                          <span className="text-xs text-red-600">Stock insuffisant</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectProduct(normalizedProduct)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <ShoppingCartIcon className="h-4 w-4" />
                        {isOutOfStock ? 'Rupture' : 'Ajouter'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des produits...</p>
          </div>
        )}

        {!loading && currentProducts.length === 0 && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 text-gray-300">📦</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      {renderPagination()}

      {selectedProducts.length > 0 && (
        <div className="border-t p-4 bg-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{selectedProducts.length}</span> produit{selectedProducts.length !== 1 ? 's' : ''} sélectionné{selectedProducts.length !== 1 ? 's' : ''}
              </p>
              <p className="text-lg font-bold text-blue-600">
                Total: {calculerTotaux(selectedProducts).sousTotal.toFixed(2)} dt
              </p>
              {!checkDisponibilite(selectedProducts) && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  Stock insuffisant pour certains produits
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProducts([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Vider le panier
              </button>
              <button
                onClick={() => handleCreateOrder?.()}
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