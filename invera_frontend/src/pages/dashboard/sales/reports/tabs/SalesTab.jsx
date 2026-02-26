// src/pages/dashboard/sales/reports/tabs/SalesTab.jsx
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Filter, Calendar, X, FileText, FileSpreadsheet } from 'lucide-react';
import { useReports } from '../../../../../hooks/useReports';
import html2pdf from 'html2pdf.js';
import { logoBase64 } from '../../../../../assets/logoBase64';

const SalesTab = () => {
  // Récupérer seulement le refreshTrigger depuis le contexte
  const { refreshTrigger } = useOutletContext();
  
  // État pour TOUS les filtres - SANS period
  const [filters, setFilters] = useState({
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

  // États pour les exports
  const [exporting, setExporting] = useState({
    pdf: false,
    excel: false
  });

  // Types de clients (avec undefined pour "tous")
  const clientTypes = [
    { id: undefined, label: 'Tous les clients' },
    { id: 'VIP', label: 'VIP' },
    { id: 'PROFESSIONNEL', label: 'Professionnel' },
    { id: 'ENTREPRISE', label: 'Entreprise' },
    { id: 'FIDELE', label: 'Fidèle' },
    { id: 'PARTICULIER', label: 'Particulier' }
  ];

  // Statuts des ventes (avec undefined pour "tous")
  const statusOptions = [
    { id: undefined, label: 'Tous les statuts' },
    { id: 'CONFIRMEE', label: 'Confirmée' },
    { id: 'EN_ATTENTE', label: 'En attente' },
    { id: 'ANNULEE', label: 'Annulée' },
  ];

  // Fonction pour normaliser les statuts
  const getStatutInfo = (statut) => {
    const statutMap = {
      'CONFIRMEE': { class: 'bg-green-100 text-green-700', label: 'Confirmée' },
      'Confirmée': { class: 'bg-green-100 text-green-700', label: 'Confirmée' },
      'Confirmé': { class: 'bg-green-100 text-green-700', label: 'Confirmée' },
      'EN_ATTENTE': { class: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      'En attente': { class: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      'ANNULEE': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      'Annulée': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      'Annulé': { class: 'bg-gray-100 text-gray-700', label: 'Annulée' },
      'LIVREE': { class: 'bg-blue-100 text-blue-700', label: 'Livrée' },
      'Livrée': { class: 'bg-blue-100 text-blue-700', label: 'Livrée' }
    };
    
    return statutMap[statut] || { class: 'bg-gray-100 text-gray-700', label: statut || 'Inconnu' };
  };

  // Fonction améliorée pour récupérer l'utilisateur courant
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
            if (decoded.sub) return decoded.sub;
            if (decoded.email) return decoded.email;
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
          if (user.username) return user.username;
        } catch (e) {}
      }
      
      return 'Utilisateur';
      
    } catch (error) {
      console.error('❌ Erreur dans getCurrentUser:', error);
      return 'Utilisateur';
    }
  };

  // Fonction pour formater la période
  const getPeriodLabel = () => {
    if (filters.startDate && filters.endDate) {
      return `Du ${filters.startDate} au ${filters.endDate}`;
    }
    return 'Période non définie';
  };

  // Utiliser le hook useReports avec tous les filtres
  const { 
    loading, 
    error, 
    data, 
    refresh,
    setFilters: updateReportsFilters
  } = useReports('sales', filters);

  // Effet pour le refreshTrigger (bouton rafraîchir global)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 SalesTab - Rafraîchissement global');
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // Appliquer la période personnalisée
  const handleApplyCustom = () => {
    if (localDates.startDate && localDates.endDate) {
      console.log('📅 Application des dates:', localDates);
      
      const newFilters = {
        ...filters,
        startDate: localDates.startDate,
        endDate: localDates.endDate
      };
      
      console.log('🔍 Nouveaux filtres:', newFilters);
      
      setFilters(newFilters);
      updateReportsFilters(newFilters);
      console.log('📅 Application des dates:', localDates);
     console.log('🔍 Nouveaux filtres:', newFilters);
    }
  };

  // Gestionnaire pour les filtres spécifiques
  const handleSpecificFilterChange = (key, value) => {
    console.log(`🔧 Changement filtre ${key}:`, value);
    
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    updateReportsFilters(newFilters);
  };

  // Réinitialiser TOUS les filtres
  const resetAllFilters = () => {
    console.log('🔄 Réinitialisation des filtres');
    
    const defaultFilters = {
      startDate: null,
      endDate: null,
      clientType: undefined,
      status: undefined
    };
    
    setFilters(defaultFilters);
    updateReportsFilters(defaultFilters);
    setLocalDates({ startDate: '', endDate: '' });
  };


// EXPORT PDF - Version avec pagination automatique
const handleExportPDF = async () => {
  try {
    setExporting(prev => ({ ...prev, pdf: true }));
    
    const currentUser = getCurrentUser();
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // ✅ Définir periodDisplay correctement
    const periodDisplay = filters.startDate && filters.endDate 
      ? `Du ${filters.startDate} au ${filters.endDate}`
      : 'Toutes les périodes';
    
    // Créer le contenu HTML du rapport
    const content = document.createElement('div');
    content.style.padding = '15px';
    content.style.fontFamily = 'Inter, sans-serif';
    content.style.maxWidth = '800px';
    content.style.margin = '0 auto';
    content.style.fontSize = '12px';
    
    // Calculer le nombre de pages nécessaires (environ 25 lignes par page)
    const ventes = data?.ventes || [];
    const lignesParPage = 25;
    const nombrePages = Math.ceil(ventes.length / lignesParPage);
    
    let tableHTML = '';
    
    // Générer le tableau pour chaque page
    for (let page = 0; page < nombrePages; page++) {
      const debut = page * lignesParPage;
      const fin = Math.min(debut + lignesParPage, ventes.length);
      const ventesPage = ventes.slice(debut, fin);
      
      tableHTML += `
        <div class="page-container" ${page > 0 ? 'style="page-break-before: always;"' : ''}>
          <!-- En-tête de page (sauf première page) -->
          ${page > 0 ? `
          <div class="header-mini">
            <div class="left-section-mini">
              <img src="${logoBase64}" alt="InVera" class="logo-mini" />
              <div class="company-details-mini">
                <span>InVera • ${today}</span>
              </div>
            </div>
            <div class="page-number">Page ${page + 1}/${nombrePages}</div>
          </div>
          ` : ''}
          
          <!-- Tableau -->
          <table class="ventes-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Réf.</th>
                <th>Client</th>
                <th class="text-right">Montant</th>
                <th>Statut</th>
                <th class="text-right">Qté</th>
              </tr>
            </thead>
            <tbody>
              ${ventesPage.map(v => {
                const statutInfo = getStatutInfo(v.statut);
                const statusClass = v.statut === 'CONFIRMEE' ? 'status-paid' : 
                                   v.statut === 'EN_ATTENTE' ? 'status-pending' :
                                   v.statut === 'ANNULEE' ? 'status-cancelled' : 'status-delivered';
                return `
                  <tr>
                    <td style="font-size: 8px;">${v.date?.substring(0,10) || ''}</td>
                    <td class="font-mono" style="font-size: 8px;">${v.reference?.substring(0,8) || ''}</td>
                    <td style="font-size: 8px;">${v.client?.substring(0,20) || ''}</td>
                    <td class="text-right font-mono" style="font-size: 8px;">${v.montant || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statutInfo.label}</span></td>
                    <td class="text-right" style="font-size: 8px;">${v.nbProduits || 0}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            ${page === nombrePages - 1 ? `
            <tfoot style="background: #f1f5f9; font-weight: 600;">
              <tr>
                <td colspan="3" class="text-right">TOTAUX:</td>
                <td class="text-right">${ventes.reduce((sum, v) => sum + (v.montant || 0), 0)} DT</td>
                <td></td>
                <td class="text-right">${ventes.reduce((sum, v) => sum + (v.nbProduits || 0), 0)}</td>
              </tr>
            </tfoot>
            ` : ''}
          </table>
          
          ${page < nombrePages - 1 ? '<div style="height: 20px;"></div>' : ''}
        </div>
      `;
    }
    
    content.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Inter', sans-serif; 
          background: white;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .report-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }
        
        /* HEADER PRINCIPAL */
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
          gap: 12px;
        }
        
        .logo {
          width: 45px;
          height: 45px;
          object-fit: contain;
        }
        
        .company-details {
          border-left: 1px solid #e2e8f0;
          padding-left: 12px;
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
          width: 16px;
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
          margin: 4px 0 8px 0;
        }
        
        .period-badge {
          display: inline-block;
          padding: 3px 8px;
          background: transparent;
          color: #475569;
          border-radius: 16px;
          font-size: 9px;
          font-weight: 500;
          border: 1px solid #e2e8f0;
        }
        
        /* HEADER MINI POUR PAGES SUIVANTES */
        .header-mini {
          padding: 8px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #eef2f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .left-section-mini {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .logo-mini {
          width: 25px;
          height: 25px;
          object-fit: contain;
        }
        
        .company-details-mini {
          font-size: 8px;
          color: #64748b;
        }
        
        .page-number {
          font-size: 8px;
          color: #2563eb;
          font-weight: 500;
        }
        
        /* FILTRES */
        .filters-applied {
          padding: 0 20px 12px 20px;
        }
        
        .filters-box {
          background: #f8fafc;
          padding: 10px 15px;
          border-radius: 8px;
          border-left: 3px solid #2563eb;
        }
        
        .filters-title {
          font-size: 10px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        
        .filters-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 10px;
          color: #334155;
        }
        
        .filter-item {
          background: white;
          padding: 3px 8px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          font-size: 9px;
        }
        
        /* SYNTHÈSE */
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
          border: 1px solid #e2e8f0;
        }
        
        .stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
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
        
        /* TABLEAU */
        .details-section {
          padding: 0 20px 20px 20px;
        }
        
        .ventes-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          font-size: 10px;
        }
        
        .ventes-table th {
          background: #2ecc71;
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }
        
        .ventes-table td {
          padding: 6px;
          font-size: 9px;
          color: #334155;
          border-bottom: 1px solid #edf2f7;
        }
        
        .ventes-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .status-paid {
          background: #ecfdf5;
          color: #047857;
        }
        
        .status-pending {
          background: #fffbeb;
          color: #b45309;
        }
        
        .status-cancelled {
          background: #fef2f2;
          color: #b91c1c;
        }
        
        .status-delivered {
          background: #eff6ff;
          color: #1d4ed8;
        }
        
        /* PAGE */
        .page-container {
          page-break-inside: avoid;
        }
        
        /* PIED DE PAGE */
        .footer {
          padding: 10px 20px;
          text-align: center;
          border-top: 1px solid #eef2f6;
          background: #fafcff;
          font-size: 8px;
          color: #94a3b8;
        }
        
        .text-right {
          text-align: right;
        }
        
        .font-mono {
          font-family: monospace;
          font-size: 9px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        
        .stat-card {
          background: #f8fafc;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .stat-card-label {
          font-size: 9px;
          color: #64748b;
        }
        
        .stat-card-value {
          font-size: 14px;
          font-weight: 700;
          color: #2563eb;
        }
      </style>
      
      <div class="report-container">
        <!-- HEADER PRINCIPAL -->
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
            <div class="report-title">VENTES</div>
            <div class="report-meta">${today} • ${currentUser}</div>
            <div class="period-badge">${periodDisplay}</div>
          </div>
        </div>
        
        <!-- FILTRES APPLIQUÉS -->
        ${(filters.clientType || filters.status) ? `
        <div class="filters-applied">
          <div class="filters-box">
            <div class="filters-title">FILTRES</div>
            <div class="filters-list">
              ${filters.clientType ? `
                <span class="filter-item">👤 ${clientTypes.find(t => t.id === filters.clientType)?.label || filters.clientType}</span>
              ` : ''}
              ${filters.status ? `
                <span class="filter-item">📊 ${statusOptions.find(s => s.id === filters.status)?.label || filters.status}</span>
              ` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- SYNTHÈSE -->
        <div class="summary-section">
          <div class="summary-title">
            <i>📊</i> SYNTHÈSE
          </div>
          
          <div class="stats-container">
            <div class="stats-row">
              <span class="stats-label">Chiffre d'affaires</span>
              <span class="stats-value highlight">${data?.summary?.totalCA || 0} DT</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Nombre de commandes</span>
              <span class="stats-value">${data?.summary?.totalCommandes || 0}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Total produits</span>
              <span class="stats-value">${data?.ventes?.reduce((sum, v) => sum + (v.nbProduits || 0), 0) || 0}</span>
            </div>
          </div>
        </div>
        
        <!-- STATISTIQUES PAR STATUT -->
        ${data?.ventes?.length > 0 ? `
        <div class="details-section" style="padding-top: 0;">
          <div class="summary-title" style="margin-top: 0;">
            <i>📈</i> RÉPARTITION
          </div>
          
          <div class="stats-grid">
            ${Object.entries(data.ventes.reduce((acc, v) => {
              const statut = getStatutInfo(v.statut).label;
              acc[statut] = (acc[statut] || 0) + 1;
              return acc;
            }, {})).map(([statut, count]) => `
              <div class="stat-card">
                <div class="stat-card-label">${statut}</div>
                <div class="stat-card-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <!-- DÉTAIL DES VENTES (avec pagination automatique) -->
        <div class="details-section">
          <div class="summary-title" style="margin-top: 0;">
            <i>📋</i> DÉTAIL DES VENTES (${ventes.length} lignes)
          </div>
          
          ${ventes.length > 0 ? tableHTML : '<p style="text-align: center; padding: 30px; color: #64748b; background: #f8fafc; border-radius: 8px;">Aucune vente trouvée</p>'}
        </div>
        
        <!-- FOOTER (uniquement sur la dernière page) -->
        <div class="footer">
          <p>InVera • ${today} • ${currentUser}</p>
        </div>
      </div>
    `;
    
    // Options pour html2pdf
    const options = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `ventes_${new Date().toISOString().split('T')[0]}.pdf`,
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
    
    // Générer et télécharger le PDF
    await html2pdf().set(options).from(content).save();
    
  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
    alert('Erreur lors de l\'export PDF');
  } finally {
    setExporting(prev => ({ ...prev, pdf: false }));
  }
};


 // EXPORT EXCEL - Génération côté front-end
const handleExportExcel = async () => {
  try {
    setExporting(prev => ({ ...prev, excel: true }));
    
    // Import dynamique de SheetJS (xlsx)
    const XLSX = await import('xlsx');
    
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // ===== FEUILLE RÉSUMÉ =====
    const summaryData = [
      ['RAPPORT DES VENTES'],
      [],
      ['Période', getPeriodLabel()],
      ['Date de génération', new Date().toLocaleDateString('fr-FR')],
      ['Généré par', getCurrentUser()],
      [],
      ['RÉSUMÉ'],
      ['CA Total', `${data?.summary?.totalCA || 0} DT`],
      ['Nombre de commandes', data?.summary?.totalCommandes || 0],
      ['Panier moyen', `${data?.summary?.panierMoyen || 0} DT`],
      ['Taux de transformation', `${data?.summary?.tauxTransformation || 0}%`],
      [],
      ['FILTRES APPLIQUÉS'],
      ['Période', filters.startDate && filters.endDate ? `Du ${filters.startDate} au ${filters.endDate}` : 'Toutes les dates'],
      ['Type client', filters.clientType ? clientTypes.find(t => t.id === filters.clientType)?.label || filters.clientType : 'Tous'],
      ['Statut', filters.status ? statusOptions.find(s => s.id === filters.status)?.label || filters.status : 'Tous']
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style de la feuille résumé (largeur des colonnes)
    wsSummary['!cols'] = [
      { wch: 25 }, // Colonne A
      { wch: 20 }  // Colonne B
    ];
    
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
    
    // ===== FEUILLE DÉTAIL DES VENTES =====
    if (data?.ventes?.length > 0) {
      // Préparer les données pour Excel
      const ventesForExcel = data.ventes.map(v => ({
        'Date': v.date || '',
        'Référence': v.reference || '',
        'Client': v.client || '',
        'Montant (DT)': v.montant || 0,
        'Statut': getStatutInfo(v.statut).label,
        'Nombre de produits': v.nbProduits || 0
      }));
      
      const wsDetails = XLSX.utils.json_to_sheet(ventesForExcel);
      
      // Ajuster la largeur des colonnes
      wsDetails['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Référence
        { wch: 25 }, // Client
        { wch: 12 }, // Montant
        { wch: 15 }, // Statut
        { wch: 10 }  // Nb produits
      ];
      
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Ventes');
      
      // ===== FEUILLE STATISTIQUES =====
      // Calculer quelques statistiques supplémentaires
      const statsData = [
        ['STATISTIQUES DÉTAILLÉES'],
        [],
        ['Par statut'],
        ['Statut', 'Nombre', 'Montant total']
      ];
      
      // Grouper par statut
      const statsByStatus = data.ventes.reduce((acc, vente) => {
        const statut = getStatutInfo(vente.statut).label;
        if (!acc[statut]) {
          acc[statut] = { count: 0, total: 0 };
        }
        acc[statut].count += 1;
        acc[statut].total += vente.montant || 0;
        return acc;
      }, {});
      
      Object.entries(statsByStatus).forEach(([statut, stats]) => {
        statsData.push([statut, stats.count, `${stats.total} DT`]);
      });
      
      statsData.push(
        [],
        ['TOTAL', data.ventes.length, `${data.ventes.reduce((sum, v) => sum + (v.montant || 0), 0)} DT`]
      );
      
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      wsStats['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
    } else {
      // Si pas de données, ajouter une feuille vide avec message
      const emptyData = [
        ['AUCUNE VENTE TROUVÉE'],
        [],
        ['Aucune donnée disponible pour la période sélectionnée']
      ];
      const wsEmpty = XLSX.utils.aoa_to_sheet(emptyData);
      XLSX.utils.book_append_sheet(wb, wsEmpty, 'Ventes');
    }
    
    // ===== FEUILLE CLIENTS (si disponible) =====
    if (data?.ventes?.length > 0) {
      // Extraire les clients uniques et leurs achats
      const clientsMap = new Map();
      data.ventes.forEach(vente => {
        const clientKey = vente.client;
        if (!clientsMap.has(clientKey)) {
          clientsMap.set(clientKey, {
            client: vente.client,
            commandes: 0,
            total: 0
          });
        }
        const client = clientsMap.get(clientKey);
        client.commandes += 1;
        client.total += vente.montant || 0;
      });
      
      const clientsData = Array.from(clientsMap.values()).map(c => ({
        'Client': c.client,
        'Nombre de commandes': c.commandes,
        'Total achats (DT)': c.total
      }));
      
      const wsClients = XLSX.utils.json_to_sheet(clientsData);
      wsClients['!cols'] = [
        { wch: 30 }, // Client
        { wch: 15 }, // Commandes
        { wch: 15 }  // Total
      ];
      XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');
    }
    
    // Générer le nom du fichier
    const fileName = `ventes_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Sauvegarder le fichier
    XLSX.writeFile(wb, fileName);
    
    console.log('✅ Export Excel réussi');
    
  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    alert('Erreur lors de l\'export Excel');
  } finally {
    setExporting(prev => ({ ...prev, excel: false }));
  }
};

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

  if (loading && !data) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement du rapport des ventes...</p>
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
          <h2 className="text-lg font-semibold">Détail des ventes</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.ventes?.length || 0} ventes trouvées
          </p>
        </div>
        
        {/* Boutons d'export PDF et Excel */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={exporting.pdf || !data.ventes?.length}
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
            disabled={exporting.excel || !data.ventes?.length}
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
          {/* En-tête des filtres */}
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

          {/* Calendrier - Sélection de période */}
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

              {/* Indicateur de période active */}
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
                {/* Type de client */}
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

                {/* Statut commande */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Statut commande</label>
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

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-xl">
          <p className="text-sm text-blue-600">CA Total</p>
          <p className="text-2xl font-bold">{data.summary?.totalCA || 0} DT</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <p className="text-sm text-green-600">Commandes</p>
          <p className="text-2xl font-bold">{data.summary?.totalCommandes || 0}</p>
        </div>
     
      </div>

      {/* Tableau des ventes */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold">Liste des ventes</h3>
        </div>
        
        <div className="overflow-x-auto">
          {data.ventes?.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.ventes.map((vente, i) => {
                  const statutInfo = getStatutInfo(vente.statut);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{vente.date}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-800">{vente.reference}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vente.client}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{vente.montant} DT</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutInfo.class}`}>
                          {statutInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vente.nbProduits || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune vente trouvée pour cette période
            </div>
          )}
        </div>
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

export default SalesTab;