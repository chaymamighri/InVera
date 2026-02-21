import React from 'react';
import { motion } from 'framer-motion';

const TopProducts = ({ products, formatCurrency }) => {
  if (!products || products.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucun produit vendu sur cette période
      </div>
    );
  }

  const maxQuantity = Math.max(...products.map(p => p.quantite), 1);

  return (
    <div className="space-y-3">
      {/* En-tête simplifié */}
      <div className="flex justify-between text-xs text-gray-500 pb-2 border-b">
        <span>Top {products.length}</span>
        <span>{products.reduce((sum, p) => sum + p.quantite, 0)} unités</span>
      </div>

      {/* Liste des produits simplifiée */}
      {products.map((product, index) => {
        const quantity = product.quantite || 0;
        const percentage = (quantity / maxQuantity) * 100;

        return (
          <motion.div
            key={product.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                {/* Rang simple */}
                <span className="text-xs font-medium text-gray-400 w-5">
                  #{index + 1}
                </span>

                {/* Image miniature */}
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.nom}
                    className="w-8 h-8 rounded-md object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/32?text=📦';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-lg">
                    📦
                  </div>
                )}

                {/* Nom et quantité simplifiés */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate" title={product.nom}>
                    {product.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {quantity} unités • {formatCurrency(product.montant)}
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de progression simple */}
            <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TopProducts;