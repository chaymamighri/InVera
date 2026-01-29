// src/pages/dashboard/sales/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import DashboardContent from './statistic/DashboardContent';
import ProductsPage from './products/ProductsPage';
//import OrdersPage from './orders/OrderPage';
//import InvoicingPage from './invoicing/InvoicingPage';
//import ReportsPage from './reports/ReportsPage';
//import ClientsPage from './clients/ClientsPage';
//import DiscountsPage from './discounts/DiscountsPage';

const SalesDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: 'Responsable Commercial',
    role: 'Responsable Ventes',
    email: 'admin@salespro.com',
    initials: 'RC'
  });

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const initials = parsedUser.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      
      setCurrentUser({
        ...parsedUser,
        initials
      });
    } else {
      const userName = localStorage.getItem('userName') || 'Responsable Commercial';
      const userEmail = localStorage.getItem('userEmail') || 'admin@salespro.com';
      const userRole = localStorage.getItem('userRole') || 'Responsable Ventes';
      const initials = userName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      
      setCurrentUser({
        name: userName,
        role: userRole,
        email: userEmail,
        initials
      });
    }
  }, []);

  // Fonction pour extraire le prénom
  const getFirstName = (fullName) => {
    return fullName.split(' ')[0];
  };

  const menuItems = [
    { id: 'dashboard', title: 'Tableau de bord', icon: '📊', badge: null },
    { id: 'products', title: 'Gestion des Produits', icon: '📦' },
    { id: 'orders', title: 'Gestion des Commandes', icon: '📋', badge: null },
    { id: 'clients', title: 'Clients', icon: '👥' },
    { id: 'invoicing', title: 'Facturation', icon: '💰', badge: null },
    { id: 'discounts', title: 'Promotions', icon: '🎯' },
    { id: 'reports', title: 'Analytics', icon: '📈' },
    { id: 'sales-reports', title: 'Rapports Ventes', icon: '📄' },
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'products':
        return <ProductsPage />;
      case 'orders':
        return <OrdersPage />;
      case 'clients':
        return <ClientsPage />;
      case 'invoicing':
        return <InvoicingPage />;
      case 'discounts':
        return <DiscountsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'sales-reports':
        return <SalesReportsPage />;
      default:
        return <DefaultPage page={activePage} menuItems={menuItems} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar - Version Professionnelle */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Tableau de Bord Commercial
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Suivi des ventes et gestion des produits
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                  } rounded-lg transition-all relative group ${
                    activePage === item.id
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-3 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="ml-3 flex-1 text-left text-sm">{item.title}</span>
                  )}
                  {item.badge && (
                    <span className={`${
                      activePage === item.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    } text-xs px-2 py-1 rounded-full ml-2`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* User Profile - Bottom */}
          <div className={`absolute bottom-0 left-0 right-0 border-t p-4 ${
            sidebarCollapsed ? 'px-3' : 'px-4'
          }`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                {currentUser.initials}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getFirstName(currentUser.name)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
              )}
              
              {/* Tooltip pour version réduite */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  <div className="font-medium">{currentUser.name}</div>
                  <div className="text-gray-300 text-xs">{currentUser.role}</div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activePage === 'dashboard' ? 'Aperçu général' : menuItems.find(item => item.id === activePage)?.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activePage === 'dashboard' 
                    ? 'Statistiques et indicateurs de performance' 
                    : 'Gestion commerciale et suivi des opérations'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Composant pour les pages par défaut (en développement)
const DefaultPage = ({ page, menuItems }) => {
  const currentItem = menuItems.find(item => item.id === page);
  
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6">
        {currentItem?.icon || '📁'}
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">
        {currentItem?.title || 'Page'}
      </h2>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        Cette section est en cours de finalisation. 
        Les fonctionnalités seront déployées dans les prochaines mises à jour.
      </p>
      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm">
        Explorer les fonctionnalités
      </button>
    </div>
  );
};

export default SalesDashboard;