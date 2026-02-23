// src/pages/dashboard/sales/reports/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Outlet, NavLink } from 'react-router-dom';
import { FileText, Receipt, Users, BarChart3, Download, RefreshCw } from 'lucide-react';
import ReportCard from './components/ReportCard';
import ReportFilters from './components/ReportFilters';
import reportService from '../../../../services/ReportService';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = () => {
  const location = useLocation();

  const [filters, setFilters] = useState({
    period: 'month',
    startDate: null,
    endDate: null,
    clientType: 'all',
    status: 'all'
  });

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Charger aperçu
  const loadPreview = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReportTypes();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  //  Fonction pour rafraîchir TOUS les rapports
  const refreshAllReports = () => {
    console.log('🔄 Rafraîchissement de tous les rapports...');
    loadPreview(); // Rafraîchir les stats de la page d'accueil
    // Le rafraîchissement des onglets se fera via le contexte
  };

  // EXPORT GLOBAL PDF UNIQUE

const exportGlobalPDF = async () => {
  try {
    setLoading(true);
    
    const [salesData, invoicesData, clientsData] = await Promise.all([
      reportService.getSalesReport(filters),
      reportService.getInvoicesReport(filters),
      reportService.getClientsReport(filters)
    ]);

    const doc = new jsPDF();
    
  // Page 1: Synthèse globale
doc.setFontSize(22);
doc.setTextColor(33, 33, 33);
doc.text('RAPPORT GLOBAL', 14, 22);

doc.setFontSize(11);
doc.setTextColor(100, 100, 100);
doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 32);
doc.text(`Période: ${filters.period}`, 14, 38);

// Résumé global
doc.setFontSize(16);
doc.setTextColor(0, 0, 0);
doc.text('SYNTHÈSE', 14, 48);

doc.setFontSize(12);
doc.setTextColor(80, 80, 80);

let y = 58;

// ✅ Version avec crochets - SIMPLE ET EFFICACE
doc.text(`[VENTES]`, 20, y); y += 6;
doc.text(`   CA Total: ${salesData?.summary?.totalCA || 0} DT`, 25, y); y += 6;
doc.text(`   Commandes: ${salesData?.summary?.totalCommandes || 0}`, 25, y); y += 6;
doc.text(`   Panier moyen: ${salesData?.summary?.panierMoyen || 0} DT`, 25, y); y += 8;

doc.text(`[FACTURES]`, 20, y); y += 6;
doc.text(`   Total: ${invoicesData?.summary?.totalFactures || 0}`, 25, y); y += 6;
doc.text(`   Payées: ${invoicesData?.summary?.payees || 0}`, 25, y); y += 6;
doc.text(`   Impayées: ${invoicesData?.summary?.impayees || 0}`, 25, y); y += 6;
doc.text(`   Taux recouvrement: ${invoicesData?.summary?.tauxRecouvrement || 0}%`, 25, y); y += 8;

doc.text(`[CLIENTS]`, 20, y); y += 6;
doc.text(`   Total: ${clientsData?.summary?.totalClients || 0}`, 25, y); y += 6;
doc.text(`   Nouveaux: ${clientsData?.summary?.nouveauxClients || 0}`, 25, y); y += 6;
doc.text(`   Actifs: ${clientsData?.summary?.clientsActifs || 0}`, 25, y); y += 6;
doc.text(`   CA total: ${clientsData?.summary?.caTotal || 0} DT`, 25, y);
    
    // Page 2: Détail des ventes
    if (salesData?.ventes?.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('DÉTAIL DES VENTES', 14, 22);
      
      // ✅ CORRECTION: autoTable(doc, options)
      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Client', 'Montant', 'Statut']],
        body: salesData.ventes.map(v => [
          v.date,
          v.client,
          `${v.montant} DT`,
          v.statut
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      });
    }
    
    // Page 3: Détail des factures
    if (invoicesData?.factures?.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('DÉTAIL DES FACTURES', 14, 22);
      
      // ✅ CORRECTION
      autoTable(doc, {
        startY: 30,
        head: [['N° Facture', 'Client', 'Date', 'Montant', 'Statut']],
        body: invoicesData.factures.map(f => [
          f.numero,
          f.client,
          f.date,
          `${f.montant} DT`,
          f.statut
        ]),
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] }
      });
    }
    
    // Page 4: Top clients
    if (clientsData?.topClients?.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('TOP 10 CLIENTS', 14, 22);
      
      // ✅ CORRECTION
      autoTable(doc, {
        startY: 30,
        head: [['Client', 'Type', 'Commandes', 'CA']],
        body: clientsData.topClients.map(c => [
          c.nom,
          c.type,
          c.commandes,
          `${c.ca} DT`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [155, 89, 182] }
      });
    }
    
    doc.save(`rapport_complet_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erreur export global PDF:', error);
  } finally {
    setLoading(false);
  }
};

  // ✅ EXPORT GLOBAL EXCEL UNIQUE
  const exportGlobalExcel = async () => {
    try {
      setLoading(true);
      
      const [salesData, invoicesData, clientsData] = await Promise.all([
        reportService.getSalesReport(filters),
        reportService.getInvoicesReport(filters),
        reportService.getClientsReport(filters)
      ]);

      const wb = XLSX.utils.book_new();
      
      // ============================================
      // FEUILLE 1: SYNTHÈSE GLOBALE
      // ============================================
      const summaryData = [
        ['📊 RAPPORT GLOBAL', ''],
        ['Date génération', new Date().toLocaleDateString('fr-FR')],
        ['Période', filters.period],
        ['', ''],
        ['📈 VENTES', ''],
        ['CA Total', salesData?.summary?.totalCA || 0, 'DT'],
        ['Nombre commandes', salesData?.summary?.totalCommandes || 0],
        ['Panier moyen', salesData?.summary?.panierMoyen || 0, 'DT'],
        ['Taux transformation', salesData?.summary?.tauxTransformation || 0, '%'],
        ['', ''],
        ['💰 FACTURES', ''],
        ['Total factures', invoicesData?.summary?.totalFactures || 0],
        ['Montant total', invoicesData?.summary?.montantTotal || 0, 'DT'],
        ['Payées', invoicesData?.summary?.payees || 0],
        ['Impayées', invoicesData?.summary?.impayees || 0],
        ['Taux recouvrement', invoicesData?.summary?.tauxRecouvrement || 0, '%'],
        ['', ''],
        ['👥 CLIENTS', ''],
        ['Total clients', clientsData?.summary?.totalClients || 0],
        ['Nouveaux clients', clientsData?.summary?.nouveauxClients || 0],
        ['Clients actifs', clientsData?.summary?.clientsActifs || 0],
        ['CA total clients', clientsData?.summary?.caTotal || 0, 'DT'],
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse');

      // ============================================
      // FEUILLE 2: VENTES - DÉTAIL
      // ============================================
      if (salesData?.ventes?.length > 0) {
        const ventesData = salesData.ventes.map(v => ({
          'Date': v.date,
          'Référence': v.reference,
          'Client': v.client,
          'Montant (DT)': v.montant,
          'Statut': v.statut,
          'Produits': v.nbProduits || 0
        }));
        
        const wsSales = XLSX.utils.json_to_sheet(ventesData);
        wsSales['!cols'] = [
          { wch: 12 }, { wch: 15 }, { wch: 25 }, 
          { wch: 12 }, { wch: 15 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(wb, wsSales, 'Ventes');
      }

      // ============================================
      // FEUILLE 3: FACTURES - DÉTAIL
      // ============================================
      if (invoicesData?.factures?.length > 0) {
        const facturesData = invoicesData.factures.map(f => ({
          'N° Facture': f.numero,
          'Date': f.date,
          'Client': f.client,
          'Montant (DT)': f.montant,
          'Statut': f.statut
        }));
        
        const wsInvoices = XLSX.utils.json_to_sheet(facturesData);
        wsInvoices['!cols'] = [
          { wch: 15 }, { wch: 12 }, { wch: 25 }, 
          { wch: 12 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsInvoices, 'Factures');
      }

      // ============================================
      // FEUILLE 4: CLIENTS - TOP 10
      // ============================================
      if (clientsData?.topClients?.length > 0) {
        const topClientsData = clientsData.topClients.map((c, i) => ({
          'Rang': i + 1,
          'Client': c.nom,
          'Type': c.type,
          'Commandes': c.commandes,
          'CA (DT)': c.ca,
          'Panier moyen': c.panierMoyen || 0
        }));
        
        const wsTop = XLSX.utils.json_to_sheet(topClientsData);
        wsTop['!cols'] = [
          { wch: 5 }, { wch: 25 }, { wch: 15 }, 
          { wch: 10 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsTop, 'Top Clients');
      }

      // ============================================
      // FEUILLE 5: CLIENTS - RÉPARTITION
      // ============================================
      if (clientsData?.repartitionParType) {
        const repartitionData = Object.entries(clientsData.repartitionParType).map(([type, stats]) => ({
          'Type': type,
          'Clients': stats.nombre,
          'CA (DT)': stats.ca,
          'Panier moyen': stats.panierMoyen || 0
        }));
        
        const wsRepartition = XLSX.utils.json_to_sheet(repartitionData);
        wsRepartition['!cols'] = [
          { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsRepartition, 'Répartition');
      }

      XLSX.writeFile(wb, `rapport_complet_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur export global Excel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Détection section active
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/sales')) return 'sales';
    if (path.includes('/invoices')) return 'invoices';
    if (path.includes('/clients')) return 'clients';
    return 'home';
  };

  const activeSection = getActiveSection();

  const navLinks = [
    {
      id: 'sales',
      label: 'Ventes',
      icon: FileText,
      path: '/dashboard/sales/reports/sales',
      color: 'blue',
      description: 'Analyse des ventes et commandes'
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: Receipt,
      path: '/dashboard/sales/reports/invoices',
      color: 'green',
      description: 'Suivi des factures'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      path: '/dashboard/sales/reports/clients',
      color: 'purple',
      description: 'Analyse des clients'
    }
  ];

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive
        ? 'bg-blue-100 text-blue-700 border-blue-300'
        : 'text-blue-600 hover:bg-blue-50',
      green: isActive
        ? 'bg-green-100 text-green-700 border-green-300'
        : 'text-green-600 hover:bg-green-50',
      purple: isActive
        ? 'bg-purple-100 text-purple-700 border-purple-300'
        : 'text-purple-600 hover:bg-purple-50'
    };
    return colors[color];
  };

  return (
    <div className="space-y-6 p-6">
      {/* ✅ Navigation avec boutons d'export global ET bouton refresh général */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Navigation à gauche */}
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.id}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all 
                     ${getColorClasses(link.color, isActive)}
                     ${isActive ? 'font-medium border shadow-sm' : ''}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* ✅ Boutons d'action dans la barre de navigation */}
          <div className="flex items-center gap-2">
            {/* Bouton Refresh général */}
            <button
              onClick={refreshAllReports}
              disabled={loading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm disabled:opacity-50 border"
              title="Rafraîchir tous les rapports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Rafraîchir</span>
            </button>

            {/* Séparateur vertical */}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Boutons d'export global */}
            <button
              onClick={exportGlobalPDF}
              disabled={loading}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm disabled:opacity-50"
              title="Exporter tout en PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              onClick={exportGlobalExcel}
              disabled={loading}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm disabled:opacity-50"
              title="Exporter tout en Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Excel</span>
            </button>
            
            {/* Indicateur de page */}
            <div className="flex items-center gap-2 text-sm text-gray-500 border-l pl-4 ml-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden lg:inline">
                {navLinks.find(l => l.id === activeSection)?.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - uniquement sur home */}
      {activeSection === 'home' && (
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          onRefresh={refreshAllReports}
          loading={loading}
        />
      )}

      {/* Cartes - uniquement sur home */}
      {activeSection === 'home' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReportCard
              title="Rapport des Ventes"
              description="Analyse détaillée des ventes"
              icon="📈"
              link="/dashboard/sales/reports/sales"
              formats={['PDF', 'Excel']}
              stats={{ label: 'Commandes', value: stats?.totalCommandes || '...' }}
              color="blue"
            />
            <ReportCard
              title="Rapport des Factures"
              description="Suivi des factures"
              icon="💰"
              link="/dashboard/sales/reports/invoices"
              formats={['PDF', 'Excel']}
              stats={{ label: 'Impayées', value: stats?.facturesImpayees || '...' }}
              color="green"
            />
            <ReportCard
              title="Rapport Clients"
              description="Analyse des clients"
              icon="👥"
              link="/dashboard/sales/reports/clients"
              formats={['Excel']}
              stats={{ label: 'Actifs', value: stats?.clientsActifs || '...' }}
              color="purple"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">
                  Export unique
                </h3>
                <p className="text-blue-600 text-sm">
                  Un seul bouton pour exporter tous les rapports (Ventes, Factures et Clients) 
                  dans un même fichier PDF ou Excel.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contenu des routes enfants */}
      <Outlet context={{ filters }} />

      {/* Indicateur de chargement */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 border border-gray-200">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Génération du rapport...</span>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;