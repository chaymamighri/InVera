// components/TableauCommandes.jsx - Version avec tri ET pagination
import React, { useState, useMemo } from 'react';
import {
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  DocumentCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

// ✅ Constantes locales
const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  FACTUREE: 'FACTUREE',
  ANNULEE: 'ANNULEE',
  REJETEE: 'REJETEE',
};

// ✅ Formatage
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

const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(price);
};

// ✅ Badge de statut
const getStatusBadge = (statut) => {
  const colors = {
    [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800',
    [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800',
    [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800',
    [StatutCommande.RECUE]: 'bg-green-100 text-green-800',
    [StatutCommande.FACTUREE]: 'bg-purple-100 text-purple-800',
    [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800',
    [StatutCommande.REJETEE]: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut]}`}>
      {statut}
    </span>
  );
};

const TableauCommandes = ({
  commandes,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onRecevoir,
  actionInProgress,
  statuts = StatutCommande,
  onNouvelleCommande,
  showArchives = false,
}) => {

  // ✅ État pour le tri par date de commande
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' ou 'desc'
  
  // ✅ État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 5, 10, 20, 50

  // ✅ Fonction pour changer le tri
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1); // Reset à la première page quand on change le tri
  };

  // ✅ Fonction de tri par date de commande
  const sortCommandes = (commandesList) => {
    if (!commandesList || commandesList.length === 0) return commandesList;
    
    const sorted = [...commandesList];
    
    sorted.sort((a, b) => {
      const dateA = new Date(a.dateCommande);
      const dateB = new Date(b.dateCommande);
      
      if (sortDirection === 'asc') {
        return dateA - dateB; // Plus ancien d'abord
      } else {
        return dateB - dateA; // Plus récent d'abord
      }
    });
    
    return sorted;
  };

  // ✅ Appliquer le tri aux commandes
  const sortedCommandes = useMemo(() => sortCommandes(commandes), [commandes, sortDirection]);

  // ✅ Calcul de la pagination
  const totalItems = sortedCommandes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommandes = sortedCommandes.slice(startIndex, endIndex);

  // ✅ Fonctions de pagination
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // ✅ Changer le nombre d'éléments par page
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset à la première page
  };

  // ✅ Rendu de l'icône de tri
  const getSortIcon = () => {
    if (sortDirection === 'asc') {
      return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
    } else {
      return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  // ✅ Rendu des numéros de pages
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
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
            currentPage === i
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

  // Statuts "archivés" (lecture seule)
  const statutsArchives = [
    statuts.ANNULEE,
    statuts.REJETEE,
    statuts.FACTUREE,
  ];

  if (commandes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        {showArchives ? (
          <ArchiveBoxIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        ) : (
          <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        )}
        <p className="text-gray-500 text-lg">
          {showArchives ? 'Aucune commande archivée' : 'Aucune commande trouvée'}
        </p>
        {!showArchives && (
          <button
            onClick={onNouvelleCommande}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer votre première commande
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                N° Commande
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fournisseur
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={toggleSortDirection}
              >
                <div className="flex items-center gap-1">
                  Date commande
                  <span className="ml-1">
                    {getSortIcon()}
                  </span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Livraison prévue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total TTC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCommandes.map((commande) => {
              const isArchived = showArchives || statutsArchives.includes(commande.statut);

              return (
                <tr
                  key={commande.idCommandeFournisseur}
                  className={`hover:bg-gray-50 ${isArchived ? 'opacity-75 bg-gray-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {commande.numeroCommande || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {commande.fournisseur?.nomFournisseur || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {commande.fournisseur?.email || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(commande.dateCommande)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(commande.dateLivraisonPrevue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {formatPrice(commande.totalTTC)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(commande.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* BROUILLON */}
                      {commande.statut === statuts.BROUILLON && !isArchived && onStatusChange && (
                        <>
                          <button
                            onClick={() => onStatusChange(commande.idCommandeFournisseur, 'valider')}
                            disabled={actionInProgress === `valider-${commande.idCommandeFournisseur}`}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50"
                            title="Valider"
                          >
                            <DocumentCheckIcon className="w-4 h-4" />
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(commande)}
                              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                              title="Modifier"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(commande)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* VALIDEE */}
                      {commande.statut === statuts.VALIDEE && !isArchived && onStatusChange && (
                        <>
                          <button
                            onClick={() => onStatusChange(commande.idCommandeFournisseur, 'envoyer')}
                            disabled={actionInProgress === `envoyer-${commande.idCommandeFournisseur}`}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50"
                            title="Envoyer"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                            disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                            className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded disabled:opacity-50"
                            title="Annuler"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* ENVOYEE */}
                      {commande.statut === statuts.ENVOYEE && !isArchived && (
                        <>
                          {onRecevoir && (
                            <button
                              onClick={() => onRecevoir(commande)}
                              disabled={actionInProgress === `recevoir-${commande.idCommandeFournisseur}`}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Réceptionner"
                            >
                              <TruckIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onStatusChange && (
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                              disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                              className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded disabled:opacity-50"
                              title="Annuler"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* RECUE */}
                      {commande.statut === statuts.RECUE && !isArchived && onStatusChange && (
                        <button
                          onClick={() => onStatusChange(commande.idCommandeFournisseur, 'facturer')}
                          disabled={actionInProgress === `facturer-${commande.idCommandeFournisseur}`}
                          className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded disabled:opacity-50"
                          title="Facturer"
                        >
                          <DocumentCheckIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Bouton Voir */}
                      <button
                        onClick={() => onView(commande)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Voir détails"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ PAGINATION */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Sélecteur de nombre d'éléments */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher :</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 </option>
                <option value={10}>10 </option>
                <option value={20}>20 </option>
                <option value={50}>50 </option>
              </select>
            </div>

            {/* Informations */}
            <div className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} commandes
            </div>

            {/* Contrôles de pagination */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Première page"
              >
                <ChevronDoubleLeftIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Page précédente"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
              </button>

              {renderPageNumbers()}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Page suivante"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Dernière page"
              >
                <ChevronDoubleRightIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableauCommandes;