// hooks/useClientOrders.js
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const useClientOrders = () => {
  const [ordersByClient, setOrdersByClient] = useState({});

  const fetchOrdersByClient = async () => {
    try {
      // Récupérer toutes les commandes du localStorage
      const ordersData = localStorage.getItem('orders');
      if (!ordersData) return {};
      
      const allOrders = JSON.parse(ordersData);
      
      // Grouper les commandes par client
      const grouped = allOrders.reduce((acc, order) => {
        const clientId = order.client?.id;
        if (!clientId) return acc;
        
        if (!acc[clientId]) {
          acc[clientId] = {
            total: 0,
            validees: 0,
            refusees: 0,
            enAttente: 0,
            orders: []
          };
        }
        
        acc[clientId].total++;
        acc[clientId].orders.push(order);
        
        // Compter par statut
        const statut = order.statut?.toLowerCase() || '';
        if (statut.includes('valid') || statut === 'confirmé') {
          acc[clientId].validees++;
        } else if (statut.includes('refus') || statut === 'refusé') {
          acc[clientId].refusees++;
        } else {
          acc[clientId].enAttente++;
        }
        
        return acc;
      }, {});
      
      setOrdersByClient(grouped);
      return grouped;
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
      return {};
    }
  };

  useEffect(() => {
    fetchOrdersByClient();
    
    // Écouter les changements dans localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'orders') {
        fetchOrdersByClient();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { ordersByClient, fetchOrdersByClient };
};

export default useClientOrders;