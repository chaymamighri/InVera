// components/stock/MovementTable.jsx - Version avec icône neutre
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowPathIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const MovementTable = ({ movements }) => {
  // État interne pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // ✅ État pour le tri par date
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' ou 'desc'
  
  // Réinitialiser à la première page quand les mouvements changent
  useEffect(() => {
    setCurrentPage(1);
  }, [movements]);
  
  // ✅ Fonction de tri par date
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };
  
  // ✅ Appliquer le tri aux mouvements
  const sortedMovements = useMemo(() => {
    if (!movements || movements.length === 0) return movements;
    
    const sorted = [...movements];
    
    sorted.sort((a, b) => {
      const dateA = new Date(a.dateMouvement);
      const dateB = new Date(b.dateMouvement);
      
      if (sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    return sorted;
  }, [movements, sortDirection]);
  
  // ✅ Calcul de la pagination
  const totalItems = sortedMovements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  if (safeCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(safeCurrentPage);
  }
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);
  const paginatedMovements = sortedMovements.slice(startIndex, endIndex);

  // ✅ Fonctions de pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(safeCurrentPage - 1);
  const goToNextPage = () => goToPage(safeCurrentPage + 1);

  const handleItemsPerPageChange = (e) => {
    const newValue = parseInt(e.target.value);
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  // ✅ Rendu de l'icône de tri
  const getSortIcon = () => {
    if (sortDirection === 'asc') {
      return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
    } else if (sortDirection === 'desc') {
      return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
    }
    return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
  };

  // ✅ Rendu des numéros de pages
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            safeCurrentPage === i
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return pages;
  };

  if (movements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="text-center py-12 text-gray-500">
          <ArrowPathIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Aucun mouvement de stock enregistré</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* ✅ Colonne Date avec tri */}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={toggleSortDirection}
              >
                <div className="flex items-center gap-1">
                  Date
                  <span className="ml-1">
                    {getSortIcon()}
                  </span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock avant</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock après</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedMovements.map((movement) => (
              <tr key={movement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(movement.dateMouvement)}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{movement.produitLibelle}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    movement.typeMouvement === 'ENTREE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {movement.typeMouvement === 'ENTREE' ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    {movement.typeMouvement === 'ENTREE' ? 'Entrée' : 'Sortie'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">{movement.quantite}</td>
                <td className="px-6 py-4 text-right text-gray-500">{movement.stockAvant}</td>
                <td className="px-6 py-4 text-right font-medium text-blue-600">{movement.stockApres}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{movement.reference || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {movement.typeDocument === 'COMMANDE_FOURNISSEUR' ? 'Commande fournisseur' : 
                   movement.typeDocument === 'COMMANDE_CLIENT' ? 'Commande client' :
                   movement.typeDocument || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination complète */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
          {/* Sélecteur du nombre d'éléments par page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Afficher :</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-500">par page</span>
          </div>
          
          {/* Informations d'affichage */}
          <div className="text-sm text-gray-500">
            Affichage de {startIndex + 1} à {endIndex} sur {totalItems} mouvements
          </div>
          
          {/* Contrôles de pagination */}
          <div className="flex items-center gap-1">
            {/* Première page */}
            <button
              onClick={goToFirstPage}
              disabled={safeCurrentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                safeCurrentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Première page"
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </button>
            
            {/* Page précédente */}
            <button
              onClick={goToPreviousPage}
              disabled={safeCurrentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                safeCurrentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Page précédente"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            {/* Numéros de pages */}
            <div className="flex items-center gap-1 mx-1">
              {renderPageNumbers()}
            </div>
            
            {/* Page suivante */}
            <button
              onClick={goToNextPage}
              disabled={safeCurrentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                safeCurrentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Page suivante"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            
            {/* Dernière page */}
            <button
              onClick={goToLastPage}
              disabled={safeCurrentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                safeCurrentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Dernière page"
            >
              <ChevronDoubleRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementTable;