// src/pages/dashboard/sales/products/hooks/useProducts.js
import { useState, useEffect } from 'react';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    // TODO: Remplacer par appel API
    const fetchProducts = async () => {
      try {
        // Simuler un appel API
        setTimeout(() => {
          // Données temporaires
          const tempProducts = [
            {
              id: 1,
              libelle: 'Ordinateur Portable Pro',
              prix: 1299.99,
              // ... autres propriétés
            }
          ];
          setProducts(tempProducts);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error, setProducts };
};

export default useProducts;