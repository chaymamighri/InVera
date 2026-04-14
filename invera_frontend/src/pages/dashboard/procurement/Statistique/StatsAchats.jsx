/**
 * StatsAchats - Page des statistiques achats
 * 
 * RÔLE : Afficher les indicateurs de performance du module achats
 * ROUTE : /dashboard/procurement/stats
 */
import React, { useState } from 'react';
import {
 ShoppingCartIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useStatsAchat } from '../../../../hooks/useStatsAchat';
import DateRangeSelectorAchats from './componentes/DateRangeSelectorAchats';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { logoBase64 } from '../../../../assets/logoBase64';
import { FileSpreadsheet, FileText } from 'lucide-react';

const StatsAchats = () => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    loading,
    error,
    stats,
    evolutionCommandes,
    mouvementsStock,
    repartitionCategories,
    alertesStock,
    commandesATraiter,
    refetch
  } = useStatsAchat(selectedStartDate, selectedEndDate);

  const navigate = useNavigate();

  // ✅ Vérifier si un filtre date est actif
  const hasDateFilter = selectedStartDate !== null && selectedEndDate !== null;

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleApplyDates = (start, end) => {
    const formattedStart = formatDateForAPI(start);
    const formattedEnd = formatDateForAPI(end);
    setSelectedStartDate(formattedStart);
    setSelectedEndDate(formattedEnd);
    refetch({ startDate: formattedStart, endDate: formattedEnd });
  };

  const handleRefresh = () => {
    if (selectedStartDate && selectedEndDate) {
      refetch({ startDate: selectedStartDate, endDate: selectedEndDate });
    } else {
      refetch({});
    }
  };

  const tauxRupture = stats.produits?.actifs > 0 
    ? ((stats.produits?.rupture || 0) / stats.produits?.actifs) * 100 
    : 0;

  // ============================================
  //  FONCTIONS D'EXPORT
  // ============================================

  // Récupérer les informations de l'utilisateur connecté
  const getUserInfo = () => {
    let userName = 'Utilisateur';

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      userName = userInfo?.nom || adminInfo?.nom || localStorage.getItem('userName') || 'Utilisateur';
    } catch (e) {
      console.warn("Erreur lecture userInfo:", e);
    }
    return { userName };
  };

  const { userName } = getUserInfo();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('fr-FR');
  const formattedPeriodStart = hasDateFilter && selectedStartDate ? formatDateForDisplay(selectedStartDate) : '30 derniers jours';
  const formattedPeriodEnd = hasDateFilter && selectedEndDate ? formatDateForDisplay(selectedEndDate) : formatDateForDisplay(currentDate);

  // Export Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Feuille KPIs
    const kpiData = [
      ['RAPPORT ACHATS - InVera', ''],
      ['Date d\'export', formattedDate],
      ['Période', `${formattedPeriodStart} - ${formattedPeriodEnd}`],
      ['Exporté par', `${userName} ${userEmail ? `(${userEmail})` : ''}`],
      ['', ''],
      ['INDICATEURS CLÉS', ''],
      ['Bons de commande', stats.commandes?.total || 0],
      ['En attente', stats.commandes?.enAttente || 0],
      ['Livrés', stats.commandes?.livre || 0],
      ['', ''],
      ['Produits actifs', stats.produits?.actifs || 0],
      ['En rupture', stats.produits?.rupture || 0],
      ['Stock critique', stats.produits?.alerte || 0],
      ['', ''],
      ['Valeur du stock (DH)', stats.stock?.valeurTotale || 0],
      ['Rotation stock', `${stats.stock?.rotation || 0} tours/an`],
      ['Taux de rupture', `${tauxRupture.toFixed(1)}%`]
    ];
    
    const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs');
    
    // Feuille Évolution commandes
    const evolutionData = [['ÉVOLUTION DES COMMANDES'], ['Période', 'Nombre de commandes']];
    evolutionCommandes.forEach(item => {
      evolutionData.push([item.label, item.valeur]);
    });
    const wsEvolution = XLSX.utils.aoa_to_sheet(evolutionData);
    XLSX.utils.book_append_sheet(wb, wsEvolution, 'Évolution commandes');
    
    // Feuille Mouvements stock
    const mouvementsData = [['MOUVEMENTS DE STOCK'], ['Période', 'Entrées', 'Sorties']];
    mouvementsStock.forEach(item => {
      mouvementsData.push([item.label, item.entrees, item.sorties]);
    });
    const wsMouvements = XLSX.utils.aoa_to_sheet(mouvementsData);
    XLSX.utils.book_append_sheet(wb, wsMouvements, 'Mouvements stock');
    
    // Feuille Répartition catégories
    const categoriesData = [['RÉPARTITION PAR CATÉGORIE'], ['Catégorie', 'Nombre de produits']];
    repartitionCategories.forEach(item => {
      categoriesData.push([item.categorie, item.nombreProduits]);
    });
    const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Catégories');
    
    // Feuille Alertes stock
    const alertesData = [['ALERTES STOCK'], ['Type', 'Nombre']];
    alertesData.push(['Rupture', alertesStock.filter(a => a.typeAlerte === 'RUPTURE').length]);
    alertesData.push(['Critique', alertesStock.filter(a => a.typeAlerte === 'CRITIQUE').length]);
    const wsAlertes = XLSX.utils.aoa_to_sheet(alertesData);
    XLSX.utils.book_append_sheet(wb, wsAlertes, 'Alertes');
    
    // Feuille Commandes à traiter
    const commandesData = [['COMMANDES À TRAITER'], ['En attente', commandesATraiter.enAttente || 0], ['En cours', commandesATraiter.enCours || 0]];
    const wsCommandes = XLSX.utils.aoa_to_sheet(commandesData);
    XLSX.utils.book_append_sheet(wb, wsCommandes, 'Commandes à traiter');
    
    XLSX.writeFile(wb, `rapport_achats_${currentDate.toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  // Export PDF
  const exportToPDF = async () => {
    setExporting(true);
    setShowExportMenu(false);
    
    try {
      const cleanText = (text) => {
        if (!text) return '';
        return String(text).replace(/[&<>]/g, '');
      };
      
      const safeUserName = cleanText(userName);
     
      
      const generateHTML = () => {
        let html = `<!DOCTYPE html>
          <html>
            <head>
              <title>Rapport Achats - InVera</title>
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
                .kpi-grid { padding: 20px 28px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .kpi-card { background: #f8fafc; border-radius: 14px; padding: 20px; border: 1px solid #edf2f7; text-align: center; }
                .kpi-icon { font-size: 32px; margin-bottom: 8px; }
                .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
                .kpi-value { font-size: 24px; font-weight: 700; color: #2563eb; margin-top: 8px; }
                .section { padding: 15px 28px; }
                .section-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
                table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #edf2f7; }
                th { background: #f8fafc; padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                td { padding: 10px; font-size: 12px; color: #334155; border-bottom: 1px solid #edf2f7; }
                .text-right { text-align: right; }
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
                    <div class="report-title">RAPPORT ACHATS</div>
                    <div class="exported-by">Exporté par : ${safeUserName}</div>
                    <div class="report-subtitle">le ${formattedDate}</div>
                    <div class="period-badge">📅 ${formattedPeriodStart} - ${formattedPeriodEnd}</div>
                  </div>
                </div>`;
        
        // KPIs
        html += `<div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-icon">📦</div><div class="kpi-label">Bons de commande</div><div class="kpi-value">${stats.commandes?.total || 0}</div></div>
          <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-label">En attente</div><div class="kpi-value">${stats.commandes?.enAttente || 0}</div></div>
          <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-label">Livrés</div><div class="kpi-value">${stats.commandes?.livre || 0}</div></div>
          <div class="kpi-card"><div class="kpi-icon">💰</div><div class="kpi-label">Valeur stock</div><div class="kpi-value">${(stats.stock?.valeurTotale || 0).toLocaleString()} DH</div></div>
        </div>`;
        
        // Évolution commandes
        if (evolutionCommandes.length > 0) {
          html += `<div class="section"><div class="section-title">📊 ÉVOLUTION DES COMMANDES</div>
            <table><thead><tr><th>Période</th><th class="text-right">Nombre</th></tr></thead><tbody>`;
          evolutionCommandes.forEach(item => {
            html += `<tr><td>${item.label}</td><td class="text-right">${item.valeur}</td></tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Mouvements stock
        if (mouvementsStock.length > 0) {
          html += `<div class="section"><div class="section-title">📦 MOUVEMENTS DE STOCK</div>
            <table><thead><tr><th>Période</th><th class="text-right">Entrées</th><th class="text-right">Sorties</th></tr></thead><tbody>`;
          mouvementsStock.forEach(item => {
            html += `<tr><td>${item.label}</td><td class="text-right">${item.entrees.toLocaleString()}</td><td class="text-right">${item.sorties.toLocaleString()}</td></tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
        // Répartition catégories
        if (repartitionCategories.length > 0) {
          html += `<div class="section"><div class="section-title">🏷️ RÉPARTITION PAR CATÉGORIE</div>
            <table><thead><tr><th>Catégorie</th><th class="text-right">Produits</th></tr></thead><tbody>`;
          repartitionCategories.forEach(item => {
            html += `<tr><td>${item.categorie}</td><td class="text-right">${item.nombreProduits}</td></tr>`;
          });
          html += `</tbody></table></div>`;
        }
        
       // Commandes à traiter - Version sans colonne priorité
html += `<div class="section">
  <div class="section-title">⏳ COMMANDES À TRAITER</div>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th style="padding: 12px; background: #f8fafc; text-align: left; font-weight: 600; color: #64748b;">Statut</th>
        <th style="padding: 12px; background: #f8fafc; text-align: right; font-weight: 600; color: #64748b;">Nombre</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 10px;">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; background: #f59e0b; border-radius: 50%; display: inline-block;"></span>
            En attente de validation
          </span>
        </td>
        <td style="padding: 10px; text-align: right; font-weight: 600;">${commandesATraiter.enAttente || 0}</td>
      </tr>
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 10px;">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; display: inline-block;"></span>
            En cours de livraison
          </span>
        </td>
        <td style="padding: 10px; text-align: right; font-weight: 600;">${commandesATraiter.enCours || 0}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr style="background: #f8fafc;">
        <td style="padding: 10px; font-weight: 600;">Total à traiter</td>
        <td style="padding: 10px; text-align: right; font-weight: 700;">${(commandesATraiter.enAttente || 0) + (commandesATraiter.enCours || 0)}</td>
      </tr>
    </tfoot>
  </table>
</div>`;
        
        return html;
      };
      
      const element = document.createElement('div');
      element.innerHTML = generateHTML();
      document.body.appendChild(element);
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `rapport_achats_${currentDate.toISOString().split('T')[0]}.pdf`,
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

  // ============================================
  //  COMPOSANTS INTERNES
  // ============================================

  // ✅ Composant StatCard avec effet gris si pas de filtre date
  const StatCard = ({ title, value, unit = '', icon: Icon, color, subtitle, trend }) => {
    const isEmpty = !hasDateFilter;
    
    return (
      <div className={`rounded-xl shadow-sm border p-5 transition-shadow ${isEmpty ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:shadow-md'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium mb-1 ${isEmpty ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            {isEmpty ? (
              <p className="text-2xl font-bold mt-2 text-gray-400">—</p>
            ) : (
              <p className="text-2xl font-bold text-gray-800">
                {typeof value === 'number' 
                  ? `${value.toLocaleString()}${unit ? ' ' + unit : ''}`
                  : value}
              </p>
            )}
            {subtitle && !isEmpty && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {isEmpty && <p className="text-xs text-gray-400 mt-2">Sélectionnez une période</p>}
            {trend !== undefined && trend !== 0 && !isEmpty && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend)}% vs mois dernier
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${isEmpty ? 'bg-gray-300' : color}`}>
            <Icon className={`w-6 h-6 ${isEmpty ? 'text-gray-400' : 'text-white'}`} />
          </div>
        </div>
      </div>
    );
  };

  // ✅ Composant graphique linéaire avec effet gris
  const SimpleLineChart = ({ data, labels, title }) => {
    const isEmpty = !hasDateFilter || !data || data.length === 0 || data.every(v => v === 0);
    
    if (isEmpty) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Aucune donnée disponible</p>
            <p className="text-gray-400 text-xs mt-1">Sélectionnez une période</p>
          </div>
        </div>
      );
    }
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const height = 250;
    const width = 600;
    
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - minValue) / (maxValue - minValue || 1)) * height,
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="relative w-full overflow-x-auto">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              className="transition-all duration-500"
            />
            {points.map((point, idx) => (
              <circle key={idx} cx={point.x} cy={point.y} r="5" fill="#3B82F6" stroke="white" strokeWidth="2" />
            ))}
          </svg>
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            {labels.map((label, idx) => (
              <span key={idx} className="text-center" style={{ width: `${100 / labels.length}%` }}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Graphique à barres groupées
  const MouvementsStockChart = ({ data, title }) => {
    const isEmpty = !hasDateFilter || !data || data.length === 0 || data.every(item => item.entrees === 0 && item.sorties === 0);
    
    if (isEmpty) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Aucune donnée disponible</p>
            <p className="text-gray-400 text-xs mt-1">Sélectionnez une période</p>
          </div>
        </div>
      );
    }
    
    const getOptimalMaxValue = (rawMax) => {
      if (rawMax === 0) return 10;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
      const normalized = rawMax / magnitude;
      let rounded;
      if (normalized <= 1) rounded = 1;
      else if (normalized <= 2) rounded = 2;
      else if (normalized <= 2.5) rounded = 2.5;
      else if (normalized <= 5) rounded = 5;
      else rounded = 10;
      let optimalMax = rounded * magnitude;
      if (optimalMax < 10) {
        if (optimalMax <= 2) return 5;
        if (optimalMax <= 5) return 10;
        return 10;
      }
      return optimalMax;
    };
    
    const rawMaxValue = Math.max(...data.flatMap(item => [item.entrees, item.sorties]), 1);
    let maxValue = getOptimalMaxValue(rawMaxValue);
    const barWidth = 30;
    const groupWidth = barWidth * 2 + 10;
    const chartHeight = 250;
    const chartWidth = Math.max(data.length * groupWidth + 100, 550);
    
    const formatLargeNumber = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
      return num.toLocaleString();
    };
    
    const generateYAxisValues = (max) => {
      if (max <= 10) return [0, max];
      if (max <= 20) return [0, 10, 20];
      if (max <= 50) return [0, 10, 20, 30, 40, 50];
      if (max <= 100) return [0, 25, 50, 75, 100];
      if (max <= 200) return [0, 50, 100, 150, 200];
      if (max <= 500) return [0, 100, 200, 300, 400, 500];
      if (max <= 1000) return [0, 250, 500, 750, 1000];
      if (max <= 5000) return [0, 1000, 2000, 3000, 4000, 5000];
      if (max <= 10000) return [0, 2500, 5000, 7500, 10000];
      if (max <= 50000) return [0, 10000, 20000, 30000, 40000, 50000];
      if (max <= 100000) return [0, 25000, 50000, 75000, 100000];
      const step = Math.pow(10, Math.floor(Math.log10(max / 4)));
      const values = [0];
      for (let i = step; i <= max; i += step) {
        values.push(i);
      }
      return values;
    };
    
    let yAxisValues = generateYAxisValues(maxValue);
    if (yAxisValues[yAxisValues.length - 1] !== maxValue) {
      yAxisValues.push(maxValue);
    }
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="relative w-full overflow-x-auto">
          <svg width={chartWidth} height={chartHeight + 80} viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`}>
            {yAxisValues.map((valeur, i) => {
              const ratio = valeur / maxValue;
              const y = chartHeight - 10 - (ratio * (chartHeight - 40));
              return (
                <g key={i}>
                  <line x1="50" y1={y} x2={chartWidth - 20} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                  <text x="45" y={y + 3} textAnchor="end" className="text-xs font-mono fill-gray-600">{formatLargeNumber(valeur)}</text>
                </g>
              );
            })}
            {data.map((item, idx) => {
              const x = idx * groupWidth + 70;
              const entreesHeight = (item.entrees / maxValue) * (chartHeight - 50);
              const sortiesHeight = (item.sorties / maxValue) * (chartHeight - 50);
              const showEntreesValue = item.entrees > 0 && (entreesHeight < 25 || rawMaxValue < 100);
              const showSortiesValue = item.sorties > 0 && (sortiesHeight < 25 || rawMaxValue < 100);
              return (
                <g key={idx}>
                  <title>{`${item.label}: Entrées: ${item.entrees.toLocaleString()}, Sorties: ${item.sorties.toLocaleString()}`}</title>
                  <rect x={x} y={chartHeight - 10 - entreesHeight} width={barWidth} height={Math.max(entreesHeight, 3)} fill="#3B82F6" rx="4" className="transition-all duration-500 hover:opacity-80 cursor-pointer" />
                  {showEntreesValue && <text x={x + barWidth/2} y={chartHeight - 10 - entreesHeight - 5} textAnchor="middle" className="text-xs fill-blue-600 font-bold">{formatLargeNumber(item.entrees)}</text>}
                  {!showEntreesValue && entreesHeight > 30 && <text x={x + barWidth/2} y={chartHeight - 10 - 8} textAnchor="middle" className="text-xs fill-white font-bold">{formatLargeNumber(item.entrees)}</text>}
                  <rect x={x + barWidth + 10} y={chartHeight - 10 - sortiesHeight} width={barWidth} height={Math.max(sortiesHeight, 3)} fill="#EF4444" rx="4" className="transition-all duration-500 hover:opacity-80 cursor-pointer" />
                  {showSortiesValue && <text x={x + barWidth + 10 + barWidth/2} y={chartHeight - 10 - sortiesHeight - 5} textAnchor="middle" className="text-xs fill-red-600 font-bold">{formatLargeNumber(item.sorties)}</text>}
                  {!showSortiesValue && sortiesHeight > 30 && <text x={x + barWidth + 10 + barWidth/2} y={chartHeight - 10 - 8} textAnchor="middle" className="text-xs fill-white font-bold">{formatLargeNumber(item.sorties)}</text>}
                  <text x={x + barWidth + 5} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-500">{item.label}</text>
                </g>
              );
            })}
            <line x1="50" y1="0" x2="50" y2={chartHeight - 5} stroke="#9CA3AF" strokeWidth="1.5" />
            <polygon points="50,0 45,10 55,10" fill="#9CA3AF" />
            <line x1="45" y1={chartHeight - 5} x2={chartWidth - 15} y2={chartHeight - 5} stroke="#9CA3AF" strokeWidth="1.5" />
            <polygon points={`${chartWidth - 15},${chartHeight - 10} ${chartWidth - 20},${chartHeight - 5} ${chartWidth - 5},${chartHeight - 5}`} fill="#9CA3AF" />
          </svg>
          <div className="flex flex-wrap justify-center gap-6 mt-4 pt-2">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span className="text-sm text-gray-600">Entrées (réceptions)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div><span className="text-sm text-gray-600">Sorties (consommations)</span></div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Composant graphique donut avec effet gris
  const SimpleDonutChart = ({ data, labels, colors, title }) => {
    const isEmpty = !hasDateFilter || !data || data.length === 0 || data.reduce((a, b) => a + b, 0) === 0;
    
    if (isEmpty) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Aucune donnée disponible</p>
            <p className="text-gray-400 text-xs mt-1">Sélectionnez une période</p>
          </div>
        </div>
      );
    }
    
    const total = data.reduce((a, b) => a + b, 0);
    let currentAngle = 0;
    const size = 150;
    const center = size / 2;
    const radius = 60;

    const getPath = (startAngle, endAngle) => {
      const start = {
        x: center + radius * Math.cos(startAngle),
        y: center + radius * Math.sin(startAngle),
      };
      const end = {
        x: center + radius * Math.cos(endAngle),
        y: center + radius * Math.sin(endAngle),
      };
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex flex-col items-center">
          <svg width={size} height={size} className="mb-4">
            {data.map((value, index) => {
              const angle = (value / total) * 2 * Math.PI;
              const start = currentAngle;
              const end = start + angle;
              const path = getPath(start, end);
              currentAngle = end;
              return <path key={index} d={path} fill={colors[index]} stroke="white" strokeWidth="2" />;
            })}
          </svg>
          <div className="grid grid-cols-2 gap-2 w-full">
            {labels.map((label, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-800 font-medium ml-auto">{data[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Composant d'affichage de la période sélectionnée
  const PeriodeInfo = () => {
    if (!hasDateFilter) return null;
    return (
      <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5 text-sm text-blue-700">
        <span className="font-medium">Période sélectionnée :</span>
        <span>{formatDateForDisplay(selectedStartDate)} → {formatDateForDisplay(selectedEndDate)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const evolutionLabels = evolutionCommandes.map(item => item.label);
  const evolutionValues = evolutionCommandes.map(item => item.valeur);
  
  const categoriesLabels = repartitionCategories.map(item => item.categorie);
  const categoriesValues = repartitionCategories.map(item => item.nombreProduits);
  const categoriesColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6'];

  const alertesRupture = alertesStock.filter(a => a.typeAlerte === 'RUPTURE').length;
  const alertesCritique = alertesStock.filter(a => a.typeAlerte === 'CRITIQUE').length;

  const getTauxRuptureColor = () => {
    if (!hasDateFilter) return "bg-gradient-to-r from-gray-400 to-gray-500";
    if (tauxRupture === 0) return "bg-gradient-to-r from-emerald-500 to-emerald-600";
    if (tauxRupture < 5) return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Aperçu général</h2>
          <p className="text-sm text-gray-500 mt-1">
            Synthèse des activités d'achat et de gestion de stock
          </p>
          <PeriodeInfo />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <DateRangeSelectorAchats
              onApply={handleApplyDates}
              onRefresh={handleRefresh}
              refreshing={loading}
              currentStartDate={selectedStartDate}
              currentEndDate={selectedEndDate}
            />
          </div>
          
          {/* ✅ BOUTON D'EXPORT */}
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
                  <ArrowDownTrayIcon  className="w-4 h-4" />
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
      </div>

      {/* 4 Cartes KPI essentielles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Bons de commande"
          value={stats.commandes?.total || 0}
          icon={ShoppingCartIcon}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle={`${stats.commandes?.enAttente || 0} en attente · ${stats.commandes?.livre || 0} livrés`}
          trend={stats.commandes?.tendance}
        />
        <StatCard
          title="Produits actifs"
          value={stats.produits?.actifs || 0}
          icon={CubeIcon}
          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle={`${stats.produits?.rupture || 0} en rupture · ${stats.produits?.alerte || 0} stock bas`}
          trend={stats.produits?.tendance}
        />
        <StatCard
          title="Valeur du stock"
          value={stats.stock?.valeurTotale || 0}
          unit="DH"
          icon={ArchiveBoxIcon}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle={`Rotation: ${stats.stock?.rotation || 0} tours/an`}
          trend={stats.stock?.tendance}
        />
        <StatCard
          title="Taux de rupture"
          value={tauxRupture.toFixed(1)}
          unit="%"
          icon={ExclamationTriangleIcon}
          color={getTauxRuptureColor()}
          subtitle={`${stats.produits?.rupture || 0} / ${stats.produits?.actifs || 0} produits`}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart
          data={evolutionValues}
          labels={evolutionLabels}
          title="Évolution des commandes"
        />
        <MouvementsStockChart
          data={mouvementsStock}
          title="Mouvements de stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleDonutChart
          data={categoriesValues}
          labels={categoriesLabels}
          colors={categoriesColors}
          title="Produits par catégorie"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Alertes stock</h3>
          <div className="space-y-3">
            {!hasDateFilter ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Filtre période requis</p>
                  <p className="text-xs text-gray-400">Sélectionnez une période pour voir les alertes</p>
                </div>
              </div>
            ) : (
              <>
                {alertesRupture > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Produits en rupture</p>
                      <p className="text-xs text-gray-500">{alertesRupture} produit(s) concerné(s)</p>
                    </div>
                  </div>
                )}
                
                {alertesCritique > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Stock critique</p>
                      <p className="text-xs text-gray-500">{alertesCritique} produit(s) concerné(s)</p>
                    </div>
                  </div>
                )}
                
                {alertesRupture === 0 && alertesCritique === 0 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Stock sain</p>
                      <p className="text-xs text-gray-500">Aucune alerte à signaler</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {(alertesRupture > 0 || alertesCritique > 0) && hasDateFilter && (
            <div className="mt-4 pt-4 border-t">
              <button 
                onClick={() => navigate('/dashboard/procurement/etat_stock?filter=alertes')}
                className="w-full px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                Voir détails
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Commandes à traiter</h3>
          {!hasDateFilter ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Filtre période requis</p>
                <p className="text-xs text-gray-400">Sélectionnez une période pour voir les commandes</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">En attente de validation</p>
                    <p className="text-xs text-gray-500">À approuver</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-yellow-600">{commandesATraiter.enAttente || 0}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <TruckIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">En cours de livraison</p>
                    <p className="text-xs text-gray-500">Commandes expédiées</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-600">{commandesATraiter.enCours || 0}</p>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <button 
              onClick={() => navigate('/dashboard/procurement/commandes')}
              className="w-full px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Voir toutes les commandes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsAchats;