// ProcurementDashboard.jsx - Version avec Réceptions
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  TruckIcon, // ← NOUVEAU : pour les réceptions
  ClipboardDocumentCheckIcon, // ← NOUVEAU : pour les réceptions
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useSidebar } from '../../../context/SidebarContext';
import Footer from '../../../components/Footer';

const ProcurementDashboard = () => {
  const { getCurrentUser } = useAuth(); 
  const admin = getCurrentUser(); 
  const navigate = useNavigate(); 
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar(); 

  const [user, setUser] = useState({ name: '', role: '', email: '', initials: '' });

  useEffect(() => {
    const userName = admin?.nom || localStorage.getItem('userName') || 'Responsable Achats';
    const userEmail = admin?.email || localStorage.getItem('userEmail') || 'achats@invera.com';
    const userRole = admin?.role || localStorage.getItem('userRole') || 'Responsable Achats';
    
    const initials = userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    setUser({ name: userName, role: userRole, email: userEmail, initials });
  }, [admin]);

  const getFirstName = (fullName) => fullName.split(' ')[0];

  // ========== DÉTERMINER LA PAGE ACTIVE DEPUIS L'URL ==========
  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/commandes')) return 'commandes';
    if (path.includes('/receptions')) return 'receptions'; // ← NOUVEAU
    if (path.includes('/stats')) return 'stats';
    return 'produits';
  };

  const activePage = getActivePage();

  // ========== STRUCTURE DE NAVIGATION MISE À JOUR ==========
  const sections = [
    {
      title: 'TABLEAU DE BORD',
      items: [
        { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
      ]
    },
    {
      title: 'GESTION DES PRODUITS',
      items: [
        { id: 'produits', label: 'Catalogue produits', icon: CubeIcon },
      ]
    },
    {
      title: 'APPROVISIONNEMENT',
      items: [
        { id: 'commandes', label: 'Bons de commande', icon: ShoppingCartIcon },
        { id: 'receptions', label: 'Réceptions', icon: TruckIcon },
      ]
    },
  ];

  // ========== NAVIGATION MISE À JOUR ==========
  const handleSetActivePage = (pageId) => {
    switch(pageId) {
      case 'produits':
        navigate('/dashboard/procurement/produits');
        break;
      case 'commandes':
        navigate('/dashboard/procurement/commandes');
        break;
      case 'receptions': // ← NOUVEAU
        navigate('/dashboard/procurement/receptions');
        break;
      case 'stats':
        navigate('/dashboard/procurement/stats');
        break;
      default:
        navigate('/dashboard/procurement/produits');
    }
  };

  // ========== TITRES DYNAMIQUES ==========
  const getPageTitle = () => {
    switch (activePage) {
      case 'stats': return 'Statistiques Achats';
      case 'produits': return 'Gestion des Produits';
      case 'commandes': return 'Bons de commande fournisseurs';
      case 'receptions': return 'Réceptions de marchandises'; // ← NOUVEAU
      default: return 'Tableau de bord';
    }
  };

  const getPageDescription = () => {
    switch (activePage) {
      case 'stats': return 'Indicateurs de performance achats';
      case 'produits': return 'Gérez votre catalogue produits';
      case 'commandes': return 'Gérez vos bons de commande fournisseurs';
      case 'receptions': return 'Suivez et enregistrez les réceptions'; // ← NOUVEAU
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar - identique mais avec le nouvel item */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        
        {/* En-tête sidebar (inchangé) */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Tableau de Bord Gestion Achats
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Stocks, commandes et réceptions
                </p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation avec le nouvel item */}
        <nav className="p-4 flex flex-col h-[calc(100vh-140px)]">
          <ul className="space-y-1 flex-1 overflow-y-auto">
            {sections.map((section) => (
              <li key={section.title}>
                {!collapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSetActivePage(item.id)}
                          className={`w-full flex items-center ${
                            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                          } rounded-lg transition-all duration-200 relative group ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-3 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={collapsed ? item.label : ''}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          
                          {!collapsed && (
                            <span className="ml-3 flex-1 text-left text-sm">{item.label}</span>
                          )}
                          
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                              {item.label}
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          {/* Profil utilisateur (inchangé) */}
          <div className={`border-t pt-4 ${collapsed ? 'px-3' : 'px-4'} mt-auto`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              <div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/profile')}
                title="Voir mon profil"
              >
                {user.initials}
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getFirstName(user.name)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Contenu principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}>
        
        <div className="h-16"></div>

        {/* Barre de titre sticky */}
        <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
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
              
              {/* Badge pour les réceptions en attente (optionnel) */}
              {activePage === 'receptions' && (
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                  <span className="font-medium">3 réceptions en attente</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu avec Outlet */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default ProcurementDashboard;