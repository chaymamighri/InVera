import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

import logo from '../assets/images/logo6.png';

const Header = ({ userRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const getUserData = () => {
    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userEmail = localStorage.getItem('userEmail') || '';
    const role = localStorage.getItem('userRole') || 'user';

    const roleTranslations = {
      'admin': 'Administrateur',
      'sales': 'Responsable Ventes',
      'commercial': 'Responsable Ventes',
      'procurement': 'Responsable Achats',
      'achat': 'Responsable Achats'
    };

    return {
      name: userName,
      email: userEmail,
      role: roleTranslations[role] || role,
      avatar: null
    };
  };

  const user = getUserData();

  const getMenuItems = () => {
    const baseItems = [
      { name: 'Tableau de bord', path: '/dashboard' },
      { name: 'Analytique', path: '/analytics' },
    ];

    const roleItems = {
      'admin': [...baseItems, { name: 'Finance', path: '/finance' }, { name: 'RH', path: '/hr' }, { name: 'Inventaire', path: '/inventory' }, { name: 'Rapports', path: '/reports' }],
      'sales': [...baseItems, { name: 'Ventes', path: '/sales' }, { name: 'Clients', path: '/clients' }, { name: 'Commandes', path: '/orders' }, { name: 'Rapports Ventes', path: '/sales-reports' }],
      'procurement': [...baseItems, { name: 'Achats', path: '/procurement' }, { name: 'Fournisseurs', path: '/suppliers' }, { name: 'Stock', path: '/inventory' }, { name: 'Commandes', path: '/purchase-orders' }],
      'default': baseItems
    };

    return roleItems[userRole] || roleItems['default'];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach(item => localStorage.removeItem(item));
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo + Desktop Nav */}
          <div className="flex items-center space-x-20">
            <Link to="/dashboard">
              {logo && <img src={logo} alt="InVera ERP Logo" className="h-20 w-auto" />}
            </Link>

            <nav className="hidden md:flex space-x-2">
              {menuItems.map(item => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-blue-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Notifications + Profile + Mobile Menu */}
          <div className="flex items-center space-x-3">

            {/* Notifications */}
            <button className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-400 rounded-full ring-2 ring-blue-900"></span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20"></div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full ring-2 ring-white/30 group-hover:ring-white/50" />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50">
                    <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-sm">{user.name.split(' ')[0]}</p>
                  <p className="text-xs text-blue-200 opacity-90">{user.role}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-blue-200 group-hover:text-white" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-blue-100 truncate">{user.email}</p>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{user.role}</span>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3 text-blue-600" />
                      Mon profil
                    </Link>
                  
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                    className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-blue-900 to-blue-800 text-white border-t border-white/20">
          <div className="px-3 pt-2 pb-3 space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.name}
                to={item.path}
                className="block px-3 py-3 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
