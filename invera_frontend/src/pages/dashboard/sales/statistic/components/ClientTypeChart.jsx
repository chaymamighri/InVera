/**
 * ClientTypeChart - Graphique de rÃƒÂ©partition des clients par type
 * 
 * RÃƒâ€LE : Afficher la distribution des clients par catÃƒÂ©gorie (VIP, Entreprise, Particulier, etc.)
 * 
 * FONCTIONNALITÃƒâ€°S :
 * - Affichage des donnÃƒÂ©es sous forme de cartes par type de client
 * - Barres de progression pour le pourcentage de clients
 * - Barres de progression pour le pourcentage du CA
 * - Cartes rÃƒÂ©capitulatives (total clients, CA total)
 * - Mini barre de rÃƒÂ©partition (camembert horizontal)
 * - LÃƒÂ©gende interactive
 * - Animations fluides (Framer Motion)
 * 
 * @param {Object} props
 * @param {Array|Object} props.data - DonnÃƒÂ©es des clients
 * @param {Function} props.formatCurrency - Fonction de formatage monÃƒÂ©taire
 * 
 * @example
 * // Format attendu des donnÃƒÂ©es
 * data = [
 *   { type: "VIP", nombre: 45, ca: 150000 },
 *   { type: "ENTREPRISE", nombre: 120, ca: 320000 },
 *   { type: "PARTICULIER", nombre: 300, ca: 180000 }
 * ]
 * 
 * // Format alternatif (objet)
 * data = {
 *   VIP: { nombre: 45, ca: 150000 },
 *   ENTREPRISE: { nombre: 120, ca: 320000 }
 * }
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../../../../context/LanguageContext';

const ClientTypeChart = ({ data, formatCurrency }) => {
  const { t } = useLanguage();
  
  // ============================================
  //  LOGS DE DÃƒâ€°BOGUAGE (ÃƒÂ  supprimer en production)
  // ============================================
  console.log('Ã°Å¸â€œÅ  ClientTypeChart - DonnÃƒÂ©es reÃƒÂ§ues:', data);
  console.log('Ã°Å¸â€œÅ  Type de donnÃƒÂ©es:', typeof data);
  console.log('Ã°Å¸â€œÅ  Est un tableau?', Array.isArray(data));

  // ============================================
  //  VALIDATION DES DONNÃƒâ€°ES
  // ============================================
  
  // Cas 1: Pas de donnÃƒÂ©es
  if (!data) {
    console.log('Ã¢ÂÅ’ Aucune donnÃƒÂ©e reÃƒÂ§ue');
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        {t('dashboard.salesStatsPage.noClientData')}
      </div>
    );
  }

  // Cas 2: Objet vide
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    console.log('Ã¢ÂÅ’ Objet vide reÃƒÂ§u');
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        {t('dashboard.salesStatsPage.noClientData')}
      </div>
    );
  }

  // Cas 3: Tableau vide
  if (Array.isArray(data) && data.length === 0) {
    console.log('Ã¢ÂÅ’ Tableau vide reÃƒÂ§u');
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        {t('dashboard.salesStatsPage.noClientData')}
      </div>
    );
  }

  // ============================================
  //  TRANSFORMATION DES DONNÃƒâ€°ES (format flexible)
  // ============================================
  
  let chartData = [];
  
  if (Array.isArray(data)) {
    // Format: tableau d'objets
    chartData = data.map(item => ({
      type: item.type || item.categorie || 'NON_DEFINI',
      nombre: item.nombre || item.count || item.clients || 0,
      ca: item.ca || item.montant || item.chiffreAffaires || 0
    }));
  } else if (typeof data === 'object') {
    // Format: objet avec clÃƒÂ©s
    chartData = Object.entries(data)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([type, stats]) => {
        // Si stats est un nombre directement
        if (typeof stats === 'number') {
          return { type, nombre: stats, ca: 0 };
        }
        // Si stats est un objet
        return {
          type: type,
          nombre: stats.nombre || stats.count || stats.clients || 0,
          ca: stats.ca || stats.montant || stats.chiffreAffaires || 0
        };
      });
  }

  console.log('Ã°Å¸â€œÅ  ChartData transformÃƒÂ©:', chartData);

  // VÃƒÂ©rification finale
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        {t('dashboard.salesStatsPage.noClientData')}
      </div>
    );
  }

  // ============================================
  //  CALCUL DES TOTAUX
  // ============================================
  
  const totalClients = chartData.reduce((sum, d) => sum + (d.nombre || 0), 0);
  const totalCA = chartData.reduce((sum, d) => sum + (d.ca || 0), 0);


  // ============================================
  //  MAPPING DES STYLES PAR TYPE DE CLIENT
  // ============================================
  
  /**
   * Couleur de fond pour chaque type de client
   * @param {string} type - Type de client
   * @returns {string} Classe Tailwind CSS
   */
  const getTypeColor = (type) => {
    const colors = {
      'VIP': 'bg-yellow-500',
      'ENTREPRISE': 'bg-purple-500',
      'PROFESSIONNEL': 'bg-blue-500',
      'FIDELE': 'bg-green-500',
      'PARTICULIER': 'bg-orange-500',
      'NON_DEFINI': 'bg-gray-500'
    };
    return colors[type] || 'bg-indigo-500';
  };

  /**
   * DÃƒÂ©gradÃƒÂ© pour chaque type de client
   * @param {string} type - Type de client
   * @returns {string} Classes Tailwind CSS pour le dÃƒÂ©gradÃƒÂ©
   */
  const getTypeGradient = (type) => {
    const gradients = {
      'VIP': 'from-yellow-500 to-yellow-600',
      'ENTREPRISE': 'from-purple-500 to-purple-600',
      'PROFESSIONNEL': 'from-blue-500 to-blue-600',
      'FIDELE': 'from-green-500 to-green-600',
      'PARTICULIER': 'from-orange-500 to-orange-600',
      'NON_DEFINI': 'from-gray-500 to-gray-600'
    };
    return gradients[type] || 'from-indigo-500 to-indigo-600';
  };

  /**
   * IcÃƒÂ´ne pour chaque type de client
   * @param {string} type - Type de client
   * @returns {string} Emoji
   */
  const getTypeIcon = (type) => {
    const icons = {
      'VIP': 'Ã°Å¸â€˜â€˜',
      'ENTREPRISE': 'Ã°Å¸ÂÂ¢',
      'PROFESSIONNEL': 'Ã°Å¸â€™Â¼',
      'FIDELE': 'Ã¢Â­Â',
      'PARTICULIER': 'Ã°Å¸â€˜Â¤',
      'NON_DEFINI': 'Ã°Å¸â€œÅ '
    };
    return icons[type] || 'Ã°Å¸â€œÅ ';
  };

  // ============================================
  //  GESTION DES CAS LIMITES
  // ============================================
  
  // Pas de clients Ã¢â€ â€™ message
  if (totalClients === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-center">
          <p className="text-sm">{t('dashboard.salesStatsPage.noClientFound')}</p>
          <p className="text-xs mt-1">{t('dashboard.salesStatsPage.noClientDataForPeriod')}</p>
        </div>
      </div>
    );
  }

  // ============================================
  //  RENDU PRINCIPAL
  // ============================================

  return (
    <div className="space-y-6">
      
      {/* ===== SECTION 1: CARTES PAR TYPE DE CLIENT ===== */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold">{t('dashboard.salesStatsPage.clientTypeBreakdown')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('dashboard.salesStatsPage.detailedCategoryAnalysis')}</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chartData.map((item, index) => {
              const percentage = totalClients > 0 ? ((item.nombre / totalClients) * 100).toFixed(1) : 0;
              const caPercentage = totalCA > 0 ? ((item.ca / totalCA) * 100).toFixed(1) : 0;
              
              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  {/* En-tÃƒÂªte de la carte */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(item.type)}`}></div>
                      <h4 className="font-semibold text-gray-800">{item.type}</h4>
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                    </div>
                  </div>
                  
                  {/* Barre de progression - clients */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{t('dashboard.salesStatsPage.clientShare')}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-2.5 rounded-full bg-gradient-to-r ${getTypeGradient(item.type)}`}
                      />
                    </div>
                  </div>
                  
                  {/* Valeurs numÃƒÂ©riques */}
                  <div className="grid grid-cols-2 gap-3 text-center mb-3">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500">{t('dashboard.salesStatsPage.clients')}</p>
                      <p className="text-xl font-bold text-gray-800">{item.nombre}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500">{t('dashboard.salesStatsPage.revenueShort')}</p>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(item.ca)}</p>
                    </div>
                  </div>

                  {/* Barre de progression - CA */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{t('dashboard.salesStatsPage.revenueShare')}</span>
                      <span className="font-medium text-green-600">{caPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${caPercentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.15 }}
                        className="h-1.5 rounded-full bg-green-500"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== SECTION 3: MINI CAMEMBERT (barre horizontale) ===== */}
      {chartData.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">{t('dashboard.salesStatsPage.clientDistributionByType')}</p>
          <div className="flex justify-center space-x-1">
            {chartData.map((item, index) => {
              const percentage = totalClients > 0 ? (item.nombre / totalClients) * 100 : 0;
              return (
                <motion.div
                  key={`mini-${item.type}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-2 rounded-full bg-gradient-to-r ${getTypeGradient(item.type)}`}
                  style={{ width: `${percentage}%` }}
                  title={`${item.type}: ${percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
          
          {/* LÃƒÂ©gende */}
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-400 pt-2">
            {chartData.map(item => (
              <div key={`legend-${item.type}`} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getTypeColor(item.type)}`}></div>
                <span>{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTypeChart;
