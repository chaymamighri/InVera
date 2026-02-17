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
        // Données statiques de démo avec la bonne structure
        const demoData = [
          {
            id: 1,
            idCommandeClient: 1,
            referenceCommandeClient: 'CMD-2024-01-15-001',
            numero: 'CMD-2024-01-15-001',
            client: {
              id: 1,
              nom: 'Mohamed Ali',
              prenom: '',
              typeClient: 'VIP',
              email: 'mohamed.ali@example.com',
              telephone: '12345678'
            },
            dateCommande: '2024-01-15T10:30:00',
            dateCreation: '2024-01-15',
            produits: [
              { 
                id: 1, 
                libelle: 'Ordinateur Portable', 
                quantite: 1, 
                prixUnitaire: 3500,
                sousTotal: 3500
              }
            ],
            sousTotal: 3500,
            tauxRemise: 5,
            total: 3325,
            montantTotal: 3325,
            statut: 'CONFIRMEE'
          },
          {
            id: 2,
            idCommandeClient: 2,
            referenceCommandeClient: 'CMD-2024-01-14-002',
            numero: 'CMD-2024-01-14-002',
            client: {
              id: 2,
              nom: 'Fatima Ben Salah',
              prenom: '',
              typeClient: 'ENTREPRISE',
              entreprise: 'Ben Salah Trading',
              email: 'contact@bensalah.com',
              telephone: '98765432'
            },
            dateCommande: '2024-01-14T14:20:00',
            dateCreation: '2024-01-14',
            produits: [
              { 
                id: 2, 
                libelle: 'Écran 24 pouces', 
                quantite: 3, 
                prixUnitaire: 1200,
                sousTotal: 3600
              }
            ],
            sousTotal: 3600,
            tauxRemise: 0,
            total: 3600,
            montantTotal: 3600,
            statut: 'CONFIRMEE'
          }
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
      const newId = sales.length + 1;
      const today = new Date().toISOString().split('T')[0];
      const reference = `CMD-${today}-${String(newId).padStart(3, '0')}`;
      
      const newSale = {
        ...saleData,
        id: newId,
        idCommandeClient: newId,
        referenceCommandeClient: reference,
        numero: reference,
        dateCommande: new Date().toISOString(),
        dateCreation: today,
        statut: 'CONFIRMEE'
      };
      
      setSales(prev => [newSale, ...prev]);
      return newSale;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSale = async (id) => {
    setSales(prev => prev.filter(sale => sale.id !== id && sale.idCommandeClient !== id));
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