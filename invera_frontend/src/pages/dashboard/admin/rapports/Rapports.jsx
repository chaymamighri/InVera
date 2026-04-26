import React, { useMemo, useState } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../../../../context/LanguageContext';
import { useStatistiques } from '../../../../hooks/pageAnalytics';

const copy = {
  fr: {
    title: 'Rapports',
    description: "Visualisez les rapports de ventes et d'achats",
    exportAll: 'Exporter tout',
    totalSales: 'Total ventes',
    totalPurchases: 'Total achats',
    netProfit: 'Profit net',
    managers: '{{count}} responsable(s)',
    margin: 'Marge',
    allReports: 'Tous les rapports',
    salesOnly: 'Ventes uniquement',
    purchasesOnly: 'Achats uniquement',
    list: 'Liste',
    charts: 'Graphiques',
    noReports: 'Aucun rapport disponible',
    sale: 'Vente',
    purchase: 'Achat',
    totalAmount: 'Montant total',
    completed: 'Termine',
    salesEvolution: 'Evolution des ventes',
    salesDataUnavailable: 'Aucune donnee de vente disponible',
    purchasesEvolution: 'Evolution des achats',
    purchaseDataUnavailable: "Aucune donnee d'achat disponible",
    currency: 'DT',
  },
  en: {
    title: 'Reports',
    description: 'View sales and purchase reports',
    exportAll: 'Export all',
    totalSales: 'Total sales',
    totalPurchases: 'Total purchases',
    netProfit: 'Net profit',
    managers: '{{count}} manager(s)',
    margin: 'Margin',
    allReports: 'All reports',
    salesOnly: 'Sales only',
    purchasesOnly: 'Purchases only',
    list: 'List',
    charts: 'Charts',
    noReports: 'No reports available',
    sale: 'Sale',
    purchase: 'Purchase',
    totalAmount: 'Total amount',
    completed: 'Completed',
    salesEvolution: 'Sales trend',
    salesDataUnavailable: 'No sales data available',
    purchasesEvolution: 'Purchases trend',
    purchaseDataUnavailable: 'No purchase data available',
    currency: 'TND',
  },
  ar: {
    title: 'التقارير',
    description: 'استعرض تقارير المبيعات والمشتريات',
    exportAll: 'تصدير الكل',
    totalSales: 'إجمالي المبيعات',
    totalPurchases: 'إجمالي المشتريات',
    netProfit: 'صافي الربح',
    managers: '{{count}} مسؤول/مسؤولون',
    margin: 'الهامش',
    allReports: 'كل التقارير',
    salesOnly: 'المبيعات فقط',
    purchasesOnly: 'المشتريات فقط',
    list: 'قائمة',
    charts: 'رسوم بيانية',
    noReports: 'لا توجد تقارير',
    sale: 'بيع',
    purchase: 'شراء',
    totalAmount: 'المبلغ الإجمالي',
    completed: 'مكتمل',
    salesEvolution: 'تطور المبيعات',
    salesDataUnavailable: 'لا توجد بيانات مبيعات',
    purchasesEvolution: 'تطور المشتريات',
    purchaseDataUnavailable: 'لا توجد بيانات مشتريات',
    currency: 'د.ت',
  },
};

const localeMap = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
};

const Rapports = () => {
  const { language, isArabic } = useLanguage();
  const text = useMemo(() => copy[language] || copy.fr, [language]);
  const numberLocale = localeMap[language] || localeMap.fr;
  const { statistiques } = useStatistiques();
  const [viewMode, setViewMode] = useState('cards');
  const [filterType, setFilterType] = useState('all');

  const totalSales = statistiques.totals.ventes;
  const totalPurchases = statistiques.totals.achats;
  const profit = totalSales - totalPurchases;

  const formatMoney = (value) => `${Number(value || 0).toLocaleString(numberLocale)} ${text.currency}`;

  const salesChartData = statistiques.monthlyComparison.map((m) => ({
    month: m.month,
    total: m.ventes,
  }));

  const purchaseChartData = statistiques.monthlyComparison.map((m) => ({
    month: m.month,
    total: m.achats,
  }));

  const allReports = statistiques.responsables.flatMap((responsable) =>
    responsable.daily.map((day) => ({
      id: `${responsable.name}-${day.day}`,
      name: responsable.name,
      type: responsable.type,
      day: day.day,
      total: day.amount,
      status: text.completed,
    }))
  );

  const filteredReports =
    filterType === 'all' ? allReports : allReports.filter((report) => report.type === filterType);

  return (
    <div className={`space-y-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.description}</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-white transition hover:bg-teal-600">
          <ArrowDownTrayIcon className="h-5 w-5" />
          {text.exportAll}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          [
            text.totalSales,
            totalSales,
            'green',
            statistiques.responsables.filter((responsable) => responsable.type === 'vente').length,
          ],
          [
            text.totalPurchases,
            totalPurchases,
            'orange',
            statistiques.responsables.filter((responsable) => responsable.type === 'achat').length,
          ],
        ].map(([label, total, tone, count]) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  tone === 'green' ? 'bg-green-100' : 'bg-orange-100'
                }`}
              >
                <ChartBarIcon
                  className={`h-6 w-6 ${tone === 'green' ? 'text-green-600' : 'text-orange-600'}`}
                />
              </div>
              <h3 className="text-sm font-medium text-gray-600">{label}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(total)}</p>
            <p className="mt-1 text-xs text-gray-500">
              {text.managers.replace('{{count}}', String(count))}
            </p>
          </div>
        ))}

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">{text.netProfit}</h3>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}
            {formatMoney(profit)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {text.margin}: {totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">{text.allReports}</option>
              <option value="vente">{text.salesOnly}</option>
              <option value="achat">{text.purchasesOnly}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {text.list}
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                viewMode === 'charts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {text.charts}
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredReports.length === 0 ? (
            <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <DocumentTextIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">{text.noReports}</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className={`mb-4 flex items-start justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        report.type === 'vente'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {report.type === 'vente' ? text.sale : text.purchase}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">
                      {report.name} - {report.day}
                    </h3>
                  </div>
                  <button className="rounded-lg p-2 transition hover:bg-gray-100">
                    <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="mb-1 text-sm text-gray-600">{text.totalAmount}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(report.total)}</p>
                </div>

                <div className="mt-2">
                  <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {report.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">{text.salesEvolution}</h3>
            {salesChartData.length === 0 ? (
              <div className="py-12 text-center text-gray-500">{text.salesDataUnavailable}</div>
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

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">{text.purchasesEvolution}</h3>
            {purchaseChartData.length === 0 ? (
              <div className="py-12 text-center text-gray-500">{text.purchaseDataUnavailable}</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
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
