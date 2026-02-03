import React from 'react';

const DashboardContent = () => {
  const statsCards = [
    { title: 'CA Mensuel', value: '€245,890', change: '+12.5%', trend: 'up' },
    { title: 'Commandes', value: '1,248', change: '+8.2%', trend: 'up' },
    { title: 'Clients', value: '342', change: '+5.3%', trend: 'up' },
    { title: 'Panier Moyen', value: '€197', change: '-2.1%', trend: 'down' },
  ];

  const recentActivities = [
    { client: 'Entreprise A', action: 'Nouvelle commande', amount: '€4,250', time: '10 min' },
    { client: 'Client B', action: 'Facture payée', amount: '€1,890', time: '25 min' },
    { client: 'Entreprise C', action: 'Devis envoyé', amount: '€7,500', time: '1h' },
    { client: 'Client D', action: 'Commande expédiée', amount: '€2,340', time: '2h' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${stat.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: stat.trend === 'up' ? '75%' : '45%' }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Évolution du CA</h3>
            <select className="text-sm border rounded-lg px-3 py-1.5 text-gray-600">
              <option>30 derniers jours</option>
              <option>Trimestre</option>
              <option>Année</option>
            </select>
          </div>
          <div className="h-64 flex items-end space-x-2 pt-4">
            {[65, 80, 60, 75, 90, 85, 95, 70].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">J{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Activités récentes</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100 text-blue-600' :
                    index === 1 ? 'bg-green-100 text-green-600' :
                    index === 2 ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {index === 0 ? '🛒' : index === 1 ? '💳' : index === 2 ? '📄' : '🚚'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{activity.client}</p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{activity.amount}</p>
                  <p className="text-sm text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Produits les plus vendus</h3>
        <div className="space-y-4">
          {[
            { name: 'Produit Premium', sales: 245, revenue: '€48,900', progress: 85 },
            { name: 'Service Entreprise', sales: 189, revenue: '€37,800', progress: 70 },
            { name: 'Solution Standard', sales: 156, revenue: '€23,400', progress: 60 },
            { name: 'Pack Économique', sales: 98, revenue: '€14,700', progress: 40 },
          ].map((product, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800">{product.name}</span>
                  <span className="text-sm font-semibold text-gray-700">{product.revenue}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${product.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{product.sales} ventes</span>
                  <span className="text-xs text-gray-500">{product.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;