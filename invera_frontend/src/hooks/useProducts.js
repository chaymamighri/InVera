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
      
      setProducts(response.data || response.products || []);
      
      if (response.pagination) {
        setPagination(response.pagination);
      } else if (response.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          page,
          total: response.total,
          totalPages: Math.ceil(response.total / pagination.limit)
        }));
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
      setProducts(response.data || []);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un produit
  const createProduct = async (productData) => {
    try {
      const response = await productService.createProduct(productData);
      await loadProducts(pagination.page); // Recharger la liste
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Mettre à jour un produit
  const updateProduct = async (id, productData) => {
    try {
      const response = await productService.updateProduct(id, productData);
      // Mettre à jour le produit dans la liste
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, ...productData } : p
      ));
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Supprimer un produit
  const deleteProduct = async (id) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
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
  }, [loadProducts]);

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