// src/hooks/useSales.js
import { useState, useEffect } from 'react';

const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        // Données statiques de démo
        const demoData = [
          {
            id: 1,
            invoiceNumber: 'INV-2024-001',
            clientName: 'Mohamed Ali',
            clientEmail: 'mohamed.ali@example.com',
            clientType: 'VIP',
            date: '2024-01-15',
            items: [
              { productName: 'Ordinateur Portable', quantity: 1, price: 3500, discount: 5, tax: 19 }
            ],
            subtotal: 3325,
            tax: 631.75,
            total: 3956.75,
            paymentMethod: 'carte bancaire',
            status: 'payée'
          },
          // ... plus de données
        ];
        
        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSales(demoData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const createSale = async (saleData) => {
    try {
      // Simuler création API
      const newSale = {
        ...saleData,
        id: sales.length + 1,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(sales.length + 1).padStart(3, '0')}`
      };
      
      setSales(prev => [newSale, ...prev]);
      return newSale;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSale = async (id) => {
    setSales(prev => prev.filter(sale => sale.id !== id));
  };

  return {
    sales,
    loading,
    error,
    createSale,
    deleteSale,
    setSales
  };
};

export default useSales;