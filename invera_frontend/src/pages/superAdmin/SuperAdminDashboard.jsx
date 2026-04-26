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
} from '@heroicons/react/24/outline';

const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const isActive = (path) => location.pathname.includes(path);

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
              <h1 className="text-2xl font-bold">InVera Platform</h1>
              <p className="text-purple-200 text-sm">{t('common.superAdminSpace')}</p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher menuClassName="z-[100]" />
              <button
                onClick={() => navigate('/super-admin/dashboard/profile')}
                className="text-right transition hover:opacity-80"
              >
                <p className="font-semibold">{adminInfo?.nom || 'Administrateur'}</p>
                <p className="text-sm text-purple-200">{adminInfo?.email}</p>
              </button>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {t('common.logout')}
              </button>
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
