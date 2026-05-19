import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const FilterChip = ({ label, onClear }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
    {label}
    <button onClick={onClear} className="hover:text-blue-900">
      <XMarkIcon className="h-4 w-4" />
    </button>
  </span>
);

const FacturesFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  hasActiveFilters,
  onClearSearch,
  onClearStatus,
  onClearDate,
  filteredCount,
  currentPage,
  totalPages,
  formatDate,
  t,
  isArabic,
}) => {
  const iconSide = isArabic ? 'right-3' : 'left-3';
  const inputPadding = isArabic ? 'pr-9 pl-4' : 'pl-9 pr-4';

  const statusLabel = (status) => {
    if (status === 'PAYE') return t('paidInvoices');
    if (status === 'NON_PAYE') return t('unpaidInvoices');
    return t('cancelled');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className={`absolute ${iconSide} top-3 h-4 w-4 text-gray-400`} />
          <input
            type="text"
            placeholder={t('searchInvoices')}
            className={`w-full ${inputPadding} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="relative">
          <FunnelIcon className={`absolute ${iconSide} top-3 h-4 w-4 text-gray-400`} />
          <select
            className={`w-full ${inputPadding} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white`}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="tous">{t('allStatuses')}</option>
            <option value="PAYE">{t('paidInvoices')}</option>
            <option value="NON_PAYE">{t('unpaidInvoices')}</option>
          </select>
        </div>

        <div className="relative">
          <CalendarIcon className={`absolute ${iconSide} top-3 h-4 w-4 text-gray-400`} />
          <input
            type="date"
            className={`w-full ${inputPadding} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">{t('activeFilters')}</span>
          {searchTerm && <FilterChip label={t('searchFilterLabel', { value: searchTerm })} onClear={onClearSearch} />}
          {statusFilter !== 'tous' && <FilterChip label={t('statusFilterLabel', { value: statusLabel(statusFilter) })} onClear={onClearStatus} />}
          {dateFilter && <FilterChip label={t('dateFilterLabel', { value: formatDate(dateFilter) })} onClear={onClearDate} />}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-4">
        <span>{t('invoiceResultsCount', { count: filteredCount })}</span>
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
          {t('pageIndicator', { current: currentPage, total: totalPages || 1 })}
        </span>
      </div>
    </div>
  );
};

export default FacturesFilters;
