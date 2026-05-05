// pages/superAdmin/SuperAdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { superAdminService } from '../../servicesPlatform/superAdminService';
import {
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const loadAdmin = async () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');

      if (!token || userRole !== 'SUPER_ADMIN') {
        navigate('/super-admin/login', { replace: true });
        return;
      }

      try {
        const profile = await superAdminService.getMe();
        setAdminInfo(profile);
      } catch {
        const storedInfo = localStorage.getItem('superAdminInfo');
        const legacyInfo = localStorage.getItem('adminInfo');
        const storedName = localStorage.getItem('userName');
        const storedEmail = localStorage.getItem('userEmail');

        if (storedInfo) {
          try {
            setAdminInfo(JSON.parse(storedInfo));
          } catch {
            setAdminInfo({ nom: storedName, email: storedEmail });
          }
        } else if (legacyInfo) {
          try {
            setAdminInfo(JSON.parse(legacyInfo));
          } catch {
            setAdminInfo({ nom: storedName, email: storedEmail });
          }
        } else if (storedName || storedEmail) {
          setAdminInfo({ nom: storedName, email: storedEmail });
        } else {
          navigate('/super-admin/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [navigate]);

  const handleLogout = () => {
    superAdminService.logout();
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleViewProfile = () => {
    setShowProfileMenu(false);
    navigate('/super-admin/dashboard/profile');
  };

  const isActive = (path) => location.pathname.includes(path);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
          <h1 className="text-xl font-bold text-white">InVera Platform</h1>
    <p className="text-purple-200 text-xs flex items-center gap-1">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
      Espace administrateur
    </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher menuClassName="z-[100]" />
              
              {/* Profile Icon with Dropdown Menu */}
              <div className="relative profile-menu-container">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 transition hover:opacity-80 focus:outline-none"
                  title={t('common.profile')}
                >
                  <UserCircleIcon className="w-10 h-10 text-white hover:text-purple-200 transition" />
                </button>
                
                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {adminInfo?.nom || 'Administrateur'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adminInfo?.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={handleViewProfile}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                      >
                        <UserCircleIcon className="w-4 h-4" />
                        {t('common.profile')}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition flex items-center gap-2"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-6">
            <button
              onClick={() => navigate('/super-admin/dashboard/clients')}
              className={`flex items-center gap-2 py-3 px-2 transition ${
                isActive('clients')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-purple-600'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              {t('dashboard.superAdminClients')}
            </button>
            <button
              onClick={() => navigate('/super-admin/dashboard/abonnements')}
              className={`flex items-center gap-2 py-3 px-2 transition ${
                isActive('abonnements')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-purple-600'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5" />
              {t('dashboard.superAdminSubscriptions')}
            </button>
            <button
              onClick={() => navigate('/super-admin/dashboard/paiements')}
              className={`flex items-center gap-2 py-3 px-2 transition ${
                isActive('paiements')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-purple-600'
              }`}
            >
              <CreditCardIcon className="w-5 h-5" />
              {t('dashboard.superAdminPayments')}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;