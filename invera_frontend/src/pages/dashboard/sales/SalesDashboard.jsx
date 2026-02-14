// src/pages/dashboard/sales/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const SalesDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  // menu bar - Mettez à jour les IDs pour correspondre aux routes
  const menuItems = [
    { id: 'dashboard', title: 'Tableau de bord', icon: '📊', badge: null },
    { id: 'products', title: 'Catalogue produits', icon: '📦' },
    { id: 'orders', title: 'Commandes clients', icon: '📋', badge: null },
    { id: 'sales', title: 'Ventes', icon: '🛒' },
    { id: 'clients', title: 'Clients', icon: '👥' },
    { id: 'invoicing', title: 'Facturation ', icon: '💰', badge: null }, 
    { id: 'reports', title: 'Rapports Ventes', icon: '📄' },
  ];

  // Fonction pour vérifier si une page est active - CORRIGÉE
  const isActive = (itemId) => {
    const currentPath = location.pathname;
    
    if (itemId === '') {
      return currentPath === '/dashboard/sales' || currentPath === '/dashboard/sales/';
    }
    
    // Vérification exacte du chemin
    return currentPath === `/dashboard/sales/${itemId}` || 
           currentPath.startsWith(`/dashboard/sales/${itemId}/`);
  };

  // Titre dynamique basé sur l'URL - CORRIGÉ
  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    // Page d'accueil
    if (currentPath === '/dashboard/sales' || currentPath === '/dashboard/sales/') {
      return 'Tableau de bord';
    }
    
    // Trouver l'item correspondant
    const currentItem = menuItems.find(item => {
      if (item.id === '') return false;
      return currentPath === `/dashboard/sales/${item.id}` || 
             currentPath.startsWith(`/dashboard/sales/${item.id}/`);
    });
    
    return currentItem?.title || 'Tableau de Bord Commercial';
  };

  // Description dynamique - CORRIGÉE
  const getPageDescription = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/dashboard/sales' || currentPath === '/dashboard/sales/') {
      return 'Statistiques et indicateurs de performance';
    }
    
    if (currentPath.includes('/products')) {
      return 'Consultez le catalogue et créez des commandes clients';
    }
    
    if (currentPath.includes('/orders')) {
      return 'Consultez et gérez toutes les commandes clients';
    }
    
    return 'Gestion commerciale et suivi des opérations';
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
              aria-label={sidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation - CORRIGÉ avec Link */}
        <nav className="p-4 flex flex-col h-[calc(100vh-140px)]">
          <ul className="space-y-1 flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <li key={item.id || 'dashboard'}>
                <Link
                  to={`/dashboard/sales${item.id ? `/${item.id}` : ''}`}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                  } rounded-lg transition-all duration-200 relative group ${
                    isActive(item.id)
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-3 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.title : ''}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left text-sm">{item.title}</span>
                      {item.badge && (
                        <span className={`${
                          isActive(item.id) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        } text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                      {item.title}
                      {item.badge && (
                        <span className="ml-2 bg-white text-gray-800 text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* User Profile - Bottom - CORRIGÉ */}
          <div className={`border-t pt-4 ${sidebarCollapsed ? 'px-3' : 'px-4'} mt-auto`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/profile')}
                title="Voir mon profil"
              >
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
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">{currentUser.name}</div>
                  <div className="text-gray-300 text-xs">{currentUser.role}</div>
                  <div className="text-gray-400 text-xs">{currentUser.email}</div>
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
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {getPageDescription()}
                </p>
              </div>
              {/* L'icône de refresh a été supprimée ici */}
            </div>
          </div>
        </div>

        {/* Content - Outlet pour les pages imbriquées */}
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
