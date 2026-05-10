/**
 * DashboardPage - Page d'accueil du module Ventes
 * Route : /dashboard/sales/dashboard
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useDashboardData } from '../../../../hooks/useDashboardData';
import KPICard from './components/KPICard';
import EvolutionChart from './components/EvolutionChart';
import TopProducts from './components/TopProducts';
import StatusDonutChart from './components/StatusDonutChart';
import OrdersEvolutionChart from './components/OrdersEvolutionChart';
import ClientTypeChart from './components/ClientTypeChart';
import SkeletonLoader from './components/SkeletonLoader';
import DateRangeSelector from './components/DateRangeSelector';
import html2pdf from 'html2pdf.js';

const DashboardPage = () => {
  const dashboardRef = useRef(null);

  const {
    loading,
    error,
    data,
    applyCustomRange,
    refresh,
    formatCurrency,
    refreshing,
    dateRange,
    filterActive: hookFilterActive
  } = useDashboardData();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      setStartDate(dateRange.startDate);
      setEndDate(dateRange.endDate);
      setFilterActive(true);
    } else {
      setStartDate('');
      setEndDate('');
      setFilterActive(false);
    }
  }, [dateRange]);

  useEffect(() => {
    setFilterActive(hookFilterActive);
  }, [hookFilterActive]);

  const defaultKPI = {
    caJour: 0,
    commandesJour: 0,
    variationJour: 0
  };

  const defaultCharts = {
    evolutionCA: [],
    topProduits: []
  };

  const statusData = useMemo(() => data?.statusRepartition || [], [data]);
  const ordersEvolutionData = useMemo(() => data?.ordersEvolution || [], [data]);
  const clientTypeData = useMemo(() => data?.clientTypeRepartition || [], [data]);

  const kpi = data?.kpi || defaultKPI;
  const charts = data?.charts || defaultCharts;

  // ============================================
  // EXPORT PDF
  // ============================================

  const exportToPDF = async () => {
    setExporting(true);
    
    try {
      // Récupérer les informations de l'utilisateur
      let userName = 'Utilisateur';
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        userName = userInfo?.nom || adminInfo?.nom || localStorage.getItem('userName') || 'Utilisateur';
      } catch (e) {
        console.warn("Erreur lecture userInfo:", e);
      }

      const safeKpi = {
        caJour: kpi?.caJour || 0,
        commandesJour: kpi?.commandesJour || 0,
        variationJour: kpi?.variationJour || 0
      };
      
      const safeCharts = {
        topProduits: charts?.topProduits || [],
        evolutionCA: charts?.evolutionCA || []
      };
      
      const safeStatusData = statusData || [];
      const safeClientTypeData = clientTypeData || [];
      const safeOrdersEvolutionData = ordersEvolutionData || [];
      
      const formatDate = (date) => {
        if (!date) return '';
        try {
          return new Date(date).toLocaleDateString('fr-FR');
        } catch {
          return '';
        }
      };
      
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('fr-FR');
      const formattedPeriodStart = filterActive && startDate ? formatDate(startDate) : '30 derniers jours';
      const formattedPeriodEnd = filterActive && endDate ? formatDate(endDate) : formatDate(currentDate);
      
      const cleanText = (text) => {
        if (!text) return '';
        return String(text).replace(/[&<>]/g, '');
      };
      
      const safeUserName = cleanText(userName);
      
      const generateHTML = () => {
        let html = `<!DOCTYPE html>
        <html>
          <head>
            <title>Rapport Ventes</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, sans-serif; background: #f0f2f5; padding: 30px 20px; color: #1e293b; }
              .dashboard-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 35px -8px rgba(0,0,0,0.1); overflow: hidden; }
              
              /* Header */
              .header { padding: 24px 30px; background: #f8fafc; border-bottom: 1px solid #e9ecef; }
              .report-title { font-size: 24px; font-weight: 700; color: #1e293b; letter-spacing: -0.5px; margin-bottom: 8px; }
              .exported-by { font-size: 12px; color: #64748b; margin-top: 4px; }
              .period-badge { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; background: #eef2ff; color: #2563eb; margin-top: 12px; }
              
              /* KPIs */
              .kpi-grid { padding: 25px 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; background: white; }
              .kpi-card { background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #eef2f6; text-align: center; }
              .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
              .kpi-value { font-size: 28px; font-weight: 700; color: #2563eb; margin-top: 8px; }
              .kpi-trend { font-size: 11px; margin-top: 4px; }
              .trend-up { color: #10b981; }
              .trend-down { color: #ef4444; }
              
              /* Sections */
              .section { padding: 20px 30px; border-top: 1px solid #eef2f6; }
              .section-title { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; border-left: 3px solid #2563eb; padding-left: 12px; }
              
              /* Tableaux */
              table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #edf2f7; }
              th { background: #f8fafc; padding: 12px 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
              td { padding: 10px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #edf2f7; }
              .text-right { text-align: right; }
              .font-mono { font-family: 'Courier New', monospace; font-weight: 500; }
              
              /* Footer */
              .footer { padding: 16px 30px; text-align: center; border-top: 1px solid #eef2f6; background: #fafcff; }
              .footer p { font-size: 11px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="dashboard-container">
              <div class="header">
                <div class="report-title">RAPPORT VENTES</div>
                <div class="exported-by">Exporte par : ${safeUserName}</div>
                <div class="exported-by">le ${formattedDate}</div>
                <div class="period-badge">Periode : ${formattedPeriodStart} - ${formattedPeriodEnd}</div>
              </div>`;
        
        // KPIs
        html += `<div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Chiffre d'Affaires</div>
            <div class="kpi-value">${formatCurrency(safeKpi.caJour)}</div>
            <div class="kpi-trend ${safeKpi.variationJour >= 0 ? 'trend-up' : 'trend-down'}">
              ${safeKpi.variationJour >= 0 ? '↑' : '↓'} ${Math.abs(safeKpi.variationJour)}%
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Commandes</div>
            <div class="kpi-value">${safeKpi.commandesJour}</div>
            <div class="kpi-trend ${safeKpi.variationJour >= 0 ? 'trend-up' : 'trend-down'}">
              ${safeKpi.variationJour >= 0 ? '↑' : '↓'} ${Math.abs(safeKpi.variationJour)}%
            </div>
          </div>
        </div>`;
        
        // Top 5 Produits
        if (safeCharts.topProduits && safeCharts.topProduits.length > 0) {
          html += `<div class="section">
            <div class="section-title">TOP 5 PRODUITS</div>
            <table>
              <thead>
                <tr><th>Rang</th><th>Produit</th><th class="text-right">Quantite</th><th class="text-right">Montant</th></tr>
              </thead>
              <tbody>`;
          safeCharts.topProduits.forEach((p, i) => {
            html += `<tr>
              <td>${i + 1}</td>
              <td>${p.nom || p.libelle || 'Produit'}</td>
              <td class="text-right">${p.quantite || p.quantiteVendue || 0}</td>
              <td class="text-right font-mono">${formatCurrency(p.total || p.montant || 0)}</td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Repartition par statut
        if (safeStatusData.length > 0) {
          html += `<div class="section">
            <div class="section-title">REPARTITION PAR STATUT</div>
            <table>
              <thead><tr><th>Statut</th><th class="text-right">Nombre</th><th class="text-right">Montant</th></tr></thead>
              <tbody>`;
          safeStatusData.forEach(s => {
            html += `<tr>
              <td>${s.statut || 'N/A'}</td>
              <td class="text-right">${s.nombre || 0}</td>
              <td class="text-right font-mono">${formatCurrency(s.montant || 0)}</td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Types de clients
        if (safeClientTypeData.length > 0) {
          html += `<div class="section">
            <div class="section-title">REPARTITION PAR TYPE DE CLIENT</div>
            <table>
              <thead><tr><th>Type</th><th class="text-right">Nombre</th><th class="text-right">Montant</th></tr></thead>
              <tbody>`;
          safeClientTypeData.forEach(c => {
            html += `<tr>
              <td>${c.type || 'N/A'}</td>
              <td class="text-right">${c.nombre || 0}</td>
              <td class="text-right font-mono">${formatCurrency(c.montant || 0)}</td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Evolution des commandes
        if (safeOrdersEvolutionData.length > 0) {
          const ordersNonZero = safeOrdersEvolutionData.filter(o => o.commandes > 0);
          if (ordersNonZero.length > 0) {
            html += `<div class="section">
              <div class="section-title">EVOLUTION DES COMMANDES</div>
              <table>
                <thead><tr><th>Date</th><th class="text-right">Commandes</th><th class="text-right">CA</th></tr></thead>
                <tbody>`;
            ordersNonZero.forEach(o => {
              html += `<tr>
                <td>${o.date || 'N/A'}</td>
                <td class="text-right">${o.commandes || 0}</td>
                <td class="text-right font-mono">${formatCurrency(o.ca || 0)}</td>
              </tr>`;
            });
            html += `</tbody></table></div>`;
          }
        }
        
        // Evolution CA
        if (safeCharts.evolutionCA && safeCharts.evolutionCA.length > 0) {
          const evolutionCANonZero = safeCharts.evolutionCA.filter(item => item.montant > 0);
          if (evolutionCANonZero.length > 0) {
            html += `<div class="section">
              <div class="section-title">EVOLUTION DU CHIFFRE D'AFFAIRES</div>
              <table>
                <thead><tr><th>Date</th><th class="text-right">Montant</th></tr></thead>
                <tbody>`;
            evolutionCANonZero.forEach(item => {
              html += `<tr>
                <td>${item.date || 'N/A'}</td>
                <td class="text-right font-mono">${formatCurrency(item.montant)}</td>
              </tr>`;
            });
            html += `</tbody></table></div>`;
          }
        }
        
        html += `<div class="footer">
          <p>Document genere automatiquement</p>
        </div>`;
        
        html += `</div></body></html>`;
        return html;
      };
      
      const element = document.createElement('div');
      element.innerHTML = generateHTML();
      document.body.appendChild(element);
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `rapport_ventes_${currentDate.toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la generation du PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      ref={dashboardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* En-tête avec filtre et export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Periode :</span>
            <DateRangeSelector 
              onApplyCustom={applyCustomRange}
              onRefresh={refresh}
              refreshing={refreshing}
              currentStartDate={startDate}
              currentEndDate={endDate}
            />
          </div>
          
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Export en cours...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Exporter PDF
              </>
            )}
          </button>
        </div>

        {filterActive && (startDate || endDate) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            Periode selectionnee : 
            {startDate && <span> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
            {startDate && endDate && <span> au </span>}
            {endDate && <span>{new Date(endDate).toLocaleDateString('fr-FR')}</span>}
          </div>
        )}
      </div>

      {/* Indicateurs cles */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          Indicateurs cles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard
            title="Chiffre d'Affaires"
            value={kpi.caJour}
            icon="💰"
            color="blue"
            trend={kpi.variationJour}
            formatValue={formatCurrency}
          />
          <KPICard
            title="Commandes"
            value={kpi.commandesJour}
            icon="📦"
            color="green"
            trend={kpi.variationJour}
          />
        </div>
      </section>

      {/* Analyse des ventes */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
          Analyse des ventes
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Evolution du Chiffre d'Affaires
            </h3>
            <EvolutionChart data={charts.evolutionCA} formatCurrency={formatCurrency} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Top 5 Produits
            </h3>
            <TopProducts products={charts.topProduits} formatCurrency={formatCurrency} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Repartition par statut
            </h3>
            <StatusDonutChart data={statusData} formatCurrency={formatCurrency} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Evolution des commandes
            </h3>
            {ordersEvolutionData.length > 0 ? (
              <OrdersEvolutionChart data={ordersEvolutionData} formatCurrency={formatCurrency} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucune donnee pour cette periode</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Repartition par type de client
          </h3>
          {clientTypeData.length > 0 ? (
            <ClientTypeChart data={clientTypeData} formatCurrency={formatCurrency} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">Aucune donnee pour cette periode</p>
            </div>
          )}
        </div>
      </section>

      {filterActive && (startDate || endDate) && (
        <div className="text-xs text-gray-400 text-right border-t pt-4">
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Periode selectionnee : 
            {startDate && <span> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
            {startDate && endDate && <span> au </span>}
            {endDate && <span>{new Date(endDate).toLocaleDateString('fr-FR')}</span>}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardPage;