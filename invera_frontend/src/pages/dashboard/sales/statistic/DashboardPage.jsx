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
import { useLanguage } from '../../../../context/LanguageContext';

const DashboardPage = () => {
  const dashboardRef = useRef(null);
  const { t, language } = useLanguage();
  const dateLocale = language === 'en' ? 'en-US' : language === 'ar' ? 'ar-TN' : 'fr-FR';

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
  const [currentUserName, setCurrentUserName] = useState('');

  // ✅ Récupération simplifiée du nom d'utilisateur depuis le localStorage
  useEffect(() => {
    const getUserName = () => {
      try {
        // Essayer différentes sources dans le localStorage
        let name = localStorage.getItem('userName');
        
        if (!name) {
          const prenom = localStorage.getItem('userPrenom');
          const nom = localStorage.getItem('userNom');
          if (prenom && nom) {
            name = `${prenom} ${nom}`;
          } else if (nom) {
            name = nom;
          }
        }
        
        if (!name) {
          const userFullName = localStorage.getItem('userFullName');
          if (userFullName) {
            name = userFullName;
          }
        }
        
        if (!name) {
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) {
            try {
              const info = JSON.parse(userInfo);
              if (info.prenom && info.nom) {
                name = `${info.prenom} ${info.nom}`;
              } else if (info.nom) {
                name = info.nom;
              }
            } catch (e) {}
          }
        }
        
        if (!name) {
          const email = localStorage.getItem('userEmail');
          if (email) {
            name = email.split('@')[0];
          }
        }
        
        setCurrentUserName(name || t('dashboard.salesStatsPage.user'));
        console.log('👤 Nom utilisateur chargé:', name);
        
      } catch (e) {
        console.error('Erreur récupération nom utilisateur:', e);
        setCurrentUserName(t('dashboard.salesStatsPage.user'));
      }
    };
    
    getUserName();
  }, [t]);


   useEffect(() => {
    console.log('=== DEBUG LOCALSTORAGE ===');
    console.log('userName:', localStorage.getItem('userName'));
    console.log('userFullName:', localStorage.getItem('userFullName'));
    console.log('userNom:', localStorage.getItem('userNom'));
    console.log('userPrenom:', localStorage.getItem('userPrenom'));
    console.log('userEmail:', localStorage.getItem('userEmail'));
    console.log('userRole:', localStorage.getItem('userRole'));
    console.log('clientId:', localStorage.getItem('clientId'));
    console.log('typeCompte:', localStorage.getItem('typeCompte'));
    
    // Vérifier si userInfo existe
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      console.log('userInfo:', JSON.parse(userInfo));
    }
    
    // Vérifier adminInfo
    const adminInfo = localStorage.getItem('adminInfo');
    if (adminInfo) {
      console.log('adminInfo:', JSON.parse(adminInfo));
    }
    
    console.log('=== FIN DEBUG ===');
  }, []);

  
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

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(dateLocale);
    } catch {
      return '';
    }
  };

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

  const getExportData = () => {
    return {
      periode: {
        debut: filterActive && startDate ? formatDateForDisplay(startDate) : t('dashboard.salesStatsPage.last30Days'),
        fin: filterActive && endDate ? formatDateForDisplay(endDate) : formatDateForDisplay(new Date())
      },
      kpi: {
        chiffreAffaires: kpi.caJour,
        nombreCommandes: kpi.commandesJour,
        variation: kpi.variationJour
      },
      topProduits: (charts.topProduits || []).map((p, i) => ({
        rang: i + 1,
        produit: p.nom || p.libelle,
        quantite: p.quantite || p.quantiteVendue || 0,
        montant: p.total || p.montant || 0
      })),
      evolutionCA: (charts.evolutionCA || []).map(item => ({
        date: item.date,
        montant: item.montant || item.value || 0
      })),
      statusRepartition: (statusData || []).map(s => ({
        statut: s.statut,
        nombre: s.nombre,
        montant: s.montant
      })),
      ordersEvolution: (ordersEvolutionData || []).map(o => ({
        date: o.date,
        commandes: o.commandes,
        ca: o.ca
      })),
      clientTypeRepartition: (clientTypeData || []).map(c => ({
        type: c.type,
        nombre: c.nombre,
        montant: c.montant
      }))
    };
  };

  const exportToExcel = () => {
    const exportData = getExportData();
    
    const wb = XLSX.utils.book_new();
    
    const kpiData = [
      [t('dashboard.salesStatsPage.exportReportTitle'), ''],
      [t('dashboard.salesStatsPage.exportDate'), new Date().toLocaleString(dateLocale)],
      [t('dashboard.salesStatsPage.period'), `${exportData.periode.debut} - ${exportData.periode.fin}`],
      ['', ''],
      [t('dashboard.salesStatsPage.keyIndicators').toUpperCase(), ''],
      [t('dashboard.salesStatsPage.revenue'), formatCurrency(exportData.kpi.chiffreAffaires)],
      [t('dashboard.salesStatsPage.orderCount'), exportData.kpi.nombreCommandes],
      [t('dashboard.salesStatsPage.variation'), `${exportData.kpi.variation > 0 ? '+' : ''}${exportData.kpi.variation}%`],
      ['', ''],
      [t('dashboard.salesStatsPage.topProducts').toUpperCase(), '', '', ''],
      [t('dashboard.salesStatsPage.rank'), t('dashboard.salesStatsPage.product'), t('dashboard.salesStatsPage.quantity'), t('dashboard.salesStatsPage.amount')]
    ];
    
    exportData.topProduits.forEach(p => {
      kpiData.push([p.rang, p.produit, p.quantite, formatCurrency(p.montant)]);
    });
    
    const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs & Top Produits');
    
    const evolutionData = [
      [t('dashboard.salesStatsPage.revenueEvolution').toUpperCase()],
      [t('dashboard.salesStatsPage.date'), t('dashboard.salesStatsPage.amount')]
    ];
    exportData.evolutionCA.forEach(item => {
      evolutionData.push([item.date, formatCurrency(item.montant)]);
    });
    const wsEvolution = XLSX.utils.aoa_to_sheet(evolutionData);
    XLSX.utils.book_append_sheet(wb, wsEvolution, 'Évolution CA');
    
    const statusDataSheet = [
      [t('dashboard.salesStatsPage.statusBreakdown').toUpperCase()],
      [t('dashboard.salesStatsPage.status'), t('dashboard.salesStatsPage.count'), t('dashboard.salesStatsPage.amount')]
    ];
    exportData.statusRepartition.forEach(s => {
      statusDataSheet.push([s.statut, s.nombre, formatCurrency(s.montant)]);
    });
    const wsStatus = XLSX.utils.aoa_to_sheet(statusDataSheet);
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Statuts');
    
    const ordersData = [
      [t('dashboard.salesStatsPage.ordersEvolution').toUpperCase()],
      [t('dashboard.salesStatsPage.date'), t('dashboard.salesStatsPage.count'), t('dashboard.salesStatsPage.revenueShort')]
    ];
    exportData.ordersEvolution.forEach(o => {
      ordersData.push([o.date, o.commandes, formatCurrency(o.ca)]);
    });
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Évolution commandes');
    
    const clientData = [
      [t('dashboard.salesStatsPage.clientTypeBreakdown').toUpperCase()],
      [t('dashboard.salesStatsPage.type'), t('dashboard.salesStatsPage.count'), t('dashboard.salesStatsPage.amount')]
    ];
    exportData.clientTypeRepartition.forEach(c => {
      clientData.push([c.type, c.nombre, formatCurrency(c.montant)]);
    });
    const wsClient = XLSX.utils.aoa_to_sheet(clientData);
    XLSX.utils.book_append_sheet(wb, wsClient, 'Types clients');
    
    XLSX.writeFile(wb, `dashboard_ventes_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const exportToPDF = async () => {
    setExporting(true);
    setShowExportMenu(false);
    
    try {
      // ✅ Utiliser le nom d'utilisateur récupéré
      let userName = currentUserName || t('dashboard.salesStatsPage.user');
      
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
          return new Date(date).toLocaleDateString(dateLocale);
        } catch {
          return '';
        }
      };
      
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString(dateLocale);
      const formattedPeriodStart = filterActive && startDate ? formatDate(startDate) : t('dashboard.salesStatsPage.last30Days');
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
              <title>${t('dashboard.salesStatsPage.pdfTitle')}</title>
              <meta charset="UTF-8">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f7fa; padding: 20px; line-height: 1.5; color: #1e293b; }
                .dashboard-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 30px -10px rgba(0, 20, 40, 0.15); overflow: hidden; }
                .header { padding: 24px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-bottom: 1px solid #eef2f6; }
                .report-title { font-size: 28px; font-weight: 700; color: white; text-align: center; margin-bottom: 8px; letter-spacing: -0.5px; }
                .exported-by { font-size: 12px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 4px; }
                .period-badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: rgba(255,255,255,0.2); color: white; margin-top: 12px; text-align: center; width: fit-content; margin-left: auto; margin-right: auto; }
                .kpi-grid { padding: 20px 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .kpi-card { background: #f8fafc; border-radius: 14px; padding: 20px; border: 1px solid #edf2f7; text-align: center; }
                .kpi-icon { font-size: 32px; margin-bottom: 8px; }
                .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
                .kpi-value { font-size: 28px; font-weight: 700; color: #2563eb; margin-top: 8px; }
                .kpi-trend { font-size: 11px; margin-top: 4px; }
                .trend-up { color: #10b981; }
                .trend-down { color: #ef4444; }
                .section { padding: 15px 28px; }
                .section-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; border-left: 3px solid #667eea; padding-left: 12px; }
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
                  <div class="report-title">${t('dashboard.salesStatsPage.salesReport').toUpperCase()}</div>
                  <div class="exported-by">${t('dashboard.salesStatsPage.exportedBy')} : ${safeUserName}</div>
                  <div class="exported-by">${t('dashboard.salesStatsPage.onDate')} ${formattedDate}</div>
                  <div class="period-badge">📅 ${formattedPeriodStart} - ${formattedPeriodEnd}</div>
                </div>`;
        
        // KPIs
        html += `<div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">💰</div>
            <div class="kpi-label">${t('dashboard.salesStatsPage.revenue')}</div>
            <div class="kpi-value">${formatCurrency(safeKpi.caJour)}</div>
            <div class="kpi-trend ${safeKpi.variationJour >= 0 ? 'trend-up' : 'trend-down'}">
              ${safeKpi.variationJour >= 0 ? '▲' : '▼'} ${Math.abs(safeKpi.variationJour)}%
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">📦</div>
            <div class="kpi-label">${t('dashboard.salesStatsPage.orders')}</div>
            <div class="kpi-value">${safeKpi.commandesJour}</div>
            <div class="kpi-trend ${safeKpi.variationJour >= 0 ? 'trend-up' : 'trend-down'}">
              ${safeKpi.variationJour >= 0 ? '▲' : '▼'} ${Math.abs(safeKpi.variationJour)}%
            </div>
          </div>
        </div>`;
        
        // Top products
        if (safeCharts.topProduits && safeCharts.topProduits.length > 0) {
          html += `<div class="section">
            <div class="section-title">🏆 ${t('dashboard.salesStatsPage.topProducts').toUpperCase()}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.rank')}</th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.product')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.quantity')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.amount')}</th>
                </tr>
              </thead>
              <tbody>`;
          safeCharts.topProduits.forEach((p, i) => {
            html += `<tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px; font-size: 12px; color: #334155;">${i + 1}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155;">${p.nom || p.libelle || t('dashboard.salesStatsPage.product')}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right;">${p.quantite || p.quantiteVendue || 0}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right; font-family: 'SF Mono', monospace;">${formatCurrency(p.total || p.montant || 0)}</td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Status breakdown
        if (safeStatusData.length > 0) {
          html += `<div class="section">
            <div class="section-title">📊 ${t('dashboard.salesStatsPage.statusBreakdown').toUpperCase()}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.status')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.count')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.amount')}</th>
                </tr>
              </thead>
              <tbody>`;
          safeStatusData.forEach(s => {
            html += `<tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px; font-size: 12px; color: #334155;">${s.statut || 'N/A'}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right;">${s.nombre || 0}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right; font-family: 'SF Mono', monospace;">${formatCurrency(s.montant || 0)}</td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Types de clients
        if (safeClientTypeData.length > 0) {
          html += `<div class="section">
            <div class="section-title">👥 ${t('dashboard.salesStatsPage.clientTypeBreakdown').toUpperCase()}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.type')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.count')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.amount')}</th>
                </tr>
              </thead>
              <tbody>`;
          safeClientTypeData.forEach(c => {
            html += `<tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px; font-size: 12px; color: #334155;">${c.type || 'N/A'}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right;">${c.nombre || 0}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right; font-family: 'SF Mono', monospace;">${formatCurrency(c.montant || 0)}</td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Orders evolution
        if (safeOrdersEvolutionData.length > 0) {
          html += `<div class="section">
            <div class="section-title">📈 ${t('dashboard.salesStatsPage.ordersEvolution').toUpperCase()}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.date')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.orders')}</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">${t('dashboard.salesStatsPage.revenueShort')}</th>
                </tr>
              </thead>
              <tbody>`;
          safeOrdersEvolutionData.slice(0, 15).forEach(o => {
            html += `<tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px; font-size: 12px; color: #334155;">${o.date || 'N/A'}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right;">${o.commandes || 0}</td>
              <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right; font-family: 'SF Mono', monospace;">${formatCurrency(o.ca || 0)}</td>
            </td>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Footer
        html += `<div class="footer">
          <p>${t('dashboard.salesStatsPage.generatedReportFooter')}</p>
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
        filename: `rapport_ventes_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert(t('dashboard.salesStatsPage.pdfError') + ': ' + error.message);
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
          {t('dashboard.salesStatsPage.loadingError')}
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {t('dashboard.salesStatsPage.retry')}
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
            <span className="text-sm font-medium text-gray-700">{t('dashboard.salesStatsPage.period')} :</span>
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
                  {t('dashboard.salesStatsPage.exportInProgress')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('dashboard.salesStatsPage.export')}
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
            {t('dashboard.salesStatsPage.activeFilter')} : 
            {startDate && <span> {t('dashboard.salesStatsPage.from')} {formatDateForDisplay(startDate)}</span>}
            {startDate && endDate && <span> {t('dashboard.salesStatsPage.to')} </span>}
            {endDate && <span>{formatDateForDisplay(endDate)}</span>}
          </div>
        )}
      </div>

      {/* Dashboard content */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          {t('dashboard.salesStatsPage.keyIndicators')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <KPICard
            title={t('dashboard.salesStatsPage.revenue')}
            value={kpi.caJour}
            icon="💰"
            color="blue"
            trend={kpi.variationJour}
            formatValue={formatCurrency}
          />
          <KPICard
            title={t('dashboard.salesStatsPage.orders')}
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
          {t('dashboard.salesStatsPage.salesAnalysis')}
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
                {t('dashboard.salesStatsPage.revenueEvolution')}
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
                {t('dashboard.salesStatsPage.topProducts')}
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
                {t('dashboard.salesStatsPage.statusBreakdown')}
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
                {t('dashboard.salesStatsPage.ordersEvolution')}
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
                  <p className="text-sm">{t('dashboard.salesStatsPage.noDataForPeriod')}</p>
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
              {t('dashboard.salesStatsPage.clientTypeBreakdown')}
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
                <p className="text-sm">{t('dashboard.salesStatsPage.noDataForPeriod')}</p>
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
            {t('dashboard.salesStatsPage.selectedPeriod')} : 
            {startDate && <span> {t('dashboard.salesStatsPage.from')} {formatDateForDisplay(startDate)}</span>}
            {startDate && endDate && <span> {t('dashboard.salesStatsPage.to')} </span>}
            {endDate && <span>{formatDateForDisplay(endDate)}</span>}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardPage;