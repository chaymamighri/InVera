// src/hooks/useCategories.js - Version corrigée
import { useState, useEffect } from 'react';
import categorieService from '../services/categorieService';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📦 Chargement des catégories depuis le backend...');
        const categoriesData = await categorieService.getAllCategories();
        
        console.log('📥 Catégories reçues:', categoriesData);
        
        // ✅ Vérifier que categoriesData est un tableau
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          const formattedCategories = categoriesData.map(cat => ({
            idCategorie: cat.idCategorie || cat.id,
            nomCategorie: cat.nomCategorie || cat.nom || cat.libelle || 'Sans catégorie',
            description: cat.description || '',
            tauxTVA: cat.tauxTVA || 19
          }));
          
          console.log('✅ Catégories formatées:', formattedCategories.length);
          setCategories(formattedCategories);
        } else {
          // ✅ Pas de catégories, mais on ne bloque pas
          console.log('⚠️ Aucune catégorie trouvée');
          setCategories([]);
        }
      } catch (err) {
        console.error('❌ Erreur chargement catégories:', err);
        setError(err.message);
        // ✅ En cas d'erreur, on garde un tableau vide pour ne pas bloquer l'UI
        setCategories([]);
      } finally {
        // ✅ TOUJOURS passer loading à false
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading, error };
};

export default useCategories;