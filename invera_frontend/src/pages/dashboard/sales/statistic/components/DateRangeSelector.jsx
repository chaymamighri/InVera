/**
 * DateRangeSelector - Sélecteur de période pour les graphiques
 * 
 * RÔLE : Permettre à l'utilisateur de filtrer les données du dashboard par période
 * 
 * FONCTIONNALITÉS :
 * - Sélection de date de début et date de fin
 * - Validation des dates (cohérence, pas dans le futur, période max 1 an)
 * - Affichage de la période sélectionnée
 - Bouton de rafraîchissement des données
 * - Bouton de réinitialisation du filtre
 * - Animations d'ouverture/fermeture
 * - Gestion des erreurs de saisie
 * 
 * VALIDATIONS :
 * - Les deux dates doivent être renseignées
 * - Date début ≤ Date fin
 * - Date début ≤ aujourd'hui
 * - Période ≤ 365 jours
 * 
 * @param {Object} props
 * @param {Function} props.onApplyCustom - Callback lors de l'application du filtre
 * @param {Function} props.onRefresh - Callback pour rafraîchir les données
 * @param {boolean} props.refreshing - État de rafraîchissement (désactive le bouton)
 * @param {string} props.currentStartDate - Date de début actuelle (YYYY-MM-DD)
 * @param {string} props.currentEndDate - Date de fin actuelle (YYYY-MM-DD)
 * 
 * @example
 * <DateRangeSelector
 *   onApplyCustom={(start, end) => fetchData(start, end)}
 *   onRefresh={() => fetchData()}
 *   refreshing={loading}
 *   currentStartDate="2024-01-01"
 *   currentEndDate="2024-12-31"
 * />
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

const DateRangeSelector = ({ 
  onApplyCustom, 
  onRefresh, 
  refreshing,
  currentStartDate,  
  currentEndDate     
}) => {
  // ===== ÉTATS LOCAUX =====
  const [showPicker, setShowPicker] = useState(false);  // Afficher/masquer le sélecteur
  const [startDate, setStartDate] = useState(currentStartDate || '');  // Date début
  const [endDate, setEndDate] = useState(currentEndDate || '');        // Date fin
  const [dateError, setDateError] = useState('');       // Message d'erreur

  // ===== SYNCHRONISATION AVEC LE PARENT =====
  // Met à jour les dates locales quand les props changent
  useEffect(() => {
    setStartDate(currentStartDate || '');
    setEndDate(currentEndDate || '');
  }, [currentStartDate, currentEndDate]);

  // ============================================
  //  VALIDATION ET APPLICATION DU FILTRE
  // ============================================

  /**
   * Valide les dates et applique le filtre
   * - Vérifie que les deux dates sont remplies
   * - Vérifie que date début ≤ date fin
   * - Vérifie que date début ≤ aujourd'hui
   * - Vérifie que la période ≤ 365 jours
   */
  const handleApplyCustom = () => {
    // Validation 1: Dates requises
    if (!startDate || !endDate) {
      setDateError('Veuillez sélectionner une date de début et de fin');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validation 2: Date début ≤ Date fin
    if (start > end) {
      setDateError('La date de début doit être antérieure à la date de fin');
      return;
    }

    // Validation 3: Date début pas dans le futur
    if (start > today) {
      setDateError('La date de début ne peut pas être dans le futur');
      return;
    }

    // Validation 4: Période ≤ 365 jours
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      setDateError('La période ne peut pas dépasser 1 an');
      return;
    }

    // Tout est valide → application du filtre
    setDateError('');
    onApplyCustom(startDate, endDate);
    setShowPicker(false);
  };

  /**
   * Ferme le sélecteur et efface les erreurs
   */
  const handleClosePicker = () => {
    setShowPicker(false);
    setDateError('');
  };

  /**
   * Réinitialise complètement le filtre
   */
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    onApplyCustom('', '');
    setShowPicker(false);
  };

  // ============================================
  //  AFFICHAGE DE LA PÉRIODE SÉLECTIONNÉE
  // ============================================

  /**
   * Formate l'affichage de la période sélectionnée
   * @returns {string} Ex: "15/01/2024 - 31/12/2024"
   */
  const getDisplayRange = () => {
    if (!currentStartDate || !currentEndDate) {
      return "Sélectionner une période";
    }
    
    const start = new Date(currentStartDate);
    const end = new Date(currentEndDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // ============================================
  //  RENDU PRINCIPAL
  // ============================================

  return (
    <div className="flex items-center gap-3 relative">
      
      {/* ===== BOUTON D'OUVERTURE DU CALENDRIER ===== */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowPicker(true)}
        className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
      >
        <Calendar className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-700">
          {getDisplayRange()}
        </span>
      </motion.button>
      
      {/* ===== BOUTON RAFRAÎCHIR ===== */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRefresh}
        disabled={refreshing}
        className={`
          px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-sm
          ${refreshing 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md'
          }
        `}
        title="Rafraîchir les données"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">Rafraîchir</span>
      </motion.button>

      {/* ===== BOUTON RÉINITIALISER (visible seulement si filtre actif) ===== */}
      {(currentStartDate || currentEndDate) && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
          title="Réinitialiser"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}

      {/* ===== SÉLECTEUR DE DATES (MODAL FLOTTANT) ===== */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border p-5 z-50 w-[500px]"
          >
            {/* Barre colorée en haut */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl" />
            
            {/* En-tête */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Sélectionner une période
              </h3>
              <button onClick={handleClosePicker} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Champs de dates */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Date de début
                  </label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => { 
                      setStartDate(e.target.value); 
                      setDateError(''); 
                    }} 
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Date de fin
                  </label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => { 
                      setEndDate(e.target.value); 
                      setDateError(''); 
                    }} 
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Affichage des erreurs */}
              {dateError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{dateError}</p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-3 border-t border-gray-200">
              <button 
                onClick={handleClosePicker} 
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={handleApplyCustom} 
                disabled={!startDate || !endDate} 
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Appliquer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangeSelector;