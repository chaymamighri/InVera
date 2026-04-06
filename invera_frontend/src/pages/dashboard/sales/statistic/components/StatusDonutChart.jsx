/**
 * StatusDonutChart - Graphique circulaire des commandes par statut
 * 
 * Affiche la répartition du chiffre d'affaires selon le statut des commandes.
 * 
 * @example
 * <StatusDonutChart data={statusData} formatCurrency={formatCurrency} />
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusDonutChart = ({ data, formatCurrency }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Pas de données
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  // Calcul du total
  const total = data.reduce((sum, item) => sum + (item.montant || 0), 0);
  
  // Pas de chiffre d'affaires
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucun chiffre d'affaires sur cette période
      </div>
    );
  }

  const radius = 80;
  let cumulativeAngle = 0;

  // Traduction des statuts
  const getStatutLabel = (statut) => {
    const labels = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  };

  return (
    <div className="space-y-4">
      {/* Graphique circulaire */}
      <div className="relative flex justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {data.map((item, index) => {
            const percentage = (item.montant / total) * 100;
            const angle = (percentage / 100) * 360;
            
            if (angle <= 0) return null;
            
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            cumulativeAngle = endAngle;

            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;

            const x1 = 100 + radius * Math.cos(startRad);
            const y1 = 100 + radius * Math.sin(startRad);
            const x2 = 100 + radius * Math.cos(endRad);
            const y2 = 100 + radius * Math.sin(endRad);

            const pathData = `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;

            return (
              <motion.path
                key={item.statut}
                d={pathData}
                fill={item.couleur}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-300"
                style={{
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  filter: hoveredIndex !== null && hoveredIndex !== index ? 'brightness(0.5)' : 'none'
                }}
              />
            );
          })}
          <circle cx="100" cy="100" r="50" fill="white" />
        </svg>

        {/* Tooltip au centre */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white px-4 py-2 rounded-xl shadow-lg border"
          >
            <p className="text-xs text-gray-500">{getStatutLabel(data[hoveredIndex].statut)}</p>
            <p className="text-lg font-bold" style={{ color: data[hoveredIndex].couleur }}>
              {formatCurrency(data[hoveredIndex].montant)}
            </p>
            <p className="text-xs text-gray-600">
              {((data[hoveredIndex].montant / total) * 100).toFixed(1)}%
            </p>
          </motion.div>
        )}
      </div>

      {/* Légende */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item, index) => (
          <div
            key={item.statut}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="flex items-center p-3 rounded-lg cursor-pointer"
          >
            <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.couleur }} />
            <div className="flex-1">
              <p className="text-sm font-medium">{getStatutLabel(item.statut)}</p>
              <p className="text-xs text-gray-500">{item.nombre || 0} commandes</p>
            </div>
            <p className="text-xs font-semibold" style={{ color: item.couleur }}>
              {((item.montant / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t pt-3">
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusDonutChart;