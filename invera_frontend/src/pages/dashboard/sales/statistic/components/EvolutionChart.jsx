import React from 'react';
import { motion } from 'framer-motion';

const EvolutionChart = ({ data, formatCurrency }) => {
  console.log('📊 EvolutionChart data:', data);
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  // ✅ GARDER LA VALEUR RÉELLE - PAS DE TRANSFORMATION
  const maxValue = Math.max(...data.map(d => d.valeur), 1);

  return (
    <div className="h-64 w-full flex items-end space-x-2">
      {data.map((point, index) => {
        // ✅ Hauteur basée sur la VRAIE valeur (préservation des données)
        const heightPercentage = (point.valeur / maxValue) * 100;
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center group h-full">
            <div className="w-full h-full flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg group-hover:from-blue-600 group-hover:to-cyan-600 transition-all cursor-pointer relative"
                style={{ 
                  // ✅ Seulement un ajustement visuel minimum
                  minHeight: point.valeur > 0 ? '6px' : '2px',
                  // ✅ Opacité basée sur la valeur (optionnel)
                  opacity: 0.7 + (heightPercentage / 300)
                }}
              >
                {point.valeur > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                    {formatCurrency(point.valeur)}
                  </div>
                )}
              </motion.div>
            </div>
            <span className="text-xs text-gray-500 mt-2">{point.date}</span>
          </div>
        );
      })}
    </div>
  );
};

export default EvolutionChart;