// ProcurementDashboard.jsx - Version avec style d'écriture et positionnement optimisés
/**
 * ProcurementDashboard - Dashboard du module Achats
 * 
 * RÔLE : Interface principale pour les utilisateurs ayant le rôle "RESPONSABLE_ACHAT"
 * ROUTE : /dashboard/procurement/*
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon, // AJOUTÉ
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useSidebar } from '../../../context/SidebarContext';
import { useLanguage } from '../../../context/LanguageContext';
import Footer from '../../../components/Footer';

const ProcurementDashboard = () => {
  const { t } = useLanguage();
  const { getCurrentUser } = useAuth(); 
  const admin = getCurrentUser(); 
  const navigate = useNavigate(); 
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar(); 

  const [user, setUser] = useState({ name: '', role: '', email: '', initials: '' });
  
  // AJOUTÉ : États pour les notifications d'essai
  const [remainingLogins, setRemainingLogins] = useState(null);
  const [typeInscription, setTypeInscription] = useState(null);

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
    
    // AJOUTÉ : Récupérer les données de connexions restantes
    const remaining = localStorage.getItem('connexionsRestantes');
    const type = localStorage.getItem('typeInscription');
    
    if (remaining !== null) {
      setRemainingLogins(parseInt(remaining, 10));
    }
    if (type !== null) {
      setTypeInscription(type);
    }
  }, [admin]);

  const getFirstName = (fullName) => fullName.split(' ')[0];

  // AJOUTÉ : Déterminer si l'utilisateur est en période d'essai
  const isTrial = typeInscription === 'ESSAI';
  const showTrialWarning = isTrial && remainingLogins !== null && remainingLogins <= 5 && remainingLogins > 0;
  const showTrialExpired = isTrial && remainingLogins !== null && remainingLogins <= 0;

  // ========== DÉTERMINER LA PAGE ACTIVE DEPUIS L'URL ==========
  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/produits')) return 'produits';
    if (path.includes('/categories')) return 'categories'; 
    if (path.includes('/commandes')) return 'commandes';
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/mouvements')) return 'mouvements';
    if (path.includes('/etat_stock')) return 'etat_stock';
    return 'stats';
  };

  const activePage = getActivePage();

  // ========== STRUCTURE DE NAVIGATION ==========
  const sections = [
    {
      title: t('dashboard.procurementSectionDashboard'),
      items: [
        { id: 'stats', label: t('dashboard.procurementStats'), icon: ChartBarIcon },
      ]
    },
    {
      title: t('dashboard.procurementSectionManagement'),
      items: [
        { id: 'produits', label: t('dashboard.procurementProducts'), icon: CubeIcon },
        { id: 'categories', label: t('dashboard.procurementCategories'), icon: Square3Stack3DIcon },
      ]
    },
    {
      title: t('dashboard.procurementSectionReplenishment'),
      items: [
        { id: 'commandes', label: t('dashboard.procurementOrders'), icon: ShoppingCartIcon },
      ]
    },
    {
      title: t('dashboard.procurementSectionStock'),
      items: [
        { id: 'mouvements', label: t('dashboard.procurementMovements'), icon: ArrowPathIcon },
        { id: 'etat_stock', label: t('dashboard.procurementStockState'), icon: ArchiveBoxIcon },
      ]
    },
   
  ];

  // ========== NAVIGATION AVEC URLs DIRECTES ==========
  const handleSetActivePage = (pageId) => {
    switch(pageId) {
      case 'stats':
        navigate('/dashboard/procurement/stats');
        break;
      case 'produits':
        navigate('/dashboard/procurement/produits');
        break;
      case 'categories':  
        navigate('/dashboard/procurement/categories');
        break;
      case 'commandes':
        navigate('/dashboard/procurement/commandes');
        break;
      case 'mouvements': 
        navigate('/dashboard/procurement/mouvements');
        break;
      case 'etat_stock': 
        navigate('/dashboard/procurement/etat_stock');
        break;
      default:
        navigate('/dashboard/procurement/stats');
    }
  };

  // ========== TITRES DYNAMIQUES ==========
  const getPageTitle = () => {
    switch (activePage) {
      case 'stats': return t('dashboard.procurementStatsTitle');
      case 'produits': return t('dashboard.procurementProductsTitle');
      case 'categories': return t('dashboard.procurementCategoriesTitle');
      case 'commandes': return t('dashboard.procurementOrdersTitle');
      case 'mouvements': return t('dashboard.procurementMovementsTitle'); 
      case 'etat_stock': return t('dashboard.procurementStockStateTitle');
      default: return t('dashboard.procurementPanelTitle');
    }
  };

  const getPageDescription = () => {
    switch (activePage) {
      case 'stats': return t('dashboard.procurementStatsDescription');
      case 'produits': return t('dashboard.procurementProductsDescription');
      case 'categories': return t('dashboard.procurementCategoriesDescription');
      case 'commandes': return t('dashboard.procurementOrdersDescription');
      case 'mouvements': return t('dashboard.procurementMovementsDescription'); 
      case 'etat_stock': return t('dashboard.procurementStockStateDescription');
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar - Version optimisée */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        
        {/* En-tête sidebar - Style compact */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center justify-between">
            {!collapsed && (
               <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {t('dashboard.procurementPanelTitle')}
                </h1>
                <p className="text-[10px] text-gray-400 mt-1">
                  {t('dashboard.procurementPanelDescription')}
                </p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ${
                collapsed ? 'mx-auto' : ''
              }`}
            >
              <span className="text-gray-500 text-sm">{collapsed ? '→' : '←'}</span>
            </button>
          </div>
        </div>

        {/* Navigation - Espacement vertical optimisé */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <ul className="space-y-3 px-3">
            {sections.map((section) => (
              <li key={section.title} className="mb-2">
                {!collapsed && (
                  <h3 className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                          className={`w-full flex items-center rounded-lg transition-all duration-200 group ${
                            collapsed 
                              ? 'justify-center p-2.5' 
                              : 'px-3 py-2.5 space-x-3'
                          } ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={collapsed ? item.label : ''}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          
                          {!collapsed && (
                            <span className="text-sm font-medium flex-1 text-left">
                              {item.label}
                            </span>
                          )}
                          
                          {/* Tooltip pour mode collapsed */}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
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
        </nav>

        {/* Profil utilisateur - Style compact */}
        <div className="flex-shrink-0 border-t p-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'}`}>
            <div
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate('/profile')}
              title="Voir mon profil"
            >
              {user.initials}
            </div>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {getFirstName(user.name)}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
                <p className="text-[9px] text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}>
        
        {/* Espace pour la barre de navigation supérieure */}
        <div className="h-14"></div>

        {/* Barre de titre sticky */}
        <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {getPageTitle()}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getPageDescription()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NOTIFICATION DE PÉRIODE D'ESSAI - AJOUTÉE ICI */}
        {showTrialWarning && (
          <div className="mx-6 mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-800">
                  ⚠️ Votre période d'essai bientôt terminée
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Il vous reste <strong>{remainingLogins}</strong> connexion{remainingLogins > 1 ? 's' : ''} avant la fin de votre période d'essai.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Pour continuer à utiliser InVera ERP après la fin de votre essai, veuillez souscrire un abonnement.
                </p>
                <Link 
                  to="/subscription" 
                  className="mt-3 inline-block text-sm font-semibold text-yellow-700 hover:text-yellow-800 hover:underline"
                >
                  Voir les offres d'abonnement →
                </Link>
              </div>
            </div>
          </div>
        )}

        {showTrialExpired && (
          <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">
                  ❌ Votre période d'essai est terminée
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Votre période d'essai gratuite est expirée. Pour continuer à utiliser InVera ERP, vous devez souscrire un abonnement.
                </p>
                <Link 
                  to="/subscription" 
                  className="mt-3 inline-block text-sm font-semibold text-red-700 hover:text-red-800 hover:underline"
                >
                  Souscrire un abonnement →
                </Link>
              </div>
            </div>
          </div>
        )}

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