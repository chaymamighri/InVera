// src/pages/dashboard/sales/components/StatusDonutChart.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusDonutChart = ({ data, formatCurrency }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  useEffect(() => {
    console.log('🔴 StatusDonutChart - Données reçues:', data);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucune donnée de répartition disponible
      </div>
    );
  }

  // ✅ Vérifier que les montants sont des nombres valides
  const validData = data.map(item => ({
    ...item,
    montant: typeof item.montant === 'number' ? item.montant : parseFloat(item.montant) || 0
  }));

  const total = validData.reduce((sum, item) => sum + item.montant, 0);
  
  // ✅ Si total est 0, afficher un message ou des valeurs par défaut
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-sm">Aucun chiffre d'affaires</p>
          <p className="text-xs mt-1">sur cette période</p>
        </div>
      </div>
    );
  }

  const radius = 80;
  let cumulativeAngle = 0;

  // Mapping des statuts vers des libellés lisibles
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
      {/* Graphique Donut */}
      <div className="relative flex justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {validData.map((item, index) => {
            const percentage = (item.montant / total) * 100;
            const angle = (percentage / 100) * 360;
            
            // ✅ Éviter les angles invalides
            if (angle <= 0 || isNaN(angle)) return null;
            
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            cumulativeAngle = endAngle;

            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;

            const x1 = 100 + radius * Math.cos(startRad);
            const y1 = 100 + radius * Math.sin(startRad);
            const x2 = 100 + radius * Math.cos(endRad);
            const y2 = 100 + radius * Math.sin(endRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M 100 100`,
              `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
              `Z`
            ].join(' ');

            return (
              <motion.path
                key={item.statut || index}
                d={pathData}
                fill={item.couleur}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                  filter: hoveredIndex === null || hoveredIndex === index 
                    ? 'none' 
                    : 'brightness(0.8) opacity(0.5)'
                }}
              />
            );
          })}
          <circle cx="100" cy="100" r="50" fill="white" className="pointer-events-none" />
        </svg>

        {/* Centre interactif */}
        <AnimatePresence>
          {hoveredIndex !== null && validData[hoveredIndex] && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white px-4 py-2 rounded-xl shadow-lg border z-10"
            >
              <p className="text-xs text-gray-500">{getStatutLabel(validData[hoveredIndex].statut)}</p>
              <p className="text-lg font-bold" style={{ color: validData[hoveredIndex].couleur }}>
                {formatCurrency(validData[hoveredIndex].montant)}
              </p>
              <p className="text-xs text-gray-600">
                {((validData[hoveredIndex].montant / total) * 100).toFixed(1)}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Légende interactive */}
      <div className="grid grid-cols-2 gap-3">
        {validData.map((item, index) => {
          const percentage = (item.montant / total) * 100;
          
          return (
            <motion.div
              key={item.statut || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                hoveredIndex === index ? 'bg-gray-50 shadow-md' : ''
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: item.couleur }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{getStatutLabel(item.statut)}</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{item.nombre || 0} commandes</p>
                  <p className="text-xs font-semibold" style={{ color: item.couleur }}>
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="border-t pt-3 mt-2">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusDonutChart;