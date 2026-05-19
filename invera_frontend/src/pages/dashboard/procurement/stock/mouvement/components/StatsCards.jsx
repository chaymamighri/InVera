import React from 'react';
import { ArrowPathIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../../context/LanguageContext';

const StatsCards = ({ stats }) => {
  const { t, language } = useLanguage();
  const tr = (key, params) => t(`dashboard.procurementMovementsPage.${key}`, params);
  const locale = language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR';

  const cards = [
    {
      title: tr('totalEntries'),
      value: stats.totalEntrees,
      icon: ArrowUpIcon,
      border: 'border-green-500',
      iconClass: 'text-green-500',
    },
    {
      title: tr('totalExits'),
      value: stats.totalSorties,
      icon: ArrowDownIcon,
      border: 'border-red-500',
      iconClass: 'text-red-500',
    },
    {
      title: tr('totalMovements'),
      value: stats.totalMouvements,
      icon: ArrowPathIcon,
      border: 'border-blue-500',
      iconClass: 'text-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(({ title, value, icon: Icon, border, iconClass }) => (
        <div key={title} className={`bg-white rounded-lg shadow p-4 border-l-4 ${border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-bold text-gray-800">{Number(value || 0).toLocaleString(locale)}</p>
            </div>
            <Icon className={`w-8 h-8 ${iconClass}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
