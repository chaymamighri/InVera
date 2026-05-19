// components/BarreRecherche.jsx
import React from 'react';
import {
  ArchiveBoxIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const BarreRecherche = ({
  searchTerm,
  setSearchTerm,
  selectedStatut,
  setSelectedStatut,
  showFilters,
  setShowFilters,
  onSearch,
  onNouvelleCommande,
  onShowArchives,
  showArchives,
  statuts,
  dateDebut,
  setDateDebut,
  dateFin,
  setDateFin,
  onSearchByPeriode,
}) => {
  const { t, isArabic } = useLanguage();
  const iconSideClass = isArabic ? 'right-3' : 'left-3';
  const inputPaddingClass = isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4';

  return (
    <div className="rounded-lg bg-white p-4 shadow" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className={`absolute ${iconSideClass} top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400`}
            />
            <input
              type="text"
              placeholder={t('dashboard.procurementOrdersComponents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              className={`${inputPaddingClass} w-full rounded-lg border py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('dashboard.procurementOrdersComponents.allStatuses')}</option>
            {Object.values(statuts).map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
              showFilters ? 'border-blue-300 bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            {t('dashboard.procurementOrdersComponents.filters')}
          </button>

          <button
            onClick={onShowArchives}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
              showArchives
                ? 'border-purple-300 bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title={
              showArchives
                ? t('dashboard.procurementOrdersComponents.hideArchives')
                : t('dashboard.procurementOrdersComponents.showArchives')
            }
          >
            <ArchiveBoxIcon className="h-5 w-5" />
            {t('dashboard.procurementOrdersComponents.archives')}
          </button>

          <button
            onClick={onNouvelleCommande}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5" />
            {t('dashboard.procurementOrdersComponents.newOrder')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('dashboard.procurementOrdersComponents.startDate')}
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('dashboard.procurementOrdersComponents.endDate')}
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={onSearchByPeriode}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              {t('dashboard.procurementOrdersComponents.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarreRecherche;
