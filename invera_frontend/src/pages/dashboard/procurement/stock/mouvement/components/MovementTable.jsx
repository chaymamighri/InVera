import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../../context/LanguageContext';

const localeByLanguage = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
};

const MovementTable = ({ movements }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortDirection, setSortDirection] = useState('desc');
  const { t, language, isArabic } = useLanguage();
  const tr = (key, params) => t(`dashboard.procurementMovementsPage.${key}`, params);
  const locale = localeByLanguage[language] || localeByLanguage.fr;

  useEffect(() => {
    setCurrentPage(1);
  }, [movements]);

  const formatDate = (dateString) => {
    if (!dateString) return tr('notAvailable');
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getDocumentLabel = (typeDocument) => {
    const labels = {
      COMMANDE_FOURNISSEUR: tr('supplierOrder'),
      COMMANDE_CLIENT: tr('customerOrder'),
      INIT_STOCK: tr('initialStock'),
      INITIALISATION: tr('initialStock'),
    };

    return labels[typeDocument?.toUpperCase?.()] ?? typeDocument ?? '-';
  };

  const sortedMovements = useMemo(() => {
    if (!movements || movements.length === 0) return [];
    return [...movements].sort((a, b) => {
      const dateA = new Date(a.dateMouvement);
      const dateB = new Date(b.dateMouvement);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [movements, sortDirection]);

  const totalItems = sortedMovements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);
  const paginatedMovements = sortedMovements.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            safeCurrentPage === i ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
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
        label: tr('entry'),
      },
      INIT_STOCK: {
        className: 'bg-blue-100 text-blue-800',
        icon: <ArrowPathIcon className="w-3 h-3" />,
        label: tr('initialStock'),
      },
      SORTIE: {
        className: 'bg-red-100 text-red-800',
        icon: <ArrowDownIcon className="w-3 h-3" />,
        label: tr('exit'),
      },
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
          <p>{tr('noMovements')}</p>
        </div>
      </div>
    );
  }

  const PrevIcon = isArabic ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = isArabic ? ChevronLeftIcon : ChevronRightIcon;
  const FirstIcon = isArabic ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;
  const LastIcon = isArabic ? ChevronDoubleLeftIcon : ChevronDoubleRightIcon;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors`}
                onClick={() => {
                  setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  setCurrentPage(1);
                }}
              >
                <div className="flex items-center gap-1">
                  {tr('date')}
                  {sortDirection === 'asc' ? (
                    <ArrowUpIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </th>
              <TableHeader align={isArabic ? 'right' : 'left'}>{tr('product')}</TableHeader>
              <TableHeader align="center">{tr('type')}</TableHeader>
              <TableHeader align="right">{tr('quantity')}</TableHeader>
              <TableHeader align="right">{tr('stockBefore')}</TableHeader>
              <TableHeader align="right">{tr('stockAfter')}</TableHeader>
              <TableHeader align={isArabic ? 'right' : 'left'}>{tr('document')}</TableHeader>
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
                <td className="px-6 py-4 text-center">{getTypeBadge(movement.typeMouvement)}</td>
                <td className="px-6 py-4 text-center font-medium tabular-nums">
                  {Number(movement.quantite || 0).toLocaleString(locale)}
                </td>
                <td className="px-6 py-4 text-center text-gray-500 tabular-nums">
                  {Number(movement.stockAvant || 0).toLocaleString(locale)}
                </td>
                <td className="px-6 py-4 text-center font-medium text-blue-600 tabular-nums">
                  {Number(movement.stockApres || 0).toLocaleString(locale)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{getDocumentLabel(movement.typeDocument)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{tr('showLabel')}</span>
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
            <span className="text-sm text-gray-500">{tr('perPage')}</span>
          </div>

          <div className="text-sm text-gray-500">
            {tr('paginationInfo', { start: startIndex + 1, end: endIndex, total: totalItems })}
          </div>

          <div className="flex items-center gap-1">
            <PageButton onClick={() => goToPage(1)} disabled={safeCurrentPage === 1} title={tr('firstPage')} Icon={FirstIcon} />
            <PageButton onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1} title={tr('previousPage')} Icon={PrevIcon} />
            <div className="flex items-center gap-1 mx-1">{renderPageNumbers()}</div>
            <PageButton onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages} title={tr('nextPage')} Icon={NextIcon} />
            <PageButton onClick={() => goToPage(totalPages)} disabled={safeCurrentPage === totalPages} title={tr('lastPage')} Icon={LastIcon} />
          </div>
        </div>
      )}
    </div>
  );
};

const TableHeader = ({ children, align }) => {
  const alignClass = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }[align];

  return (
    <th className={`px-6 py-3 ${alignClass} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
      {children}
    </th>
  );
};

const PageButton = ({ onClick, disabled, title, Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg transition-colors ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
    title={title}
  >
    <Icon className="w-5 h-5" />
  </button>
);

export default MovementTable;
