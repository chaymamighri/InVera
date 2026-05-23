/**
 * OrdersEvolutionChart - Graphique d'évolution des commandes
 * Version avec Recharts et option alternative avec SVG animé
 */

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../../../../../context/LanguageContext';

const OrdersEvolutionChart = ({ data, formatCurrency }) => {
  const { t } = useLanguage();
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        {t('dashboard.salesStatsPage.noDataAvailable')}
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const [, month, day] = dateStr.split('-');
      return `${day}/${month}`;
    }
    return dateStr;
  };

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    commandes: item.commandes || 0,
    ca: item.ca || 0
  }));

  const maxCommandes = Math.max(...chartData.map(d => d.commandes), 1);
  const maxCA = Math.max(...chartData.map(d => d.ca), 1);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const commandesData = payload.find(p => p.dataKey === 'commandes');
      const caData = payload.find(p => p.dataKey === 'ca');
      
      return (
        <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg">
          <div className="font-medium mb-2 pb-1 border-b border-gray-700">
            {label}
          </div>
          {commandesData && (
            <div className="flex justify-between gap-4 mb-1">
              <span>{t('dashboard.salesStatsPage.orders')} :</span>
              <span className="font-medium text-blue-300">{commandesData.value}</span>
            </div>
          )}
          {caData && caData.value > 0 && (
            <div className="flex justify-between gap-4">
              <span>{t('dashboard.salesStatsPage.revenueShort')} :</span>
              <span className="font-medium text-green-300">{formatCurrency(caData.value)}</span>
            </div>
          )}
          {caData && caData.value === 0 && (
            <div className="text-gray-400 text-[10px] mt-1">{t('dashboard.salesStatsPage.noSale')}</div>
          )}
        </div>
      );
    }
    return null;
  };

  const totalCommandes = data.reduce((sum, p) => sum + p.commandes, 0);
  const totalCA = data.reduce((sum, p) => sum + p.ca, 0);

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }}
              domain={[0, maxCommandes]}
              tickCount={maxCommandes + 1}
              tickFormatter={(value) => Math.floor(value).toString()}
              allowDecimals={false}
              label={{ 
                value: t('dashboard.salesStatsPage.orderCountLabel'), 
                angle: -90, 
                position: 'insideLeft',
                fontSize: 11,
                style: { fill: '#6b7280' }
              }}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
              label={{ 
                value: t('dashboard.salesStatsPage.revenueLabel'), 
                angle: 90, 
                position: 'insideRight',
                fontSize: 11,
                style: { fill: '#6b7280' }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Barres sans les labels au-dessus */}
            <Bar 
              yAxisId="left"
              dataKey="commandes" 
              name={t('dashboard.salesStatsPage.orders')}
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="ca" 
              name={t('dashboard.salesStatsPage.revenueShort')}
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Légende en dessous */}
      <div className="flex items-center justify-center gap-8 pt-2 pb-1 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-xs text-gray-600">{t('dashboard.salesStatsPage.orderCount')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500 rounded"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{t('dashboard.salesStatsPage.revenue')}</span>
        </div>
      </div>

      {/* Totaux */}
      <div className="border-t pt-3 mt-2 text-xs text-gray-500 flex justify-between px-2">
        <span>
          📦 {t('dashboard.salesStatsPage.totalOrders')}: {totalCommandes}
        </span>
        <span>
          💰 {t('dashboard.salesStatsPage.totalRevenue')}: {formatCurrency(totalCA)}
        </span>
      </div>
    </div>
  );
};

export default OrdersEvolutionChart;