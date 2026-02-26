// src/pages/dashboard/sales/components/DateRangeSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

const DateRangeSelector = ({ 
  onApplyCustom, 
  onRefresh, 
  refreshing 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [lastCustomRange, setLastCustomRange] = useState(null);

  // ✅ PLUS D'INITIALISATION AUTOMATIQUE - dates vides par défaut
  // useEffect supprimé

  const handleApplyCustom = () => {
    if (!startDate || !endDate) {
      setDateError('Veuillez sélectionner une date de début et de fin');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > end) {
      setDateError('La date de début doit être antérieure à la date de fin');
      return;
    }

    if (start > today) {
      setDateError('La date de début ne peut pas être dans le futur');
      return;
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      setDateError('La période ne peut pas dépasser 1 an');
      return;
    }

    setDateError('');
    setLastCustomRange({ start: startDate, end: endDate });
    onApplyCustom(startDate, endDate);
    setShowPicker(false);
  };

  const handleClosePicker = () => {
    setShowPicker(false);
    setDateError('');
    // ✅ Ne pas restaurer lastCustomRange
  };

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fonction pour formater l'affichage de la période sélectionnée
  const getDisplayRange = () => {
    if (!lastCustomRange) return "Sélectionner une période";
    
    const start = new Date(lastCustomRange.start);
    const end = new Date(lastCustomRange.end);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // ✅ Fonction pour réinitialiser (si besoin)
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setLastCustomRange(null);
    setDateError('');
    onApplyCustom('', ''); // ← Appel avec dates vides
  };

  return (
    <div className="flex items-center gap-3 relative">
      {/* Bouton d'ouverture du calendrier */}
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
      
      {/* Bouton rafraîchir */}
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

      {/* Bouton Reset (optionnel) */}
      {lastCustomRange && (
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

      {/* Sélecteur de dates */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border p-5 z-50 w-[500px]"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl" />
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Sélectionner une période
              </h3>
              <button onClick={handleClosePicker} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Date de début
                  </label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => { setStartDate(e.target.value); setDateError(''); }} 
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
                    onChange={(e) => { setEndDate(e.target.value); setDateError(''); }} 
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {dateError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{dateError}</p>
                </div>
              )}
            </div>

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