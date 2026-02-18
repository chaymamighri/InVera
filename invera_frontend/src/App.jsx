// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import SalesDashboard from './pages/dashboard/sales/SalesDashboard';
import ProductsPage from './pages/dashboard/sales/products/ProductsConsultationPage';
import OrdersPage from './pages/dashboard/sales/orders/OrderPage';
import ProcurementDashboard from './pages/dashboard/procurement/ProcurementDashboard';

import Header from './components/Header';
import ProfilePage from './pages/shared/profilePage';
import SettingsPage from './pages/shared/settingPage';
import DashboardContent from './pages/dashboard/sales/statistic/DashboardContent';
import SalesPage from './pages/dashboard/sales/sales/SalesPage';
import CreatePasswordPage from './pages/CreatePasswordPage';

import LoginPage from './pages/auth/loginPage';
import InvoicingPage from './pages/dashboard/sales/invoicing/InvoicingPage';

// Mapping des rôles entre API (backend) et frontend
const ROLE_MAPPING = {
  'ADMIN': 'admin',
  'ROLE_ADMIN': 'admin',

  'COMMERCIAL': 'sales',
  'ROLE_COMMERCIAL': 'sales',

  'RESPONSABLE_ACHAT': 'procurement',
  'ROLE_RESPONSABLE_ACHAT': 'procurement'
};

const normalizeBackendRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return ROLE_MAPPING[normalized] || normalized.toLowerCase();
};

// ✅ Try to infer role from JWT if localStorage role is missing
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

    // authorities can be: ["ROLE_ADMIN"] or "ROLE_ADMIN"
    if (Array.isArray(possible)) {
      return possible[0] ? String(possible[0]) : null;
    }
    if (typeof possible === 'string') {
      // sometimes scope contains: "ROLE_ADMIN ROLE_X"
      const first = possible.split(' ').find(Boolean);
      return first || possible;
    }
    return null;
  } catch {
    return null;
  }
};

// Layout général pour les pages protégées
const Layout = ({ children, userRole }) => (
  <div className="min-h-screen flex flex-col">
    <Header userRole={userRole} />
    <main className="flex-grow bg-gray-50">{children}</main>
  </div>
);

// Layout pour les pages publiques
const PublicLayout = ({ children }) => children;

// ✅ Auth + role getter (NO MORE default admin)
const getUserData = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const storedRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'Utilisateur';
  const userEmail = localStorage.getItem('userEmail') || '';

  // role fallback: infer from token if not stored
  const inferred = storedRole || inferRoleFromToken(token);
  const frontendRole = normalizeBackendRole(inferred);

  // If we cannot determine role, treat as unauthenticated (prevents "default admin")
  if (!frontendRole) return null;

  return {
    token,
    role: frontendRole,          // admin | sales | procurement
    originalRole: inferred,      // backend format
    name: userName,
    email: userEmail
  };
};

// Redirection automatique selon rôle
const DashboardRedirect = () => {
  const userData = getUserData();
  if (!userData) return <Navigate to="/login" />;

  switch (userData.role) {
    case 'admin': return <Navigate to="/dashboard/admin" />;
    case 'sales': return <Navigate to="/dashboard/sales/dashboard" />;
    case 'procurement': return <Navigate to="/dashboard/procurement" />;
    default: return <Navigate to="/login" />;
  }
};

// Route protégée avec contrôle de rôle
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userData = getUserData();
  if (!userData) return <Navigate to="/login" />;

  if (!allowedRoles.includes(userData.role)) return <Navigate to="/unauthorized" />;

  return <Layout userRole={userData.originalRole}>{children}</Layout>;
};

// Page d'erreur 403
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <h2 className="text-2xl font-semibold mt-4">Accès non autorisé</h2>
      <p className="mt-2 text-gray-600">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <div className="mt-6 space-x-4">
        <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Retour
        </button>
        <button onClick={() => window.location.href = '/login'} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
          Se connecter
        </button>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>

        {/* Pages publiques */}
        <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
        <Route path="/create-password" element={<PublicLayout><CreatePasswordPage /></PublicLayout>} />

        {/* Dashboard Admin */}
        <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        {/* Dashboard Procurement */}
        <Route path="/dashboard/procurement" element={<ProtectedRoute allowedRoles={['procurement', 'admin']}><ProcurementDashboard /></ProtectedRoute>} />

        {/* Dashboard Sales */}
        <Route path="/dashboard/sales" element={<ProtectedRoute allowedRoles={['sales', 'admin']}><SalesDashboard /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardContent />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="invoices" element={<InvoicingPage />} />
        </Route>

        {/* Pages partagées */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'sales', 'procurement']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'sales', 'procurement']}><SettingsPage /></ProtectedRoute>} />

        {/* Redirection selon rôle */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Page 403 */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Redirection racine */}
        <Route path="/" element={getUserData() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

        {/* Page 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-700">404</h1>
              <h2 className="text-2xl font-semibold mt-4">Page non trouvée</h2>
              <button onClick={() => window.location.href = '/'} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Retour à l'accueil
              </button>
            </div>
          </div>
        }/>
      </Routes>
    </Router>
  );
}

export default App;
