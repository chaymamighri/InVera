/**
 * StatsAchats - Page des statistiques achats
 * 
 * RÔLE : Afficher les indicateurs de performance du module achats
 * ROUTE : /dashboard/procurement/stats
 */
import React, { useState, useEffect } from 'react';
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
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { useStatsAchat } from '../../../../hooks/useStatsAchat';
import { useLanguage } from '../../../../context/LanguageContext';
import { logoBase64 } from '../../../../assets/logoBase64';
import DateRangeSelectorAchats from './componentes/DateRangeSelectorAchats';

const localeByLanguage = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
};

const StatsAchats = () => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const { t, language, isArabic } = useLanguage();
  const navigate = useNavigate();

  const locale = localeByLanguage[language] || localeByLanguage.fr;
  const tr = (key, params) => t(`dashboard.procurementStatsPage.${key}`, params);

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

  const hasDateFilter = Boolean(selectedStartDate && selectedEndDate);

  // ✅ Récupération du nom d'utilisateur depuis le localStorage (similaire à DashboardPage)
  useEffect(() => {
    const getUserName = () => {
      try {
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
              } else if (info.name) {
                name = info.name;
              }
            } catch (e) {}
          }
        }
        
        if (!name) {
          const adminInfo = localStorage.getItem('adminInfo');
          if (adminInfo) {
            try {
              const info = JSON.parse(adminInfo);
              if (info.prenom && info.nom) {
                name = `${info.prenom} ${info.nom}`;
              } else if (info.nom) {
                name = info.nom;
              } else if (info.name) {
                name = info.name;
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
        
        setCurrentUserName(name || tr('userFallback'));
        console.log('👤 Nom utilisateur chargé (StatsAchats):', name);
        
      } catch (e) {
        console.error('Erreur récupération nom utilisateur:', e);
        setCurrentUserName(tr('userFallback'));
      }
    };
    
    getUserName();
  }, [tr]);

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    console.log('=== DEBUG COMMANDES A TRAITER ===');
    console.log('hasDateFilter:', hasDateFilter);
    console.log('commandesATraiter reçu:', commandesATraiter);
    console.log('aEnvoyer:', commandesATraiter?.aEnvoyer);
    console.log('aRecevoir:', commandesATraiter?.aRecevoir);
  }, [commandesATraiter, hasDateFilter]);

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString(locale);

  const handleApplyDates = (start, end) => {
    const formattedStart = formatDateForAPI(start);
    const formattedEnd = formatDateForAPI(end);
    setSelectedStartDate(formattedStart || null);
    setSelectedEndDate(formattedEnd || null);
    refetch(formattedStart && formattedEnd ? { startDate: formattedStart, endDate: formattedEnd } : {});
  };

  const handleRefresh = () => {
    refetch(hasDateFilter ? { startDate: selectedStartDate, endDate: selectedEndDate } : {});
  };

  const tauxRupture = stats.produits?.actifs > 0 
    ? ((stats.produits?.rupture || 0) / stats.produits?.actifs) * 100 
    : 0;

  const hasCommandsToSend = (commandesATraiter?.aEnvoyer || 0) > 0;
  const hasCommandsToReceive = (commandesATraiter?.aRecevoir || 0) > 0;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString(locale);
  const formattedPeriodStart = hasDateFilter && selectedStartDate ? formatDateForDisplay(selectedStartDate) : tr('last30Days');
  const formattedPeriodEnd = hasDateFilter && selectedEndDate ? formatDateForDisplay(selectedEndDate) : formatDateForDisplay(currentDate);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const kpiData = [
      [tr('reportTitle'), ''],
      [tr('exportDate'), formattedDate],
      [tr('period'), `${formattedPeriodStart} - ${formattedPeriodEnd}`],
      [tr('exportedBy'), currentUserName],
      ['', ''],
      [tr('keyIndicators'), ''],
      [tr('purchaseOrders'), stats.commandes?.total || 0],
      [tr('pending'), stats.commandes?.enAttente || 0],
      [tr('delivered'), stats.commandes?.livre || 0],
      ['', ''],
      [tr('activeProducts'), stats.produits?.actifs || 0],
      [tr('outOfStock'), stats.produits?.rupture || 0],
      [tr('criticalStock'), stats.produits?.alerte || 0],
      ['', ''],
      [tr('stockValueWithCurrency'), stats.stock?.valeurTotale || 0],
      [tr('stockRotation'), tr('turnsPerYear', { count: stats.stock?.rotation || 0 })],
      [tr('stockoutRate'), `${tauxRupture.toFixed(1)}%`],
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), tr('kpisSheet'));

    const evolutionData = [[tr('ordersEvolutionUpper')], [tr('period'), tr('orderCount')]];
    evolutionCommandes.forEach((item) => evolutionData.push([item.label, item.valeur]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(evolutionData), tr('ordersEvolutionSheet'));

    const mouvementsData = [[tr('stockMovementsUpper')], [tr('period'), tr('entries'), tr('exits')]];
    mouvementsStock.forEach((item) => mouvementsData.push([item.label, item.entrees, item.sorties]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mouvementsData), tr('stockMovementsSheet'));

    const categoriesData = [[tr('categoryBreakdownUpper')], [tr('category'), tr('productCount')]];
    repartitionCategories.forEach((item) => categoriesData.push([item.categorie, item.nombreProduits]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(categoriesData), tr('categoriesSheet'));

    const alertesData = [[tr('stockAlertsUpper')], [tr('type'), tr('count')]];
    alertesData.push([tr('rupture'), alertesStock.filter((a) => a.typeAlerte === 'RUPTURE').length]);
    alertesData.push([tr('critical'), alertesStock.filter((a) => a.typeAlerte === 'CRITIQUE').length]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(alertesData), tr('alertsSheet'));

    const commandesData = [
      [tr('ordersToProcessUpper')],
      [tr('toSend'), commandesATraiter?.aEnvoyer || 0],
      [tr('toReceive'), commandesATraiter?.aRecevoir || 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(commandesData), tr('ordersToProcessSheet'));

    XLSX.writeFile(wb, `rapport_achats_${currentDate.toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

const exportToPDF = async () => {
  setExporting(true);
  setShowExportMenu(false);

  try {
    const cleanText = (text) => String(text || '').replace(/[&<>]/g, '');
    const safeUserName = cleanText(currentUserName);
   
    const html = `<!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}">
        <head>
          <title>${tr('reportTitle')}</title>
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
            .kpi-grid { padding: 20px 28px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
            .kpi-card { background: #f8fafc; border-radius: 14px; padding: 20px; border: 1px solid #edf2f7; text-align: center; }
            .kpi-icon { font-size: 32px; margin-bottom: 8px; }
            .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
            .kpi-value { font-size: 28px; font-weight: 700; color: #2563eb; margin-top: 8px; }
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
              <div class="report-title">${tr('reportTitle').toUpperCase()}</div>
              <div class="exported-by">${tr('exportedBy') || 'Exporté par'} : ${safeUserName}</div>
              <div class="exported-by">${tr('onDate', { date: formattedDate }) || `le ${formattedDate}`}</div>
              <div class="period-badge">📅 ${formattedPeriodStart} - ${formattedPeriodEnd}</div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-icon">📦</div>
                <div class="kpi-label">${tr('purchaseOrders') || 'Bons de commande'}</div>
                <div class="kpi-value">${formatNumber(stats.commandes?.total)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">⏳</div>
                <div class="kpi-label">${tr('pending') || 'En attente'}</div>
                <div class="kpi-value">${formatNumber(stats.commandes?.enAttente)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">✅</div>
                <div class="kpi-label">${tr('delivered') || 'Livrés'}</div>
                <div class="kpi-value">${formatNumber(stats.commandes?.livre)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">💰</div>
                <div class="kpi-label">${tr('stockValue') || 'Valeur du stock'}</div>
                <div class="kpi-value">${formatNumber(stats.stock?.valeurTotale)} TND</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📈 ${tr('ordersEvolutionUpper') || 'ÉVOLUTION DES COMMANDES'}</div>
              <table>
                <thead>
                  <tr>
                    <th>${tr('period') || 'Période'}</th>
                    <th class="text-right">${tr('count') || 'Nombre'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${evolutionCommandes.map(item => `
                  <tr>
                    <td>${item.label}</td>
                    <td class="text-right">${item.valeur}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">🔄 ${tr('stockMovementsUpper') || 'MOUVEMENTS DE STOCK'}</div>
              <table>
                <thead>
                  <tr>
                    <th>${tr('period') || 'Période'}</th>
                    <th class="text-right">${tr('entries') || 'Entrées'}</th>
                    <th class="text-right">${tr('exits') || 'Sorties'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${mouvementsStock.map(item => `
                  <tr>
                    <td>${item.label}</td>
                    <td class="text-right">${formatNumber(item.entrees)}</td>
                    <td class="text-right">${formatNumber(item.sorties)}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">🏷️ ${tr('categoryBreakdownUpper') || 'RÉPARTITION PAR CATÉGORIE'}</div>
              <table>
                <thead>
                  <tr>
                    <th>${tr('category') || 'Catégorie'}</th>
                    <th class="text-right">${tr('products') || 'Produits'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${repartitionCategories.map(item => `
                  <tr>
                    <td>${item.categorie}</td>
                    <td class="text-right">${item.nombreProduits}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">⚠️ ${tr('stockAlertsUpper') || 'ALERTES STOCK'}</div>
              <table>
                <thead>
                  <tr>
                    <th>${tr('type') || 'Type'}</th>
                    <th class="text-right">${tr('count') || 'Nombre'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${tr('rupture') || 'Rupture'}</td>
                    <td class="text-right">${alertesStock.filter((a) => a.typeAlerte === 'RUPTURE').length}</td>
                  </tr>
                  <tr>
                    <td>${tr('critical') || 'Critique'}</td>
                    <td class="text-right">${alertesStock.filter((a) => a.typeAlerte === 'CRITIQUE').length}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">🚚 ${tr('ordersToProcessUpper') || 'COMMANDES À TRAITER'}</div>
              <table>
                <thead>
                  <tr>
                    <th>${tr('type') || 'Type'}</th>
                    <th class="text-right">${tr('count') || 'Nombre'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${tr('toSend') || 'À envoyer'}</td>
                    <td class="text-right">${commandesATraiter?.aEnvoyer || 0}</td>
                  </tr>
                  <tr>
                    <td>${tr('toReceive') || 'À recevoir'}</td>
                    <td class="text-right">${commandesATraiter?.aRecevoir || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>${tr('autoGenerated') || 'Rapport généré automatiquement'}</p>
              <p style="margin-top: 4px;">${formattedDate}</p>
            </div>
          </div>
        </body>
      </html>`;

    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);

    await html2pdf()
      .set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `rapport_achats_${currentDate.toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();

    document.body.removeChild(element);
  } catch (pdfError) {
    console.error('Erreur lors de l export PDF:', pdfError);
    alert(`${tr('pdfExportError') || 'Erreur lors de la génération du PDF:'} ${pdfError.message}`);
  } finally {
    setExporting(false);
  }
};
  const EmptyChart = ({ title, height = 'h-64' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <div className={`flex flex-col items-center justify-center ${height} bg-gray-50 rounded-lg`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-gray-400 text-sm">{tr('noData')}</p>
        <p className="text-gray-400 text-xs mt-1">{tr('selectPeriod')}</p>
      </div>
    </div>
  );

  const StatCard = ({ title, value, unit = '', icon: Icon, color, subtitle, trend }) => {
    const isEmpty = !hasDateFilter;
    return (
      <div className={`rounded-xl shadow-sm border p-5 transition-shadow ${isEmpty ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:shadow-md'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className={`text-sm font-medium mb-1 ${isEmpty ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            {isEmpty ? (
              <p className="text-2xl font-bold mt-2 text-gray-400">-</p>
            ) : (
              <p className="text-2xl font-bold text-gray-800">
                {typeof value === 'number' ? `${formatNumber(value)}${unit ? ` ${unit}` : ''}` : value}
              </p>
            )}
            {subtitle && !isEmpty && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {trend !== undefined && trend !== 0 && !isEmpty && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" /> : <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />}
                <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tr('trendVsLastMonth', { value: Math.abs(trend) })}
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

  const SimpleLineChart = ({ data, labels, title }) => {
    const isEmpty = !hasDateFilter || !data || data.length === 0 || data.every((v) => v === 0);
    if (isEmpty) return <EmptyChart title={title} />;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const height = 250;
    const width = 600;
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1 || 1)) * width,
      y: height - ((value - minValue) / (maxValue - minValue || 1)) * height,
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="relative w-full overflow-x-auto">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth="3" />
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

const MouvementsStockChart = ({ data, title }) => {
  // Fonction pour obtenir le numéro de semaine (ISO)
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  
  // Obtenir le début de la semaine (lundi)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  
  // Obtenir la fin de la semaine (dimanche)
  const getEndOfWeek = (startDate) => {
    const end = new Date(startDate);
    end.setDate(startDate.getDate() + 6);
    return end;
  };
  
  // Formater une date en format court JJ/MM
  const formatShortDate = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  // Fonction pour agréger les données par semaine
  const aggregateByWeek = (data) => {
    const weeklyData = {};
    
    data.forEach(item => {
      // Si le label est déjà au format semaine (ex: "Sem 19 (4/5 - 10/5)")
      if (item.label.includes('Sem ') && item.label.includes('(')) {
        if (!weeklyData[item.label]) {
          weeklyData[item.label] = {
            entrees: 0,
            sorties: 0,
            label: item.label
          };
        }
        weeklyData[item.label].entrees += item.entrees;
        weeklyData[item.label].sorties += item.sorties;
        return;
      }
      
      // Essayer de parser la date
      let date = null;
      
      // Format JJ/MM/AAAA
      if (item.label.includes('/')) {
        const parts = item.label.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          date = new Date(`${year}-${month}-${day}`);
        } else if (parts.length === 2) {
          // Format JJ/MM sans année
          const [day, month] = parts;
          date = new Date(`2026-${month}-${day}`);
        }
      } 
      // Format AAAA-MM-JJ
      else if (item.label.includes('-')) {
        date = new Date(item.label);
      }
      
      if (date && !isNaN(date.getTime())) {
        // Calculer le numéro de semaine
        const weekNumber = getWeekNumber(date);
        const year = date.getFullYear();
        const weekKey = `${year}-W${weekNumber}`;
        
        const weekStart = getStartOfWeek(date);
        const weekEnd = getEndOfWeek(weekStart);
        const weekLabel = `Sem ${weekNumber} (${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)})`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            entrees: 0,
            sorties: 0,
            label: weekLabel,
            weekNumber: weekNumber,
            year: year,
            startDate: weekStart
          };
        }
        
        weeklyData[weekKey].entrees += item.entrees;
        weeklyData[weekKey].sorties += item.sorties;
      } else {
        // Si ce n'est pas une date reconnaissable, garder tel quel
        if (!weeklyData[item.label]) {
          weeklyData[item.label] = {
            entrees: 0,
            sorties: 0,
            label: item.label
          };
        }
        weeklyData[item.label].entrees += item.entrees;
        weeklyData[item.label].sorties += item.sorties;
      }
    });
    
    // Convertir en tableau et trier par date
    return Object.values(weeklyData).sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate - b.startDate;
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return 0;
    });
  };
  
  // Vérifier si les données sont déjà agrégées par semaine
  const isAlreadyWeekly = data.length > 0 && data[0]?.label?.includes('Sem ');
  
  let displayData;
  if (isAlreadyWeekly) {
    // Déjà par semaine, pas besoin d'agréger
    displayData = [...data];
  } else {
    // Agréger par semaine
    displayData = aggregateByWeek(data);
  }
  
  // Filtrer pour ne garder que les périodes avec des mouvements
  const filteredData = displayData.filter((item) => item.entrees > 0 || item.sorties > 0);
  
  const isEmpty = !hasDateFilter || !filteredData || filteredData.length === 0;
  if (isEmpty) return <EmptyChart title={title} />;

  const rawMaxValue = Math.max(...filteredData.flatMap((item) => [item.entrees, item.sorties]), 1);
  const maxValue = Math.max(rawMaxValue, 10);
  const barWidth = 35;
  const groupWidth = barWidth * 2 + 12;
  const chartHeight = 250;
  const chartWidth = Math.max(filteredData.length * groupWidth + 100, 600);
  const yAxisValues = [0, Math.round(maxValue * 0.25), Math.round(maxValue * 0.5), Math.round(maxValue * 0.75), maxValue];

  const formatLargeNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return formatNumber(num);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="relative w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight + 80} viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`}>
          {/* Lignes horizontales */}
          {yAxisValues.map((value, i) => {
            const y = chartHeight - 10 - (value / maxValue) * (chartHeight - 40);
            return (
              <g key={i}>
                <line x1="50" y1={y} x2={chartWidth - 20} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                <text x="45" y={y + 3} textAnchor="end" className="text-xs font-mono fill-gray-600">{formatLargeNumber(value)}</text>
              </g>
            );
          })}
          
          {/* Barres */}
          {filteredData.map((item, idx) => {
            const x = idx * groupWidth + 70;
            const entryHeight = (item.entrees / maxValue) * (chartHeight - 50);
            const exitHeight = (item.sorties / maxValue) * (chartHeight - 50);
            return (
              <g key={idx}>
                <rect 
                  x={x} 
                  y={chartHeight - 10 - entryHeight} 
                  width={barWidth} 
                  height={Math.max(entryHeight, 3)} 
                  fill="#3B82F6" 
                  rx="4" 
                />
                <rect 
                  x={x + barWidth + 10} 
                  y={chartHeight - 10 - exitHeight} 
                  width={barWidth} 
                  height={Math.max(exitHeight, 3)} 
                  fill="#EF4444" 
                  rx="4" 
                />
                <text 
                  x={x + barWidth + 5} 
                  y={chartHeight + 20} 
                  textAnchor="middle" 
                  className="text-xs fill-gray-500"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
        
        <div className="flex flex-wrap justify-center gap-6 mt-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">{tr('entriesLegend') || 'Entrées (réceptions)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm text-gray-600">{tr('exitsLegend') || 'Sorties (consommations)'}</span>
          </div>
        </div>
        
        {!isAlreadyWeekly && filteredData.length !== displayData.length && (
          <div className="mt-3 text-xs text-gray-400 text-center">
            {tr('showingOnlyMovements', { 
              count: filteredData.length, 
              hidden: displayData.length - filteredData.length 
            }) || `Affichage uniquement des ${filteredData.length} semaine(s) avec mouvements`}
          </div>
        )}
      </div>
    </div>
  );
};

  const SimpleDonutChart = ({ data, labels, colors, title }) => {
    const isEmpty = !hasDateFilter || !data || data.length === 0 || data.reduce((a, b) => a + b, 0) === 0;
    if (isEmpty) return <EmptyChart title={title} height="h-48" />;

    const total = data.reduce((a, b) => a + b, 0);
    let currentAngle = 0;
    const size = 150;
    const center = size / 2;
    const radius = 60;
    const getPath = (startAngle, endAngle) => {
      const start = { x: center + radius * Math.cos(startAngle), y: center + radius * Math.sin(startAngle) };
      const end = { x: center + radius * Math.cos(endAngle), y: center + radius * Math.sin(endAngle) };
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
              currentAngle = end;
              return <path key={index} d={getPath(start, end)} fill={colors[index]} stroke="white" strokeWidth="2" />;
            })}
          </svg>
          <div className="grid grid-cols-2 gap-2 w-full">
            {labels.map((label, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-800 font-medium ml-auto">{formatNumber(data[index])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PeriodInfo = () => {
    if (!hasDateFilter) return null;
    return (
      <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5 text-sm text-blue-700">
        <span className="font-medium">{tr('selectedPeriod')}</span>
        <span>{formatDateForDisplay(selectedStartDate)} - {formatDateForDisplay(selectedEndDate)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">{tr('loadingStats')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
          <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {tr('retry')}
          </button>
        </div>
      </div>
    );
  }

  const evolutionLabels = evolutionCommandes.map((item) => item.label);
  const evolutionValues = evolutionCommandes.map((item) => item.valeur);
  const categoriesLabels = repartitionCategories.map((item) => item.categorie);
  const categoriesValues = repartitionCategories.map((item) => item.nombreProduits);
  const categoriesColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6'];
  const alertesRupture = alertesStock.filter((a) => a.typeAlerte === 'RUPTURE').length;
  const alertesCritique = alertesStock.filter((a) => a.typeAlerte === 'CRITIQUE').length;

  const getTauxRuptureColor = () => {
    if (!hasDateFilter) return 'bg-gradient-to-r from-gray-400 to-gray-500';
    if (tauxRupture === 0) return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
    if (tauxRupture < 5) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  return (
    <div className={`space-y-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{tr('overviewTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">{tr('overviewSubtitle')}</p>
          <PeriodInfo />
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

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {tr('exporting')}
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  {tr('export')}
                </>
              )}
            </button>

            {showExportMenu && !exporting && (
              <div className={`absolute ${isArabic ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10`}>
                <button onClick={exportToExcel} className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-t-lg">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-b-lg">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={tr('purchaseOrders')}
          value={stats.commandes?.total || 0}
          icon={ShoppingCartIcon}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle={tr('ordersSubtitle', { pending: stats.commandes?.enAttente || 0, delivered: stats.commandes?.livre || 0 })}
          trend={stats.commandes?.tendance}
        />
        <StatCard
          title={tr('activeProducts')}
          value={stats.produits?.actifs || 0}
          icon={CubeIcon}
          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle={tr('productsSubtitle', { rupture: stats.produits?.rupture || 0, low: stats.produits?.alerte || 0 })}
          trend={stats.produits?.tendance}
        />
        <StatCard
          title={tr('stockValue')}
          value={stats.stock?.valeurTotale || 0}
          unit="TND"
          icon={ArchiveBoxIcon}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle={tr('rotationSubtitle', { count: stats.stock?.rotation || 0 })}
          trend={stats.stock?.tendance}
        />
        <StatCard
          title={tr('stockoutRate')}
          value={tauxRupture.toFixed(1)}
          unit="%"
          icon={ExclamationTriangleIcon}
          color={getTauxRuptureColor()}
          subtitle={tr('stockoutSubtitle', { rupture: stats.produits?.rupture || 0, active: stats.produits?.actifs || 0 })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart data={evolutionValues} labels={evolutionLabels} title={tr('ordersEvolution')} />
        <MouvementsStockChart data={mouvementsStock} title={tr('stockMovements')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleDonutChart data={categoriesValues} labels={categoriesLabels} colors={categoriesColors} title={tr('productsByCategory')} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">{tr('stockAlerts')}</h3>
          <div className="space-y-3">
            {!hasDateFilter ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">{tr('periodFilterRequired')}</p>
                  <p className="text-xs text-gray-400">{tr('selectPeriodForAlerts')}</p>
                </div>
              </div>
            ) : (
              <>
                {alertesRupture > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tr('outOfStockProducts')}</p>
                      <p className="text-xs text-gray-500">{tr('affectedProducts', { count: alertesRupture })}</p>
                    </div>
                  </div>
                )}
                {alertesCritique > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tr('criticalStock')}</p>
                      <p className="text-xs text-gray-500">{tr('affectedProducts', { count: alertesCritique })}</p>
                    </div>
                  </div>
                )}
                {alertesRupture === 0 && alertesCritique === 0 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tr('healthyStock')}</p>
                      <p className="text-xs text-gray-500">{tr('noAlerts')}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {(alertesRupture > 0 || alertesCritique > 0) && hasDateFilter && (
            <div className="mt-4 pt-4 border-t">
              <button onClick={() => navigate('/dashboard/procurement/etat_stock?filter=alertes')} className="w-full px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                {tr('viewDetails')}
              </button>
            </div>
          )}
        </div>
        
        {/* Section Commandes à traiter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">{tr('ordersToProcess')}</h3>
          {!hasDateFilter ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">{tr('periodFilterRequired')}</p>
                <p className="text-xs text-gray-400">{tr('selectPeriodForOrders')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {hasCommandsToSend && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tr('toSend')}</p>
                      <p className="text-xs text-gray-500">{tr('validatedAwaitingSend')}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{commandesATraiter?.aEnvoyer || 0}</p>
                </div>
              )}
              
              {hasCommandsToReceive && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <TruckIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tr('toReceive')}</p>
                      <p className="text-xs text-gray-500">{tr('sentAwaitingReceipt')}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-purple-600">{commandesATraiter?.aRecevoir || 0}</p>
                </div>
              )}
              
              {!hasCommandsToSend && !hasCommandsToReceive && (
                <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircleIcon className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tr('noOrdersToProcess')}</p>
                    <p className="text-xs text-gray-500">{tr('allOrdersProcessed')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <button onClick={() => navigate('/dashboard/procurement/commandes')} className="w-full px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              {tr('viewAllOrders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsAchats;