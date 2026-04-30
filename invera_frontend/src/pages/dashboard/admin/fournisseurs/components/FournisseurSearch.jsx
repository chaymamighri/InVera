import React, { useState, useEffect, useRef } from 'react';
import { useFournisseur } from '../../../../../hooks/useFournisseur';

const FournisseurSearch = ({ onViewModeChange, viewMode, onSearchResults, onAddNew, text }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { searchFournisseurs, loading } = useFournisseur();
  const inputRef = useRef(null);
  const onSearchResultsRef = useRef(onSearchResults);

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

  const handleClearSearch = () => {
    setSearchTerm('');
    onSearchResultsRef.current([], '');
    inputRef.current?.focus();
  };

  const handleViewModeClick = (mode) => {
    onViewModeChange(mode);
    setSearchTerm('');
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center gap-4 lg:flex-row">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={text.searchPlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm transition-all focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400/20"
            />

            {searchTerm && !loading && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {loading && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            ['active', text.active],
            ['inactive', text.inactive],
            ['all', text.all],
          ].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => handleViewModeClick(mode)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={onAddNew}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {text.newSupplier}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FournisseurSearch;
