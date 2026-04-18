// pages/superAdmin/SuperAdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { superAdminService } from '../../services/superAdminService';
import { 
  UsersIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      // ✅ Vérifier d'abord le token localement
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      if (!token || userRole !== 'SUPER_ADMIN') {
        console.log('❌ Pas de token ou mauvais rôle, redirection vers login');
        navigate('/super-admin/login', { replace: true });
        return;
      }
      
      try {
        const profile = await superAdminService.getProfile();
        console.log('📊 Profil Super Admin chargé:', profile);
        setAdminInfo(profile);
      } catch (error) {
        console.error('❌ Erreur chargement profil:', error);
        // En cas d'erreur API, on utilise les données du localStorage
        const storedName = localStorage.getItem('userName');
        const storedEmail = localStorage.getItem('userEmail');
        if (storedName && storedEmail) {
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

  // Déterminer l'onglet actif
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">InVera Platform</h1>
              <p className="text-purple-200 text-sm">Espace Super Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{adminInfo?.nom || 'Administrateur'}</p>
                <p className="text-sm text-purple-200">{adminInfo?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => navigate('/super-admin/dashboard/clients')}
              className={`flex items-center gap-2 py-3 px-2 transition ${
                isActive('clients')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-purple-600'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              Clients
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
              Abonnements
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
              Paiements
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal avec Outlet pour les sous-routes */}
      <div className="container mx-auto px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;