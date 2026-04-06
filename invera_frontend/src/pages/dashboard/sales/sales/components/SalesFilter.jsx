/**
 * SalesFilters - Barre de filtres pour les commandes validées
 * 
 * Permet de filtrer et trier la liste des commandes.
 * 
 * FONCTIONNALITÉS :
 * - Recherche par texte (n° commande, client, produit)
 * - Filtre par date de création
 * - Tri par (date, numéro, client, montant)
 * - Ordre croissant/décroissant
 * - Réinitialisation des filtres
 * - Affichage des filtres actifs
 * 
 * @param {Object} filters - État des filtres
 * @param {string} filters.searchTerm - Terme de recherche
 * @param {Object} filters.dateRange - Plage de dates { from, to }
 * @param {string} filters.sortBy - Champ de tri (date_creation, numero_commande, client, montant)
 * @param {string} filters.sortOrder - Ordre de tri (asc/desc)
 * @param {Function} onFilterChange - (key, value) => void
 * @param {number} totalFiltered - Nombre de résultats après filtrage
 */

import React from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SalesFilters = ({ filters, onFilterChange, totalFiltered = 0 }) => {
  // Options de tri disponibles
  const sortOptions = [
    { value: 'date_creation', label: 'Date création' },
    { value: 'numero_commande', label: 'N° Commande' },
    { value: 'client', label: 'Client' },
    { value: 'montant', label: 'Montant' }
  ];

  // Valeurs par défaut des filtres
  const defaultFilters = {
    searchTerm: '',
    dateRange: { from: '', to: '' },
    sortBy: 'date_creation',
    sortOrder: 'desc'
  };

  // Vérifie si des filtres sont actifs (recherche ou date)
  const hasActiveFilters = () => {
    return filters.searchTerm?.trim() !== '' || 
           filters.dateRange?.from?.trim() !== '';
  };

  // Vérifie si le tri est différent des valeurs par défaut
  const isSortModified = () => {
    return filters.sortBy !== defaultFilters.sortBy || 
           filters.sortOrder !== defaultFilters.sortOrder;
  };

  // Réinitialise tous les filtres
  const handleReset = () => {
    onFilterChange('searchTerm', defaultFilters.searchTerm);
    onFilterChange('dateRange', defaultFilters.dateRange);
    onFilterChange('sortBy', defaultFilters.sortBy);
    onFilterChange('sortOrder', defaultFilters.sortOrder);
  };

  // Inverse l'ordre de tri (asc ↔ desc)
  const handleSortToggle = () => {
    onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Gère le changement de date
  const handleDateChange = (e) => {
    const value = e.target.value;
    onFilterChange('dateRange', { from: value, to: '' });
  };

  // Supprime le filtre date
  const handleClearDate = () => {
    onFilterChange('dateRange', { from: '', to: '' });
  };

  // Formate une date pour l'affichage (ex: "15 janvier 2024")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Génère le libellé des filtres actifs (ex: "recherche & date")
  const getActiveFilterLabel = () => {
    const activeFilters = [];
    if (filters.searchTerm) activeFilters.push('recherche');
    if (filters.dateRange?.from) activeFilters.push('date');
    return activeFilters.join(' & ');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      
      {/* ===== EN-TÊTE ===== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Icône Filtre avec style conditionnel */}
          <div className={`
            p-2 rounded-lg transition-all duration-200
            ${hasActiveFilters() 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm shadow-blue-200' 
              : 'bg-gradient-to-br from-blue-50 to-indigo-100'
            }
          `}>
            <FunnelIcon className={`h-5 w-5 transition-colors ${
              hasActiveFilters() ? 'text-white' : 'text-blue-600'
            }`} />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">
              Filtres de commandes
              {hasActiveFilters() && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {getActiveFilterLabel()}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {hasActiveFilters() 
                ? `${totalFiltered} commande${totalFiltered > 1 ? 's' : ''} trouvée${totalFiltered > 1 ? 's' : ''}`
                : 'Filtrer les commandes validées'
              }
            </p>
          </div>
        </div>
        
        {/* Bouton Réinitialiser (visible si filtre actif OU tri modifié) */}
        {(hasActiveFilters() || isSortModified()) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm 
                      bg-gradient-to-r from-emerald-50 to-teal-50 
                      text-emerald-700 border border-emerald-200
                      hover:from-emerald-100 hover:to-teal-100 
                      hover:text-emerald-800 hover:border-emerald-300
                      rounded-lg transition-all duration-200 shadow-sm
                      hover:shadow-md active:scale-95"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* ===== CHAMPS DE FILTRAGE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* 1. Recherche textuelle */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rechercher
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 transition-colors duration-200 ${
                filters.searchTerm ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
            </div>
            <input
              type="text"
              placeholder="N° commande, client..."
              className={`w-full pl-10 pr-10 py-2.5 border rounded-lg transition-all duration-200
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400
                        ${filters.searchTerm 
                          ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-200' 
                          : 'border-gray-300'
                        }`}
              value={filters.searchTerm || ''}
              onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            />
            {filters.searchTerm && (
              <button
                onClick={() => onFilterChange('searchTerm', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center
                         text-gray-400 hover:text-gray-600 transition-colors"
                title="Effacer la recherche"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {filters.searchTerm && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-blue-600 rounded-full"></span>
              Recherche : "{filters.searchTerm}"
            </p>
          )}
        </div>

        {/* 2. Filtre par date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date de création
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className={`h-5 w-5 transition-colors duration-200 ${
                filters.dateRange?.from ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
            </div>
            <input
              type="date"
              className={`w-full pl-10 pr-10 py-2.5 border rounded-lg transition-all duration-200
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400
                        ${filters.dateRange?.from 
                          ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-200' 
                          : 'border-gray-300'
                        }`}
              value={filters.dateRange?.from || ''}
              onChange={handleDateChange}
            />
            {filters.dateRange?.from && (
              <button
                onClick={handleClearDate}
                className="absolute inset-y-0 right-0 pr-3 flex items-center
                         text-gray-400 hover:text-gray-600 transition-colors"
                title="Effacer la date"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {filters.dateRange?.from && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-emerald-600 rounded-full"></span>
              {formatDate(filters.dateRange.from)}
            </p>
          )}
        </div>

        {/* 3. Tri */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Trier par
          </label>
          <div className="flex gap-2">
            {/* Sélecteur du champ de tri */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowsUpDownIcon className={`h-5 w-5 transition-colors duration-200 ${
                  isSortModified() ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
              </div>
              <select
                className={`w-full pl-10 pr-8 py-2.5 border rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         transition-all duration-200 hover:border-gray-400 
                         appearance-none bg-white cursor-pointer
                         ${isSortModified() 
                           ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200' 
                           : 'border-gray-300'
                         }`}
                value={filters.sortBy || 'date_creation'}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Bouton d'inversion de l'ordre (asc/desc) */}
            <button
              onClick={handleSortToggle}
              className={`
                flex items-center justify-center w-12 px-3 py-2.5 border rounded-lg 
                transition-all duration-200 hover:shadow-md active:scale-95
                ${filters.sortOrder === 'desc' 
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-gray-700 hover:from-gray-100 hover:to-gray-200' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100'
                }
                ${isSortModified() ? 'ring-1 ring-offset-1 ring-blue-200' : ''}
              `}
              title={filters.sortOrder === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'}
            >
              {filters.sortOrder === 'desc' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== FILTRES ACTIFS (badges) ===== */}
      {hasActiveFilters() && (
        <div className="mt-6 pt-5 border-t border-gray-200 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-semibold text-gray-700">
                Filtres appliqués
              </span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                {[
                  filters.searchTerm && 'R',
                  filters.dateRange?.from && 'D'
                ].filter(Boolean).join('')}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Badge Recherche */}
            {filters.searchTerm && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 
                            bg-gradient-to-r from-blue-50 to-indigo-50 
                            border border-blue-200 text-blue-700 
                            rounded-lg text-sm shadow-sm
                            hover:shadow-md transition-shadow duration-200
                            animate-slideIn">
                <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                <span className="font-medium">Recherche:</span>
                <span className="truncate max-w-[150px] font-mono text-xs bg-white/70 px-1.5 py-0.5 rounded">
                  "{filters.searchTerm}"
                </span>
                <button
                  onClick={() => onFilterChange('searchTerm', '')}
                  className="ml-1 p-0.5 hover:bg-blue-200/50 rounded transition-colors"
                  title="Supprimer ce filtre"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {/* Badge Date */}
            {filters.dateRange?.from && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 
                            bg-gradient-to-r from-emerald-50 to-teal-50 
                            border border-emerald-200 text-emerald-700 
                            rounded-lg text-sm shadow-sm
                            hover:shadow-md transition-shadow duration-200
                            animate-slideIn">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="font-medium">Date:</span>
                <span className="bg-white/70 px-1.5 py-0.5 rounded text-xs font-mono">
                  {formatDate(filters.dateRange.from)}
                </span>
                <button
                  onClick={handleClearDate}
                  className="ml-1 p-0.5 hover:bg-emerald-200/50 rounded transition-colors"
                  title="Supprimer ce filtre"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Indicateur de nombre de résultats */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <span className="font-medium text-gray-700">{totalFiltered}</span>
            <span>commande{totalFiltered > 1 ? 's' : ''} trouvée{totalFiltered > 1 ? 's' : ''}</span>
            {totalFiltered === 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                Aucun résultat
              </span>
            )}
          </div>
        </div>
      )}

      {/* ===== STATUT (indicateur visuel) ===== */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          {/* État des commandes */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <span className="text-sm text-gray-600">
              État des commandes :
              <span className="ml-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 
                             text-white text-xs font-medium rounded-full 
                             shadow-sm shadow-emerald-200">
                Validée ✓
              </span>
            </span>
          </div>
          
          {/* Indicateur de statut des filtres */}
          {!hasActiveFilters() && !isSortModified() && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
              Toutes les commandes
            </span>
          )}
          
          {hasActiveFilters() && totalFiltered > 0 && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-blue-600 rounded-full"></span>
              {totalFiltered} résultat{totalFiltered > 1 ? 's' : ''}
            </span>
          )}
          
          {hasActiveFilters() && totalFiltered === 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-amber-600 rounded-full"></span>
              Aucun résultat
            </span>
          )}
        </div>
      </div>

      {/* Animations CSS */}
      <style >{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SalesFilters;