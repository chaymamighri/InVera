/**
 * App.jsx - Point d'entrée principal de l'application
 * 
 * RÔLE : Configurer le routage, l'authentification et la mise en page
 * 
 * FONCTIONNALITÉS PRINCIPALES :
 * - Routes publiques (login, création mot de passe)
 * - Routes protégées par rôle (admin, sales, procurement, super_admin)
 * - Layout adaptatif (avec/sans Header)
 * - Redirection automatique selon le rôle
 * - Gestion des erreurs (403, 404)
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// ============================================
// IMPORTS DES PAGES - DASHBOARDS
// ============================================
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import SalesDashboard from './pages/dashboard/sales/SalesDashboard';
import ProcurementDashboard from './pages/dashboard/procurement/ProcurementDashboard';

// ============================================
// IMPORTS DES PAGES - SALES (Commercial)
// ============================================
import DashboardPage from './pages/dashboard/sales/statistic/DashboardPage';
import ProductsPage from './pages/dashboard/sales/products/ProductsConsultationPage';
import OrdersPage from './pages/dashboard/sales/orders/OrderPage';
import SalesPage from './pages/dashboard/sales/sales/SalesPage';
import InvoicingPage from './pages/dashboard/sales/invoicing/InvoicingPage';
import ClientManagePage from './pages/dashboard/sales/clients/ClientPageManage';

// ============================================
// IMPORTS DES PAGES - PROCUREMENT (Achats)
// ============================================
import StatsAchats from './pages/dashboard/procurement/Statistique/StatsAchats';
import Produits from './pages/dashboard/procurement/produits/Produits';
import GestionCategories from './pages/dashboard/procurement/categories/GestionCategories';
import CommandesFournisseurs from './pages/dashboard/procurement/commandeFournisseur/CommandesFournisseurs';
import StockMovementsPage from './pages/dashboard/procurement/stock/mouvement/StockMovementsPage';
import EtatStock from './pages/dashboard/procurement/stock/etat/etatStock';

// ============================================
// IMPORTS DES PAGES - AUTH & SHARED
// ============================================
import LoginPage from './pages/auth/loginPage';
import CreatePasswordPage from './pages/CreatePasswordPage';
import ProfilePage from './pages/shared/profilePage';
import SettingsPage from './pages/shared/settingPage';

// ============================================
// IMPORTS DES COMPOSANTS & CONTEXTES
// ============================================
import Header from './components/Header';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import ValidationCommande from './pages/dashboard/admin/ValidationCommande/ValidationCommande';
import Statistiques from './pages/dashboard/admin/statestiques/Statistiques';
import GestionUsers from './pages/dashboard/admin/users/gestionUsers';
import Remise from './pages/dashboard/admin/remise/RemiseProduit';
import FournisseurManagement from './pages/dashboard/admin/fournisseurs/Fournisseurs';
import AdminLogin from './pages/superAdmin/AdminLogin';
import SuperAdminDashboard from './pages/superAdmin/SuperAdminDashboard';
import SalesTable from './pages/dashboard/sales/sales/components/SalesTable';

// ============================================
// MAPPING DES RÔLES (Backend → Frontend)
// ============================================

const ROLE_MAPPING = {
  ADMIN: 'admin',
  ROLE_ADMIN: 'admin',
  COMMERCIAL: 'sales',
  ROLE_COMMERCIAL: 'sales',
  RESPONSABLE_ACHAT: 'procurement',
  ROLE_RESPONSABLE_ACHAT: 'procurement',
  SUPER_ADMIN: 'super_admin',
  ROLE_SUPER_ADMIN: 'super_admin'
};

const normalizeBackendRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return ROLE_MAPPING[normalized] || normalized.toLowerCase();
};

const inferRoleFromToken = (token) => {
  try {
    const raw = String(token || '').trim();
    const parts = raw.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    const possible =
      payload?.role ||
      payload?.roles ||
      payload?.authority ||
      payload?.authorities ||
      payload?.scope;

    if (Array.isArray(possible)) return possible[0] ? String(possible[0]) : null;
    if (typeof possible === 'string') return possible.split(' ').find(Boolean) || possible;
    return null;
  } catch {
    return null;
  }
};

const getUserData = () => {
  console.log('=== getUserData START ===');
  
  // ============================================
  // 1. DÉTECTER LE TYPE D'AUTHENTIFICATION
  // ============================================
  
  // Vérifier si c'est un SUPER ADMIN (basé sur adminToken)
  const adminToken = localStorage.getItem('adminToken');
  const isSuperAdmin = adminToken && localStorage.getItem('adminInfo');
  
  // Vérifier si c'est un UTILISATEUR NORMAL
  const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  const isNormalUser = userToken && userRole;
  
  console.log('isSuperAdmin:', isSuperAdmin);
  console.log('isNormalUser:', isNormalUser);
  
  // ============================================
  // 2. CAS SUPER ADMIN (priorité absolue si c'est la route super admin)
  // ============================================
  
  // Détecter si on est sur une route super admin
  const currentPath = window.location.pathname;
  const isSuperAdminRoute = currentPath.startsWith('/super-admin');
  
  console.log('Current path:', currentPath);
  console.log('Is super admin route:', isSuperAdminRoute);
  
  // Si on est sur une route super admin, utiliser le token super admin
  if (isSuperAdminRoute && adminToken) {
    console.log('✅ Mode Super Admin (route spécifique)');
    const adminInfo = localStorage.getItem('adminInfo');
    let adminName = 'Super Admin';
    let adminEmail = '';
    
    if (adminInfo) {
      try {
        const info = JSON.parse(adminInfo);
        adminName = info.nom || adminName;
        adminEmail = info.email || '';
      } catch(e) {}
    }
    
    return {
      token: adminToken,
      role: 'super_admin',
      originalRole: 'SUPER_ADMIN',
      name: adminName,
      email: adminEmail,
      type: 'super_admin'
    };
  }
  
  // ============================================
  // 3. CAS UTILISATEUR NORMAL
  // ============================================
  
  if (userToken && userRole) {
    console.log('✅ Mode Utilisateur Normal');
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Utilisateur';
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
    
    // Normaliser le rôle
    const roleMap = {
      'ROLE_ADMIN': 'admin', 'ADMIN': 'admin',
      'ROLE_COMMERCIAL': 'sales', 'COMMERCIAL': 'sales',
      'ROLE_RESPONSABLE_ACHAT': 'procurement', 'RESPONSABLE_ACHAT': 'procurement',
    };
    
    const normalizedRole = roleMap[userRole?.toUpperCase()];
    
    if (normalizedRole) {
      return {
        token: userToken,
        role: normalizedRole,
        originalRole: userRole,
        name: userName,
        email: userEmail,
        type: 'normal_user'
      };
    }
  }
  
  // ============================================
  // 4. CAS SUPER ADMIN (fallback si pas sur route spécifique)
  // ============================================
  
  if (adminToken) {
    console.log('✅ Mode Super Admin (fallback)');
    const adminInfo = localStorage.getItem('adminInfo');
    let adminName = 'Super Admin';
    let adminEmail = '';
    
    if (adminInfo) {
      try {
        const info = JSON.parse(adminInfo);
        adminName = info.nom || adminName;
        adminEmail = info.email || '';
      } catch(e) {}
    }
    
    return {
      token: adminToken,
      role: 'super_admin',
      originalRole: 'SUPER_ADMIN',
      name: adminName,
      email: adminEmail,
      type: 'super_admin'
    };
  }
  
  console.log('❌ Aucun utilisateur authentifié');
  return null;
};

// ============================================
// COMPOSANTS DE MISE EN PAGE
// ============================================

const Layout = ({ children, userRole }) => (
  <div className="min-h-screen flex flex-col">
    <Header userRole={userRole} />
    <main className="flex-grow bg-gray-50">{children}</main>
  </div>
);

const PublicLayout = ({ children }) => children;

// ============================================
// REDIRECTION PAR RÔLE
// ============================================

const DashboardRedirect = () => {
  const userData = getUserData();
  if (!userData) return <Navigate to="/login" replace />;

  switch (userData.role) {
    case 'super_admin':
      return <Navigate to="/super-admin/clients" replace />;
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'sales':
      return <Navigate to="/dashboard/sales/dashboard" replace />;
    case 'procurement':
      return <Navigate to="/dashboard/procurement" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// ============================================
// COMPOSANT DE PROTECTION DES ROUTES
// ============================================

const ProtectedRoute = ({ children, allowedRoles = [], useLayout = true }) => {
  const userData = getUserData();
  
  if (!userData) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(userData.role)) return <Navigate to="/unauthorized" replace />;
  if (!useLayout) return children;

  return <Layout userRole={userData.originalRole}>{children}</Layout>;
};

// ============================================
// PAGE D'ERREUR 403 (Non autorisé)
// ============================================

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <h2 className="text-2xl font-semibold mt-4">Accès non autorisé</h2>
      <p className="mt-2 text-gray-600">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <div className="mt-6 space-x-4">
        <button
          onClick={() => window.history.back()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Retour
        </button>
        <button
          onClick={() => (window.location.href = '/login')}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Se connecter
        </button>
      </div>
    </div>
  </div>
);

// ============================================
// COMPOSANT PRINCIPAL APP
// ============================================

function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>
          
          <Toaster
            position="top-right"
            containerStyle={{ top: 80, right: 24 }}
            toastOptions={{
              duration: 5000,
              closeButton: true,
              style: {
                borderRadius: "10px",
                background: "#ffffff",
                color: "#0f172a",
                padding: "14px 18px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
                maxWidth: "360px",
              },
              success: {
                icon: "✓",
                duration: 5000,
                style: { borderLeft: "4px solid #22c55e" },
              },
              error: {
                icon: "✕",
                duration: 7000,
                style: { borderLeft: "4px solid #ef4444" },
              },
              loading: {
                icon: "⏳",
                duration: Infinity,
                style: { borderLeft: "4px solid #3b82f6" },
              },
            }}
          />

          <Routes>
            {/* ============================================
                REDIRECTION PAR DÉFAUT
                ============================================ */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ============================================
                ROUTES PUBLIQUES
                ============================================ */}
            <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
            <Route path="/create-password" element={<PublicLayout><CreatePasswordPage /></PublicLayout>} />

            {/* ============================================
                ROUTES SUPER ADMIN
                ============================================ */}
            <Route path="/super-admin/login" element={<PublicLayout><AdminLogin /></PublicLayout>} />
            
            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_admin']} useLayout={false}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="clients" replace />} />
              <Route path="clients" element={<div className="p-6"><h1 className="text-2xl font-bold">Gestion des clients</h1></div>} />
              <Route path="abonnements" element={<div className="p-6"><h1 className="text-2xl font-bold">Gestion des abonnements</h1></div>} />
              <Route path="paiements" element={<div className="p-6"><h1 className="text-2xl font-bold">Gestion des paiements</h1></div>} />
            </Route>

            {/* ============================================
                ROUTES ADMIN
                ============================================ */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']} useLayout={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="stats" replace />} />
              <Route path="stats" element={<Statistiques />} />
              <Route path="validation-commandes" element={<ValidationCommande />} />
              <Route path="users" element={<GestionUsers />} />
              <Route path="remises" element={<Remise />} />
              <Route path="fournisseurs" element={<FournisseurManagement />} />
            </Route>

            {/* ============================================
                ROUTES PROCUREMENT (Achats)
                ============================================ */}
            <Route
              path="/dashboard/procurement/*"
              element={
                <ProtectedRoute allowedRoles={['procurement']} useLayout={true}>
                  <ProcurementDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="stats" replace />} />
              <Route path="stats" element={<StatsAchats />} />
              <Route path="produits" element={<Produits />} />
              <Route path="categories" element={<GestionCategories />} />
              <Route path="commandes" element={<CommandesFournisseurs />} />
              <Route path="mouvements" element={<StockMovementsPage />} />
              <Route path="etat_stock" element={<EtatStock />} />
            </Route>

            {/* ============================================
                ROUTES SALES (Commercial)
                ============================================ */}
            <Route
              path="/dashboard/sales/*"
              element={
                <ProtectedRoute allowedRoles={['sales']} useLayout={true}>
                  <SalesDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="invoices" element={<InvoicingPage />} />
              <Route path="clients" element={<ClientManagePage />} />
              <Route index element={<Navigate to="sales" replace />} />
              <Route path="sales" element={<SalesTable />} />
             
            </Route>
         

            {/* ============================================
                ROUTES PARTAGÉES (tous rôles)
                ============================================ */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales', 'procurement', 'super_admin']} useLayout={false}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales', 'procurement', 'super_admin']} useLayout={false}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* ============================================
                ROUTES UTILITAIRES
                ============================================ */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ============================================
                PAGE 404 (Non trouvée)
                ============================================ */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-700">404</h1>
                    <h2 className="text-2xl font-semibold mt-4">Page non trouvée</h2>
                    <button
                      onClick={() => (window.location.href = '/login')}
                      className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Aller à la connexion
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
          
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
