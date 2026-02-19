// src/hooks/useFactures.js
import { useState, useEffect, useCallback } from 'react';
import { commandeService } from '../services/commandeService';

export const useFactures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'tous',
    date: ''
  });
  const [sort, setSort] = useState({
    field: 'dateFacture',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10
  });

  const loadFactures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commandeService.getAllInvoices();
      setFactures(data);
    } catch (err) {
      setError('Impossible de charger les factures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  // Filtrage
  const getFilteredFactures = useCallback(() => {
    let result = [...factures];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(f => 
        f.reference?.toLowerCase().includes(term) ||
        f.client?.nomComplet?.toLowerCase().includes(term)
      );
    }

    if (filters.status !== 'tous') {
      result = result.filter(f => f.statut === filters.status);
    }

    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      result = result.filter(f => 
        new Date(f.dateFacture).toDateString() === filterDate
      );
    }

    // Tri
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch(sort.field) {
        case 'reference':
          aValue = a.reference || '';
          bValue = b.reference || '';
          break;
        case 'client':
          aValue = a.client?.nomComplet || '';
          bValue = b.client?.nomComplet || '';
          break;
        case 'dateFacture':
          aValue = new Date(a.dateFacture).getTime();
          bValue = new Date(b.dateFacture).getTime();
          break;
        case 'montant':
          aValue = a.montantTotal;
          bValue = b.montantTotal;
          break;
        default:
          aValue = a[sort.field] || '';
          bValue = b[sort.field] || '';
      }

      return sort.order === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return result;
  }, [factures, filters, sort]);

  // Pagination
  const filteredFactures = getFilteredFactures();
  const totalPages = Math.ceil(filteredFactures.length / pagination.itemsPerPage);
  const startIndex = (pagination.page - 1) * pagination.itemsPerPage;
  const paginatedFactures = filteredFactures.slice(startIndex, startIndex + pagination.itemsPerPage);

  return {
    factures: paginatedFactures,
    allFactures: filteredFactures,
    loading,
    error,
    totalFactures: filteredFactures.length,
    totalPages,
    currentPage: pagination.page,
    itemsPerPage: pagination.itemsPerPage,
    filters,
    sort,
    setFilters,
    setSort,
    setPagination,
    refresh: loadFactures
  };
};