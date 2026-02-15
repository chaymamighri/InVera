// src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import logo from '../assets/images/logo.png';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Récupération des infos utilisateur depuis le localStorage
  const user = (() => {
    const name = localStorage.getItem('userName') || 'Utilisateur';
    const email = localStorage.getItem('userEmail') || '';
    const role = localStorage.getItem('userRole') || 'user';

    const roleTranslations = {
      admin: 'Administrateur',
      sales: 'Responsable Ventes',
      commercial: 'Responsable Ventes',
      procurement: 'Responsable Achats',
      achat: 'Responsable Achats',
      user: 'Utilisateur'
    };

    return {
      name,
      email,
      role: roleTranslations[role] || role,
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
    };
  })();

  const handleLogout = () => {
    // Supprime toutes les données d'authentification
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach(item => {
      localStorage.removeItem(item);
    });
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 ml-32">
              {logo && <img src={logo} alt="InVera ERP Logo" className="h-10 w-auto" />}
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-white">InVera ERP</h1>
                <p className="text-xs text-blue-200">Système de Gestion Intégré</p>
              </div>
            </Link>
          </div>

          {/* Right Section: Notifications + Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button 
              className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              title="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-400 rounded-full ring-2 ring-blue-900"></span>
            </button>

            {/* Separator */}
            <div className="hidden lg:block h-6 w-px bg-white/20"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                aria-label="Menu profil"
              >
                {/* Avatar avec initiales */}
                <div className="h-9 w-9 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50">
                  <span className="text-white font-bold text-sm">{user.initials}</span>
                </div>
                
                {/* Infos utilisateur - visible seulement sur desktop */}
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-sm truncate max-w-[150px]">{user.name.split(' ')[0]}</p>
                  <p className="text-xs text-blue-200 opacity-90 truncate max-w-[150px]">{user.role}</p>
                </div>
                
                <ChevronDownIcon className={`h-4 w-4 text-blue-200 group-hover:text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  {/* En-tête du profil */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-sm text-blue-100 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                  
                  {/* Options */}
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3 text-blue-600" />
                      Mon profil
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg className="h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Paramètres
                    </Link>
                  </div>
                  
                  {/* Séparateur */}
                  <div className="border-t border-gray-100"></div>
                  
                  {/* Déconnexion */}
                  <button
                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                    className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                  >
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
