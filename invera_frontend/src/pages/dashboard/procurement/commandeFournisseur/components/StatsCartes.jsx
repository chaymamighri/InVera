// components/StatsCartes.jsx
import React from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';

const getLocale = (language) => (language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR');

const formatPrice = (price, language) => {
  if (price === null || price === undefined) return 'N/A';

  const amount = Number(price);
  if (!Number.isFinite(amount)) return 'N/A';

  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'TND',
  }).format(amount);
};

const StatsCartes = ({ stats }) => {
  const { t, language } = useLanguage();

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">{t('dashboard.procurementOrdersComponents.statsTotalOrders')}</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">{t('dashboard.procurementOrdersComponents.statsPending')}</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">{t('dashboard.procurementOrdersComponents.totalHT')}</p>
        <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalHT, language)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">{t('dashboard.procurementOrdersComponents.totalTTC')}</p>
        <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.totalTTC, language)}</p>
      </div>
    </div>
  );
};

export default StatsCartes;
