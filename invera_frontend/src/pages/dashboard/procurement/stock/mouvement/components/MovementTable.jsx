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

const TYPE_DOCUMENT_LABELS = {
  COMMANDE_FOURNISSEUR: 'Commande fournisseur',
  COMMANDE_CLIENT: 'Commande client',
  INIT_STOCK: 'Stock initial',
  INITIALISATION: 'Stock initial',
};

const MovementTable = ({ movements }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    setCurrentPage(1);
  }, [movements]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const sortedMovements = useMemo(() => {
    if (!movements || movements.length === 0) return movements;
    return [...movements].sort((a, b) => {
      const dateA = new Date(a.dateMouvement);
      const dateB = new Date(b.dateMouvement);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [movements, sortDirection]);

  const totalItems = sortedMovements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  if (safeCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(safeCurrentPage);
  }

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);
  const paginatedMovements = sortedMovements.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(safeCurrentPage - 1);
  const goToNextPage = () => goToPage(safeCurrentPage + 1);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
    if (sortDirection === 'desc') return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
    return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
  };

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

  const getTypeBadge = (typeMouvement) => {
    const badgeConfig = {
      ENTREE: {
        className: 'bg-green-100 text-green-800',
        icon: <ArrowUpIcon className="w-3 h-3" />,
        label: 'Entrée'
      },
      INIT_STOCK: {
        className: 'bg-blue-100 text-blue-800',
        icon: <ArrowPathIcon className="w-3 h-3" />,
        label: 'Stock initial'
      },
      SORTIE: {
        className: 'bg-red-100 text-red-800',
        icon: <ArrowDownIcon className="w-3 h-3" />,
        label: 'Sortie'
      }
    };

    const config = badgeConfig[typeMouvement] || badgeConfig.SORTIE;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (!movements || movements.length === 0) {
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={toggleSortDirection}
              >
                <div className="flex items-center gap-1">
                  Date
                  <span className="ml-1">{getSortIcon()}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantité
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock avant
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock après
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedMovements.map((movement) => (
              <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(movement.dateMouvement)}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{movement.produitLibelle}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {getTypeBadge(movement.typeMouvement)}
                </td>
                <td className="px-6 py-4 text-center font-medium tabular-nums">
                  {movement.quantite}
                </td>
                <td className="px-6 py-4 text-center text-gray-500 tabular-nums">
                  {movement.stockAvant}
                </td>
                <td className="px-6 py-4 text-center font-medium text-blue-600 tabular-nums">
                  {movement.stockApres}
                </td>
               <td className="px-6 py-4 text-sm text-gray-500">
  {movement.typeDocument?.toUpperCase() === 'INIT_STOCK' || 
   movement.typeDocument?.toUpperCase() === 'INITIALISATION'
    ? 'Stock initial'
    : TYPE_DOCUMENT_LABELS[movement.typeDocument] ?? movement.typeDocument ?? '-'}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
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

          <div className="text-sm text-gray-500">
            Affichage de {startIndex + 1} à {endIndex} sur {totalItems} mouvements
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={goToFirstPage}
              disabled={safeCurrentPage === 1}
              className={`p-2 rounded-lg transition-colors ${safeCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Première page"
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={goToPreviousPage}
              disabled={safeCurrentPage === 1}
              className={`p-2 rounded-lg transition-colors ${safeCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Page précédente"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {renderPageNumbers()}
            </div>
            <button
              onClick={goToNextPage}
              disabled={safeCurrentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${safeCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Page suivante"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <button
              onClick={goToLastPage}
              disabled={safeCurrentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${safeCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
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