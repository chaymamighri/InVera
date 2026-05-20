import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useSidebar } from '../../../context/SidebarContext';
import { useLanguage } from '../../../context/LanguageContext';
import Footer from '../../../components/Footer';

const pageRoutes = {
  stats: '/dashboard/procurement/stats',
  produits: '/dashboard/procurement/produits',
  categories: '/dashboard/procurement/categories',
  commandes: '/dashboard/procurement/commandes',
  mouvements: '/dashboard/procurement/mouvements',
  etat_stock: '/dashboard/procurement/etat_stock',
};

const ProcurementDashboard = () => {
  const { t, isArabic } = useLanguage();
  const { getCurrentUser } = useAuth();
  const admin = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState({ name: '', role: '', email: '', initials: '' });
  const [remainingLogins, setRemainingLogins] = useState(null);
  const [typeInscription, setTypeInscription] = useState(null);

  useEffect(() => {
    const userName = admin?.nom || localStorage.getItem('userName') || t('dashboard.procurementManagerFallback');
    const userEmail = admin?.email || localStorage.getItem('userEmail') || 'achats@invera.com';
    const userRole = admin?.role || localStorage.getItem('userRole') || t('dashboard.procurementManagerFallback');
    const initials = userName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    setUser({ name: userName, role: userRole, email: userEmail, initials });

    const remaining = localStorage.getItem('connexionsRestantes');
    const type = localStorage.getItem('typeInscription');

    if (remaining !== null) setRemainingLogins(parseInt(remaining, 10));
    if (type !== null) setTypeInscription(type);
  }, [admin, t]);

  const activePage = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/produits')) return 'produits';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/commandes')) return 'commandes';
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/mouvements')) return 'mouvements';
    if (path.includes('/etat_stock')) return 'etat_stock';
    return 'stats';
  }, [location.pathname]);

  const sections = [
    {
      title: t('dashboard.procurementSectionDashboard'),
      items: [{ id: 'stats', label: t('dashboard.procurementStats'), icon: ChartBarIcon }],
    },
    {
      title: t('dashboard.procurementSectionManagement'),
      items: [
        { id: 'produits', label: t('dashboard.procurementProducts'), icon: CubeIcon },
        { id: 'categories', label: t('dashboard.procurementCategories'), icon: Square3Stack3DIcon },
      ],
    },
    {
      title: t('dashboard.procurementSectionReplenishment'),
      items: [{ id: 'commandes', label: t('dashboard.procurementOrders'), icon: ShoppingCartIcon }],
    },
    {
      title: t('dashboard.procurementSectionStock'),
      items: [
        { id: 'mouvements', label: t('dashboard.procurementMovements'), icon: ArrowPathIcon },
        { id: 'etat_stock', label: t('dashboard.procurementStockState'), icon: ArchiveBoxIcon },
      ],
    },
  ];

  const pageMeta = {
    stats: {
      title: t('dashboard.procurementStatsTitle'),
      description: t('dashboard.procurementStatsDescription'),
    },
    produits: {
      title: t('dashboard.procurementProductsTitle'),
      description: t('dashboard.procurementProductsDescription'),
    },
    categories: {
      title: t('dashboard.procurementCategoriesTitle'),
      description: t('dashboard.procurementCategoriesDescription'),
    },
    commandes: {
      title: t('dashboard.procurementOrdersTitle'),
      description: t('dashboard.procurementOrdersDescription'),
    },
    mouvements: {
      title: t('dashboard.procurementMovementsTitle'),
      description: t('dashboard.procurementMovementsDescription'),
    },
    etat_stock: {
      title: t('dashboard.procurementStockStateTitle'),
      description: t('dashboard.procurementStockStateDescription'),
    },
  };

  const getFirstName = (fullName) => fullName.split(' ')[0];
  const showTrialWarning =
    typeInscription === 'ESSAI' && remainingLogins !== null && remainingLogins <= 5 && remainingLogins > 0;
  const showTrialExpired = typeInscription === 'ESSAI' && remainingLogins !== null && remainingLogins <= 0;
  const page = pageMeta[activePage] || {
    title: t('dashboard.procurementPanelTitle'),
    description: '',
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir={isArabic ? 'rtl' : 'ltr'}>
      <aside
        className={`fixed top-0 ${isArabic ? 'right-0 border-l' : 'left-0 border-r'} h-full bg-white shadow-xl transition-all duration-300 z-30 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center justify-between gap-3">
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
              className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}
              title={collapsed ? t('dashboard.expandSidebar') : t('dashboard.collapseSidebar')}
            >
              {collapsed ? (
                isArabic ? <ChevronLeftIcon className="w-4 h-4 text-gray-500" /> : <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              ) : (
                isArabic ? <ChevronRightIcon className="w-4 h-4 text-gray-500" /> : <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

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
                          onClick={() => navigate(pageRoutes[item.id] || pageRoutes.stats)}
                          className={`w-full flex items-center rounded-lg transition-all duration-200 group ${
                            collapsed ? 'justify-center p-2.5' : `px-3 py-2.5 ${isArabic ? 'space-x-reverse space-x-3' : 'space-x-3'}`
                          } ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={collapsed ? item.label : ''}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />

                          {!collapsed && (
                            <span className={`text-sm font-medium flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                              {item.label}
                            </span>
                          )}

                          {collapsed && (
                            <div className={`absolute ${isArabic ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none`}>
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

        <div className="flex-shrink-0 border-t p-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : isArabic ? 'space-x-reverse space-x-2.5' : 'space-x-2.5'}`}>
            <div
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate('/profile')}
              title={t('dashboard.viewProfile')}
            >
              {user.initials}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{getFirstName(user.name)}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
                <p className="text-[9px] text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isArabic ? (collapsed ? 'mr-20' : 'mr-64') : collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="h-14" />

        <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-6 py-3">
            <h1 className="text-xl font-bold text-gray-800">{page.title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{page.description}</p>
          </div>
        </div>

        {showTrialWarning && (
          <TrialBanner
            tone="yellow"
            title={t('dashboard.trialSoonTitle')}
            description={t('dashboard.trialRemainingLogins', { count: remainingLogins })}
            hint={t('dashboard.trialSubscribeHint')}
            linkLabel={t('dashboard.viewSubscriptionOffers')}
          />
        )}

        {showTrialExpired && (
          <TrialBanner
            tone="red"
            title={t('dashboard.trialExpiredTitle')}
            description={t('dashboard.trialExpiredDescription')}
            linkLabel={t('dashboard.subscribeNow')}
          />
        )}

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>

        <Footer />
      </main>
    </div>
  );
};

const TrialBanner = ({ tone, title, description, hint, linkLabel }) => {
  const colors = {
    yellow: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      hint: 'text-yellow-600',
      link: 'text-yellow-700 hover:text-yellow-800',
    },
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      icon: 'text-red-600',
      title: 'text-red-800',
      text: 'text-red-700',
      hint: 'text-red-600',
      link: 'text-red-700 hover:text-red-800',
    },
  }[tone];

  return (
    <div className={`mx-6 mt-6 rounded-xl border ${colors.border} ${colors.bg} p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className={`h-5 w-5 ${colors.icon} mt-0.5`} />
        <div className="flex-1">
          <p className={`font-semibold ${colors.title}`}>{title}</p>
          <p className={`text-sm ${colors.text} mt-1`}>{description}</p>
          {hint && <p className={`text-xs ${colors.hint} mt-2`}>{hint}</p>}
          <Link to="/subscription" className={`mt-3 inline-block text-sm font-semibold ${colors.link} hover:underline`}>
            {linkLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
