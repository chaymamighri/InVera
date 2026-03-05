// src/pages/settings/SettingsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import api from '../../services/api';
import Header from '../../components/Header'; // 👈 IMPORTER HEADER

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loadingMe, setLoadingMe] = useState(true);

  // ✅ data from /me
  const [me, setMe] = useState(null);

  // ✅ profile form
  const [profileForm, setProfileForm] = useState({
    username: '',
    nom: '',
    prenom: '',
    email: ''
  });

  // ✅ password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ✅ single toggle for all password fields
  const [showPasswords, setShowPasswords] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ---------- Load /me ----------
  useEffect(() => {
    const load = async () => {
      setLoadingMe(true);
      try {
        const res = await authService.getCurrentUser(); // uses /auth/me already
        const data = res?.data;

        setMe(data);

        setProfileForm({
          username: data?.username || '',
          nom: data?.lastName || data?.nom || '',
          prenom: data?.firstName || data?.prenom || '',
          email: data?.email || ''
        });

        // keep storage consistent
        const fullName = `${data?.nom || data?.lastName || ''} ${data?.prenom || data?.firstName || ''}`.trim();
        if (data?.role) localStorage.setItem('userRole', data.role);
        if (fullName) localStorage.setItem('userName', fullName);
        if (data?.email) localStorage.setItem('userEmail', data.email);
      } catch (e) {
        // 401/403 redirect handled by interceptor
        toast.error("Impossible de charger vos informations.");
      } finally {
        setLoadingMe(false);
      }
    };

    load();
  }, []);

  // ---------- Tabs ----------
  const tabs = useMemo(
    () => [
      {
        id: 'profile',
        name: 'Profil',
        icon: <UserIcon className="h-5 w-5" />,
        description: 'Mettez à jour vos informations personnelles'
      },
      {
        id: 'security',
        name: 'Sécurité',
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        description: 'Modifiez votre mot de passe'
      },
      {
        id: 'notifications',
        name: 'Notifications',
        icon: <BellIcon className="h-5 w-5" />,
        description: 'Configurez vos préférences de notifications'
      },
    
    ],
    []
  );

  // ---------- Helpers ----------
  const validateProfile = () => {
    if (!profileForm.username.trim()) return "Le nom d'utilisateur est requis.";
    if (!profileForm.nom.trim()) return "Le nom est requis.";
    if (!profileForm.prenom.trim()) return "Le prénom est requis.";
    return '';
  };

  const validatePassword = () => {
    if (!passwordForm.oldPassword.trim()) return "Le mot de passe actuel est requis.";
    if (!passwordForm.newPassword.trim()) return "Le nouveau mot de passe est requis.";
    if (passwordForm.newPassword.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return "Les mots de passe ne correspondent pas.";
    return '';
  };

  // ---------- Profile submit ----------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const err = validateProfile();
    if (err) return toast.error(err);

    setSavingProfile(true);
    try {
      // ✅ backend: PUT /api/auth/update-profile
      await api.put('/auth/update-profile', {
        username: profileForm.username.trim(),
        nom: profileForm.nom.trim(),
        prenom: profileForm.prenom.trim()
      });

      // refresh /me after update
      const res = await authService.getCurrentUser();
      const data = res?.data;
      setMe(data);

      setProfileForm({
        username: data?.username || '',
        nom: data?.lastName || data?.nom || '',
        prenom: data?.firstName || data?.prenom || '',
        email: data?.email || profileForm.email
      });

      const fullName = `${data?.nom || data?.lastName || ''} ${data?.prenom || data?.firstName || ''}`.trim();
      if (fullName) localStorage.setItem('userName', fullName);

      toast.success('Profil mis à jour avec succès.');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Erreur lors de la mise à jour du profil.";
      toast.error(typeof msg === 'string' ? msg : "Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- Password submit ----------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const err = validatePassword();
    if (err) return toast.error(err);

    setSavingPassword(true);
    try {
      // ✅ backend: PUT /api/auth/change-password
      await api.put('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords(false);
      toast.success('Mot de passe modifié avec succès.');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Erreur lors de la modification du mot de passe';
      toast.error(typeof msg === 'string' ? msg : 'Erreur lors de la modification du mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingMe) {
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back */}
          <Link
            to="/profile"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour au profil
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Paramètres</h2>

                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
                        {tab.icon}
                      </span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 p-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {tabs.find((t) => t.id === activeTab)?.icon}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {tabs.find((t) => t.id === activeTab)?.name}
                    </h1>
                  </div>
                  <p className="text-gray-600 text-lg mt-3">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-8">
                  {/* -------- PROFILE TAB -------- */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">
                          <UserIcon className="h-5 w-5 inline mr-2 text-blue-600" />
                          Informations du profil
                        </h3>

                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom d'utilisateur
                              </label>
                              <input
                                type="text"
                                value={profileForm.username}
                                onChange={(e) =>
                                  setProfileForm((p) => ({ ...p, username: e.target.value }))
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Votre nom d'utilisateur"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email (lecture seule)
                              </label>
                              <input
                                type="email"
                                value={profileForm.email}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 bg-gray-100 rounded-lg text-gray-600"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom
                              </label>
                              <input
                                type="text"
                                value={profileForm.nom}
                                onChange={(e) =>
                                  setProfileForm((p) => ({ ...p, nom: e.target.value }))
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Votre nom"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prénom
                              </label>
                              <input
                                type="text"
                                value={profileForm.prenom}
                                onChange={(e) =>
                                  setProfileForm((p) => ({ ...p, prenom: e.target.value }))
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Votre prénom"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={savingProfile}
                              className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all ${
                                savingProfile ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {savingProfile ? (
                                <span className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Mise à jour...
                                </span>
                              ) : (
                                'Enregistrer'
                              )}
                            </button>
                          </div>
                        </form>

                        {me?.active === false && (
                          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            Votre compte est désactivé. Contactez l'administrateur.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* -------- SECURITY TAB -------- */}
                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-800">
                            <LockClosedIcon className="h-5 w-5 inline mr-2 text-blue-600" />
                            Changer le mot de passe
                          </h3>

                          {/* Global show/hide toggle */}
                          <button
                            type="button"
                            onClick={() => setShowPasswords((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors select-none"
                            title={showPasswords ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
                          >
                            {showPasswords ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4" />
                                Masquer
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4" />
                                Afficher
                              </>
                            )}
                          </button>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                          <div className="space-y-4">
                            {/* Current password */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe actuel
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords ? 'text' : 'password'}
                                  value={passwordForm.oldPassword}
                                  onChange={(e) =>
                                    setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))
                                  }
                                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Entrez votre mot de passe actuel"
                                />
                              </div>
                            </div>

                            {/* New password */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nouveau mot de passe
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords ? 'text' : 'password'}
                                  value={passwordForm.newPassword}
                                  onChange={(e) =>
                                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                                  }
                                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Minimum 8 caractères"
                                />
                              </div>
                            </div>

                            {/* Confirm password */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le nouveau mot de passe
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords ? 'text' : 'password'}
                                  value={passwordForm.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                                  }
                                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Retapez votre nouveau mot de passe"
                                />
                              </div>
                            </div>

                            <p className="text-xs text-gray-500">
                              Astuce: utilisez au moins 8 caractères avec des chiffres et lettres.
                            </p>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={savingPassword}
                              className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all ${
                                savingPassword ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {savingPassword ? (
                                <span className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Modification...
                                </span>
                              ) : (
                                'Mettre à jour'
                              )}
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          <ShieldCheckIcon className="h-5 w-5 inline mr-2 text-blue-600" />
                          Sécurité supplémentaire
                        </h3>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="font-medium text-gray-800">Sessions actives</div>
                          <div className="text-sm text-gray-600">
                            (Optionnel) Cette page peut être ajoutée plus tard.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -------- Notifications / Language (placeholder) -------- */}
                  {activeTab === 'notifications' && (
                    <div className="text-center py-12">
                      <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Configuration des notifications
                      </h3>
                      <p className="text-gray-500">Cette fonctionnalité est en cours de développement.</p>
                      <p className="text-sm text-gray-400 mt-2">Bientôt disponible !</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;