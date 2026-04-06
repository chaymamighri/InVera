/**
 * KPICard - Carte d'indicateur clé de performance
 * 
 * RÔLE : Afficher un indicateur métrique (CA, nombre de commandes, etc.)
 * 
 * FONCTIONNALITÉS :
 * - Affichage d'une valeur avec icône personnalisée
 * - Tendance avec pourcentage (positif/négatif)
 * - Couleurs adaptées au contexte (bleu, vert, rouge, etc.)
 * - Animation au survol (élévation)
 * - Animation d'apparition (fade-in)
 * - Formatage automatique des valeurs (monnaie, nombre)
 * 
 * UTILISATION DANS LE PROJET :
 * - Chiffre d'Affaires (couleur bleue, icône 💰)
 * - Nombre de commandes (couleur verte, icône 📦)
 * 
 * @param {Object} props
 * @param {string} props.title - Titre de l'indicateur (ex: "Chiffre d'Affaires")
 * @param {number|string} props.value - Valeur à afficher
 * @param {string} props.icon - Emoji ou icône (ex: "💰", "📦")
 * @param {string} [props.color='blue'] - Couleur du thème (blue, green, red, orange, purple, yellow)
 * @param {number} [props.trend] - Tendance en pourcentage (positif = hausse, négatif = baisse)
 * @param {Function} [props.formatValue] - Fonction de formatage (ex: formatCurrency)
 * 
 * @example
 * <KPICard
 *   title="Chiffre d'Affaires"
 *   value={125000}
 *   icon="💰"
 *   color="blue"
 *   trend={12.5}
 *   formatValue={(v) => `${v.toLocaleString()}€`}
 * />
 * 
 * @example
 * <KPICard
 *   title="Commandes"
 *   value={45}
 *   icon="📦"
 *   color="green"
 *   trend={-5.2}
 * />
 */

import React from 'react';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, icon, color = 'blue', trend, formatValue }) => {
  
  // ============================================
  //  MAPPING DES STYLES PAR COULEUR
  // ============================================
  
  /**
   * Dégradé pour la bordure ou le fond (non utilisé actuellement)
   */
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  /**
   * Couleur de fond pour l'icône
   */
  const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    orange: 'bg-orange-100',
    purple: 'bg-purple-100',
    yellow: 'bg-yellow-100'
  };

  /**
   * Couleur du texte pour la valeur
   */
  const textColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600'
  };

  // ============================================
  //  FORMATAGE DE LA VALEUR
  // ============================================
  
  const formattedValue = formatValue ? formatValue(value) : value;

  // ============================================
  //  RENDU
  // ============================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300"
    >
      {/* ===== LIGNE SUPÉRIEURE : ICÔNE + TENDANCE ===== */}
      <div className="flex items-start justify-between">
        
        {/* Icône avec fond coloré */}
        <div className={`${bgColors[color]} p-3 rounded-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
        
        {/* Badge de tendance (si fourni) */}
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-green-100 text-green-700' : 
            trend < 0 ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            <span>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            </span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* ===== LIGNE INFÉRIEURE : TITRE + VALEUR ===== */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${textColors[color]}`}>
          {formattedValue}
        </p>
      </div>
    </motion.div>
  );
};

export default KPICard;