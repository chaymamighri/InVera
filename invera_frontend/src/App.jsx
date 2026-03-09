// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import SalesDashboard from './pages/dashboard/sales/SalesDashboard';
import ProductsPage from './pages/dashboard/sales/products/ProductsConsultationPage';
import OrdersPage from './pages/dashboard/sales/orders/OrderPage';
import ProcurementDashboard from './pages/dashboard/procurement/ProcurementDashboard';

import Header from './components/Header';
import ProfilePage from './pages/shared/profilePage';
import SettingsPage from './pages/shared/settingPage';
import DashboardPage from './pages/dashboard/sales/statistic/DashboardPage';
import SalesPage from './pages/dashboard/sales/sales/SalesPage';
import CreatePasswordPage from './pages/CreatePasswordPage';

import LoginPage from './pages/auth/loginPage';
import InvoicingPage from './pages/dashboard/sales/invoicing/InvoicingPage';
import ClientManagePage from './pages/dashboard/sales/clients/ClientPageManage';
import SalesTab from './pages/dashboard/sales/reports/tabs/SalesTab';
import InvoicesTab from './pages/dashboard/sales/reports/tabs/InvoicesTab';
import ClientsTab from './pages/dashboard/sales/reports/tabs/ClientsTab';
import ReportsPage from './pages/dashboard/sales/reports/ReportsPage';
import { SidebarProvider } from './context/SidebarContext';

const ROLE_MAPPING = {
  ADMIN: 'admin',
  ROLE_ADMIN: 'admin',
  COMMERCIAL: 'sales',
  ROLE_COMMERCIAL: 'sales',
  RESPONSABLE_ACHAT: 'procurement',
  ROLE_RESPONSABLE_ACHAT: 'procurement'
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
  const token = localStorage.getItem('token');
  if (!token) return null;

  const storedRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'Utilisateur';
  const userEmail = localStorage.getItem('userEmail') || '';

  const inferred = storedRole || inferRoleFromToken(token);
  const frontendRole = normalizeBackendRole(inferred);

  if (!frontendRole) return null;

  return {
    token,
    role: frontendRole,
    originalRole: inferred,
    name: userName,
    email: userEmail
  };
};

const Layout = ({ children, userRole }) => (
  <div className="min-h-screen flex flex-col">
    <Header userRole={userRole} />
    <main className="flex-grow bg-gray-50">{children}</main>
  </div>
);

const PublicLayout = ({ children }) => children;

const DashboardRedirect = () => {
  const userData = getUserData();
  if (!userData) return <Navigate to="/login" replace />;

  switch (userData.role) {
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

// fonction ProtectedRoute qui accepter le paramètre useLayout
const ProtectedRoute = ({ children, allowedRoles = [], useLayout = true }) => {
  const userData = getUserData();
  if (!userData) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(userData.role)) return <Navigate to="/unauthorized" replace />;

  // Si useLayout est false, on retourne directement les enfants sans Layout
  if (!useLayout) return children;

  // Sinon, on utilise le Layout standard
  return <Layout userRole={userData.originalRole}>{children}</Layout>;
};

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

function App() {
  return (
  <Router>
  <SidebarProvider>
 <Toaster
  position="top-right"
  containerStyle={{
    top: 80,
    right: 20,
  }}
  toastOptions={{
    duration: 5000,
    closeButton: true,
    
    // Style de base pour tous les toasts
    style: {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#f8fafc',
      padding: '16px 20px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '1px solid #334155',
      maxWidth: '380px',
    },
    
    // Configuration spécifique pour les succès
    success: {
      duration: 6000,
      icon: '✅', // ← Garde l'icône
      style: {
        background: '#0f172a',
        border: '1px solid #10b981',
      },
      // Pas besoin de répéter closeButton ici car hérité
    },
    
    // Configuration spécifique pour les erreurs
    error: {
      duration: 8000,
      icon: '❌', // ← Garde l'icône
      style: {
        background: '#0f172a',
        border: '1px solid #ef4444',
      },
    },
    
    // Configuration spécifique pour le loading
    loading: {
      duration: Infinity,
      icon: '⏳', // ← Garde l'icône
      style: {
        background: '#0f172a',
        border: '1px solid #6b7280',
      },
    },
  }}
/>
  <Routes>
        {/* ✅ ALWAYS LAND ON LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
        <Route path="/create-password" element={<PublicLayout><CreatePasswordPage /></PublicLayout>} />

        {/* Dashboards */}
         <Route
    path="/dashboard/admin/*" 
    element={
      <ProtectedRoute allowedRoles={['admin']} useLayout={true}>
        <AdminDashboard />
      </ProtectedRoute>
    }
  /> {/* Procurement Dashboard - SANS Layout car il a sa propre sidebar */}
  <Route
    path="/dashboard/procurement"
    element={
      <ProtectedRoute allowedRoles={['procurement']} useLayout={true}>
        <ProcurementDashboard />
      </ProtectedRoute>
    }
  />

  {/* Sales Dashboard - AVEC Layout (utilisation du Header standard) */}
  <Route
    path="/dashboard/sales"
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

           {/* ✅ Routes pour les rapports  */}
          <Route path="reports" element={<ReportsPage />}>
          <Route index element={<Navigate to="sales" replace />} />
          <Route path="sales" element={<SalesTab />} />
          <Route path="invoices" element={<InvoicesTab />} />
          <Route path="clients" element={<ClientsTab />} />
          </Route>
          </Route>

        {/* Shared */}
       <Route
    path="/profile"
    element={
      <ProtectedRoute allowedRoles={['admin', 'sales', 'procurement']} useLayout={false}>
        <ProfilePage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/settings"
    element={
      <ProtectedRoute allowedRoles={['admin', 'sales', 'procurement']} useLayout={false}>
        <SettingsPage />
      </ProtectedRoute>
    }
  />

        {/* Redirect helper */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* 404 */}
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
    </Router>
  );
}
export default App;