// src/hooks/useProducts.js - VERSION CORRIGÉE AVEC GESTION DES CATÉGORIES
import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService';

const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 9,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    actif: '',
    status: '',
    categorieId: '',
    keyword: '',  
    ...initialFilters
  });

  // ========== FONCTIONS DE NORMALISATION ==========
  const getStatusLabel = useCallback((status) => {
    const labels = {
      'EN_STOCK': 'En stock',
      'FAIBLE': 'Stock faible',
      'CRITIQUE': 'Stock critique',
      'RUPTURE': 'Rupture'
    };
    return labels[status] || status;
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      'EN_STOCK': 'green',
      'FAIBLE': 'yellow',
      'CRITIQUE': 'orange',
      'RUPTURE': 'red'
    };
    return colors[status] || 'gray';
  }, []);

  const normalizeProduct = useCallback((produit) => {
    if (!produit) return null;
    
    // ✅ S'assurer que l'ID est toujours défini
    const productId = produit.idProduit || produit.id;
    if (!productId) {
      console.warn('⚠️ Produit sans ID:', produit);
      return null;
    }
    
    let categorieNom = 'Sans catégorie';
    let categorieId = null;
    
    // ✅ RÉCUPÉRER L'ID DE LA CATÉGORIE DEPUIS DIFFÉRENTS ENDROITS
    if (produit.categorieId !== undefined && produit.categorieId !== null) {
      categorieId = produit.categorieId;
    } else if (produit.idCategorie !== undefined && produit.idCategorie !== null) {
      categorieId = produit.idCategorie;
    } else if (produit.categorie) {
      if (typeof produit.categorie === 'object') {
        categorieId = produit.categorie.idCategorie || produit.categorie.id;
        categorieNom = produit.categorie.nomCategorie || 'Sans catégorie';
      } else if (typeof produit.categorie === 'number') {
        categorieId = produit.categorie;
      } else if (typeof produit.categorie === 'string') {
        categorieNom = produit.categorie;
      }
    }
    
    // ✅ Si on a un ID mais pas de nom, on garde temporairement "Sans catégorie"
    // (sera enrichi plus tard avec les données des catégories dans le composant)
    
    const remiseTemporaire = produit.remiseTemporaire != null ? Number(produit.remiseTemporaire) : 0;
    
    return {
      ...produit,
      id: productId,
      idProduit: productId,
      nom: produit.libelle,
      libelle: produit.libelle,
      prix: produit.prixVente,
      prixVente: produit.prixVente,
      prixAchat: produit.prixAchat,
      stock: produit.quantiteStock,
      quantiteStock: produit.quantiteStock,
      unite: produit.uniteMesure,
      uniteMesure: produit.uniteMesure,
      seuilMinimum: produit.seuilMinimum,
      image: produit.imageUrl,
      imageUrl: produit.imageUrl,
      remise: remiseTemporaire,
      estActif: produit.active === true,
      active: produit.active,
      categorieId: categorieId,  // ✅ Maintenant correctement récupéré
      categorieNom: categorieNom,
      displayCategorie: categorieNom,
      statutStock: produit.status,
      status: produit.status,
      statutStockLabel: getStatusLabel(produit.status),
      statutStockColor: getStatusColor(produit.status)
    };
  }, [getStatusLabel, getStatusColor]);

  const normalizeProducts = useCallback((productsData) => {
    if (!Array.isArray(productsData)) return [];
    const normalized = productsData.map(p => normalizeProduct(p)).filter(Boolean);
    console.log('✅ Normalisation:', {
      entree: productsData.length,
      sortie: normalized.length,
      produitsAvecCategorie: normalized.filter(p => p.categorieId).length,
      produitsSansCategorie: normalized.filter(p => !p.categorieId).length
    });
    return normalized;
  }, [normalizeProduct]);

  // ========== FONCTION DE CHARGEMENT ==========
  const loadProducts = useCallback(async (page = 0, customFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = {
        keyword: customFilters.keyword !== undefined ? customFilters.keyword : filters.keyword,
        status: customFilters.status !== undefined ? customFilters.status : filters.status,
        categorieId: customFilters.categorieId !== undefined ? customFilters.categorieId : filters.categorieId,
        actif: customFilters.actif !== undefined ? customFilters.actif : (filters.actif !== '' ? filters.actif : undefined),
        ...customFilters
      };
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === '' || searchParams[key] === undefined || searchParams[key] === null) {
          delete searchParams[key];
        }
      });
      
      console.log('📡 Chargement des produits avec:', searchParams);
      
      const response = await productService.searchProducts(searchParams);

      let allProductsData = [];
      
      if (response?.data && Array.isArray(response.data)) {
        allProductsData = response.data;
        console.log('✅ Structure: response.data,', allProductsData.length, 'produits');
      } else if (Array.isArray(response)) {
        allProductsData = response;
        console.log('✅ Structure: response,', allProductsData.length, 'produits');
      } else if (response?.success && response?.produits) {
        allProductsData = response.produits;
        console.log('✅ Structure: response.produits,', allProductsData.length, 'produits');
      } else {
        console.warn('⚠️ Structure non reconnue:', response);
        allProductsData = [];
      }
      
      // ✅ Normaliser les données avant de les stocker
      const normalizedAll = normalizeProducts(allProductsData);
      setAllProducts(normalizedAll);
      
      const total = normalizedAll.length;
      const totalPages = Math.ceil(total / pagination.size);
      const start = page * pagination.size;
      const end = start + pagination.size;
      const paginatedProducts = normalizedAll.slice(start, end);
      
      setProducts(paginatedProducts);
      setPagination(prev => ({
        ...prev,
        page: page,
        total: total,
        totalPages: totalPages
      }));
      
      console.log(`📊 Page ${page + 1}/${totalPages} - ${paginatedProducts.length} produits sur ${total}`);
      console.log(`📊 Produits avec catégorie: ${normalizedAll.filter(p => p.categorieId).length}`);
      
    } catch (err) {
      console.error('❌ ERREUR dans loadProducts:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des produits');
      setProducts([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.size, normalizeProducts]);

  // ========== FONCTIONS CRUD ==========
  const createProduct = async (productData) => {
    try {
      const response = await productService.createProduct(productData);
      if (response?.success) {
        await loadProducts(0);
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur création:', err);
      throw err;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const response = await productService.updateProduct(id, productData);
      if (response?.success) {
        if (response.produit) {
          const produitNormalise = normalizeProduct(response.produit);
          setAllProducts(prev => prev.map(p => p.id === id ? produitNormalise : p));
          const start = pagination.page * pagination.size;
          const end = start + pagination.size;
          setProducts(allProducts.slice(start, end));
        } else {
          await loadProducts(pagination.page);
        }
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur mise à jour:', err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const response = await productService.deleteProduct(id);
      if (response?.success) {
        const newAllProducts = allProducts.filter(p => p.id !== id);
        setAllProducts(newAllProducts);
        
        const totalPages = Math.ceil(newAllProducts.length / pagination.size);
        let newPage = pagination.page;
        if (newPage >= totalPages && newPage > 0) {
          newPage = totalPages - 1;
        }
        if (newPage < 0) newPage = 0;
        
        const start = newPage * pagination.size;
        const end = start + pagination.size;
        setProducts(newAllProducts.slice(start, end));
        setPagination(prev => ({
          ...prev,
          page: newPage,
          total: newAllProducts.length,
          totalPages: totalPages
        }));
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      throw err;
    }
  };

  const reactivateProduct = async (id) => {
    try {
      const response = await productService.reactivateProduct(id);
      if (response?.success) {
        await loadProducts(pagination.page);
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur réactivation:', err);
      throw err;
    }
  };

  const checkAvailability = async (id, quantite) => {
    try {
      return await productService.checkAvailability(id, quantite);
    } catch (err) {
      console.error('❌ Erreur vérification disponibilité:', err);
      throw err;
    }
  };

  const checkMultipleAvailability = async (items) => {
    try {
      return await productService.checkMultipleAvailability(items);
    } catch (err) {
      console.error('❌ Erreur vérification multiple:', err);
      throw err;
    }
  };

  const loadLowStockProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getLowStockProducts();
      if (response?.data) {
        const produitsNormalises = normalizeProducts(response.data);
        setAllProducts(produitsNormalises);
        setProducts(produitsNormalises);
        setPagination(prev => ({
          ...prev,
          total: produitsNormalises.length,
          totalPages: 1,
          page: 0
        }));
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur chargement stock faible:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ========== FONCTIONS DE FILTRAGE ET PAGINATION ==========
  const resetFilters = useCallback(() => {
    const emptyFilters = { actif: '', status: '', categorieId: '', keyword: '' };
    setFilters(emptyFilters);
    loadProducts(0, emptyFilters);
  }, [loadProducts]);

  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    loadProducts(0, newFilters);
  }, [loadProducts]);

  const changePage = useCallback((newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      loadProducts(newPage);
    }
  }, [loadProducts, pagination.totalPages]);

  const changePageSize = useCallback((newSize) => {
    setPagination(prev => {
      const newPagination = { ...prev, size: newSize };
      
      const totalPages = Math.ceil(allProducts.length / newSize);
      let newPage = pagination.page;
      
      if (newPage >= totalPages && totalPages > 0) {
        newPage = totalPages - 1;
      }
      if (newPage < 0) newPage = 0;
      
      const start = newPage * newSize;
      const end = start + newSize;
      const paginatedProducts = allProducts.slice(start, end);
      
      setProducts(paginatedProducts);
      
      return {
        ...newPagination,
        page: newPage,
        totalPages: totalPages
      };
    });
  }, [allProducts, pagination.page]);

  // ========== CHARGEMENT INITIAL ==========
  useEffect(() => {
    loadProducts(0);
  }, []);

  // ========== RETOUR ==========
  return {
    products,
    allProducts,
    loading,
    error,
    pagination,
    filters,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct,
    checkAvailability,
    checkMultipleAvailability,
    loadLowStockProducts,
    applyFilters,
    resetFilters,
    setFilters,
    changePage,
    changePageSize,
    normalizeProduct,
    getStatusLabel,
    getStatusColor
  };
};

export default useProducts;