import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UsersIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import Header from '../../components/Header';
import { useSidebar } from '../../context/SidebarContext';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();

  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');

    if (token && info) {
      const parsedInfo = JSON.parse(info);

      const initials = (parsedInfo?.nom || 'Super Admin')
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      setAdminInfo({
        ...parsedInfo,
        initials,
      });
    } else {
      navigate('/super-admin/login');
    }
  }, [navigate]);

  const getActivePage = () => {
    const path = location.pathname;

    if (path.includes('/settings')) return 'settings';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/abonnements')) return 'abonnements';
    if (path.includes('/clients')) return 'clients';

    return 'clients';
  };

  const activePage = getActivePage();

  const sections = [
    {
      title: 'GESTION',
      items: [
        {
          id: 'clients',
          label: 'Clients',
          icon: UsersIcon,
          path: '/super-admin/dashboard/clients',
        },
        {
          id: 'abonnements',
          label: 'Abonnements',
          icon: RectangleStackIcon,
          path: '/super-admin/dashboard/abonnements',
        },
      ],
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header userRole="SUPER_ADMIN" />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header Sidebar */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  Super Admin
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Gestion globale de la plateforme
                </p>
              </div>
            )}

            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
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
                              ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={collapsed ? item.label : ''}
                        >
                          <Icon
                            className={`w-5 h-5 flex-shrink-0 ${
                              isActive
                                ? 'text-purple-600'
                                : 'text-gray-500 group-hover:text-gray-700'
                            }`}
                          />

                          {!collapsed && (
                            <span className="ml-3 flex-1 text-left text-sm">
                              {item.label}
                            </span>
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

          {/* Résumé du compte */}
          <div className={`border-t pt-4 ${collapsed ? 'px-3' : 'px-4'} mt-auto`}>
            <div
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'space-x-3'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {adminInfo?.initials || 'SA'}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {adminInfo?.nom || 'Super Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Super Admin
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {adminInfo?.email || 'superadmin@invera.com'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="h-16"></div>

        {/* Top bar */}
        <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activePage === 'clients' && 'Gestion des clients'}
                  {activePage === 'abonnements' && 'Gestion des abonnements'}
                  {activePage === 'profile' && 'Profil du super admin'}
                  {activePage === 'settings' && 'Paramètres du compte'}
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  {activePage === 'clients' &&
                    'Pilotez les comptes clients de la plateforme.'}
                  {activePage === 'abonnements' &&
                    'Gérez les offres et le cycle des abonnements.'}
                  {activePage === 'profile' &&
                    'Consultez les informations du super admin connecté.'}
                  {activePage === 'settings' &&
                    'Mettez à jour le profil et le mot de passe du super admin.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
