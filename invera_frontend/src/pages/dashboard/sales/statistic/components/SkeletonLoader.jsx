/**
 * SkeletonLoader - Chargement (squelette animé)
 * 
 * Affiche des blocs gris animés pendant le chargement des données.
 * 
 * @example
 * if (loading) return <SkeletonLoader />;
 */

import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="space-y-6 animate-pulse">
      
      {/* ===== 1. SÉLECTEUR DE PÉRIODE (mock) ===== */}
      <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
      
      {/* ===== 2. CARTES KPI (4 cartes) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
            {/* Ligne supérieure : icône + badge tendance */}
            <div className="flex justify-between">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            {/* Ligne inférieure : titre + valeur */}
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 3. GRAPHIQUES (2 colonnes) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne gauche : Graphique évolution CA (2/3 largeur) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
        
        {/* Colonne droite : Top 5 produits (1/3 largeur) */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                {/* Ligne : nom produit + valeur */}
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
                {/* Barre de progression */}
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;