// hooks/useStockMovements.js
import { useState, useCallback } from 'react';
import stockMovementService from '../services/StockMovementService';

export const useStockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger tous les mouvements avec filtres optionnels
   */
  const fetchAllMovements = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 useStockMovements - fetchAllMovements appelé avec:', filters);
      
      // ✅ Appeler le service avec les filtres
      const data = await stockMovementService.getAllMovements(filters);
      
      console.log('✅ Mouvements reçus:', data?.length || 0);
      setMovements(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('❌ Erreur fetchAllMovements:', err);
      setError(err.message || 'Erreur lors du chargement');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger les mouvements d'un produit
   */
  const fetchMovementsByProduct = useCallback(async (productId) => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await stockMovementService.getMovementsByProduct(productId);
      setMovements(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('❌ Erreur fetchMovementsByProduct:', err);
      setError(err.message || 'Erreur lors du chargement');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    return fetchAllMovements();
  }, [fetchAllMovements]);

  return {
    movements,
    loading,
    error,
    fetchAllMovements,
    fetchMovementsByProduct,
    refresh
  };
};