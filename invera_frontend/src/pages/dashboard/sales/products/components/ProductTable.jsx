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
// Supprimer DEFAULT_IMAGE et IMAGES_BY_CATEGORY pour éviter les images par défaut

// ========== FONCTIONS UTILITAIRES ==========
const getStatusText = (status, t = (key) => key) => {
  const statusMap = {
    'EN_STOCK': t('inStock'),
    'RUPTURE': t('outOfStock'),
    'FAIBLE': t('lowStock'),
    'CRITIQUE': t('criticalStock')
  };
  return statusMap[status] || t('unknown');
};

const getStatusBadgeColor = (status) => {
  const colorMap = {
    'EN_STOCK': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'RUPTURE': 'bg-red-100 text-red-800 border-red-200',
    'FAIBLE': 'bg-amber-100 text-amber-800 border-amber-200',
    'CRITIQUE': 'bg-orange-100 text-orange-800 border-orange-200'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStockColor = (quantiteStock, seuilMinimum) => {
  if (quantiteStock <= 0) return 'text-red-600';
  if (quantiteStock <= seuilMinimum) return 'text-yellow-600';
  return 'text-green-600';
};

// Fonction CORRIGÉE pour normaliser l'URL de l'image
const normalizeImageUrl = (imageUrl, categorie) => {
  // Si pas d'URL, retourner null
  if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl.trim() === '') {
    return null;
  }
  
  // Si l'URL contient des placeholders invalides
  if (imageUrl.includes('undefined') || imageUrl.includes('null')) {
    return null;
  }
  
  // Si c'est déjà une URL complète avec http ou https
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Si l'URL commence par /api/produits/uploads/
  if (imageUrl.startsWith('/api/produits/uploads/')) {
    return `http://localhost:8081${imageUrl}`;
  }
  
  // Si l'URL contient 'uploads/produits/'
  if (imageUrl.includes('uploads/produits/')) {
    // Extraire juste le nom du fichier
    const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
    return `http://localhost:8081/api/produits/uploads/produits/${filename}`;
  }
  
  // Si l'URL est juste un nom de fichier (ex: "image123.jpg")
  if (!imageUrl.includes('/')) {
    return `http://localhost:8081/api/produits/uploads/produits/${imageUrl}`;
  }
  
  // Pour tout autre format, essayer de construire l'URL
  const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
  return `http://localhost:8081/api/produits/uploads/produits/${filename}`;
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
  itemsPerPage = 5,
  t = (key) => key,
  locale = 'fr-FR',
  isArabic = false
}) => {
  
  const [currentProducts, setCurrentProducts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCurrentProducts(products.slice(startIndex, endIndex));
  }, [products, currentPage, itemsPerPage]);

  const normalizeProductData = useCallback((product) => {
    const categorie = product.categorie?.nomCategorie || product.categorieNom || product.categorie || '';
    
    let remise = 0;
    if (product.categorie?.remiseStandard !== undefined && product.categorie?.remiseStandard !== null) {
      remise = Number(product.categorie.remiseStandard);
    } else if (product.categorieRemiseStandard !== undefined && product.categorieRemiseStandard !== null) {
      remise = Number(product.categorieRemiseStandard);
    } else if (product.remiseStandard !== undefined && product.remiseStandard !== null) {
      remise = Number(product.remiseStandard);
    }
    
    if (remise === 0 && product.remiseTemporaire) {
      remise = Number(product.remiseTemporaire);
    }
    
    const imageUrl = normalizeImageUrl(product.imageUrl, categorie);
    const prixBase = Number(product.prixVente) || 0;
    const prixAvecRemise = remise > 0 ? prixBase * (1 - remise / 100) : prixBase;
    
    return {
      idProduit: product.idProduit,
      libelle: product.libelle || t('unnamedProduct'),
      imageUrl: imageUrl,
      categorie: categorie,
      uniteMesure: product.uniteMesure || t('unit'),
      prixVente: Number(prixBase),
      remiseTemporaire: Number(remise),
      prix: prixAvecRemise,
      prixInitial: prixBase,
      remise: remise,
      quantiteStock: Number(product.quantiteStock) || 0,
      seuilMinimum: Number(product.seuilMinimum) || 5,
      status: product.status || 'EN_STOCK',
      statut: getStatusText(product.status, t)
    };
  }, [t]);

  const formatMontant = (value) => `${Number(value || 0).toLocaleString(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} ${t('currencyLower') || 'dt'}`;

  const handleImageError = (productId) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const produitsDisponibles = currentProducts.filter(p => 
        p.status !== 'RUPTURE' && (p.quantiteStock || 0) > 0
      );
      
      const nouveauxProduits = produitsDisponibles
        .filter(p => !selectedProducts.some(sp => sp.idProduit === p.idProduit))
        .map(p => ({ 
          idProduit: p.idProduit,
          libelle: p.libelle,
          prixVente: p.prixVente || 0,
          quantiteStock: p.quantiteStock || 0,
          uniteMesure: p.uniteMesure || t('unit'),
          imageUrl: p.imageUrl,
          categorie: p.categorie,
          quantiteCommande: 1,
          prix: p.prixVente || 0,
          remiseTemporaire: p.remiseTemporaire || 0,
          status: p.status
        }));
      
      setSelectedProducts(prev => [...prev, ...nouveauxProduits]);
    } else {
      const produitsAffichésIds = currentProducts.map(p => p.idProduit);
      setSelectedProducts(prev => prev.filter(sp => 
        !produitsAffichésIds.includes(sp.idProduit)
      ));
    }
  }, [currentProducts, selectedProducts, setSelectedProducts, t]);

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
      const isOutOfStock = p.status === 'RUPTURE' || (p.quantiteStock || 0) <= 0;
      return isOutOfStock || selectedProducts.some(sp => sp.idProduit === p.idProduit);
    });
  }, [currentProducts, selectedProducts]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700 mb-3 sm:mb-0">
          {t('pageIndicator', { current: currentPage, total: totalPages })}
          {' • '}
          {t('productTotalCount', { count: products.length })}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            {t('previous')}
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
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('next')}
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
        <h3 className="text-lg font-medium text-gray-700 mb-2">{t('loadingError')}</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* En-tête */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{t('productCatalog')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedProducts.length > 0 ? (
                <span className="font-medium text-blue-600">
                  {t('selectedProductsCount', { count: selectedProducts.length })}
                </span>
              ) : (
                <span>{t('availableProductsCount', { count: products.length })}</span>
              )}
            </p>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 mt-3 sm:mt-0">
              <div className="flex items-center space-x-3">
                <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-700">
                  {t('total')}: <span className="font-bold text-blue-600 text-lg">
                    {formatMontant(calculerTotaux(selectedProducts).sousTotal)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des produits */}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={() => handleSort('libelle')} className="flex items-center gap-1">
                  <CubeIcon className="h-4 w-4" />
                  {t('product')}
                  {sortField === 'libelle' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)}
                </button>
              </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
  <button onClick={() => handleSort('prixVente')} className="flex items-center gap-1">
    {t('price')}
    {sortField === 'prixVente' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)}
  </button>
</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={() => handleSort('quantiteStock')} className="flex items-center gap-1">
                  <ChartBarIcon className="h-4 w-4" />
                  {t('stock')}
                  {sortField === 'quantiteStock' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => {
              const normalizedProduct = normalizeProductData(product);
              const isSelected = selectedProducts.some(p => p.idProduit === normalizedProduct.idProduit);
              const selectedProduct = selectedProducts.find(p => p.idProduit === normalizedProduct.idProduit);
              const quantiteCommande = selectedProduct?.quantiteCommande || 1;
              const isAvailable = checkDisponibiliteProduit(normalizedProduct);
              const imageUrl = normalizedProduct.imageUrl;
              const isOutOfStock = normalizedProduct.status === 'RUPTURE' || normalizedProduct.quantiteStock <= 0;
              
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
                            onError={() => handleImageError(normalizedProduct.idProduit)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                            <span className="text-lg font-bold text-white">
                              {normalizedProduct.libelle?.charAt(0).toUpperCase() || 'P'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{normalizedProduct.libelle}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(normalizedProduct.status)}`}>
                            {normalizedProduct.statut}
                          </span>
                          <span className="text-xs text-gray-500">{normalizedProduct.uniteMesure}</span>
                        </div>
                        {normalizedProduct.remiseTemporaire > 0 && (
                          <span className="inline-block mt-1 text-xs text-red-600 font-medium">
                            {t('discount')} {normalizedProduct.remiseTemporaire}%
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{formatMontant(normalizedProduct.prix)}</div>
                    {normalizedProduct.remise > 0 && (
                      <div className="text-xs text-gray-500 line-through">{formatMontant(normalizedProduct.prixInitial)}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className={`font-medium ${getStockColor(normalizedProduct.quantiteStock, normalizedProduct.seuilMinimum)}`}>
                      {normalizedProduct.quantiteStock} {t('units')}
                    </div>
                    <div className="text-xs text-gray-500">{t('threshold')}: {normalizedProduct.seuilMinimum}</div>
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
                            className="w-14 text-center py-1 border-x text-sm"
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
                          title={t('remove')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        {!isAvailable && (
                          <span className="text-xs text-red-600">{t('stockInsufficient')}</span>
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
                        {isOutOfStock ? t('outOfStock') : t('add')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* États de chargement et vide */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">{t('loadingProducts')}</p>
        </div>
      )}

      {!loading && currentProducts.length === 0 && products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 text-gray-300">📦</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">{t('noProductsFound')}</h3>
          <p className="text-gray-500">{t('tryChangingSearch')}</p>
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}

      {/* Footer avec résumé */}
      {selectedProducts.length > 0 && (
        <div className="border-t p-4 bg-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{selectedProducts.length}</span> {t('selectedProducts')}
              </p>
              <p className="text-lg font-bold text-blue-600">
                {t('total')}: {formatMontant(calculerTotaux(selectedProducts).sousTotal)}
              </p>
              {!checkDisponibilite(selectedProducts) && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {t('someProductsUnavailable')}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProducts([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('clearCart')}
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
                {t('placeOrder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;