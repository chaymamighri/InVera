// src/pages/dashboard/sales/components/AdvancedPeriodSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, RefreshCw, Check, AlertCircle, TrendingUp } from 'lucide-react';

const periods = [
  { id: 'today', label: "Aujourd'hui", icon: '📅', description: 'Ventes du jour' },
  { id: 'week', label: 'Cette semaine', icon: '📆', description: 'Lun - Dim' },
  { id: 'month', label: 'Ce mois', icon: '📊', description: 'Performance mensuelle' },
  { id: 'year', label: 'Cette année', icon: '📈', description: 'Vue annuelle' },
  { id: 'custom', label: 'Personnalisé', icon: '⚙️', description: 'Choisir vos dates' }
];

const AdvancedPeriodSelector = ({ 
  selectedPeriod, 
  onChange, 
  onRefresh, 
  refreshing,
  onApplyCustom,
  showCustomPicker,
  setShowCustomPicker 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [isHovered, setIsHovered] = useState(null);
  const [lastCustomRange, setLastCustomRange] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearSelector, setShowYearSelector] = useState(false);

  // Générer les années (5 ans en arrière, 2 ans en avant)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    if (showCustomPicker) {
      setDateError('');
    }
  }, [showCustomPicker]);

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
    setShowCustomPicker(false);
  };

  const handleClosePicker = () => {
    setShowCustomPicker(false);
    setShowYearSelector(false);
    setDateError('');
    if (lastCustomRange) {
      setStartDate(lastCustomRange.start);
      setEndDate(lastCustomRange.end);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
    setDateError('');
  };

  const setCurrentWeek = () => {
    const now = new Date();
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay() + 1);
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
    setDateError('');
  };

  const setLast7Days = () => {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    setStartDate(formatDateForInput(lastWeek));
    setEndDate(formatDateForInput(now));
    setDateError('');
  };

  const setLast30Days = () => {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setDate(now.getDate() - 30);
    setStartDate(formatDateForInput(lastMonth));
    setEndDate(formatDateForInput(now));
    setDateError('');
  };

  const setYear = (year) => {
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
    setSelectedYear(year);
    setShowYearSelector(false);
    setDateError('');
  };

  const setCurrentYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
    setSelectedYear(now.getFullYear());
    setDateError('');
  };

  const setLastYear = () => {
    const lastYear = currentYear - 1;
    const firstDay = new Date(lastYear, 0, 1);
    const lastDay = new Date(lastYear, 11, 31);
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
    setSelectedYear(lastYear);
    setDateError('');
  };

  const getSelectedPeriodDescription = () => {
    const period = periods.find(p => p.id === selectedPeriod);
    return period?.description || '';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Périodes buttons - VERSION PLUS GRANDE ET LISIBLE */}
      <div className="relative">
        <div className="flex gap-1.5 bg-gray-50/80 p-1.5 rounded-xl border border-gray-200 shadow-sm">
          {periods.map(period => (
            <motion.button
              key={period.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onChange(period.id);
                if (period.id === 'custom') {
                  setShowCustomPicker(true);
                } else {
                  setShowCustomPicker(false);
                }
                if (period.id === 'year') {
                  setShowYearSelector(true);
                }
              }}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 
                flex items-center gap-2
                ${selectedPeriod === period.id 
                  ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-200' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/80'
                }
              `}
              title={period.description}
            >
              <span className="text-base">{period.icon}</span>
              <span className="md:inline">{period.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Sélecteur d'année - PLUS GRAND */}
        <AnimatePresence>
          {showYearSelector && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border p-5 z-50 w-80"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-t-xl" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                  Sélectionner une année
                </h3>
                <button onClick={() => setShowYearSelector(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <button onClick={setCurrentYear} className="w-full px-4 py-2.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-between border border-blue-200">
                  <span className="font-medium">Année en cours</span>
                  <span className="text-sm bg-blue-200 px-3 py-1 rounded-full">{currentYear}</span>
                </button>

                <button onClick={setLastYear} className="w-full px-4 py-2.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg flex items-center justify-between border border-gray-200">
                  <span className="font-medium">Année précédente</span>
                  <span className="text-sm bg-gray-200 px-3 py-1 rounded-full">{currentYear - 1}</span>
                </button>

                <div className="border-t border-gray-100 my-3"></div>

                <div className="grid grid-cols-4 gap-2">
                  {years.map(year => (
                    <button 
                      key={year} 
                      onClick={() => setYear(year)} 
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                        year === selectedYear 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setShowYearSelector(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                    Annuler
                  </button>
                  <button 
                    onClick={() => { 
                      const firstDay = new Date(selectedYear, 0, 1); 
                      const lastDay = new Date(selectedYear, 11, 31); 
                      onApplyCustom(formatDateForInput(firstDay), formatDateForInput(lastDay)); 
                      setShowYearSelector(false); 
                    }} 
                    className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium shadow-md"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sélecteur de dates personnalisées - PLUS GRAND */}
        <AnimatePresence>
          {showCustomPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border p-5 z-50 w-[500px]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-t-xl" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  Période personnalisée
                </h3>
                <button onClick={handleClosePicker} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={setCurrentWeek} className="px-3 py-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-center">
                  <span className="block font-medium text-gray-700">Cette semaine</span>
                  <span className="text-xs text-gray-400">Lun - Dim</span>
                </button>
                <button onClick={setCurrentMonth} className="px-3 py-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-center">
                  <span className="block font-medium text-gray-700">Ce mois</span>
                  <span className="text-xs text-gray-400">1er - {new Date().toLocaleDateString('fr-FR', { month: 'long' })}</span>
                </button>
                <button onClick={setLast7Days} className="px-3 py-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-center">
                  <span className="block font-medium text-gray-700">7 derniers jours</span>
                  <span className="text-xs text-gray-400">Analyse rapide</span>
                </button>
                <button onClick={setLast30Days} className="px-3 py-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-center">
                  <span className="block font-medium text-gray-700">30 derniers jours</span>
                  <span className="text-xs text-gray-400">Mois glissant</span>
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Date de début</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => { setStartDate(e.target.value); setDateError(''); }} 
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Date de fin</label>
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
                <button onClick={handleClosePicker} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
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
      
      {/* Bouton rafraîchir - PLUS GRAND */}
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
        title="Rafraîchir"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">Rafraîchir</span>
      </motion.button>
    </div>
  );
};

export default AdvancedPeriodSelector;