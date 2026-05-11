import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import { AuthProvider } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { SidebarProvider } from './context/SidebarContext';

import LoginPage from './pages/auth/loginPage';
import CreatePasswordPage from './pages/CreatePasswordPage';
import AdminLogin from './pages/superAdmin/AdminLogin';

import WelcomePage from './pages/public/WelcomePage';
import MoreInformationPage from './pages/public/MoreInformationPage';

import RegisterPage from './pages/Register/RegisterPage';

import ProfilePage from './pages/shared/profilePage';
import SettingsPage from './pages/shared/settingPage';
import SuperAdminProfilePage from './pages/superAdmin/profilePage';
import SuperAdminSettingsPage from './pages/superAdmin/settingPage';

import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import ValidationCommande from './pages/dashboard/admin/ValidationCommande/ValidationCommande';
import Statistiques from './pages/dashboard/admin/statestiques/Statistiques';
import GestionUsers from './pages/dashboard/admin/users/gestionUsers';
import Remise from './pages/dashboard/admin/remise/RemiseProduit';
import FournisseurManagement from './pages/dashboard/admin/fournisseurs/Fournisseurs';

import SalesDashboard from './pages/dashboard/sales/SalesDashboard';
import DashboardPage from './pages/dashboard/sales/statistic/DashboardPage';
import ProductsPage from './pages/dashboard/sales/products/ProductsConsultationPage';
import OrdersPage from './pages/dashboard/sales/orders/OrderPage';
import SalesPage from './pages/dashboard/sales/sales/SalesPage';
import InvoicingPage from './pages/dashboard/sales/invoicing/InvoicingPage';
import ClientManagePage from './pages/dashboard/sales/clients/ClientPageManage';
import SalesTable from './pages/dashboard/sales/sales/components/SalesTable';

import ProcurementDashboard from './pages/dashboard/procurement/ProcurementDashboard';
import StatsAchats from './pages/dashboard/procurement/Statistique/StatsAchats';
import Produits from './pages/dashboard/procurement/produits/Produits';
import GestionCategories from './pages/dashboard/procurement/categories/GestionCategories';
import CommandesFournisseurs from './pages/dashboard/procurement/commandeFournisseur/CommandesFournisseurs';
import StockMovementsPage from './pages/dashboard/procurement/stock/mouvement/StockMovementsPage';
import EtatStock from './pages/dashboard/procurement/stock/etat/etatStock';

import SuperAdminDashboard from './pages/superAdmin/SuperAdminDashboard';
import ClientsManagementPage from './pages/superAdmin/clients/ClientsManagementPage';
import SubscriptionsManagementPage from './pages/superAdmin/abonnements/SubscriptionsManagementPage';

import ConnexionInfoToast from './components/ConnexionInfoToast';

import ConditionsInvera from './pages/public/ConditionsInvera';
import ContactUsPage from './pages/public/ContactUsPage';

import PaymentPage from './pages/public/PaymentPage';

const ROLE_MAPPING = {
  SUPER_ADMIN: 'super_admin',
  ROLE_SUPER_ADMIN: 'super_admin',
  ADMIN_CLIENT: 'admin',
  ROLE_ADMIN_CLIENT: 'admin',
  ADMIN: 'admin',
  ROLE_ADMIN: 'admin',
  COMMERCIAL: 'sales',
  ROLE_COMMERCIAL: 'sales',
  RESPONSABLE_ACHAT: 'procurement',
  ROLE_RESPONSABLE_ACHAT: 'procurement',
};

const normalizeBackendRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return ROLE_MAPPING[normalized] || null;
};

const getUserData = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');

  if (!token) {
    return null;
  }

  const normalizedRole = normalizeBackendRole(userRole);

  if (!normalizedRole) {
    return null;
  }

  const userName =
    localStorage.getItem('userName') ||
    sessionStorage.getItem('userName') ||
    'Utilisateur';

  const userEmail =
    localStorage.getItem('userEmail') ||
    sessionStorage.getItem('userEmail') ||
    '';

  return {
    token,
    role: normalizedRole,
    originalRole: userRole,
    name: userName,
    email: userEmail,
    type: normalizedRole === 'super_admin'
      ? 'super_admin'
      : 'normal_user',
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
    case 'super_admin':
      return <Navigate to="/super-admin/dashboard/clients" replace />;

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

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  useLayout = true,
}) => {
  const userData = getUserData();

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userData.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!useLayout) {
    return children;
  }

  return (
    <Layout userRole={userData.originalRole}>
      {children}
    </Layout>
  );
};

const UnauthorizedPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">
          403
        </h1>

        <h2 className="text-2xl font-semibold mt-4">
          {t('app.unauthorizedTitle')}
        </h2>

        <p className="mt-2 text-gray-600">
          {t('app.unauthorizedDescription')}
        </p>

        <div className="mt-6 space-x-4">
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {t('app.back')}
          </button>

          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            {t('app.signIn')}
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { t } = useLanguage();

  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>

          <Toaster
            position="top-right"
            containerStyle={{ top: 80, right: 24 }}
          />

          <ConnexionInfoToast />

          <Routes>

            {/* ================================= */}
            {/* SINGLE PUBLIC LANDING PAGE */}
            {/* ================================= */}

            <Route
              path="/"
              element={
                <PublicLayout>
                  <WelcomePage />
                </PublicLayout>
              }
            />

            <Route
              path="/welcome"
              element={
                <PublicLayout>
                  <WelcomePage />
                </PublicLayout>
              }
            />

            {/* REDIRECT OLD ROUTES TO HOME */}

            <Route
              path="/more-information"
              element={<Navigate to="/features/documents" replace />}
            />

            <Route
              path="/features/:featureId"
              element={
                <PublicLayout>
                  <MoreInformationPage />
                </PublicLayout>
              }
            />

            <Route
              path="/subscriptions"
              element={<Navigate to="/" replace />}
            />

            {/* REGISTER */}

            <Route
              path="/register"
              element={
                <PublicLayout>
                  <RegisterPage />
                </PublicLayout>
              }
            />

            {/* PAYMENT */}

            <Route
              path="/paiement/checkout"
              element={
                <PublicLayout>
                  <PaymentPage />
                </PublicLayout>
              }
            />

            <Route
              path="/paiement/succes"
              element={
                <PublicLayout>
                  <PaymentPage />
                </PublicLayout>
              }
            />

            <Route
              path="/paiement/echec"
              element={
                <PublicLayout>
                  <PaymentPage />
                </PublicLayout>
              }
            />

            <Route
              path="/paiement/annuler"
              element={
                <PublicLayout>
                  <PaymentPage />
                </PublicLayout>
              }
            />

            {/* AUTH */}

            <Route
              path="/login"
              element={
                <PublicLayout>
                  <LoginPage />
                </PublicLayout>
              }
            />

            <Route
              path="/create-password"
              element={
                <PublicLayout>
                  <CreatePasswordPage />
                </PublicLayout>
              }
            />

            <Route
              path="/conditions-invera"
              element={
                <PublicLayout>
                  <ConditionsInvera />
                </PublicLayout>
              }
            />

            <Route
              path="/contact"
              element={
                <PublicLayout>
                  <ContactUsPage />
                </PublicLayout>
              }
            />

            <Route
              path="/super-admin/login"
              element={
                <PublicLayout>
                  <AdminLogin />
                </PublicLayout>
              }
            />

            {/* SUPER ADMIN */}

            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={['super_admin']}
                  useLayout={false}
                >
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="clients" replace />}
              />

              <Route
                path="clients"
                element={<ClientsManagementPage />}
              />

              <Route
                path="abonnements"
                element={<SubscriptionsManagementPage />}
              />

              <Route
                path="profile"
                element={<SuperAdminProfilePage />}
              />

              <Route
                path="settings"
                element={<SuperAdminSettingsPage />}
              />
            </Route>

            {/* ADMIN */}

            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute
                  allowedRoles={['admin']}
                  useLayout
                >
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="stats" replace />}
              />

              <Route
                path="stats"
                element={<Statistiques />}
              />

              <Route
                path="validation-commandes"
                element={<ValidationCommande />}
              />

              <Route
                path="users"
                element={<GestionUsers />}
              />

              <Route
                path="remises"
                element={<Remise />}
              />

              <Route
                path="fournisseurs"
                element={<FournisseurManagement />}
              />
            </Route>

            {/* PROCUREMENT */}

            <Route
              path="/dashboard/procurement/*"
              element={
                <ProtectedRoute
                  allowedRoles={['procurement']}
                  useLayout
                >
                  <ProcurementDashboard />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="stats" replace />}
              />

              <Route
                path="stats"
                element={<StatsAchats />}
              />

              <Route
                path="produits"
                element={<Produits />}
              />

              <Route
                path="categories"
                element={<GestionCategories />}
              />

              <Route
                path="commandes"
                element={<CommandesFournisseurs />}
              />

              <Route
                path="mouvements"
                element={<StockMovementsPage />}
              />

              <Route
                path="etat_stock"
                element={<EtatStock />}
              />
            </Route>

            {/* SALES */}

            <Route
              path="/dashboard/sales/*"
              element={
                <ProtectedRoute
                  allowedRoles={['sales']}
                  useLayout
                >
                  <SalesDashboard />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="dashboard" replace />}
              />

              <Route
                path="dashboard"
                element={<DashboardPage />}
              />

              <Route
                path="products"
                element={<ProductsPage />}
              />

              <Route
                path="orders"
                element={<OrdersPage />}
              />

              <Route
                path="sales"
                element={<SalesPage />}
              />

              <Route
                path="invoices"
                element={<InvoicingPage />}
              />

              <Route
                path="clients"
                element={<ClientManagePage />}
              />

              <Route
                path="sales-table"
                element={<SalesTable />}
              />
            </Route>

            {/* PROFILE */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'admin',
                    'sales',
                    'procurement',
                  ]}
                  useLayout={false}
                >
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'admin',
                    'sales',
                    'procurement',
                  ]}
                  useLayout={false}
                >
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* REDIRECT */}

            <Route
              path="/dashboard"
              element={<DashboardRedirect />}
            />

            <Route
              path="/unauthorized"
              element={<UnauthorizedPage />}
            />

            {/* 404 */}

            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-700">
                      404
                    </h1>

                    <h2 className="text-2xl font-semibold mt-4">
                      {t('app.notFoundTitle')}
                    </h2>

                    <button
                      onClick={() => {
                        window.location.href = '/login';
                      }}
                      className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      {t('app.goToLogin')}
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
