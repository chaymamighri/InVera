import React, { useState, useEffect, useRef } from 'react';
import { useFournisseur } from '../../../../../hooks/useFournisseur';

const FournisseurSearch = ({ onViewModeChange, viewMode, onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { searchFournisseurs, loading } = useFournisseur();
  const inputRef = useRef(null);

  // Utiliser useRef pour éviter les recréations de fonction
  const onSearchResultsRef = useRef(onSearchResults);
  
  // Mettre à jour la ref quand la fonction change
  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
  }, [onSearchResults]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        const results = await searchFournisseurs(searchTerm, 0, 100);
        onSearchResultsRef.current(results, searchTerm);
      } else if (searchTerm.trim().length === 0) {
        onSearchResultsRef.current([], '');
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchFournisseurs]);

  // Fonction pour vider le champ de recherche
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearchResultsRef.current([], '');
    // Remettre le focus sur l'input après avoir vidé
    inputRef.current?.focus();
  };

  const handleViewModeClick = (mode) => {
    onViewModeChange(mode);
    setSearchTerm(''); 
  };

  return (
    <div className="rounded-xl shadow-md p-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Bar - MODIFIÉ : gris par défaut, vert au focus */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un fournisseur..."
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
            />
            
            {/* Bouton "x" pour vider */}
            {searchTerm && !loading && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Effacer la recherche"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Indicateur de chargement */}
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                <svg className="animate-spin h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>

          {/* Messages d'information */}
          <div className="flex items-center justify-between mt-1 text-xs">
            {/* Nombre de caractères */}
            {searchTerm && (
              <span className="text-gray-500">
                {searchTerm.length} caractère{searchTerm.length > 1 ? 's' : ''}
              </span>
            )}
            
            {/* Message minimum 2 caractères */}
            {searchTerm && searchTerm.length < 2 && searchTerm.length > 0 && (
              <span className="text-amber-600 font-medium">
                Minimum 2 caractères
              </span>
            )}
          </div>
        </div>

        {/* View Mode Filters - NON MODIFIÉS */}
        <div className="flex gap-1.5 bg-white/50 p-1 rounded-lg">
          <button
            onClick={() => handleViewModeClick('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewMode === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow'
                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-emerald-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Actifs
            </span>
          </button>
          <button
            onClick={() => handleViewModeClick('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewMode === 'inactive'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow'
                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-emerald-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Inactifs
            </span>
          </button>
          <button
            onClick={() => handleViewModeClick('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow'
                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-emerald-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Tous
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FournisseurSearch;