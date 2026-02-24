// src/pages/dashboard/sales/reports/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Outlet, NavLink } from 'react-router-dom';
import { FileText, Receipt, Users, BarChart3, Download } from 'lucide-react';
import ReportCard from './components/ReportCard';
import reportService from '../../../../services/ReportService';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Créer un contexte pour partager la fonction de rafraîchissement
export const RefreshContext = React.createContext();

const ReportsPage = () => {
  const location = useLocation();

// src/pages/dashboard/sales/reports/ReportsPage.jsx

// ✅ Fonction pour récupérer l'utilisateur connecté
const getCurrentUser = () => {
  try {
    // 1. Essayer de récupérer depuis 'userName' (directement disponible)
    const userName = localStorage.getItem('userName');
    if (userName) {
      console.log('✅ Utilisateur trouvé via userName:', userName);
      return userName;
    }
    
    // 2. Essayer de récupérer depuis 'userEmail' (fallback)
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      console.log('✅ Utilisateur trouvé via userEmail:', userEmail);
      return userEmail;
    }
    
    // 3. Essayer de décoder le token JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Décoder la partie payload du JWT (deuxième partie)
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('✅ Token décodé:', decoded);
          
          // Retourner le nom depuis le token (nom + prénom)
          if (decoded.nom && decoded.prenom) {
            return `${decoded.prenom} ${decoded.nom}`;
          }
          if (decoded.nom) return decoded.nom;
          if (decoded.sub) return decoded.sub;
        }
      } catch (e) {
        console.log('⚠️ Erreur décodage token:', e);
      }
    }
    
    // 4. Essayer de récupérer depuis 'users-management' (si besoin)
    const usersStr = localStorage.getItem('users-management');
    if (usersStr) {
      try {
        const users = JSON.parse(usersStr);
        // Chercher l'utilisateur connecté (si vous avez son ID ailleurs)
        // Cette partie dépend de comment vous identifiez l'utilisateur courant
      } catch (e) {}
    }
    
    // 5. Valeur par défaut
    console.log('⚠️ Aucun utilisateur trouvé, utilisation de la valeur par défaut');
    return 'Chayma Mighri'; // Vous pouvez mettre le nom par défaut que vous voulez
    
  } catch (error) {
    console.error('❌ Erreur dans getCurrentUser:', error);
    return 'Utilisateur';
  }
};

  // ✅ Filtres de date seulement (pour l'export global)
  const [dateFilters] = useState({
    period: 'month',
    startDate: null,
    endDate: null
  });

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  // ✅ État pour forcer le rechargement des données enfants
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // ✅ EXPORT GLOBAL PDF UNIQUE
  const exportGlobalPDF = async () => {
    try {
      setLoading(true);
      
      const [salesData, invoicesData, clientsData] = await Promise.all([
        reportService.getSalesReport(dateFilters),
        reportService.getInvoicesReport(dateFilters),
        reportService.getClientsReport(dateFilters)
      ]);

      const doc = new jsPDF();
      const currentUser = getCurrentUser();
      const today = new Date().toLocaleDateString('fr-FR');
      
      // Page 1: Synthèse globale
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text('RAPPORT GLOBAL', 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${today}`, 14, 32);
      doc.text(`Généré par: ${currentUser}`, 14, 38);
      doc.text(`Période: ${dateFilters.period}`, 14, 44);

      // Résumé global
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('SYNTHÈSE', 14, 54);

      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);

      let y = 64;

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
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Rapport généré par ${currentUser} le ${today}`, 14, doc.internal.pageSize.height - 10);
      }
      
      // Page 3: Détail des factures
      if (invoicesData?.factures?.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text('DÉTAIL DES FACTURES', 14, 22);
        
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
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Rapport généré par ${currentUser} le ${today}`, 14, doc.internal.pageSize.height - 10);
      }
      
      // Page 4: Top clients
      if (clientsData?.topClients?.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text('TOP 10 CLIENTS', 14, 22);
        
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
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Rapport généré par ${currentUser} le ${today}`, 14, doc.internal.pageSize.height - 10);
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
        reportService.getSalesReport(dateFilters),
        reportService.getInvoicesReport(dateFilters),
        reportService.getClientsReport(dateFilters)
      ]);

      const wb = XLSX.utils.book_new();
      const currentUser = getCurrentUser();
      const today = new Date().toLocaleDateString('fr-FR');
      
      // FEUILLE 1: SYNTHÈSE GLOBALE
      const summaryData = [
        ['📊 RAPPORT GLOBAL', ''],
        ['Date génération', today],
        ['Généré par', currentUser],
        ['Période', dateFilters.period],
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

      // FEUILLE 2: VENTES - DÉTAIL
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

      // FEUILLE 3: FACTURES - DÉTAIL
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

      // FEUILLE 4: CLIENTS - TOP 10
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

      // FEUILLE 5: CLIENTS - RÉPARTITION
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
      {/* ✅ Navigation avec boutons d'export */}
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

          {/* ✅ Boutons d'export */}
          <div className="flex items-center gap-2">
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

      {/* ✅ Cartes - uniquement sur home */}
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

      {/* ✅ Contenu des routes enfants */}
      <Outlet context={{ refreshTrigger }} />

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