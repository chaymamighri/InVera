import React, { useState } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BellIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

import { useAuth } from '../../../hooks/useAuth';

// Pages
import GestionUsers from './users/gestionUsers';
import Rapports from './rapports/Rapports';
import Statistiques from './statestiques/Statistiques';
import Settings from './settings/Settings';

const AdminDashboard = () => {
  const { getCurrentUser, logout } = useAuth();
  const admin = getCurrentUser();

  const [activePage, setActivePage] = useState('stats');

  // 🔹 Sidebar buttons
  const menuItems = [
        { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
        { id: 'users', label: 'Gestion utilisateurs', icon: UsersIcon },
        { id: 'reports', label: 'Rapports', icon: DocumentTextIcon },
        { id: 'settings', label: 'Paramètres', icon: Cog6ToothIcon }
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'stats':
        return <Statistiques />;
      case 'users':
        return <GestionUsers />;
      
      case 'reports':
        return <Rapports />;
      case 'settings':
        return <Settings />;
      default:
        return <GestionUsers />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ================= Sidebar ================= */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <span className="text-xl font-bold text-gray-800">
            In<span className="text-teal-500">Vera</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-all ${
                activePage === item.id
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        
      </aside>

      {/* ================= Main ================= */}
      <div className="flex-1 flex flex-col">
        

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
