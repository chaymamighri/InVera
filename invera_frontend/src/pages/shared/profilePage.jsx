// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import Header from '../../components/Header';

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: 'Non renseigné',
    departement: 'Non renseigné',
    dateCreation: '',
    role: '',
    photo: null,
    active: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMe = async () => {
      setLoading(true);
      setError('');

      try {
        // ✅ Real info from backend: /api/auth/me
        const res = await authService.getCurrentUser();
        const me = res?.data;

        const mapped = {
          nom: me?.lastName || me?.nom || '',
          prenom: me?.firstName || me?.prenom || '',
          email: me?.email || '',
          role: me?.role || '',
          active: me?.active !== false,

          // optional fields (not returned by /me in your backend)
          telephone: localStorage.getItem('userPhone') || 'Non renseigné',
          departement: localStorage.getItem('userDepartement') || 'Non renseigné',
          dateCreation: localStorage.getItem('userCreatedAt') || '',
          photo: localStorage.getItem('userPhoto')
        };

        setUserData(mapped);

        // ✅ keep storage consistent for the whole app
        const fullName = `${mapped.nom} ${mapped.prenom}`.trim();
        if (mapped.role) localStorage.setItem('userRole', mapped.role);
        if (fullName) localStorage.setItem('userName', fullName);
        if (mapped.email) localStorage.setItem('userEmail', mapped.email);
      } catch (e) {
        // 401/403 handled by interceptor (logout + redirect)
        setError(
          e?.message || "Impossible de charger votre profil. Veuillez réessayer."
        );

        // fallback from localStorage
        const fallback = {
          nom: localStorage.getItem('userNom') || '',
          prenom: localStorage.getItem('userPrenom') || '',
          email: localStorage.getItem('userEmail') || '',
          telephone: localStorage.getItem('userPhone') || 'Non renseigné',
          departement: localStorage.getItem('userDepartement') || 'Non renseigné',
          dateCreation: localStorage.getItem('userCreatedAt') || '',
          role: localStorage.getItem('userRole') || '',
          photo: localStorage.getItem('userPhoto'),
          active: true
        };
        setUserData(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const getRoleLabel = (role) => {
    const normalized = String(role || '').toUpperCase();
    const roles = {
      ADMIN: 'Administrateur',
      COMMERCIAL: 'Responsable Commercial',
      RESPONSABLE_ACHAT: 'Responsable Achats',
      SALES: 'Responsable Ventes',
      USER: 'Utilisateur'
    };
    return roles[normalized] || role || 'Utilisateur';
  };

  const getInitials = (nom, prenom) => {
    const firstInitial = prenom?.charAt(0)?.toUpperCase() || '';
    const lastInitial = nom?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const getRandomColor = (str) => {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-cyan-500 to-cyan-600'
    ];

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </>
    );
  }

  const initials = getInitials(userData.nom, userData.prenom);
  const avatarColor = getRandomColor(`${userData.nom}${userData.prenom}`);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Link>

          {error && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
              <div className="flex items-start gap-2">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Données affichées en mode hors-ligne</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-cyan-500">
              <div className="absolute -bottom-16 left-8">
                {userData.photo ? (
                  <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    <img
                      src={userData.photo}
                      alt={`${userData.prenom} ${userData.nom}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`h-32 w-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${avatarColor}`}
                  >
                    <span className="text-white text-4xl font-bold">{initials}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-20 px-8 pb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {userData.prenom} {userData.nom}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    {getRoleLabel(userData.role)}
                  </p>

                  {userData.active === false && (
                    <p className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                      Compte désactivé
                    </p>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium"
                >
                  Modifier le profil
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Informations personnelles
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Nom complet</div>
                      <div className="font-medium text-gray-800">
                        {userData.prenom} {userData.nom}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Email</div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {userData.email}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Téléphone</div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {userData.telephone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Informations professionnelles
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Rôle</div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {getRoleLabel(userData.role)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Département</div>
                      <div className="font-medium text-gray-800">
                        {userData.departement}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Membre depuis</div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {userData.dateCreation || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <div className="text-sm text-blue-600 font-medium">Activité ce mois</div>
                  <div className="text-2xl font-bold text-gray-800 mt-2">48</div>
                  <div className="text-sm text-gray-500">Actions réalisées</div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="text-sm text-green-600 font-medium">Sessions</div>
                  <div className="text-2xl font-bold text-gray-800 mt-2">24</div>
                  <div className="text-sm text-gray-500">Cette semaine</div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                  <div className="text-sm text-purple-600 font-medium">Dernière connexion</div>
                  <div className="text-2xl font-bold text-gray-800 mt-2">Aujourd&apos;hui</div>
                  <div className="text-sm text-gray-500">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;