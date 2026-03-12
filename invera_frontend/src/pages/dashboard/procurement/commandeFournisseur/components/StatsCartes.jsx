// components/StatsCartes.jsx
import React from 'react';
import { formatPrice } from '../CommandesFournisseurs'; 

const StatsCartes = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Total commandes</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">En attente</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Total HT</p>
        <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalHT)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Total TTC</p>
        <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.totalTTC)}</p>
      </div>
    </div>
  );
};

export default StatsCartes;