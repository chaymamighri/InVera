// src/pages/dashboard/sales/reports/tabs/InvoicesTab.jsx
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Filter, Calendar, X, FileText, FileSpreadsheet } from 'lucide-react';
import { useReports } from '../../../../../hooks/useReports';
import html2pdf from 'html2pdf.js';
import { logoBase64 } from '../../../../../assets/logoBase64';

const InvoicesTab = () => {
  const { refreshTrigger } = useOutletContext();
  
  // ✅ État pour TOUS les filtres - GARDER period pour le backend
  const [filters, setFilters] = useState({
    period: 'custom',     // 👈 TOUJOURS 'custom' pour les dates personnalisées
    startDate: null,
    endDate: null,
    clientType: undefined,  
    status: undefined      
  });

  const [showSpecificFilters, setShowSpecificFilters] = useState(false);
  const [localDates, setLocalDates] = useState({
    startDate: '',
    endDate: ''
  });

  // ✅ États pour les exports
  const [exporting, setExporting] = useState({
    pdf: false,
    excel: false
  });

  // ✅ Types de clients
  const clientTypes = [
    { id: undefined, label: 'Tous les clients' },
    { id: 'VIP', label: 'VIP' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ];

  // ✅ Statuts des factures
  const statusOptions = [
    { id: undefined, label: 'Tous les statuts' },
    { id: 'PAYE', label: 'Payée' },
    { id: 'NON_PAYE', label: 'Impayée' },
  ];

  // ✅ Fonction pour normaliser les statuts
  const getStatutInfo = (statut) => {
    const statutMap = {
      'PAYE': { class: 'bg-green-100 text-green-700', label: 'Payée' },
      'Payée': { class: 'bg-green-100 text-green-700', label: 'Payée' },
      'Payé': { class: 'bg-green-100 text-green-700', label: 'Payée' },
      'NON_PAYE': { class: 'bg-red-100 text-red-700', label: 'Impayée' },
      'Impayée': { class: 'bg-red-100 text-red-700', label: 'Impayée' },
      'Impayé': { class: 'bg-red-100 text-red-700', label: 'Impayée' },
      'EN_ATTENTE': { class: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      'En attente': { class: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      'ANNULEE': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      'Annulée': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' }
    };
    
    return statutMap[statut] || { class: 'bg-gray-100 text-gray-700', label: statut || 'Inconnu' };
  };

  // ✅ Fonction pour récupérer l'utilisateur courant
  const getCurrentUser = () => {
    try {
      const userName = localStorage.getItem('userName');
      if (userName) return userName;
      
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) return userEmail;
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            
            if (decoded.prenom && decoded.nom) return `${decoded.prenom} ${decoded.nom}`;
            if (decoded.nom) return decoded.nom;
            if (decoded.prenom) return decoded.prenom;
            if (decoded.name) return decoded.name;
          }
        } catch (e) {}
      }
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.prenom && user.nom) return `${user.prenom} ${user.nom}`;
          if (user.name) return user.name;
          if (user.email) return user.email;
        } catch (e) {}
      }
      
      return 'Utilisateur';
      
    } catch (error) {
      console.error('❌ Erreur dans getCurrentUser:', error);
      return 'Utilisateur';
    }
  };

  // ✅ Fonction pour formater la période POUR L'AFFICHAGE UNIQUEMENT
  const getDisplayPeriodLabel = () => {
    if (filters.startDate && filters.endDate) {
      return `Du ${filters.startDate} au ${filters.endDate}`;
    }
    return 'Sélectionnez une période';
  };

  // ✅ Utiliser le hook useReports
  const { 
    loading, 
    error, 
    data, 
    refresh,
    setFilters: updateReportsFilters 
  } = useReports('invoices', filters);

  // ✅ Effet pour le refreshTrigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 InvoicesTab - Rafraîchissement global');
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // ✅ Appliquer la période personnalisée
  const handleApplyCustom = () => {
    if (localDates.startDate && localDates.endDate) {
      console.log('📅 Application dates personnalisées:', localDates);
      
      const newFilters = {
        ...filters,
        period: 'custom',           // 👈 GARDER period = 'custom' pour le backend
        startDate: localDates.startDate,
        endDate: localDates.endDate
      };
      
      console.log('🔍 Nouveaux filtres (avec period):', newFilters);
      
      setFilters(newFilters);
      updateReportsFilters(newFilters);
    }
  };

  // ✅ Gestionnaire pour les filtres spécifiques
  const handleSpecificFilterChange = (key, value) => {
    console.log(`🔧 Filtre ${key}:`, value);
    
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // ✅ Réinitialiser TOUS les filtres
  const resetAllFilters = () => {
    console.log('🔄 Réinitialisation complète des filtres');
    
    const defaultFilters = {
      period: 'custom',              // 👈 GARDER period
      startDate: null,
      endDate: null,
      clientType: undefined, 
      status: undefined       
    };
    
    setFilters(defaultFilters);
    updateReportsFilters(defaultFilters);
    setLocalDates({ startDate: '', endDate: '' });
  };

  // ✅ EXPORT PDF 
  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }));
      
      const currentUser = getCurrentUser();
      const today = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Pour l'affichage dans le PDF, utiliser les dates directement
      const periodDisplay = filters.startDate && filters.endDate 
        ? `Du ${filters.startDate} au ${filters.endDate}`
        : 'Sélectionnez une période';
      
      const content = document.createElement('div');
      content.style.padding = '15px';
      content.style.fontFamily = 'Inter, sans-serif';
      content.style.maxWidth = '800px';
      content.style.margin = '0 auto';
      
      content.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { font-family: 'Inter', sans-serif; background: white; }
          
          .report-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .header {
            padding: 15px 20px;
            background: white;
            border-bottom: 1px solid #eef2f6;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .left-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .logo {
            width: 45px;
            height: 45px;
            object-fit: contain;
          }
          
          .company-details {
            border-left: 1px solid #e2e8f0;
            padding-left: 15px;
          }
          
          .company-details p {
            margin: 3px 0;
            font-size: 9px;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .company-details i {
            color: #64748b;
            width: 15px;
            font-style: normal;
            font-size: 9px;
          }
          
          .report-info {
            text-align: right;
          }
          
          .report-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.3px;
          }
          
          .report-meta {
            color: #64748b;
            font-size: 9px;
            margin: 3px 0 8px 0;
          }
          
.period-badge {
  display: inline-block;
  padding: 4px 10px;
  background: transparent;
  color: #475569;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
}
          
          .summary-section {
            padding: 15px 20px;
          }
          
          .summary-title {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .summary-title i {
            color: #2563eb;
            font-style: normal;
            font-size: 16px;
          }
          
          .stats-container {
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
          }
          
          .stats-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 11px;
          }
          
          .stats-row:last-child {
            border-bottom: none;
          }
          
          .stats-label {
            color: #475569;
            font-weight: 500;
          }
          
          .stats-value {
            font-weight: 600;
            color: #0f172a;
            font-family: monospace;
          }
          
          .stats-value.highlight {
            color: #2563eb;
            font-weight: 700;
          }
          
          .details-section {
            padding: 0 20px 20px 20px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            font-size: 9px;
            border: 1px solid #e2e8f0;
          }
          
          th {
            background: #2ecc71;
            color: white;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 9px;
            white-space: nowrap;
          }
          
          td {
            padding: 6px 4px;
            color: #334155;
            border-bottom: 1px solid #edf2f7;
            white-space: nowrap;
          }
          
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 8px;
            font-weight: 500;
            white-space: nowrap;
          }
          
          .status-paid {
            background: #ecfdf5;
            color: #047857;
          }
          
          .status-unpaid {
            background: #fef2f2;
            color: #b91c1c;
          }
          
          .status-pending {
            background: #fffbeb;
            color: #b45309;
          }
          
          .footer {
            padding: 10px 20px;
            text-align: center;
            border-top: 1px solid #eef2f6;
            background: #fafcff;
            font-size: 8px;
            color: #94a3b8;
          }
          
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; font-size: 9px; }
        </style>
        
        <div class="report-container">
          <div class="header">
            <div class="left-section">
              <img src="${logoBase64}" alt="InVera" class="logo" />
              <div class="company-details">
                <p><i>📍</i> 123 Rue de la République, 1000 Tunis</p>
                <p><i>📞</i> +216 00 000 000</p>
                <p><i>✉️</i> contact@invera.tn</p>
                <p><i>🆔</i> MF: 0000000/A/M/000</p>
              </div>
            </div>
            <div class="report-info">
              <div class="report-title">FACTURES</div>
              <div class="report-meta">${today} • ${currentUser}</div>
              <div class="period-badge">${periodDisplay}</div>
            </div>
          </div>
        
          
          <div class="summary-section">
            <div class="summary-title">
              <i>📊</i> RÉSUMÉ
            </div>
            
            <div class="stats-container">
              <div class="stats-row">
                <span class="stats-label">Total factures</span>
                <span class="stats-value">${data?.summary?.totalFactures || 0}</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">Montant total</span>
                <span class="stats-value highlight">${data?.summary?.montantTotal || 0} DT</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">Payées</span>
                <span class="stats-value">${data?.summary?.payees || 0} (${data?.summary?.montantPaye || 0} DT)</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">Impayées</span>
                <span class="stats-value">${data?.summary?.impayees || 0} (${data?.summary?.montantImpaye || 0} DT)</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">En retard</span>
                <span class="stats-value">${data?.summary?.enRetard || 0}</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">Taux recouvrement</span>
                <span class="stats-value highlight">${data?.summary?.tauxRecouvrement || 0}%</span>
              </div>
            </div>
          </div>
          
          <div class="details-section">
            <div class="summary-title" style="margin-top: 0;">
              <i>📋</i> LISTE DES FACTURES
            </div>
            
            ${data?.factures?.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th class="text-right">Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.factures.slice(0, 20).map(f => {
                  const statutInfo = getStatutInfo(f.statut);
                  const statusClass = f.statut === 'Payée' ? 'status-paid' : 
                                     f.statut === 'Impayée' ? 'status-unpaid' : 'status-pending';
                  return `
                    <tr>
                      <td class="font-mono" style="font-size: 8px;">${f.numero?.substring(0, 12) || ''}</td>
                      <td style="font-size: 8px;">${f.client?.substring(0, 20) || ''}</td>
                      <td style="font-size: 8px;">${f.date || ''}</td>
                      <td class="text-right font-mono" style="font-size: 8px;">${f.montant || 0}</td>
                      <td><span class="status-badge ${statusClass}" style="font-size: 7px;">${statutInfo.label}</span></td>
                    </tr>
                  `;
                }).join('')}
                ${data.factures.length > 20 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 6px; font-size: 8px; color: #64748b;">
                    ... et ${data.factures.length - 20} autres factures
                  </td>
                </tr>
                ` : ''}
              </tbody>
            </table>
            ` : '<p style="text-align: center; padding: 20px; color: #64748b; font-size: 10px;">Aucune facture trouvée</p>'}
          </div>
          
          <div class="footer">
            <p>InVera • 123 Rue de la République, 1000 Tunis • contact@invera.tn</p>
          </div>
        </div>
      `;
      
      const options = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `factures_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          letterRendering: true,
          useCORS: true,
          logging: false,
          windowWidth: 800
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      await html2pdf().set(options).from(content).save();
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }));
    }
  };

  // ✅ EXPORT EXCEL (Front-end uniquement)
  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }));
      
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      
      // Pour l'affichage dans Excel, utiliser les dates directement
      const periodDisplay = filters.startDate && filters.endDate 
        ? `Du ${filters.startDate} au ${filters.endDate}`
        : 'Sélectionnez une période';
      
      // 1. Feuille : Résumé
      const summaryData = [
        ['RAPPORT DES FACTURES', ''],
        ['Généré le', new Date().toLocaleDateString('fr-FR')],
        ['Généré par', getCurrentUser()],
        ['Période', periodDisplay],
        ['', ''],
        ['RÉSUMÉ', ''],
        ['Total factures', data?.summary?.totalFactures || 0],
        ['Montant total', `${data?.summary?.montantTotal || 0} DT`],
        ['Factures payées', data?.summary?.payees || 0],
        ['Montant payé', `${data?.summary?.montantPaye || 0} DT`],
        ['Factures impayées', data?.summary?.impayees || 0],
        ['Montant impayé', `${data?.summary?.montantImpaye || 0} DT`],
    
      ];
      
      // Ajouter les filtres appliqués
      if (filters.clientType || filters.status) {
        summaryData.push(['', '']);
        summaryData.push(['FILTRES APPLIQUÉS', '']);
        if (filters.clientType) {
          summaryData.push(['Type client', clientTypes.find(t => t.id === filters.clientType)?.label || filters.clientType]);
        }
        if (filters.status) {
          summaryData.push(['Statut', statusOptions.find(s => s.id === filters.status)?.label || filters.status]);
        }
      }
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
      
      // 2. Feuille : Liste des factures
      if (data?.factures?.length > 0) {
        const facturesData = data.factures.map(f => ({
          'N° Facture': f.numero,
          'Client': f.client,
          'Date': f.date,
          'Montant (DT)': f.montant,
          'Statut': getStatutInfo(f.statut).label
        }));
        
        const wsFactures = XLSX.utils.json_to_sheet(facturesData);
        wsFactures['!cols'] = [
          { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsFactures, 'Factures');
      }
      
      const fileName = `factures_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setExporting(prev => ({ ...prev, excel: false }));
    }
  };

  if (loading && !data) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement des factures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons d'export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Détail des factures</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.factures?.length || 0} factures trouvées
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={exporting.pdf || !data.factures?.length}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${exporting.pdf 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">
              {exporting.pdf ? 'Export PDF...' : 'Export PDF'}
            </span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting.excel || !data.factures?.length}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${exporting.excel 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">
              {exporting.excel ? 'Export Excel...' : 'Export Excel'}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION FILTRES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium text-gray-700">Filtres</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSpecificFilters(!showSpecificFilters)}
                className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors
                  ${showSpecificFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres avancés</span>
              </button>

              <button
                onClick={resetAllFilters}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-100 bg-blue-50 text-blue-700 border-blue-200"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Calendrier - Période personnalisée */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Sélectionner une période
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                <input
                  type="date"
                  value={localDates.startDate}
                  onChange={(e) => setLocalDates({ ...localDates, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={localDates.endDate}
                  min={localDates.startDate}
                  onChange={(e) => setLocalDates({ ...localDates, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

          

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleApplyCustom}
                disabled={!localDates.startDate || !localDates.endDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Appliquer
              </button>

              {/* Indicateur des dates actives (après application) */}
              {filters.startDate && filters.endDate && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Période active: du {filters.startDate} au {filters.endDate}
                </div>
              )}
            </div>
          </div>

          {/* FILTRES SPÉCIFIQUES */}
          {showSpecificFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Filtres avancés</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type de client</label>
                  <select
                    value={filters.clientType ?? 'all'}
                    onChange={(e) => {
                      const value = e.target.value === 'all' ? undefined : e.target.value;
                      handleSpecificFilterChange('clientType', value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    {clientTypes.map(type => (
                      <option key={type.id || 'all'} value={type.id ?? 'all'}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Statut facture</label>
                  <select
                    value={filters.status ?? 'all'}
                    onChange={(e) => {
                      const value = e.target.value === 'all' ? undefined : e.target.value;
                      handleSpecificFilterChange('status', value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    {statusOptions.map(option => (
                      <option key={option.id || 'all'} value={option.id ?? 'all'}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


 {/*  Cartes résumé */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total factures */}
  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
    <p className="text-sm text-blue-600 mb-1">Total factures</p>
    <p className="text-2xl font-bold text-blue-700">{data.summary?.totalFactures || 0}</p>
  </div>
  
  {/* Payées */}
  <div className="bg-green-50 p-6 rounded-xl border border-green-100">
    <p className="text-sm text-green-600 mb-1">Payées</p>
    <p className="text-2xl font-bold text-green-700">{data.summary?.payees || 0}</p>
    <p className="text-xs text-green-500 mt-1">{data.summary?.montantPaye || 0} DT</p>
  </div>
  
  {/* Impayées */}
  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
    <p className="text-sm text-red-600 mb-1">Impayées</p>
    <p className="text-2xl font-bold text-red-700">{data.summary?.impayees || 0}</p>
    <p className="text-xs text-red-500 mt-1">{data.summary?.montantImpaye || 0} DT</p>
  </div>
  
</div>

      {/* Montant total */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Montant total:</span>
          <span className="text-lg font-semibold">{data.summary?.montantTotal || 0} DT</span>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Facture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.factures?.map((facture, i) => {
                const statutInfo = getStatutInfo(facture.statut);
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-800">{facture.numero}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{facture.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{facture.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{facture.montant} DT</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutInfo.class}`}>
                        {statutInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {(!data.factures || data.factures.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Aucune facture trouvée pour cette période
          </div>
        )}
      </div>

      {/* Indicateur de chargement */}
      {loading && data && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 border border-gray-200">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Mise à jour...</span>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;
