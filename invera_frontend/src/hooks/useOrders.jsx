// src/pages/dashboard/sales/products/hooks/useOrders.js
import { useState } from 'react';

const useOrders = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const handleSelectProduct = (product, selectedProducts, setSelectedProducts) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantiteCommande: 1 }]);
    }
  };

  return {
    selectedProducts,
    setSelectedProducts,
    selectedClient,
    setSelectedClient,
    handleSelectProduct
  };
};

export default useOrders;