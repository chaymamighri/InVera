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

      const response = await productService.getAllProducts(params);
      
      // Adapter la structure du backend
      if (response.data) {
        setProducts(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        } else if (response.total) {
          setPagination(prev => ({
            ...prev,
            page,
            total: response.total,
            totalPages: Math.ceil(response.total / pagination.limit)
          }));
        }
      } else if (Array.isArray(response)) {
        setProducts(response);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des produits');
      console.error('Erreur dans useProducts:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Recherche de produits
  const searchProducts = useCallback(async (searchTerm, searchFilters = {}) => {
    setLoading(true);
    try {
      const response = await productService.searchProducts(searchTerm, searchFilters);
      
      if (response.data) {
        setProducts(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.count || response.data.length,
          totalPages: Math.ceil((response.count || response.data.length) / pagination.limit)
        }));
        return response;
      }
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Créer un produit
  const createProduct = async (productData) => {
    try {
      const response = await productService.createProduct(productData);
      if (response && response.success) {
        await loadProducts(pagination.page); // Recharger la liste
      }
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Mettre à jour un produit
  const updateProduct = async (id, productData) => {
    try {
      const response = await productService.updateProduct(id, productData);
      if (response && response.success && response.produit) {
        // Mettre à jour le produit dans la liste
        setProducts(prev => prev.map(p => 
          p.idProduit === id ? response.produit : p
        ));
      } else {
        // Recharger complètement si pas de retour précis
        await loadProducts(pagination.page);
      }
      return response;
    } catch (err) {
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
      throw err;
    }
  };

  // Vérifier la disponibilité
  const checkProductsAvailability = async (productIds) => {
    try {
      return await productService.checkAvailability(productIds);
    } catch (err) {
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
  }, []); // Enlever loadProducts des dépendances pour éviter les boucles

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
    setFilters
  };
};

export default useProducts;