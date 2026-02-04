import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStatistiques } from '../../../../hooks/pageAnalytics';

const Rapports = () => {
  const { statistiques } = useStatistiques();
  const [viewMode, setViewMode] = useState('cards');
  const [filterType, setFilterType] = useState('all');

  // 🔹 Totaux et profit
  const totalSales = statistiques.totals.ventes;
  const totalPurchases = statistiques.totals.achats;
  const profit = totalSales - totalPurchases;

  // 🔹 Données pour les graphiques
  const salesChartData = statistiques.monthlyComparison.map(m => ({
    month: m.month,
    total: m.ventes
  }));

  const purchaseChartData = statistiques.monthlyComparison.map(m => ({
    month: m.month,
    total: m.achats
  }));

  // 🔹 Données pour les cartes (daily des responsables)
  const allReports = statistiques.responsables.flatMap(r =>
    r.daily.map(d => ({
      id: `${r.name}-${d.day}`,
      name: r.name,
      type: r.type,
      day: d.day,
      total: d.amount,
      status: 'Completed' // placeholder
    }))
  );

  const filteredReports = filterType === 'all' 
    ? allReports 
    : allReports.filter(r => r.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500 mt-1">Visualisez les rapports de ventes et d'achats</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Exporter tout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Ventes</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSales.toLocaleString()} €</p>
          <p className="text-xs text-gray-500 mt-1">{statistiques.responsables.filter(r => r.type === 'vente').length} responsable(s)</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Achats</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPurchases.toLocaleString()} €</p>
          <p className="text-xs text-gray-500 mt-1">{statistiques.responsables.filter(r => r.type === 'achat').length} responsable(s)</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Profit Net</h3>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}{profit.toLocaleString()} €
          </p>
          <p className="text-xs text-gray-500 mt-1">Marge: {totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Tous les rapports</option>
                <option value="vente">Ventes uniquement</option>
                <option value="achat">Achats uniquement</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'cards' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'charts' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Graphiques
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun rapport disponible</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div 
                key={report.id} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.type === 'vente' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {report.type === 'vente' ? 'Vente' : 'Achat'}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">{report.name} - {report.day}</h3>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ArrowDownTrayIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Montant total</p>
                  <p className="text-2xl font-bold text-gray-900">{report.total.toLocaleString()} €</p>
                </div>

                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700`}>
                    {report.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution des Ventes</h3>
            {salesChartData.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Aucune donnée de vente disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Purchases Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution des Achats</h3>
            {purchaseChartData.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Aucune donnée d'achat disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar 
                    dataKey="total" 
                    fill="#f97316" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapports;
