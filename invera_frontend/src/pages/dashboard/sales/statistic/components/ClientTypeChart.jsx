// src/pages/dashboard/sales/components/ClientTypeChart.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ClientTypeChart = ({ data, formatCurrency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucune donnée client disponible
      </div>
    );
  }

  const maxMontant = Math.max(...data.map(d => d.montant), 1);
  const total = data.reduce((sum, d) => sum + d.montant, 0);
  const totalClients = data.reduce((sum, d) => sum + d.nombre, 0);

  // Mapping des types avec leurs icônes et couleurs (SANS DOUBLON)
  const typeConfig = {
    'VIP': { icon: '👑', color: 'from-purple-500 to-purple-600' },
    'PROFESSIONNEL': { icon: '💼', color: 'from-blue-500 to-blue-600' },
    'ENTREPRISE': { icon: '🏢', color: 'from-green-500 to-green-600' },
    'FIDELE': { icon: '⭐', color: 'from-yellow-500 to-yellow-600' },
    'PARTICULIER': { icon: '👤', color: 'from-gray-500 to-gray-600' }
  };

  console.log('📊 ClientTypeChart - Données reçues:', data);
  console.log('📊 Total clients calculé:', totalClients);

  return (
    <div className="space-y-6">
      {/* Barres horizontales */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const config = typeConfig[item.type] || { icon: '📊', color: 'from-blue-500 to-blue-600' };
          const percentage = (item.montant / maxMontant) * 100;
          const part = (item.montant / total) * 100;

          return (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <p className="font-medium text-gray-800">{item.type}</p>
                    <p className="text-xs text-gray-400">{item.nombre} clients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatCurrency(item.montant)}</p>
                  <p className="text-xs text-gray-400">{part.toFixed(1)}%</p>
                </div>
              </div>

              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${config.color} rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Statistiques supplémentaires */}
      {data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-600 mb-1">Client moyen</p>
              <p className="text-lg font-bold text-blue-800">
                {formatCurrency(total / totalClients)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-xs text-purple-600 mb-1">Total clients</p>
              <p className="text-lg font-bold text-purple-800">
                {totalClients}
              </p>
            </div>
          </div>

          {/* Mini camembert de répartition */}
          <div className="flex justify-center space-x-1 pt-2">
            {data.map((item, index) => {
              const config = typeConfig[item.type] || { color: 'from-blue-500 to-blue-600' };
              const percentage = (item.montant / total) * 100;
              
              return (
                <motion.div
                  key={`mini-${item.type}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-2 rounded-full bg-gradient-to-r ${config.color}`}
                  style={{ width: `${percentage}%` }}
                />
              );
            })}
          </div>

          {/* Résumé des types */}
          <div className="text-xs text-gray-400 text-center pt-2">
            {data.map(item => item.type).join(' • ')}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientTypeChart;