// pages/dashboard/procurement/stock/StockMovementsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useStockMovements } from '../../../../hooks/useStockMovements';
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

const ITEMS_PER_PAGE = 10;

const StockMovementsPage = () => {
  const { movements, loading, error, fetchAllMovements } = useStockMovements();
  
  // État des filtres
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    type: ''
  });
  
  // État de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mettre à jour le nombre de pages
  useEffect(() => {
    setTotalPages(Math.ceil(movements.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [movements]);

  // Chargement initial
  useEffect(() => {
    fetchAllMovements();
  }, []);

  // ✅ Recherche automatique quand les filtres changent
  const handleFilterChange = useCallback(async (key, value) => {
    console.log(`🔍 Filtre changé: ${key} = ${value}`);
    
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Construire les paramètres pour l'API
    const apiFilters = {};
    
    if (newFilters.dateDebut) {
      apiFilters.debut = formatDateDebutAPI(newFilters.dateDebut);
      console.log(`📅 Date début formatée: ${apiFilters.debut}`);
    }
    if (newFilters.dateFin) {
      apiFilters.fin = formatDateFinAPI(newFilters.dateFin);
      console.log(`📅 Date fin formatée: ${apiFilters.fin}`);
    }
    if (newFilters.type) {
      apiFilters.type = newFilters.type;
      console.log(`📌 Type sélectionné: ${apiFilters.type}`);
    }
    
    console.log('📡 Appel API avec:', apiFilters);
    
    // Recharger avec les filtres
    await fetchAllMovements(apiFilters);
  }, [filters, fetchAllMovements]);

  // ✅ Réinitialiser les filtres
  const resetFilters = useCallback(async () => {
    console.log('🔄 Réinitialisation des filtres');
    setFilters({ dateDebut: '', dateFin: '', type: '' });
    await fetchAllMovements();
  }, [fetchAllMovements]);

  // Statistiques
  const stats = {
    totalEntrees: movements.filter(m => m.typeMouvement === 'ENTREE').reduce((sum, m) => sum + m.quantite, 0),
    totalSorties: movements.filter(m => m.typeMouvement === 'SORTIE').reduce((sum, m) => sum + m.quantite, 0),
    totalMouvements: movements.length
  };

  if (loading && movements.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-500">Chargement des mouvements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-600">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Erreur de chargement</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchAllMovements()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <StatsCards stats={stats} />

      {/* Filtres */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />

      {/* Tableau */}
      <MovementTable
        movements={movements}
        pagination={{
          currentPage,
          totalPages,
          itemsPerPage: ITEMS_PER_PAGE
        }}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StockMovementsPage;