import React, { useState, useMemo, useCallback } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  HomeIcon, // éventuel
} from '@heroicons/react/24/outline';

import { useAuth } from '../../../hooks/useAuth';

// Pages
import GestionUsers from './users/gestionUsers';
import Rapports from './rapports/Rapports';
import Statistiques from './statestiques/Statistiques';
import Settings from './settings/Settings';

// Mémoïsation des pages
const MemoizedGestionUsers = React.memo(GestionUsers);
const MemoizedRapports = React.memo(Rapports);
const MemoizedStatistiques = React.memo(Statistiques);
const MemoizedSettings = React.memo(Settings);

const AdminDashboard = () => {
  const { getCurrentUser } = useAuth();
  const admin = getCurrentUser();

  const [activePage, setActivePage] = useState('stats');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Définition des sections pour une structure organisée
  const sections = [
    {
      title: 'Tableau de bord',
      items: [
        { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
      ]
    },
    {
      title: 'Gestion',
      items: [
        { id: 'users', label: 'Gestion utilisateurs', icon: UsersIcon },
      ]
    },
    {
      title: 'Rapports',
      items: [
        { id: 'reports', label: 'Rapports', icon: DocumentTextIcon },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'settings', label: 'Paramètres', icon: Cog6ToothIcon },
      ]
    }
  ];

  const handleSetActivePage = useCallback((pageId) => {
    setActivePage(pageId);
  }, []);

  const renderPage = useMemo(() => {
    switch (activePage) {
      case 'stats':
        return <MemoizedStatistiques />;
      case 'users':
        return <MemoizedGestionUsers />;
      case 'reports':
        return <MemoizedRapports />;
      case 'settings':
        return <MemoizedSettings />;
      default:
        return <MemoizedStatistiques />;
    }
  }, [activePage]);

  const getUserInitials = () => {
    if (admin?.name) {
      return admin.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return 'AD';
  };

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header with toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <span className="text-xl font-bold text-gray-800">
              In<span className="text-teal-500">Vera</span>
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
            aria-label={sidebarCollapsed ? 'Développer le menu' : 'Réduire le menu'}
          >
            {sidebarCollapsed ? (
              <ArrowRightIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation avec sections */}
        <nav className="px-3 py-4 flex flex-col h-[calc(100vh-8rem)] overflow-y-auto">
          <ul className="space-y-6 flex-1">
            {sections.map((section) => (
              <li key={section.title}>
                {/* Titre de section - affiché seulement si sidebar non réduite */}
                {!sidebarCollapsed && (
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
                            sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                          } rounded-lg transition-all duration-200 relative group ${
                            isActive
                              ? 'bg-teal-50 text-teal-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={sidebarCollapsed ? item.label : ''}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!sidebarCollapsed && (
                            <span className="ml-3 text-sm font-medium">{item.label}</span>
                          )}

                          {/* Tooltip pour version réduite */}
                          {sidebarCollapsed && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
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
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <main className="h-full overflow-y-auto p-6">
          {renderPage}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;