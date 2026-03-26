// components/stock/StatsCards.jsx
import React from 'react';
import { ArrowPathIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total entrées</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalEntrees}</p>
          </div>
          <ArrowUpIcon className="w-8 h-8 text-green-500" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total sorties</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalSorties}</p>
          </div>
          <ArrowDownIcon className="w-8 h-8 text-red-500" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total mouvements</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalMouvements}</p>
          </div>
          <ArrowPathIcon className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;