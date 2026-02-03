// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
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

// Layout général pour les pages protégées
const Layout = ({ children, userRole }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header userRole={userRole} />
      <main className="flex-grow bg-gray-50">{children}</main>
    </div>
  );
};

// Layout pour les pages publiques
const PublicLayout = ({ children }) => {
  return children;
};

// Vérification d'authentification et rôle
const getUserData = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const userRole = localStorage.getItem('userRole') || 'admin';
  const userName = localStorage.getItem('userName') || 'Utilisateur';

  return { token, role: userRole, name: userName };
};

// Redirection automatique selon rôle
const DashboardRedirect = () => {
  const userData = getUserData();
  if (!userData) return <Navigate to="/login" />;

  switch (userData.role) {
    case 'admin':
      return <Navigate to="/dashboard/admin" />;
    case 'sales':
      return <Navigate to="/dashboard/sales/products" />; // page par défaut sales
    case 'procurement':
      return <Navigate to="/dashboard/procurement" />;
    default:
      return <Navigate to="/login" />;
  }
};

// Route protégée avec contrôle de rôle
const ProtectedRoute = ({ children, allowedRoles = ['admin', 'sales', 'procurement'] }) => {
  const userData = getUserData();

  if (!userData) return <Navigate to="/login" />;
  if (!allowedRoles.includes(userData.role)) return <Navigate to="/unauthorized" />;

  return <Layout userRole={userData.role}>{children}</Layout>;
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
      <button
        onClick={() => window.history.back()}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Retour
      </button>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>

        {/* Pages publiques */}
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />

        {/* Dashboard Admin */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Procurement */}
        <Route
          path="/dashboard/procurement"
          element={
            <ProtectedRoute allowedRoles={['procurement']}>
              <ProcurementDashboard />
            </ProtectedRoute>
          }
        />
     {/* Dashboard Sales avec ses sous-pages */}
        <Route
          path="/dashboard/sales"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        >
           {/* Sous-routes */}
          <Route path="dashboard" element={<DashboardContent />} /> {/* /dashboard/sales/dashboard */}
          <Route path="products" element={<ProductsPage />} /> {/* /dashboard/sales/products */}
          <Route path="orders" element={<OrdersPage />} /> {/* /dashboard/sales/orders */}
          <Route path="sales" element={<SalesPage />} /> {/* /dashboard/sales/sales */}

            {/*  <Route path="invoicing" element={<InvoicingPage />} />
          <Route path="reports" element={<ReportsPage />} />  */}
        </Route>

        {/* Pages partagées */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />

        {/* Redirection selon rôle */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Page 403 */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Redirection racine */}
        <Route
          path="/"
          element={
            getUserData() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
