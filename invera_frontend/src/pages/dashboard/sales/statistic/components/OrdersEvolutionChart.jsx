/**
 * OrdersEvolutionChart - Graphique combiné commandes + chiffre d'affaires
 * 
 * RÔLE : Visualiser l'évolution des commandes (barres) et du CA (ligne)
 * 
 * FONCTIONNALITÉS :
 * - Barres bleues : nombre de commandes par jour
 * - Ligne verte : évolution du chiffre d'affaires
 * - Points interactifs au survol (tooltip avec CA + commandes)
 * - Gestion des jours sans commandes (barre grise fixe)
 * - Grille de fond pour la lecture
 * - Animations progressives (barres, ligne, points)
 * - Résumé des totaux (commandes totales, CA total)
 * 
 * PARTICULARITÉS :
 * - Jours sans commandes : barre grise de hauteur fixe (40%)
 * - Ligne du CA peut monter et descendre (pas cumulatif)
 * - Tooltip personnalisé au survol des points verts
 * 
 * @param {Object} props
 * @param {Array} props.data - Données [{ date, commandes, ca }]
 * @param {Function} props.formatCurrency - Formatage monétaire
 * 
 * @example
 * // Données attendues
 * data = [
 *   { date: "2024-01-15", commandes: 12, ca: 12500 },
 *   { date: "2024-01-16", commandes: 8, ca: 8900 },
 *   { date: "2024-01-17", commandes: 0, ca: 0 }
 * ]
 */

import React from 'react';
import { motion } from 'framer-motion';

const OrdersEvolutionChart = ({ data, formatCurrency }) => {
  
  // ============================================
  //  VALIDATION DES DONNÉES
  // ============================================
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  // ============================================
  //  CALCUL DES MAXIMUMS (ÉCHELLE)
  // ============================================
  
  // ✅ Pour les barres : jours AVEC commandes uniquement
  const commandesPositives = data.filter(d => d.commandes > 0).map(d => d.commandes);
  const maxCommandes = commandesPositives.length > 0 
    ? Math.max(...commandesPositives, 1) 
    : 1;
  
  // ✅ Pour la ligne CA : jours AVEC CA uniquement
  const caPositifs = data.filter(d => d.ca > 0).map(d => d.ca);
  const maxCA = caPositifs.length > 0 
    ? Math.max(...caPositifs, 1) 
    : 1;

  // ============================================
  //  FORMATAGE DES DATES
  // ============================================
  
  /**
   * Formate la date pour l'affichage (ex: "15/01")
   * @param {string} dateStr - Date ISO (YYYY-MM-DD)
   * @returns {string} Date formatée
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}`;
    }
    return dateStr;
  };

  // ============================================
  //  RENDU PRINCIPAL
  // ============================================

  return (
    <div className="space-y-4">
      
      {/* ===== GRAPHIQUE ===== */}
      <div className="h-64 relative">
        
        {/* Grille de fond (lignes horizontales) */}
        <div className="absolute inset-0">
          {[0, 25, 50, 75, 100].map((line) => (
            <div 
              key={line} 
              className="border-t border-gray-100 absolute w-full" 
              style={{ bottom: `${line}%` }}
            />
          ))}
        </div>

        {/* ===== BARRES (nombre de commandes) ===== */}
        <div className="absolute inset-0 flex items-end space-x-2 z-10">
          {data.map((point, index) => {
            // Hauteur des barres :
            // - Jours avec commandes → proportionnelle
            // - Jours sans commande → hauteur fixe (40px pour visibilité)
            const height = point.commandes > 0 
              ? (point.commandes / maxCommandes) * 100 
              : 40; // Hauteur fixe pour les jours à 0
            
            return (
              <div key={`bar-${index}`} className="flex-1 flex flex-col items-center group">
                <div className="w-full h-full flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`w-full rounded-t-lg relative ${
                      point.commandes > 0 
                        ? 'bg-gradient-to-t from-blue-400 to-blue-500' 
                        : 'bg-gray-200 border border-gray-300'
                    }`}
                    style={{ minHeight: point.commandes > 0 ? '6px' : '40px' }}
                  >
                    {/* Badge du nombre de commandes */}
                    {point.commandes > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 whitespace-nowrap bg-blue-50 px-2 py-1 rounded shadow-sm"
                      >
                        {point.commandes}
                      </motion.div>
                    ) : (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-500 whitespace-nowrap bg-white/80 px-2 py-0.5 rounded shadow-sm">
                        0
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== LIGNE DU CHIFFRE D'AFFAIRES (polyline) ===== */}
        <svg className="absolute inset-0 w-full h-full z-20" style={{ overflow: 'visible' }}>
          <motion.polyline
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            points={data.map((point, i) => {
              const x = (i / (data.length - 1)) * 100;
              // Position Y en pourcentage :
              // - CA > 0 → position normale (plus haut = plus de CA)
              // - CA = 0 → tout en bas (100%)
              const y = point.ca > 0 
                ? 100 - (point.ca / maxCA) * 100 
                : 100;
              return `${x}%,${y}%`;
            }).join(' ')}
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* ===== POINTS SUR LA LIGNE (interactifs) ===== */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = point.ca > 0 
            ? 100 - (point.ca / maxCA) * 100 
            : 100;
          
          return (
            <motion.div
              key={`point-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg group cursor-pointer z-30"
              style={{ left: `${x}%`, bottom: `${y}%`, transform: 'translate(-50%, 50%)' }}
            >
              {/* Tooltip au survol */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 shadow-lg pointer-events-none">
                {point.ca > 0 ? (
                  <>
                    <div>CA: {formatCurrency(point.ca)}</div>
                    <div className="text-gray-300 text-[10px]">{point.commandes} commandes</div>
                  </>
                ) : (
                  <div>Aucune vente</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

           {/* ===== LÉGENDE ===== */}
      <div className="flex items-center justify-center space-x-8 pt-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-xs text-gray-600">Nombre de commandes</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-500 rounded mr-2"></div>
          <span className="text-xs text-gray-600">Chiffre d'affaires</span>
        </div>
      </div>

        {/* ===== DATES ET VALEURS ===== */}
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
        {data.map((point, index) => (
          <div key={`date-${index}`} className="text-center">
            {/* Date */}
            <div className={point.commandes === 0 ? 'text-gray-500 font-medium' : 'text-gray-400'}>
              {formatDate(point.date)}
            </div>
            {/* CA du jour */}
            {point.ca > 0 ? (
              <div className="text-[10px] text-green-600 mt-1 font-medium">
                {formatCurrency(point.ca)}
              </div>
            ) : (
              <div className="text-[8px] text-gray-300 mt-1">-</div>
            )}
          </div>
        ))}
      </div>

      {/* ===== RÉSUMÉ STATISTIQUES ===== */}
      <div className="border-t pt-3 mt-2 text-xs text-gray-500 flex justify-between px-2">
        <span>📦 Total: {data.reduce((sum, p) => sum + p.commandes, 0)} commandes</span>
        <span>💰 CA total: {formatCurrency(data.reduce((sum, p) => sum + p.ca, 0))}</span>
      </div>
    </div>
  );
};

export default OrdersEvolutionChart;