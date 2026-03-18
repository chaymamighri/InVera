// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService';

const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    total: 0,
    totalPages: 0
  });
  
  //  1. AJOUTER 'keyword' DANS L'ÉTAT INITIAL DES FILTRES
  const [filters, setFilters] = useState({
    actif: '',
    status: '',
    categorieId: '',
    keyword: '',  
    ...initialFilters
  });



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

  // ========== 2. FONCTIONS DE NORMALISATION ==========

const normalizeProduct = useCallback((produit) => {
  if (!produit) return null;
  
  // Extraire les infos de catégorie
  let categorieNom = 'Sans catégorie';
  let categorieId = null;
  
  if (produit.categorie) {
    if (typeof produit.categorie === 'object') {
      // ✅ Pour votre backend Spring Boot : le champ s'appelle "nomCategorie"
      categorieNom = produit.categorie.nomCategorie || 'Sans catégorie';
      categorieId = produit.categorie.idCategorie || produit.categorie.id;
    } else if (typeof produit.categorie === 'string') {
      categorieNom = produit.categorie;
    }
  }
  
  const remiseTemporaire = produit.remiseTemporaire != null 
    ? Number(produit.remiseTemporaire) 
    : 0;
  
  return {
    ...produit,
    // Identifiants
    id: produit.idProduit || produit.id,
    idProduit: produit.idProduit || produit.id,
    
    // Noms
    nom: produit.libelle,
    libelle: produit.libelle,
    
    // Prix
    prix: produit.prixVente,
    prixVente: produit.prixVente,
    prixAchat: produit.prixAchat,
    
    // Stock
    stock: produit.quantiteStock,
    quantiteStock: produit.quantiteStock,
    unite: produit.uniteMesure,
    uniteMesure: produit.uniteMesure,
    seuilMinimum: produit.seuilMinimum,
    
    // Image
    image: produit.imageUrl,
    imageUrl: produit.imageUrl,
    
    // Remise
    remise: remiseTemporaire,
    
    // Statut actif
    estActif: produit.active,
    active: produit.active,
    
    // ✅ CATÉGORIE - L'ESSENTIEL
    categorieId: categorieId,
    categorieNom: categorieNom,
    displayCategorie: categorieNom,
    
    // Statut stock
    statutStock: produit.status,
    status: produit.status,
    statutStockLabel: getStatusLabel(produit.status),
    statutStockColor: getStatusColor(produit.status)
  };
}, [getStatusLabel, getStatusColor]);

  const normalizeProducts = useCallback((productsData) => {
    if (!Array.isArray(productsData)) return [];
    return productsData.map(p => normalizeProduct(p)).filter(Boolean);
  }, [normalizeProduct]);

  // ========== 3. FONCTIONS DE CHARGEMENT ==========
const loadProducts = useCallback(async (page = 0, customFilters = {}) => {
  setLoading(true);
  setError(null);
  
  try {
    
    // ✅ 1. Fusionner les paramètres
    const rawParams = {
      ...customFilters, 
      ...filters, 
      page: page,
      size: pagination.size
    };
    console.log(' rawParams (avant nettoyage):', rawParams);
const searchParams = {};
    Object.keys(rawParams).forEach(key => {
      const value = rawParams[key];
      
      if (value !== '' && value !== undefined && value !== null) {
        // 👇 Mapper les noms de paramètres
        if (key === 'categorie' || key === 'categorieId') {
          searchParams['categorieId'] = value;  // Toujours utiliser 'categorieId'
          console.log(` Mappage: ${key} -> categorieId =`, value);
        } else {
          searchParams[key] = value;
        }
      }
    });
    
    // ✅ 3. S'assurer que page et size sont toujours présents
    searchParams.page = page;
    searchParams.size = pagination.size;
    console.log('📌 searchParams FINAUX:', searchParams);
    
    console.log('📡 Envoi requête à searchProducts avec:', searchParams);
    
    // ✅ 4. TOUJOURS utiliser searchProducts
    const response = await productService.searchProducts(searchParams);
    console.log('📦 Réponse brute de searchProducts:', response);
    
    let productsData = [];
    let paginationData = null;
    
    if (response?.data && Array.isArray(response.data)) {
      console.log('✅ Format 1: response.data est un tableau de', response.data.length, 'éléments');
      productsData = response.data;
      paginationData = {
        total: response.total || productsData.length,
        totalPages: response.totalPages || Math.ceil(productsData.length / pagination.size),
        page: response.currentPage || page,
        size: response.size || pagination.size
      };
      console.log('📊 paginationData:', paginationData);
      
    } else if (Array.isArray(response)) {
      console.log('✅ Format 2: response est un tableau direct de', response.length, 'éléments');
      productsData = response;
      paginationData = {
        total: productsData.length,
        totalPages: Math.ceil(productsData.length / pagination.size),
        page: 0,
        size: pagination.size
      };
      console.log('📊 paginationData:', paginationData);
      
    } else if (response?.success && response?.produits) {
      console.log('✅ Format 3: response.produits est un tableau de', response.produits.length, 'éléments');
      productsData = response.produits;
      paginationData = {
        total: response.total || response.count || productsData.length,
        totalPages: response.totalPages || Math.ceil((response.total || response.count || productsData.length) / pagination.size),
        page: response.currentPage || page,
        size: response.size || pagination.size
      };
      console.log('📊 paginationData:', paginationData);
      
    } else {
      console.warn('⚠️ Format de réponse non reconnu:', response);
    }
    
    console.log('📦 Données produits brutes:', productsData);
    
    const produitsNormalises = normalizeProducts(productsData);
    console.log('✨ Produits normalisés:', produitsNormalises.length, 'éléments');
    if (produitsNormalises.length > 0) {
      console.log('✨ Premier produit normalisé:', produitsNormalises[0]);
    }
    
    setProducts(produitsNormalises);
    console.log('✅ State products mis à jour');
    
    if (paginationData) {
      setPagination(prev => ({
        ...prev,
        page: paginationData.page,
        size: paginationData.size,
        total: paginationData.total,
        totalPages: paginationData.totalPages
      }));
      console.log('✅ State pagination mis à jour:', paginationData);
    }
    
    console.log('🟦 ====== LOAD PRODUCTS FIN ======');
    
  } catch (err) {
    console.error('❌ ERREUR dans useProducts:', err);
    console.error('❌ Détails:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    setError(err.response?.data?.message || 'Erreur lors du chargement des produits');
  } finally {
    setLoading(false);
    console.log('🏁 Loading set to false');
  }
}, [filters, pagination.size, normalizeProducts]);

  // ========== 4. AUTRES FONCTIONS ==========

  const searchProducts = useCallback(async (searchParams = {}) => {
    setLoading(true);
    try {
      const response = await productService.searchProducts(searchParams);
      let productsData = [];
      let paginationData = null;
      
      if (response?.data && Array.isArray(response.data)) {
        productsData = response.data;
        paginationData = {
          total: response.total || productsData.length,
          totalPages: response.totalPages || Math.ceil(productsData.length / pagination.size),
          page: response.currentPage || 0,
          size: response.size || pagination.size
        };
      } else if (Array.isArray(response)) {
        productsData = response;
        paginationData = {
          total: productsData.length,
          totalPages: Math.ceil(productsData.length / pagination.size),
          page: 0,
          size: pagination.size
        };
      } else if (response?.success && response?.produits) {
        productsData = response.produits;
        paginationData = {
          total: response.total || response.count || productsData.length,
          totalPages: response.totalPages || Math.ceil((response.total || response.count || productsData.length) / pagination.size),
          page: response.currentPage || 0,
          size: response.size || pagination.size
        };
      }
      
      const produitsNormalises = normalizeProducts(productsData);
      setProducts(produitsNormalises);
      
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          page: paginationData.page,
          size: paginationData.size,
          total: paginationData.total,
          totalPages: paginationData.totalPages
        }));
      }
      
      return response;
    } catch (err) {
      console.error('❌ Erreur recherche:', err);
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.size, normalizeProducts]);

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

 // useProducts.js - updateProduct avec logs
const updateProduct = async (id, productData) => {
  console.log('🔵 ===== USEPRODUCTS UPDATE =====');
  console.log('🔵 ID:', id);
  console.log('🔵 Type reçu:', productData instanceof FormData ? 'FORMDATA' : typeof productData);
  
  try {
    const response = await productService.updateProduct(id, productData);
    console.log('🔵 Réponse service:', response);
    
    if (response?.success) {
      if (response.produit) {
        const produitNormalise = normalizeProduct(response.produit);
        setProducts(prev => prev.map(p => 
          p.id === id ? produitNormalise : p
        ));
      } else {
        await loadProducts(pagination.page);
      }
    }
    console.log('🔵 ===== FIN USEPRODUCTS UPDATE =====');
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
        setProducts(prev => prev.filter(p => p.id !== id));
        if (products.length === 1 && pagination.page > 0) {
          await loadProducts(pagination.page - 1);
        }
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
        if (response.produit) {
          const produitNormalise = normalizeProduct(response.produit);
          setProducts(prev => prev.map(p => 
            p.id === id ? produitNormalise : p
          ));
        } else {
          await loadProducts(pagination.page);
        }
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur réactivation:', err);
      throw err;
    }
  };

  const updateStock = async (id, nouvelleQuantite) => {
    try {
      const response = await productService.updateStock(id, nouvelleQuantite);
      if (response?.success && response.produit) {
        const produitNormalise = normalizeProduct(response.produit);
        setProducts(prev => prev.map(p => 
          p.id === id ? produitNormalise : p
        ));
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur mise à jour stock:', err);
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
        setProducts(produitsNormalises);
        setPagination(prev => ({
          ...prev,
          total: response.count || produitsNormalises.length,
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


  // ✅ 2. MODIFIER resetFilters POUR INCLURE keyword
  const resetFilters = useCallback(() => {
    // Remettre à l'état initial
    setFilters({ 
      actif: '', 
      status: '', 
      categorieId: '',
      keyword: '',  
      ...initialFilters 
    });
    
    // Charger avec les filtres réinitialisés
    loadProducts(0, { 
      actif: '', 
      status: '', 
      categorieId: '',
      keyword: ''  
    });
  }, [initialFilters, loadProducts]);

  // appliquer plusieurs filtres à la fois 
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    loadProducts(0, newFilters);
  }, [loadProducts]);


  const changePage = useCallback((newPage) => {
    loadProducts(newPage);
  }, [loadProducts]);

  const changePageSize = useCallback((newSize) => {
    setPagination(prev => ({ ...prev, size: newSize }));
    loadProducts(0, { ...filters, size: newSize });
  }, [filters, loadProducts]);

  // ========== 5. EFFET DE CHARGEMENT INITIAL ==========
  useEffect(() => {
  // ✅ Se déclenche à chaque changement de filtre
  console.log('🔄 Filtres changés, rechargement...', filters);
  
  const params = {
    page: 0,
    size: pagination.size,
    actif: filters.actif || undefined,
    status: filters.status || undefined,
    categorieId: filters.categorieId || undefined
  };
  
  loadProducts(0, params);
}, [filters.actif, filters.status, filters.categorieId, pagination.size]); 

  // ========== 6. RETOUR ==========
  return {
    products,
    loading,
    error,
    pagination,
    filters,
    loadProducts,
    searchProducts,
    loadLowStockProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct,
    updateStock,
    checkAvailability,
    checkMultipleAvailability,
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
