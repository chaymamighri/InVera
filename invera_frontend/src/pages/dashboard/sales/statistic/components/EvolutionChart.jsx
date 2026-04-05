// src/pages/dashboard/sales/components/EvolutionChart.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';

const EvolutionChart = ({ data, formatCurrency }) => {
  // ✅ Filtrer pour garder UNIQUEMENT les jours avec CA > 0
  const filteredData = data?.filter(point => point.valeur > 0) || [];
  
  // ✅ Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Si la date est déjà au format "Sat 28/03"
    if (dateString.match(/^[A-Za-z]{3} \d{2}\/\d{2}$/)) {
      return dateString.substring(4); // Retourne "28/03"
    }
    
    // Si la date est au format ISO
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };
  
  // ✅ Cas 1 : Aucune donnée du tout
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-5xl mb-4 animate-pulse">📊</div>
        <p className="text-sm font-medium text-gray-500">Aucune donnée à afficher</p>
        <p className="text-xs text-gray-400 mt-2 text-center max-w-xs px-4">
          Sélectionnez une période dans le calendrier<br />
          pour visualiser l'évolution du chiffre d'affaires
        </p>
        <div className="flex items-center gap-2 mt-4 text-blue-500">
          <Calendar className="w-4 h-4" />
          <span className="text-xs">Cliquez sur le calendrier pour commencer</span>
        </div>
      </div>
    );
  }
  
  // ✅ Cas 2 : Aucune vente sur la période
  if (filteredData.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-5xl mb-4">📉</div>
        <p className="text-sm font-medium text-gray-500">Aucune vente sur cette période</p>
        <p className="text-xs text-gray-400 mt-2 text-center max-w-xs px-4">
          {data.length} jour(s) sans chiffre d'affaires
        </p>
        <div className="flex items-center gap-2 mt-4 text-amber-500">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs">Essayez une autre période</span>
        </div>
      </div>
    );
  }
  
  // ✅ Calcul de la valeur max pour l'échelle
  const maxValue = Math.max(...filteredData.map(d => d.valeur), 1);
  
  console.log('📊 EvolutionChart - Jours avec ventes :', filteredData.length, '/', data.length);
  
  return (
    <div className="w-full">
      {/* Indicateur de filtre */}
      {filteredData.length < data.length && (
        <div className="mb-3 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
          Affichage des {filteredData.length} jour(s) avec ventes
          <span className="text-gray-400">({data.length - filteredData.length} jour(s) sans vente masqué(s))</span>
        </div>
      )}
      
      {/* Graphique */}
      <div className="h-64 w-full flex items-end gap-2">
        {filteredData.map((point, index) => {
          const heightPercentage = (point.valeur / maxValue) * 100;
          const formattedDate = formatDate(point.date);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-1 flex flex-col items-center group h-full"
            >
              {/* Barre */}
              <div className="w-full h-full flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg group-hover:from-blue-600 group-hover:to-cyan-600 transition-all cursor-pointer relative shadow-md"
                  style={{ 
                    minHeight: '4px',
                  }}
                >
                  {/* Tooltip au survol */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                    <div className="font-medium">{formatCurrency(point.valeur)}</div>
                    <div className="text-gray-300 text-[10px]">{formattedDate}</div>
                  </div>
                </motion.div>
              </div>
              
              {/* Date */}
              <span className="text-xs text-gray-500 mt-2 font-medium">
                {formattedDate}
              </span>
              
              {/* Valeur sous la date */}
              <span className="text-[10px] text-blue-600 mt-0.5">
                {formatCurrency(point.valeur)}
              </span>
            </motion.div>
          );
        })}
      </div>
      
      {/* Statistiques */}
      <div className="flex justify-between mt-4 pt-3 border-t text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Période: {data.length} jours</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Jours avec ventes: {filteredData.length}</span>
        </div>
        <div>
          CA total: {formatCurrency(filteredData.reduce((sum, d) => sum + d.valeur, 0))}
        </div>
      </div>
    </div>
  );
};

export default EvolutionChart;