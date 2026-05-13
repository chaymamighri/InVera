/**
 * TopProducts - Classement des produits les plus vendus
 * 
 * Affiche le top 5 des produits avec leur quantité et montant.
 * 
 * @example
 * <TopProducts products={topProduits} formatCurrency={formatCurrency} />
 */

import React from 'react';
import { motion } from 'framer-motion';

const TopProducts = ({ products, formatCurrency }) => {
  // URL de base de votre API backend
  const API_BASE_URL = 'http://localhost:8081'; // Votre port backend

  // Fonction pour obtenir l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Si c'est déjà une URL complète, la retourner
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Construire l'URL complète vers l'endpoint public
    // Le chemin stocké est "uploads/produits/nomfichier.jpg"
    return `${API_BASE_URL}/api/produits/${imagePath}`;
  };

  // Pas de produits
  if (!products || products.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucun produit vendu
      </div>
    );
  }

  // Valeur max pour les barres
  const maxQuantity = Math.max(...products.map(p => p.quantite), 1);

  return (
    <div className="space-y-3">
      {/* En-tête */}
      <div className="flex justify-between text-xs text-gray-500 pb-2 border-b">
        <span>Top {products.length}</span>
        <span>{products.reduce((sum, p) => sum + p.quantite, 0)} unités</span>
      </div>

      {/* Liste des produits */}
      {products.map((product, index) => {
        const quantity = product.quantite || 0;
        const percentage = (quantity / maxQuantity) * 100;
        const imageUrl = getImageUrl(product.image);

        return (
          <motion.div
            key={product.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            {/* Ligne produit */}
            <div className="flex items-center gap-2">
              {/* Rang */}
              <span className="text-xs font-medium text-gray-400 w-5">
                #{index + 1}
              </span>

              {/* Icône / Image - Version corrigée */}
              {imageUrl ? (
                <img 
                  src={imageUrl}
                  alt={product.nom}
                  className="w-8 h-8 rounded-md object-cover border"
                  onError={(e) => {
                    console.error(`❌ Erreur chargement image: ${imageUrl}`);
                    e.target.style.display = 'none';
                    // Afficher un fallback
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-icon w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-lg';
                      fallback.textContent = '📦';
                      parent.appendChild(fallback);
                    }
                  }}
                  onLoad={() => {
                    console.log(`✅ Image chargée: ${imageUrl}`);
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-lg">
                  📦
                </div>
              )}

              {/* Infos produit */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate" title={product.nom}>
                  {product.nom}
                </p>
                <p className="text-xs text-gray-500">
                  {quantity} unités • {formatCurrency(product.montant)}
                </p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TopProducts;