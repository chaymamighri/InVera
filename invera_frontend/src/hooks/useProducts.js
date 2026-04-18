// src/hooks/useProducts.js - VERSION CORRIGÉE AVEC FOURNISSEURS ET PRIX
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
    
    const productId = produit.idProduit || produit.id;
    if (!productId) {
      console.warn('⚠️ Produit sans ID:', produit);
      return null;
    }
    
    let categorieNom = 'Sans catégorie';
    let categorieId = null;
    
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
    
    // ✅ Récupérer les fournisseurs avec leurs prix
    let fournisseurs = [];
    if (produit.fournisseurs && Array.isArray(produit.fournisseurs)) {
      fournisseurs = produit.fournisseurs;
    } else if (produit.fournisseursIds && Array.isArray(produit.fournisseursIds)) {
      fournisseurs = produit.fournisseursIds;
    }
    
    const remiseTemporaire = produit.remiseTemporaire != null ? Number(produit.remiseTemporaire) : 0;
    
    return {
      ...produit,
      id: productId,
      idProduit: productId,
      nom: produit.libelle,
      libelle: produit.libelle,
      prix: produit.prixVente,
      prixVente: produit.prixVente,
      // ❌ Supprimer prixAchat global
      // prixAchat: produit.prixAchat,
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
      categorieId: categorieId,
      categorieNom: categorieNom,
      displayCategorie: categorieNom,
      statutStock: produit.status,
      status: produit.status,
      statutStockLabel: getStatusLabel(produit.status),
      statutStockColor: getStatusColor(produit.status),
      // ✅ AJOUT des fournisseurs
      fournisseurs: fournisseurs,
      fournisseursIds: fournisseurs.map(f => f.id || f.idFournisseur)
    };
  }, [getStatusLabel, getStatusColor]);

  const normalizeProducts = useCallback((productsData) => {
    if (!Array.isArray(productsData)) return [];
    const normalized = productsData.map(p => normalizeProduct(p)).filter(Boolean);
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
      
      const response = await productService.searchProducts(searchParams);

      let allProductsData = [];
      
      if (response?.data && Array.isArray(response.data)) {
        allProductsData = response.data;
      } else if (Array.isArray(response)) {
        allProductsData = response;
      } else if (response?.success && response?.produits) {
        allProductsData = response.produits;
      } else {
        allProductsData = [];
      }
      
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
      
    } catch (err) {
      console.error('❌ ERREUR dans loadProducts:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des produits');
      setProducts([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.size, normalizeProducts]);

  // ========== FONCTIONS CRUD (avec fournisseurs et prix) ==========
  
  // ✅ CORRIGÉ : Ajout du paramètre prixAchats
  const createProduct = async (productData, fournisseursIds = [], prixAchats = []) => {
    try {
      const response = await productService.createProduct(productData, fournisseursIds, prixAchats);
      if (response?.success) {
        await loadProducts(0);
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur création:', err);
      throw err;
    }
  };

  // Récupérer un produit avec ses fournisseurs
  const getProductWithFournisseurs = useCallback(async (id) => {
    try {
      const response = await productService.getProductById(id);
      console.log('📦 Produit récupéré:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération produit:', error);
      throw error;
    }
  }, []);

  // ✅ CORRIGÉ : Ajout du paramètre prixAchats
  const updateProduct = async (id, productData, fournisseursIds = null, prixAchats = null) => {
    try {
      const response = await productService.updateProduct(id, productData, fournisseursIds, prixAchats);
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

  // ========== FONCTIONS POUR FOURNISSEURS ==========
// ✅ AJOUTER CETTE FONCTION
const getFournisseursByProduit = async (produitId) => {
  try {
    const response = await productService.getFournisseursByProduit(produitId);
    return response;
  } catch (err) {
    console.error('❌ Erreur récupération fournisseurs:', err);
    throw err;
  }
};

const getProductsByFournisseur = useCallback(async (fournisseurId) => {
  if (!fournisseurId) return [];
  
  setLoading(true);
  try {
    // ✅ Utiliser l'endpoint dédié au lieu de searchProducts
    const response = await productService.getProduitsByFournisseur(fournisseurId);
    
    console.log('📦 Réponse getProduitsByFournisseur:', response);
    
    let produitsData = [];
    if (response?.success && response?.produits) {
      produitsData = response.produits;
    } else if (Array.isArray(response)) {
      produitsData = response;
    }
    
    // Normaliser les produits
    const produitsNormalises = produitsData.map(p => normalizeProduct(p));
    
    console.log(`📦 ${produitsNormalises.length} produits trouvés pour le fournisseur ${fournisseurId}`);
    
    return produitsNormalises;
  } catch (error) {
    console.error('❌ Erreur getProductsByFournisseur:', error);
    return [];
  } finally {
    setLoading(false);
  }
}, [normalizeProduct]);


  const updateProduitFournisseurs = async (produitId, fournisseursIds) => {
    try {
      const response = await productService.updateProduitFournisseurs(produitId, fournisseursIds);
      if (response?.success) {
        await loadProducts(pagination.page);
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur mise à jour fournisseurs:', err);
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
    getStatusColor,
    getFournisseursByProduit,
    updateProduitFournisseurs,
    getProductWithFournisseurs,
    getProductsByFournisseur,
  };
};

export default useProducts;