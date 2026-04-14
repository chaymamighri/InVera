/**
 * SalesDashboard - Dashboard du module commercial (Ventes)
 * 
 * RÔLE : Interface principale pour les utilisateurs ayant le rôle "COMMERCIAL"
 * ROUTE : /dashboard/sales/*
 * 
 * FONCTIONNALITÉS :
 * - Barre latérale (sidebar) avec navigation
 * - Affichage du contenu dynamique via Outlet (React Router)
 * - Titre et description dynamiques selon la page active
 * - Profil utilisateur avec initiales
 * - Footer cohérent avec le reste de l'application
 * 
 * SOUS-PAGES (via Outlet) :
 * - /dashboard/sales/dashboard    → Statistiques ventes
 * - /dashboard/sales/products     → Catalogue produits
 * - /dashboard/sales/clients      → Gestion clients
 * - /dashboard/sales/orders       → Commandes clients
 * - /dashboard/sales/sales        → Historique ventes
 * - /dashboard/sales/invoices     → Facturation
 * - /dashboard/sales/reports      → Rapports et analyses
 */

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../../context/SidebarContext';
import Footer from '../../../components/Footer';

// ============================================
// ICÔNES (Heroicons)
// ============================================
import {
  ChartBarIcon,           // Dashboard / Statistiques
  CubeIcon,               // Catalogue produits
  ShoppingCartIcon,       // Commandes clients
  CurrencyDollarIcon,     // Ventes
  UsersIcon,              // Clients
  DocumentTextIcon,       // Facturation
  PresentationChartLineIcon, // Rapports
} from '@heroicons/react/24/outline';

const SalesDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggleSidebar } = useSidebar();
  
  // ===== ÉTAT UTILISATEUR =====
  const [currentUser, setCurrentUser] = useState({
    name: 'Responsable Commercial',
    role: 'Responsable Ventes',
    email: 'commercial@invera.com',
    initials: 'RC'
  });

  // ============================================
  // CHARGEMENT DES INFOS UTILISATEUR
  // ============================================
  
  useEffect(() => {
    // Tentative de récupération depuis localStorage
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
      // Fallback : données depuis les clés individuelles
      const userName = localStorage.getItem('userName') || 'Responsable Commercial';
      const userEmail = localStorage.getItem('userEmail') || 'commercial@invera.com';
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

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  
  const getFirstName = (fullName) => fullName.split(' ')[0];

  // ============================================
  // STRUCTURE DE NAVIGATION
  // ============================================
  
  const sections = [
    {
      title: 'TABLEAU DE BORD',
      items: [
        { id: 'dashboard', label: 'Statistiques', icon: ChartBarIcon, path: 'dashboard' },
      ]
    },
    {
      title: 'GESTION COMMERCIALE',
      items: [
        { id: 'products', label: 'Catalogue produits', icon: CubeIcon, path: 'products' },
        { id: 'clients', label: 'Clients', icon: UsersIcon, path: 'clients' },
      ]
    },
    {
      title: 'TRANSACTIONS',
      items: [
        { id: 'orders', label: 'Commandes clients', icon: ShoppingCartIcon, path: 'orders' },
        { id: 'sales', label: 'Ventes', icon: CurrencyDollarIcon, path: 'sales' },
        { id: 'invoices', label: 'Facturation', icon: DocumentTextIcon, path: 'invoices' },
      ]
    }
  ];

  // ============================================
  // DÉTECTION DE LA PAGE ACTIVE
  // ============================================
  
  /**
   * Vérifie si un élément de navigation est actif
   * @param {string} itemPath - Chemin de l'élément
   * @returns {boolean}
   */
  const isActive = (itemPath) => {
    const currentPath = location.pathname;
    
    // Cas spécial pour la racine (dashboard)
    if (itemPath === 'dashboard') {
      return currentPath === '/dashboard/sales' || 
             currentPath === '/dashboard/sales/' ||
             currentPath === '/dashboard/sales/dashboard';
    }
    
    // Pour les autres pages
    return currentPath === `/dashboard/sales/${itemPath}`;
  };

  // ============================================
  // TITRE ET DESCRIPTION DYNAMIQUES
  // ============================================
  
  /**
   * Détermine le titre de la page selon l'URL active
   * @returns {string}
   */
  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/dashboard/sales' || 
        currentPath === '/dashboard/sales/' ||
        currentPath === '/dashboard/sales/dashboard') {
      return 'Tableau de bord commercial';
    }
    if (currentPath.includes('/products')) return 'Catalogue produits';
    if (currentPath.includes('/clients')) return 'Gestion des clients';
    if (currentPath.includes('/orders')) return 'Commandes clients';
    if (currentPath.includes('/sales')) return 'Ventes';
    if (currentPath.includes('/invoices')) return 'Facturation';
    
    return 'Tableau de bord commercial';
  };

  /**
   * Détermine la description de la page selon l'URL active
   * @returns {string}
   */
  const getPageDescription = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/dashboard/sales' || 
        currentPath === '/dashboard/sales/' ||
        currentPath === '/dashboard/sales/dashboard') {
      return 'Statistiques et indicateurs de performance commerciale';
    }
    if (currentPath.includes('/products')) return 'Consultez le catalogue des produits disponibles à la vente';
    if (currentPath.includes('/clients')) return 'Gérez votre portefeuille clients et leurs informations';
    if (currentPath.includes('/orders')) return 'Suivez et gérez toutes les commandes clients';
    if (currentPath.includes('/sales')) return 'Historique et suivi des ventes réalisées';
    if (currentPath.includes('/invoices')) return 'Gérez la facturation et les paiements clients';
    
    return 'Gestion commerciale et suivi des opérations';
  };

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* ========== SIDEBAR ========== */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        
        {/* En-tête de la sidebar */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {!collapsed && (
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
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation */}
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
                    const active = isActive(item.path);

                    return (
                      <li key={item.id}>
                        <Link
                          to={`/dashboard/sales/${item.path}`}
                          className={`w-full flex items-center ${
                            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                          } rounded-lg transition-all duration-200 relative group ${
                            active
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-3 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={collapsed ? item.label : ''}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${
                            active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          
                          {!collapsed && (
                            <span className="ml-3 flex-1 text-left text-sm">{item.label}</span>
                          )}
                          
                          {/* Tooltip pour version réduite */}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          {/* Profil utilisateur */}
          <div className={`border-t pt-4 ${collapsed ? 'px-3' : 'px-4'} mt-auto`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              <div 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/profile')}
                title="Voir mon profil"
              >
                {currentUser.initials}
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getFirstName(currentUser.name)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
              )}
              
              {/* Tooltip pour version réduite */}
              {collapsed && (
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

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}>
        
        {/* Espace pour compenser le Header fixe */}
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
            </div>
          </div>
        </div>

        {/* Contenu dynamique de la page */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default SalesDashboard;