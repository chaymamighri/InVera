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
  EyeIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ShoppingCartIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  ANNULEE: 'ANNULEE',
  REJETEE: 'REJETEE',
};

const getLocale = (language) => (language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR');

const getTimestamp = (dateString) => {
  const timestamp = new Date(dateString).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatDate = (dateString, language) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatPrice = (price, language) => {
  if (price === null || price === undefined) return 'N/A';

  const amount = Number(price);
  if (!Number.isFinite(amount)) return 'N/A';

  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'TND',
  }).format(amount);
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

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[statut]}`}>{statut}</span>;
};

const TableauCommandes = ({
  commandes,
  onView,
  onEdit,
  onStatusChange,
  onRecevoir,
  actionInProgress,
  statuts = StatutCommande,
  onNouvelleCommande,
  showArchives = false,
  highlightedCommandeId = '',
  highlightedReminderStage = '',
  highlightedNotificationType = '',
}) => {
  const { t, language, isArabic } = useLanguage();
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const rowRefs = useRef({});
  const commandesList = Array.isArray(commandes) ? commandes : [];

  const normalizedHighlightedId = highlightedCommandeId ? String(highlightedCommandeId) : '';
  const normalizedHighlightedNotificationType = String(highlightedNotificationType || '').toUpperCase();
  const highlightedBadgeText =
    normalizedHighlightedNotificationType === 'REJECTED'
      ? 'REJETEE'
      : highlightedReminderStage === statuts.VALIDEE
        ? t('dashboard.procurementOrdersComponents.reminderSend24h')
        : t('dashboard.procurementOrdersComponents.reminderConfirm24h');

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };

  const sortedCommandes = useMemo(() => {
    if (!commandesList.length) return [];

    return [...commandesList].sort((a, b) => {
      const dateA = getTimestamp(a?.dateCommande);
      const dateB = getTimestamp(b?.dateCommande);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [commandesList, sortDirection]);

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
      return <ArrowUpIcon className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowDownIcon className="h-4 w-4 text-blue-600" />;
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
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      );
    }
    return pages;
  };

  if (!commandesList.length) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow" dir={isArabic ? 'rtl' : 'ltr'}>
        {showArchives ? (
          <ArchiveBoxIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        ) : (
          <ShoppingCartIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        )}

        <p className="text-lg text-gray-500">
          {showArchives
            ? t('dashboard.procurementOrdersComponents.noArchivedOrders')
            : t('dashboard.procurementOrdersComponents.noOrdersFound')}
        </p>

        {!showArchives && (
          <button onClick={onNouvelleCommande} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            {t('dashboard.procurementOrdersComponents.createFirstOrder')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('dashboard.procurementOrdersComponents.orderNumber')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('dashboard.procurementOrdersComponents.supplier')}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 transition-colors hover:bg-gray-100"
                onClick={toggleSortDirection}
              >
                <div className="flex items-center gap-1">
                  {t('dashboard.procurementOrdersComponents.orderDate')}
                  <span className="mx-1">{getSortIcon()}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('dashboard.procurementOrdersComponents.totalTTC')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('dashboard.procurementOrdersComponents.status')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                {t('dashboard.procurementOrdersComponents.actions')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedCommandes.map((commande) => {
              const isArchived = showArchives;
              const isHighlighted = String(commande.idCommandeFournisseur) === normalizedHighlightedId;
              const isRejectedFromNotification = isHighlighted && normalizedHighlightedNotificationType === 'REJECTED';
              const isApprovedFromNotification = isHighlighted && normalizedHighlightedNotificationType === 'APPROVED';
              const canEditCommande =
                !isArchived &&
                onEdit &&
                !isApprovedFromNotification &&
                ( commande.statut === statuts.REJETEE || isRejectedFromNotification);
              const canResendCommande =
                !isArchived &&
                onStatusChange &&
                (commande.statut === statuts.REJETEE || isRejectedFromNotification);
              const canSendCommande =
                !isArchived &&
                onStatusChange &&
                (commande.statut === statuts.VALIDEE || isApprovedFromNotification);
              const rowClassName = `${isArchived ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'} ${
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
                    className={`whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 ${
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

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                    {formatDate(commande.dateCommande, language)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-blue-600">
                    {formatPrice(commande.totalTTC, language)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      {getStatusBadge(commande.statut)}

                      {commande.statut === statuts.REJETEE && commande.motifRejet && (
                        <div className="max-w-xs rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
                          <span className="font-semibold">{t('dashboard.procurementOrdersComponents.rejectionReason')} </span>
                          {commande.motifRejet}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {canEditCommande && (
                        <button
                          onClick={() => onEdit(commande)}
                          className="rounded-lg p-1.5 text-yellow-600 transition-colors hover:bg-yellow-50 hover:text-yellow-800"
                          title={t('dashboard.procurementOrdersComponents.editRejectedTitle')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canResendCommande && (
                        <button
                          onClick={() => onStatusChange(commande.idCommandeFournisseur, 'renvoyer_attente')}
                          disabled={actionInProgress === `renvoyer_attente-${commande.idCommandeFournisseur}`}
                          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
                          title={t('dashboard.procurementOrdersComponents.resendPendingTitle')}
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canSendCommande && (
                        <button
                          onClick={() => onStatusChange(commande.idCommandeFournisseur, 'envoyer')}
                          disabled={actionInProgress === `envoyer-${commande.idCommandeFournisseur}`}
                          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
                          title={t('dashboard.procurementOrdersComponents.sendSupplierTitle')}
                        >
                          <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                      )}

                      {commande.statut === statuts.ENVOYEE && !isArchived && onRecevoir && (
                        <button
                          onClick={() => onRecevoir(commande)}
                          disabled={actionInProgress === `recevoir-${commande.idCommandeFournisseur}`}
                          className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 hover:text-green-800 disabled:opacity-50"
                          title={t('dashboard.procurementOrdersComponents.receiveOrderTitle')}
                        >
                          <TruckIcon className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        onClick={() => onView(commande)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title={t('dashboard.procurementOrdersComponents.viewDetailsTitle')}
                      >
                        <EyeIcon className="h-5 w-5" />
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
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('dashboard.procurementOrdersComponents.showLabel')}</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="rounded-md border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {t('dashboard.procurementOrdersComponents.paginationInfo', {
                start: startIndex + 1,
                end: Math.min(endIndex, totalItems),
                total: totalItems,
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="rounded-md p-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                title={t('dashboard.procurementOrdersComponents.firstPage')}
              >
                <ChevronDoubleLeftIcon className="h-4 w-4 text-gray-600" />
              </button>

              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-md p-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                title={t('dashboard.procurementOrdersComponents.previousPage')}
              >
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              </button>

              {renderPageNumbers()}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-md p-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                title={t('dashboard.procurementOrdersComponents.nextPage')}
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              </button>

              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-md p-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                title={t('dashboard.procurementOrdersComponents.lastPage')}
              >
                <ChevronDoubleRightIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableauCommandes;
