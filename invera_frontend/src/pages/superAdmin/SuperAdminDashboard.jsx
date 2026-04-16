import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ArrowRightOnRectangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    // Récupérer les infos admin (token super admin)
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');
    
    if (token && info) {
      setAdminInfo(JSON.parse(info));
    } else {
      navigate('/super-admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('adminRole');
    toast.success('Déconnexion réussie');
    navigate('/super-admin/login');
  };

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

      {/* Contenu principal - Juste une phrase de bienvenue */}
      <div className="container mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Bienvenue, {adminInfo?.nom || 'Super Admin'} !
          </h2>
          <p className="text-gray-600 text-lg">
            Vous devez gérer les clients, les abonnements et les paiements depuis cet espace.
          </p>
  
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;