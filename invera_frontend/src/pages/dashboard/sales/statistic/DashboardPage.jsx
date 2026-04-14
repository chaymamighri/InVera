/**
 * DashboardPage - Page d'accueil du module Ventes
 * Route : /dashboard/sales/dashboard
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useDashboardData } from '../../../../hooks/useDashboardData';
import KPICard from './components/KPICard';
import EvolutionChart from './components/EvolutionChart';
import TopProducts from './components/TopProducts';
import StatusDonutChart from './components/StatusDonutChart';
import OrdersEvolutionChart from './components/OrdersEvolutionChart';
import ClientTypeChart from './components/ClientTypeChart';
import SkeletonLoader from './components/SkeletonLoader';
import DateRangeSelector from './components/DateRangeSelector';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { logoBase64 } from '../../../../assets/logoBase64';

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
  const [showExportMenu, setShowExportMenu] = useState(false);
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

  // Générer les données pour l'export Excel
  const getExportData = () => {
    return {
      periode: {
        debut: filterActive && startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '30 derniers jours',
        fin: filterActive && endDate ? new Date(endDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')
      },
      kpi: {
        chiffreAffaires: kpi.caJour,
        nombreCommandes: kpi.commandesJour,
        variation: kpi.variationJour
      },
      topProduits: charts.topProduits.map((p, i) => ({
        rang: i + 1,
        produit: p.nom || p.libelle,
        quantite: p.quantite || p.quantiteVendue || 0,
        montant: p.total || p.montant || 0
      })),
      evolutionCA: charts.evolutionCA.map(item => ({
        date: item.date,
        montant: item.montant || item.value || 0
      })),
      statusRepartition: statusData.map(s => ({
        statut: s.statut,
        nombre: s.nombre,
        montant: s.montant
      })),
      ordersEvolution: ordersEvolutionData.map(o => ({
        date: o.date,
        commandes: o.commandes,
        ca: o.ca
      })),
      clientTypeRepartition: clientTypeData.map(c => ({
        type: c.type,
        nombre: c.nombre,
        montant: c.montant
      }))
    };
  };

  // Export Excel
  const exportToExcel = () => {
    const exportData = getExportData();
    
    const wb = XLSX.utils.book_new();
    
    const kpiData = [
      ['RAPPORT DASHBOARD VENTES - InVera', ''],
      ['Date d\'export', new Date().toLocaleString('fr-FR')],
      ['Période', `${exportData.periode.debut} - ${exportData.periode.fin}`],
      ['', ''],
      ['INDICATEURS CLÉS', ''],
      ['Chiffre d\'Affaires', formatCurrency(exportData.kpi.chiffreAffaires)],
      ['Nombre de Commandes', exportData.kpi.nombreCommandes],
      ['Variation', `${exportData.kpi.variation > 0 ? '+' : ''}${exportData.kpi.variation}%`],
      ['', ''],
      ['TOP 5 PRODUITS', '', '', ''],
      ['Rang', 'Produit', 'Quantité', 'Montant']
    ];
    
    exportData.topProduits.forEach(p => {
      kpiData.push([p.rang, p.produit, p.quantite, formatCurrency(p.montant)]);
    });
    
    const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs & Top Produits');
    
    const evolutionData = [
      ['ÉVOLUTION DU CHIFFRE D\'AFFAIRES'],
      ['Date', 'Montant']
    ];
    exportData.evolutionCA.forEach(item => {
      evolutionData.push([item.date, formatCurrency(item.montant)]);
    });
    const wsEvolution = XLSX.utils.aoa_to_sheet(evolutionData);
    XLSX.utils.book_append_sheet(wb, wsEvolution, 'Évolution CA');
    
    const statusDataSheet = [
      ['RÉPARTITION PAR STATUT'],
      ['Statut', 'Nombre', 'Montant']
    ];
    exportData.statusRepartition.forEach(s => {
      statusDataSheet.push([s.statut, s.nombre, formatCurrency(s.montant)]);
    });
    const wsStatus = XLSX.utils.aoa_to_sheet(statusDataSheet);
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Statuts');
    
    const ordersData = [
      ['ÉVOLUTION DES COMMANDES'],
      ['Date', 'Nombre', 'CA']
    ];
    exportData.ordersEvolution.forEach(o => {
      ordersData.push([o.date, o.commandes, formatCurrency(o.ca)]);
    });
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Évolution commandes');
    
    const clientData = [
      ['RÉPARTITION PAR TYPE DE CLIENT'],
      ['Type', 'Nombre', 'Montant']
    ];
    exportData.clientTypeRepartition.forEach(c => {
      clientData.push([c.type, c.nombre, formatCurrency(c.montant)]);
    });
    const wsClient = XLSX.utils.aoa_to_sheet(clientData);
    XLSX.utils.book_append_sheet(wb, wsClient, 'Types clients');
    
    XLSX.writeFile(wb, `dashboard_ventes_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

// Export PDF avec le même en-tête que la facture
const exportToPDF = async () => {
  setExporting(true);
  setShowExportMenu(false);
  
  try {
    // Récupérer les informations de l'utilisateur connecté (sécurisé)
    let userName = 'Utilisateur';

    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      userName = userInfo?.nom || adminInfo?.nom || localStorage.getItem('userName') || 'Utilisateur';
    } catch (e) {
      console.warn("Erreur lecture userInfo:", e);
    }

    // Sécuriser les valeurs pour éviter les erreurs
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
    
    // Formater la date de façon sécurisée
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
    
    // Nettoyer les caractères problématiques
    const cleanText = (text) => {
      if (!text) return '';
      return String(text).replace(/[&<>]/g, '');
    };
    
    const safeUserName = cleanText(userName);

    
    // Générer le HTML de façon sécurisée
    const generateHTML = () => {
      let html = `<!DOCTYPE html>
        <html>
          <head>
            <title>Dashboard Ventes - InVera</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f7fa; padding: 20px; line-height: 1.5; color: #1e293b; }
              .dashboard-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 30px -10px rgba(0, 20, 40, 0.15); overflow: hidden; }
              .header { padding: 24px 28px; background: white; border-bottom: 1px solid #eef2f6; display: flex; justify-content: space-between; align-items: flex-start; }
              .left-section { display: flex; align-items: center; gap: 20px; }
              .logo { width: 60px; height: 60px; object-fit: contain; }
              .company-details { border-left: 1px solid #e2e8f0; padding-left: 16px; }
              .company-details p { margin: 3px 0; font-size: 11px; color: #475569; display: flex; align-items: center; gap: 8px; font-weight: 400; }
              .company-details i { color: #64748b; width: 14px; font-style: normal; font-size: 12px; opacity: 0.7; }
              .report-info { text-align: right; }
              .report-title { font-size: 24px; font-weight: 600; color: #0f172a; letter-spacing: -0.3px; }
              .exported-by { font-size: 11px; color: #64748b; margin-top: 4px; }
              .report-subtitle { color: #64748b; font-size: 11px; margin-top: 2px; }
              .period-badge { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; margin-top: 8px; }
              .kpi-grid { padding: 20px 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .kpi-card { background: #f8fafc; border-radius: 14px; padding: 20px; border: 1px solid #edf2f7; text-align: center; }
              .kpi-icon { font-size: 32px; margin-bottom: 8px; }
              .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
              .kpi-value { font-size: 28px; font-weight: 700; color: #2563eb; margin-top: 8px; }
              .kpi-trend { font-size: 11px; margin-top: 4px; }
              .trend-up { color: #10b981; }
              .trend-down { color: #ef4444; }
              .section { padding: 15px 28px; }
              .section-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
              .section-title i { font-style: normal; font-size: 18px; }
              table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #edf2f7; }
              th { background: #f8fafc; padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
              td { padding: 10px; font-size: 12px; color: #334155; border-bottom: 1px solid #edf2f7; }
              tr:last-child td { border-bottom: none; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-mono { font-family: 'SF Mono', monospace; }
              .footer { padding: 16px 28px; text-align: center; border-top: 1px solid #eef2f6; background: #fafcff; }
              .footer p { font-size: 10px; color: #94a3b8; font-weight: 400; }
            </style>
          </head>
          <body>
            <div class="dashboard-container">
              <div class="header">
                <div class="left-section">
                  <img src="${logoBase64}" alt="InVera" class="logo" />
                  <div class="company-details">
                    <p><i>📍</i> 123 Rue de la République, 1000 Tunis</p>
                    <p><i>📞</i> +216 71 123 456</p>
                    <p><i>✉️</i> contact@invera.tn</p>
                    <p><i>🆔</i> MF: 0000000/A/M/000</p>
                  </div>
                </div>
                <div class="report-info">
                  <div class="report-title">RAPPORT VENTES</div>
                  <div class="exported-by">Exporté par : ${safeUserName}</div>
                  <div class="report-subtitle">le ${formattedDate}</div>
                  <div class="period-badge">📅 ${formattedPeriodStart} - ${formattedPeriodEnd}</div>
                </div>
              </div>`;
      
      // KPIs
      html += `<div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label">Chiffre d'Affaires</div>
          <div class="kpi-value">${formatCurrency(safeKpi.caJour)}</div>
          <div class="kpi-trend ${safeKpi.variationJour >= 0 ? 'trend-up' : 'trend-down'}">
            ${safeKpi.variationJour >= 0 ? '▲' : '▼'} ${Math.abs(safeKpi.variationJour)}%
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-label">Commandes</div>
          <div class="kpi-value">${safeKpi.commandesJour}</div>
          <div class="kpi-trend ${safeKpi.variationJour >= 0 ? 'trend-up' : 'trend-down'}">
            ${safeKpi.variationJour >= 0 ? '▲' : '▼'} ${Math.abs(safeKpi.variationJour)}%
          </div>
        </div>
      </div>`;
      
      // Top 5 Produits
      if (safeCharts.topProduits && safeCharts.topProduits.length > 0) {
        html += `<div class="section">
          <div class="section-title"><i>🏆</i> TOP 5 PRODUITS</div>
          <table><thead><tr><th>Rang</th><th>Produit</th><th class="text-right">Quantité</th><th class="text-right">Montant</th></tr></thead><tbody>`;
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
      
      // Répartition par statut
      if (safeStatusData.length > 0) {
        html += `<div class="section">
          <div class="section-title"><i>📊</i> RÉPARTITION PAR STATUT</div>
          <table><thead><tr><th>Statut</th><th class="text-right">Nombre</th><th class="text-right">Montant</th></tr></thead><tbody>`;
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
          <div class="section-title"><i>👥</i> RÉPARTITION PAR TYPE DE CLIENT</div>
          <table><thead><tr><th>Type</th><th class="text-right">Nombre</th><th class="text-right">Montant</th></tr></thead><tbody>`;
        safeClientTypeData.forEach(c => {
          html += `<tr>
            <td>${c.type || 'N/A'}</td>
            <td class="text-right">${c.nombre || 0}</td>
            <td class="text-right font-mono">${formatCurrency(c.montant || 0)}</td>
          </tr>`;
        });
        html += `</tbody></table></div>`;
      }
      
      // Évolution des commandes
      if (safeOrdersEvolutionData.length > 0) {
        html += `<div class="section">
          <div class="section-title"><i>📈</i> ÉVOLUTION DES COMMANDES</div>
          <table><thead><tr><th>Date</th><th class="text-right">Commandes</th><th class="text-right">CA</th></tr></thead><tbody>`;
        safeOrdersEvolutionData.slice(0, 15).forEach(o => {
          html += `<tr>
            <td>${o.date || 'N/A'}</td>
            <td class="text-right">${o.commandes || 0}</td>
            <td class="text-right font-mono">${formatCurrency(o.ca || 0)}</td>
          </tr>`;
        });
        html += `</tbody></table></div>`;
      }
      
      // Footer
      html += `<div class="footer">
        <p>InVera ERP - Rapport généré automatiquement</p>
        <p style="margin-top: 4px;">${formattedDate}</p>
      </div>
            </div>
          </body>
        </html>`;
      
      return html;
    };
    
    const element = document.createElement('div');
    element.innerHTML = generateHTML();
    document.body.appendChild(element);
    
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `dashboard_ventes_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    await html2pdf().set(opt).from(element).save();
    document.body.removeChild(element);
    
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    alert('Erreur lors de la génération du PDF: ' + error.message);
  } finally {
    setExporting(false);
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <span className="text-4xl mb-4 block">😕</span>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Période :</span>
            <DateRangeSelector 
              onApplyCustom={applyCustomRange}
              onRefresh={refresh}
              refreshing={refreshing}
              currentStartDate={startDate}
              currentEndDate={endDate}
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter
                </>
              )}
            </button>
            
            {showExportMenu && !exporting && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-t-lg"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-b-lg"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {filterActive && (startDate || endDate) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            Filtre actif : 
            {startDate && <span> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
            {startDate && endDate && <span> au </span>}
            {endDate && <span>{new Date(endDate).toLocaleDateString('fr-FR')}</span>}
          </div>
        )}
      </div>

      {/* Reste du dashboard identique... */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          Indicateurs clés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
          Analyse des ventes
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Évolution du Chiffre d'Affaires
              </h3>
            </div>
            <EvolutionChart 
              data={charts.evolutionCA} 
              formatCurrency={formatCurrency}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Top 5 Produits
              </h3>
            </div>
            <TopProducts 
              products={charts.topProduits} 
              formatCurrency={formatCurrency}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Répartition par statut
              </h3>
            </div>
            <StatusDonutChart 
              data={statusData} 
              formatCurrency={formatCurrency}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Évolution des commandes
              </h3>
            </div>
            {ordersEvolutionData.length > 0 ? (
              <OrdersEvolutionChart 
                data={ordersEvolutionData} 
                formatCurrency={formatCurrency}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm">Aucune donnée pour cette période</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Répartition par type de client
            </h3>
          </div>
          {clientTypeData.length > 0 ? (
            <ClientTypeChart 
              data={clientTypeData} 
              formatCurrency={formatCurrency}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <p className="text-sm">Aucune donnée pour cette période</p>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {filterActive && (startDate || endDate) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-right border-t pt-4"
        >
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Période sélectionnée : 
            {startDate && <span> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
            {startDate && endDate && <span> au </span>}
            {endDate && <span>{new Date(endDate).toLocaleDateString('fr-FR')}</span>}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardPage;