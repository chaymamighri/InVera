import React from 'react';
import {
  CubeIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const ProcurementDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de bord – Achats & Approvisionnement
        </h1>
        <p className="text-gray-600 mt-2">
          Module en cours de développement
        </p>
      </div>

      {/* Banner WIP */}
      <div className="mb-8 flex items-center gap-3 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
        <ClockIcon className="h-6 w-6 text-yellow-600" />
        <p className="text-sm text-yellow-800">
          Ce module est actuellement en cours de développement.  
          Les données affichées sont statiques et fournies à titre de démonstration.
        </p>
      </div>

      {/* Stats (statiques) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Commandes actives', value: '--', icon: CubeIcon },
          { label: 'Budget utilisé', value: '--', icon: CurrencyDollarIcon },
          { label: 'Articles en alerte', value: '--', icon: ExclamationTriangleIcon },
          { label: 'Fournisseurs', value: '--', icon: TruckIcon },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6 opacity-70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">Non disponible</p>
              </div>
              <div className="bg-gray-300 p-3 rounded-lg">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stocks */}
        <div className="bg-white rounded-xl shadow-sm border p-6 opacity-70">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              Suivi des stocks
            </h2>
            <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
          </div>

          <p className="text-sm text-gray-500">
            Les informations de stock seront disponibles après l’intégration
            du module d’inventaire.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 opacity-70">
          <h2 className="text-xl font-bold mb-6">
            Gestion des achats
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nouvelle commande', icon: CubeIcon },
              { label: 'Suivi livraisons', icon: TruckIcon },
              { label: 'Budget', icon: CurrencyDollarIcon },
              { label: 'Rapports', icon: ChartBarIcon },
            ].map((action, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg text-center bg-gray-50 cursor-not-allowed"
              >
                <action.icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <span className="font-medium text-gray-400">
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
