import React from 'react';

const SalesDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Ventes</h1>
        <p className="text-gray-600 mt-2">En cours de développement 🚧</p>
      </div>

      {/* Message central */}
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-md border p-6">
        <svg 
          className="h-20 w-20 text-orange-400 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xl font-semibold text-gray-700">
          Ce dashboard est actuellement en cours de développement.
        </p>
        <p className="text-gray-500 mt-2">
          Les statistiques et les fonctionnalités seront disponibles bientôt.
        </p>
      </div>
    </div>
  );
};

export default SalesDashboard;
