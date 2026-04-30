import React from 'react';

const ClientFilters = ({ filters, setFilters, sortBy, setSortBy, sortOrder, setSortOrder, t }) => {
  const handleSearchChange = (e) => {
    setFilters({ search: e.target.value });
  };

  const handleClearFilters = () => {
    setFilters({ search: '' });
  };

  const handleSortChange = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc'); 
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Barre de recherche */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('salesPages.searchClients')}
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <button
              onClick={handleClearFilters}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filtre de tri par date */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <span className="text-sm text-gray-500 px-2">{t('salesPages.sortBy')}:</span>
          <button
            onClick={() => handleSortChange('date')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'date' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t('salesPages.date')}
            {sortBy === 'date' && (
              <span className="ml-1">
                {sortOrder === 'desc' ? '↓' : '↑'}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientFilters;