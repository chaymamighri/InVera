// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService';

const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState(initialFilters);

  // ✅ Fonction pour normaliser un produit
  const normalizeProduct = useCallback((produit) => {
    if (!produit) return null;
    
    // Extraire les informations de catégorie
    let categorie = null;
    let categorieNom = null;
    let categorieId = null;
    
    if (produit.categorie) {
      categorie = produit.categorie;
      categorieId = produit.categorie.idCategorie || produit.categorie.id;
      
      // Essayer différentes propriétés pour le nom
      categorieNom = produit.categorie.nomCategorie || 
                     produit.categorie.nom || 
                     produit.categorie.libelle || 
                     produit.categorie.name ||
                     'Catégorie';
    } else if (produit.categorieNom) {
      categorieNom = produit.categorieNom;
    } else if (produit.categorieId) {
      categorieId = produit.categorieId;
      categorieNom = `Catégorie ${produit.categorieId}`;
    }
    
    return {
      // Propriétés originales
      ...produit,
      
      // Propriétés normalisées
      idProduit: produit.idProduit || produit.id,
      libelle: produit.libelle || produit.nom || 'Produit sans nom',
      prixVente: produit.prixVente || produit.prix || 0,
      quantiteStock: produit.quantiteStock || produit.stock || 0,
      uniteMesure: produit.uniteMesure || produit.unite || 'unité',
      imageUrl: produit.imageUrl || produit.image || null,
      
      // ✅ Catégorie normalisée
      categorie: categorie,
      categorieId: categorieId,
      categorieNom: categorieNom,
      
      // Pour l'affichage direct
      displayCategorie: categorieNom || '—'
    };
  }, []);

  // ✅ Fonction pour normaliser une liste de produits
  const normalizeProducts = useCallback((productsData) => {
    if (!Array.isArray(productsData)) return [];
    return productsData.map(p => normalizeProduct(p)).filter(Boolean);
  }, [normalizeProduct]);

  // Charger les produits
  const loadProducts = useCallback(async (page = 1, customFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...customFilters
      };

      console.log('📡 Chargement produits avec params:', params);
      const response = await productService.getAllProducts(params);
      
      console.log('📦 Réponse brute:', response);
      
      let productsData = [];
      let paginationData = null;
      
      // Adapter la structure du backend
      if (response.data) {
        productsData = response.data;
        paginationData = response.pagination;
      } else if (Array.isArray(response)) {
        productsData = response;
      } else if (response.success && response.produits) {
        productsData = response.produits;
        paginationData = response.pagination;
      }
      
      // ✅ Normaliser les produits
      const produitsNormalises = normalizeProducts(productsData);
      console.log('✅ Produits normalisés:', produitsNormalises.map(p => ({
        id: p.idProduit,
        libelle: p.libelle,
        categorie: p.categorieNom
      })));
      
      setProducts(produitsNormalises);
      
      // Mettre à jour la pagination
      if (paginationData) {
        setPagination(paginationData);
      } else if (response.total) {
        setPagination(prev => ({
          ...prev,
          page,
          total: response.total,
          totalPages: Math.ceil(response.total / pagination.limit)
        }));
      } else if (productsData.length > 0) {
        // Si pas d'info de pagination, on suppose que c'est la page 1 avec tous les produits
        setPagination(prev => ({
          ...prev,
          page,
          total: productsData.length,
          totalPages: Math.ceil(productsData.length / pagination.limit)
        }));
      }
      
    } catch (err) {
      console.error('❌ Erreur dans useProducts:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, normalizeProducts]);

  // Recherche de produits
  const searchProducts = useCallback(async (searchTerm, searchFilters = {}) => {
    setLoading(true);
    try {
      console.log('🔍 Recherche produits:', searchTerm, searchFilters);
      const response = await productService.searchProducts(searchTerm, searchFilters);
      
      console.log('📦 Résultat recherche:', response);
      
      let productsData = [];
      
      if (response.data) {
        productsData = response.data;
      } else if (Array.isArray(response)) {
        productsData = response;
      } else if (response.success && response.produits) {
        productsData = response.produits;
      }
      
      // ✅ Normaliser les résultats
      const produitsNormalises = normalizeProducts(productsData);
      setProducts(produitsNormalises);
      
      // Mettre à jour la pagination
      setPagination(prev => ({
        ...prev,
        total: response.count || response.total || productsData.length,
        totalPages: Math.ceil((response.count || response.total || productsData.length) / pagination.limit)
      }));
      
      return response;
    } catch (err) {
      console.error('❌ Erreur recherche:', err);
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, normalizeProducts]);

  // Créer un produit
  const createProduct = async (productData) => {
    try {
      const response = await productService.createProduct(productData);
      if (response && response.success) {
        await loadProducts(pagination.page);
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur création:', err);
      throw err;
    }
  };

  // Mettre à jour un produit
  const updateProduct = async (id, productData) => {
    try {
      const response = await productService.updateProduct(id, productData);
      if (response && response.success && response.produit) {
        // Normaliser le produit mis à jour
        const produitNormalise = normalizeProduct(response.produit);
        setProducts(prev => prev.map(p => 
          p.idProduit === id ? produitNormalise : p
        ));
      } else {
        await loadProducts(pagination.page);
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur mise à jour:', err);
      throw err;
    }
  };

  // Supprimer un produit
  const deleteProduct = async (id) => {
    try {
      const response = await productService.deleteProduct(id);
      if (response && response.success) {
        setProducts(prev => prev.filter(p => p.idProduit !== id));
      }
      return response;
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      throw err;
    }
  };

  // Vérifier la disponibilité
  const checkProductsAvailability = async (productIds) => {
    try {
      return await productService.checkAvailability(productIds);
    } catch (err) {
      console.error('❌ Erreur vérification disponibilité:', err);
      throw err;
    }
  };

  // Appliquer des filtres
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    loadProducts(1, newFilters);
  }, [loadProducts]);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    loadProducts(1, initialFilters);
  }, [initialFilters, loadProducts]);

  // Charger initialement
  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    filters,
    loadProducts,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    checkProductsAvailability,
    applyFilters,
    resetFilters,
    setFilters,
    // ✅ Export de la fonction de normalisation pour usage externe
    normalizeProduct
  };
};

export default useProducts;