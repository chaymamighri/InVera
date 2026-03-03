// src/hooks/useCategories.js
import { useState, useEffect } from 'react';
import categorieService from '../services/categorieService';

// Catégories par défaut (fallback)
const DEFAULT_CATEGORIES = [
  { idCategorie: 1, libelle: 'Électronique' },
  { idCategorie: 2, libelle: 'Informatique' },
  { idCategorie: 3, libelle: 'Bureau' },
  { idCategorie: 4, libelle: 'Téléphonie' },
  { idCategorie: 5, libelle: 'Accessoires' },
];

const useCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📦 Chargement des catégories depuis le backend...');
        const data = await categorieService.getAllCategories();
        
        if (Array.isArray(data) && data.length > 0) {
          // Formater les données du backend
          const formattedCategories = data.map(cat => ({
            idCategorie: cat.idCategorie,
            libelle: cat.nomCategorie || cat.libelle || 'Sans nom'
          }));
          setCategories(formattedCategories);
        } else {
          // Pas de données, on garde les catégories par défaut
          console.log('⚠️ Aucune catégorie reçue, utilisation des valeurs par défaut');
        }
      } catch (err) {
        console.error('❌ Erreur chargement catégories:', err);
        setError(err.message);
        // On garde les catégories par défaut en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading, error };
};

export default useCategories;