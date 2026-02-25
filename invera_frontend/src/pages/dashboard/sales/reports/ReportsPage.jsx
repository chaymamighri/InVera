// src/pages/dashboard/sales/reports/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Outlet, NavLink } from 'react-router-dom';
import { FileText, Receipt, Users, BarChart3 } from 'lucide-react';
import ReportCard from './components/ReportCard';
import reportService from '../../../../services/ReportService';

// Créer un contexte pour partager la fonction de rafraîchissement
export const RefreshContext = React.createContext();

const ReportsPage = () => {
  const location = useLocation();

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
      
      // 4. Valeur par défaut
      console.log('⚠️ Aucun utilisateur trouvé, utilisation de la valeur par défaut');
      return 'Chayma Mighri'; 
      
    } catch (error) {
      console.error('❌ Erreur dans getCurrentUser:', error);
      return 'Utilisateur';
    }
  };

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
      {/* ✅ Navigation simplifiée sans boutons d'export */}
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

          {/* Indicateur de page à droite */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden lg:inline">
              {navLinks.find(l => l.id === activeSection)?.description}
            </span>
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
                  Exports disponibles
                </h3>
                <p className="text-blue-600 text-sm">
                  Les exports PDF et Excel sont disponibles directement dans chaque onglet 
                  (Ventes, Factures et Clients) avec un design moderne incluant le logo InVera.
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
          <span className="text-sm text-gray-600">Chargement...</span>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;