// components/stock/MovementTable.jsx
import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  
  // Réinitialiser à la première page quand les mouvements changent
  useEffect(() => {
    setCurrentPage(1);
  }, [movements]);
  
  const totalItems = movements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // S'assurer que currentPage est valide
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  if (safeCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(safeCurrentPage);
  }
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);
  const paginatedMovements = movements.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newValue = parseInt(e.target.value);
    setItemsPerPage(newValue);
    setCurrentPage(1);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Affichage de {startIndex + 1} à {endIndex} sur {totalItems} mouvements
        </div>
        
        <div className="flex items-center gap-4">
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
          
          {/* Boutons de navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                safeCurrentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Afficher la première page, la dernière page, et les pages autour de la page actuelle
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        safeCurrentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === safeCurrentPage - 2 && safeCurrentPage > 3) ||
                  (pageNum === safeCurrentPage + 2 && safeCurrentPage < totalPages - 2)
                ) {
                  return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages || totalPages === 0}
              className={`p-2 rounded-lg transition-colors ${
                safeCurrentPage === totalPages || totalPages === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementTable;