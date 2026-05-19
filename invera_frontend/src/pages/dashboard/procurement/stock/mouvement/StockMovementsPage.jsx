import React, { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useStockMovements } from '../../../../../hooks/useStockMovements';
import { useLanguage } from '../../../../../context/LanguageContext';
import StatsCards from './components/StatsCards';
import FilterBar from './components/FilterBar';
import MovementTable from './components/MovementTable';

const formatDateDebutAPI = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const formatDateFinAPI = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const StockMovementsPage = () => {
  const { movements, loading, error, fetchAllMovements } = useStockMovements();
  const { t, isArabic } = useLanguage();
  const tr = (key, params) => t(`dashboard.procurementMovementsPage.${key}`, params);
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    type: '',
  });

  useEffect(() => {
    fetchAllMovements();
  }, [fetchAllMovements]);

  const handleFilterChange = useCallback(
    async (key, value) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);

      const apiFilters = {};
      if (newFilters.dateDebut) apiFilters.debut = formatDateDebutAPI(newFilters.dateDebut);
      if (newFilters.dateFin) apiFilters.fin = formatDateFinAPI(newFilters.dateFin);
      if (newFilters.type) apiFilters.type = newFilters.type;

      await fetchAllMovements(apiFilters);
    },
    [filters, fetchAllMovements]
  );

  const resetFilters = useCallback(async () => {
    setFilters({ dateDebut: '', dateFin: '', type: '' });
    await fetchAllMovements();
  }, [fetchAllMovements]);

  const stats = {
    totalEntrees: movements
      .filter((movement) => movement.typeMouvement === 'ENTREE')
      .reduce((sum, movement) => sum + movement.quantite, 0),
    totalSorties: movements
      .filter((movement) => movement.typeMouvement === 'SORTIE')
      .reduce((sum, movement) => sum + movement.quantite, 0),
    totalMouvements: movements.length,
  };

  if (loading && movements.length === 0) {
    return (
      <div className="flex justify-center py-12" dir={isArabic ? 'rtl' : 'ltr'}>
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
        <p className={`${isArabic ? 'mr-2' : 'ml-2'} text-gray-500`}>{tr('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-600" dir={isArabic ? 'rtl' : 'ltr'}>
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">{tr('loadingError')}</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchAllMovements()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {tr('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <StatsCards stats={stats} />
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />
      <MovementTable movements={movements} />
    </div>
  );
};

export default StockMovementsPage;
