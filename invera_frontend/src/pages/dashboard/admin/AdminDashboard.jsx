// AdminDashboard.jsx - Version avec Outlet pour les sous-routes

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  UsersIcon,
  ChartBarIcon,
  TagIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon, 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useSidebar } from '../../../context/SidebarContext';
import { useLanguage } from '../../../context/LanguageContext';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { getCurrentUser } = useAuth();
  const admin = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState({ name: '', role: '', email: '', initials: '' });
  
  // ✅ AJOUTER LES ÉTATS POUR LES NOTIFICATIONS D'ESSAI
  const [remainingLogins, setRemainingLogins] = useState(null);
  const [typeInscription, setTypeInscription] = useState(null);
  const [clientStatut, setClientStatut] = useState(null);

  useEffect(() => {
    const userName = admin?.nom || localStorage.getItem('userName') || 'Administrateur';
    const userEmail = admin?.email || localStorage.getItem('userEmail') || 'admin@invera.com';
    const userRole = admin?.role || localStorage.getItem('userRole') || 'Administrateur';
    const initials = userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    setUser({ name: userName, role: userRole, email: userEmail, initials });
    
    // ✅ RÉCUPÉRER LES DONNÉES DE CONNEXIONS RESTANTES
    const remaining = localStorage.getItem('connexionsRestantes');
    const type = localStorage.getItem('typeInscription');
    const statut = localStorage.getItem('clientStatut');
    
    if (remaining !== null) {
      setRemainingLogins(parseInt(remaining, 10));
    }
    if (type !== null) {
      setTypeInscription(type);
    }
    if (statut !== null) {
      setClientStatut(statut);
    }
  }, [admin]);

  const getFirstName = (fullName) => fullName.split(' ')[0];
  
  // ✅ DÉTERMINER SI L'UTILISATEUR EST EN PÉRIODE D'ESSAI
  const isTrial = typeInscription === 'ESSAI';
  const showTrialWarning = isTrial && remainingLogins !== null && remainingLogins <= 5 && remainingLogins > 0;
  const showTrialExpired = isTrial && remainingLogins !== null && remainingLogins <= 0;

  // Détecter la page active depuis l'URL
  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/validation-commandes')) return 'validation-commandes';
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/users')) return 'users';
    if (path.includes('/remises')) return 'remises';
    if (path.includes('/fournisseurs')) return 'fournisseurs';
    return 'stats';
  };

  const activePage = getActivePage();

  const sections = [
    {
      title: t('dashboard.adminSectionDashboard'),
      items: [
        { id: 'stats', label: t('dashboard.adminStatistics'), icon: ChartBarIcon, path: '/dashboard/admin/stats' },
      ]
    },
    {
      title: t('dashboard.adminSectionOrders'),
      items: [
        { id: 'validation-commandes', label: t('dashboard.adminValidationOrders'), icon: DocumentCheckIcon, path: '/dashboard/admin/validation-commandes' },
      ]
    },
    {
      title: t('dashboard.adminSectionManagement'),
      items: [
        { id: 'users', label: t('dashboard.adminUsers'), icon: UsersIcon, path: '/dashboard/admin/users' },
        { id: 'remises', label: t('dashboard.adminDiscounts'), icon: TagIcon, path: '/dashboard/admin/remises' },
        { id: 'fournisseurs', label: t('dashboard.adminSuppliers'), icon: UserGroupIcon, path: '/dashboard/admin/fournisseurs' },
      ]
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header userRole={admin?.role || localStorage.getItem('userRole') || 'ADMIN'} />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        {/* En-tête */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {t('dashboard.adminPanelTitle')}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {t('dashboard.adminPanelDescription')}
                </p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={collapsed ? t('dashboard.expandMenu') : t('dashboard.collapseMenu')}
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
                    const isActive = activePage === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center ${
                            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                          } rounded-lg transition-all duration-200 relative group ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold'
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

          {/* Profil utilisateur */}
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
        {/* Espace pour le header */}
        <div className="h-16"></div>

        {/* Top Bar locale (sticky) */}
        <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activePage === 'stats' && t('dashboard.adminStatsTitle')}
                  {activePage === 'validation-commandes' && t('dashboard.adminValidationTitle')}
                  {activePage === 'users' && t('dashboard.adminUsersTitle')}
                  {activePage === 'remises' && t('dashboard.adminDiscountsTitle')}
                  {activePage === 'fournisseurs' && t('dashboard.adminSuppliersTitle')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activePage === 'stats' && t('dashboard.adminStatsDescription')}
                  {activePage === 'validation-commandes' && t('dashboard.adminValidationDescription')}
                  {activePage === 'users' && t('dashboard.adminUsersDescription')}
                  {activePage === 'remises' && t('dashboard.adminDiscountsDescription')}
                  {activePage === 'fournisseurs' && t('dashboard.adminSuppliersDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NOTIFICATION DE PÉRIODE D'ESSAI - AJOUTER ICI */}
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

        {/* Contenu de la page avec Outlet */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;