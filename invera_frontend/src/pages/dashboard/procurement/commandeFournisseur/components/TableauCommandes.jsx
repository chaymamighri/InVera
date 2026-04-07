import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArchiveBoxIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentCheckIcon,
  EyeIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  ANNULEE: 'ANNULEE',
  REJETEE: 'REJETEE',
};

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

const getStatusBadge = (statut) => {
  const colors = {
    [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800',
    [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800',
    [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800',
    [StatutCommande.RECUE]: 'bg-green-100 text-green-800',
    [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800',
    [StatutCommande.REJETEE]: 'bg-orange-100 text-orange-800',
  };

  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut]}`}>{statut}</span>;
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
  highlightedCommandeId = '',
  highlightedReminderStage = '',
  isAdmin = false,
}) => {
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const rowRefs = useRef({});

  const normalizedHighlightedId = highlightedCommandeId ? String(highlightedCommandeId) : '';

  const highlightedBadgeText =
    highlightedReminderStage === statuts.VALIDEE ? 'Rappel envoi 24h' : 'Rappel confirmation 24h';

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };

  const sortedCommandes = useMemo(() => {
    if (!Array.isArray(commandes) || commandes.length === 0) return [];

    return [...commandes].sort((a, b) => {
      const dateA = new Date(a.dateCommande).getTime();
      const dateB = new Date(b.dateCommande).getTime();

      if (sortDirection === 'asc') {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [commandes, sortDirection]);

  const totalItems = sortedCommandes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommandes = sortedCommandes.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!normalizedHighlightedId) return;

    const highlightedIndex = sortedCommandes.findIndex(
      (commande) => String(commande.idCommandeFournisseur) === normalizedHighlightedId
    );

    if (highlightedIndex === -1) return;

    const highlightedPage = Math.floor(highlightedIndex / itemsPerPage) + 1;
    if (highlightedPage !== currentPage) {
      setCurrentPage(highlightedPage);
    }
  }, [currentPage, itemsPerPage, normalizedHighlightedId, sortedCommandes]);

  useEffect(() => {
    if (!normalizedHighlightedId) return;

    const isVisible = paginatedCommandes.some(
      (commande) => String(commande.idCommandeFournisseur) === normalizedHighlightedId
    );

    if (!isVisible) return;

    const rafId = window.requestAnimationFrame(() => {
      rowRefs.current[normalizedHighlightedId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [normalizedHighlightedId, paginatedCommandes]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') {
      return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
    }
    return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      );
    }
    return pages;
  };

  const statutsArchives = [statuts.ANNULEE, statuts.REJETEE, statuts.FACTUREE];

  if (commandes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        {showArchives ? (
          <ArchiveBoxIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        ) : (
          <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        )}

        <p className="text-gray-500 text-lg">{showArchives ? 'Aucune commande archivee' : 'Aucune commande trouvee'}</p>

        {!showArchives && (
          <button
            onClick={onNouvelleCommande}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Creer votre premiere commande
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                N° Commande
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fournisseur
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={toggleSortDirection}
              >
                <div className="flex items-center gap-1">
                  Date commande
                  <span className="ml-1">{getSortIcon()}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total TTC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCommandes.map((commande) => {
              const isArchived = showArchives || statutsArchives.includes(commande.statut);
              const isHighlighted = String(commande.idCommandeFournisseur) === normalizedHighlightedId;
              const rowClassName = `${isArchived ? 'opacity-75 bg-gray-50' : 'hover:bg-gray-50'} ${
                isHighlighted ? 'bg-amber-50/80' : ''
              } transition-colors`;

              return (
                <tr
                  key={commande.idCommandeFournisseur}
                  ref={(node) => {
                    if (node) {
                      rowRefs.current[String(commande.idCommandeFournisseur)] = node;
                    } else {
                      delete rowRefs.current[String(commande.idCommandeFournisseur)];
                    }
                  }}
                  data-commande-id={commande.idCommandeFournisseur}
                  className={rowClassName}
                >
                  <td
                    className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                      isHighlighted ? 'border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div>{commande.numeroCommande || 'N/A'}</div>
                    {isHighlighted && (
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        {highlightedBadgeText}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{commande.fournisseur?.nomFournisseur || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{commande.fournisseur?.email || ''}</div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(commande.dateCommande)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {formatPrice(commande.totalTTC)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(commande.statut)}</td>

                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      
                      {/* STATUT BROUILLON - Création/Modification/Suppression */}
                      {commande.statut === statuts.BROUILLON && !isArchived && (
                        <>
                          {/* Valider - Seulement pour l'ADMIN */}
                          {isAdmin && onStatusChange && (
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'valider')}
                              disabled={actionInProgress === `valider-${commande.idCommandeFournisseur}`}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                              title="Valider la commande"
                            >
                              <DocumentCheckIcon className="w-5 h-5" />
                            </button>
                          )}

                          {/* Modifier - Responsable et Admin */}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(commande)}
                              className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Modifier la commande"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                          )}

                          {/* Supprimer - Responsable et Admin */}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(commande)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer la commande"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}

                      {/* STATUT VALIDEE - Envoi au fournisseur */}
                      {commande.statut === statuts.VALIDEE && !isArchived && (
                        <>
                          {/* Envoyer - Responsable et Admin */}
                          {onStatusChange && (
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'envoyer')}
                              disabled={actionInProgress === `envoyer-${commande.idCommandeFournisseur}`}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                              title="Envoyer au fournisseur"
                            >
                              <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                          )}

                          {/* Annuler - Seulement pour l'ADMIN */}
                          {isAdmin && onStatusChange && (
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                              disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                              className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg disabled:opacity-50 transition-colors"
                              title="Annuler la commande"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}

                      {/* STATUT ENVOYEE - Réception */}
                      {commande.statut === statuts.ENVOYEE && !isArchived && (
                        <>
                          {/* Réceptionner - Responsable et Admin */}
                          {onRecevoir && (
                            <button
                              onClick={() => onRecevoir(commande)}
                              disabled={actionInProgress === `recevoir-${commande.idCommandeFournisseur}`}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg disabled:opacity-50 transition-colors"
                              title="Réceptionner la commande"
                            >
                              <TruckIcon className="w-5 h-5" />
                            </button>
                          )}

                          {/* Annuler - Seulement pour l'ADMIN */}
                          {isAdmin && onStatusChange && (
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                              disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                              className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg disabled:opacity-50 transition-colors"
                              title="Annuler la commande"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}

                    
                      {/* Voir détails - Tout le monde */}
                      <button
                        onClick={() => onView(commande)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher :</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} commandes
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Première page"
              >
                <ChevronDoubleLeftIcon className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Page précédente"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
              </button>

              {renderPageNumbers()}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                title="Page suivante"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => goToPage(totalPages)}
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