/**
 * SettingsPage - Page des paramètres utilisateur
 * 
 * RÔLE : Centraliser tous les paramètres du compte utilisateur
 * 
 * FONCTIONNALITÉS :
 * 1. Gestion du profil (nom, prénom, username)
 * 2. Sécurité (changement de mot de passe)
 * 3. Centre de notifications (lecture, suppression)
 * 
 * ROUTE : /settings
 * 
 * TABS DISPONIBLES :
 * - Profil     : Modification des infos personnelles
 * - Sécurité   : Changement de mot de passe
 * - Notifications : Gestion des notifications reçues
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BellIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import api from '../../services/api';
import { notificationService } from '../../services/notificationService';
import commandeFournisseurService from '../../services/commandeFournisseurService';
import procurementReminderService from '../../services/procurementReminderService';
import Header from '../../components/Header';
import { decorateNotification } from '../../utils/notificationRouting';

const normalizeRole = (value) => String(value || '').trim().toUpperCase().replace(/^ROLE_/, '');

const SettingsPage = () => {
  const navigate = useNavigate();
  // ===== ÉTATS =====
  const [activeTab, setActiveTab] = useState('profile');     // Onglet actif
  const [loadingMe, setLoadingMe] = useState(true);          // Chargement du profil
  const [me, setMe] = useState(null);                        // Données utilisateur

  // Formulaire profil
  const [profileForm, setProfileForm] = useState({
    username: '',
    nom: '',
    prenom: '',
    email: ''
  });

  // Formulaire mot de passe
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState(false); // Afficher/masquer MDP
  const [savingProfile, setSavingProfile] = useState(false); // Sauvegarde profil
  const [savingPassword, setSavingPassword] = useState(false); // Sauvegarde MDP
  const [notifLoading, setNotifLoading] = useState(false);    // Chargement notifications
  const [notifActionLoading, setNotifActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);     // Liste notifications

  // ===== CHARGEMENT DU PROFIL =====
  useEffect(() => {
    const load = async () => {
      setLoadingMe(true);
      try {
        const res = await authService.getCurrentUser();
        const data = res?.data;
        setMe(data);

        // Remplir le formulaire
        setProfileForm({
          username: data?.username || '',
          nom: data?.lastName || data?.nom || '',
          prenom: data?.firstName || data?.prenom || '',
          email: data?.email || ''
        });

        // Mise à jour localStorage
        const fullName = `${data?.nom || data?.lastName || ''} ${data?.prenom || data?.firstName || ''}`.trim();
        if (data?.role) localStorage.setItem('userRole', data.role);
        if (fullName) localStorage.setItem('userName', fullName);
        if (data?.email) localStorage.setItem('userEmail', data.email);
      } catch {
        toast.error('Impossible de charger vos informations.');
      } finally {
        setLoadingMe(false);
      }
    };
    load();
  }, []);

  // ===== CONFIGURATION DES ONGLETS =====
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
      }
    ],
    []
  );

  // ===== NOTIFICATIONS =====
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const normalizedRole = useMemo(
    () => normalizeRole(me?.role || localStorage.getItem('userRole')),
    [me?.role]
  );

  const canUseServerNotifications = useMemo(
    () => ['ADMIN', 'RESPONSABLE_ACHAT', 'PROCUREMENT'].includes(normalizedRole),
    [normalizedRole]
  );

  const canUseProcurementReminders = useMemo(
    () => ['RESPONSABLE_ACHAT', 'PROCUREMENT'].includes(normalizedRole),
    [normalizedRole]
  );

  const loadNotifications = useCallback(async ({ syncProcurement = true } = {}) => {
    if (!canUseServerNotifications && !canUseProcurementReminders) {
      setNotifications([]);
      return;
    }

    setNotifLoading(true);
    const mergedNotifications = [];

    try {
      if (canUseServerNotifications) {
        try {
          const res = await notificationService.getAll();
          const serverItems = Array.isArray(res?.data) ? res.data.map(decorateNotification) : [];
          mergedNotifications.push(...serverItems);
        } catch (error) {
          const msg = error?.response?.data?.message || error?.response?.data || error?.message || 'Erreur notifications';
          toast.error(typeof msg === 'string' ? msg : 'Erreur notifications');
        }
      }

      if (canUseProcurementReminders) {
        try {
          let reminderItems = procurementReminderService.getStoredReminders();
          if (syncProcurement) {
            const commandes = await commandeFournisseurService.getAllCommandes();
            reminderItems = procurementReminderService.syncCommandes(Array.isArray(commandes) ? commandes : []);
          }
          mergedNotifications.push(...(Array.isArray(reminderItems) ? reminderItems : []));
        } catch {
          mergedNotifications.push(...procurementReminderService.getStoredReminders());
        }
      }

      mergedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(mergedNotifications);
    } finally {
      setNotifLoading(false);
    }
  }, [canUseProcurementReminders, canUseServerNotifications]);

  // Charge les notifications quand l'onglet est actif
  useEffect(() => {
    if (activeTab !== 'notifications') return;
    loadNotifications();
  }, [activeTab, loadNotifications]);

  // ===== VALIDATIONS =====
  const validateProfile = () => {
    if (!profileForm.username.trim()) return "Le nom d'utilisateur est requis.";
    if (!profileForm.nom.trim()) return 'Le nom est requis.';
    if (!profileForm.prenom.trim()) return 'Le prénom est requis.';
    return '';
  };

  const validatePassword = () => {
    if (!passwordForm.oldPassword.trim()) return 'Le mot de passe actuel est requis.';
    if (!passwordForm.newPassword.trim()) return 'Le nouveau mot de passe est requis.';
    if (passwordForm.newPassword.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    return '';
  };

  // ===== ACTIONS NOTIFICATIONS =====
  const handleMarkAsRead = async (id) => {
    if (procurementReminderService.isReminderId(id)) {
      procurementReminderService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }

    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error('Impossible de marquer comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifActionLoading(true);
    try {
      if (canUseProcurementReminders) {
        procurementReminderService.markAllRead();
      }
      if (canUseServerNotifications) {
        await notificationService.markAllRead();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Toutes les notifications sont marquées comme lues');
    } catch {
      toast.error('Impossible de tout marquer comme lu');
    } finally {
      setNotifActionLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (procurementReminderService.isReminderId(id)) {
      procurementReminderService.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification supprimÃ©e');
      return;
    }

    try {
      await notificationService.deleteOne(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification supprimée');
    } catch {
      toast.error('Erreur suppression notification');
    }
  };

  const handleNotificationAction = async (notification) => {
    const targetPath = notification?.actionPath || notification?.reminderPath;
    if (!targetPath) return;

    if (notification.source === 'procurement-reminder') {
      procurementReminderService.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );
      navigate(targetPath);
      return;
    }

    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    navigate(targetPath);
  };

  useEffect(() => {
    if (activeTab !== 'notifications' || !canUseProcurementReminders) return undefined;

    const handleReminderUpdate = () => {
      loadNotifications({ syncProcurement: false });
    };

    window.addEventListener(procurementReminderService.REMINDER_EVENT, handleReminderUpdate);
    return () => window.removeEventListener(procurementReminderService.REMINDER_EVENT, handleReminderUpdate);
  }, [activeTab, canUseProcurementReminders, loadNotifications]);

  // ===== ACTIONS PROFIL =====
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const err = validateProfile();
    if (err) return toast.error(err);

    setSavingProfile(true);
    try {
      await api.put('/auth/update-profile', {
        username: profileForm.username.trim(),
        nom: profileForm.nom.trim(),
        prenom: profileForm.prenom.trim()
      });

      // Recharger les données
      const res = await authService.getCurrentUser({ force: true });
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
      const msg = error?.response?.data?.message || error?.response?.data || error?.message || 'Erreur lors de la mise à jour du profil.';
      toast.error(typeof msg === 'string' ? msg : 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ===== ACTIONS MOT DE PASSE =====
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const err = validatePassword();
    if (err) return toast.error(err);

    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords(false);
      toast.success('Mot de passe modifié avec succès.');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data || error?.message || 'Erreur lors de la modification du mot de passe';
      toast.error(typeof msg === 'string' ? msg : 'Erreur lors de la modification du mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  // Formatage date notification
  const formatNotificationDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  // ===== AFFICHAGE CHARGEMENT =====
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

  // ===== RENDU PRINCIPAL =====
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Lien retour */}
          <Link to="/profile" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour au profil
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ===== SIDEBAR GAUCHE : ONGLETS ===== */}
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
                      <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}>
                        {tab.icon}
                      </span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* ===== CONTENU PRINCIPAL ===== */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                
                {/* En-tête */}
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

                {/* Corps */}
                <div className="p-8">
                  
                  {/* ONGLET PROFIL */}
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
                                onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
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
                                onChange={(e) => setProfileForm((p) => ({ ...p, nom: e.target.value }))}
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
                                onChange={(e) => setProfileForm((p) => ({ ...p, prenom: e.target.value }))}
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

                  {/* ONGLET SÉCURITÉ */}
                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-800">
                            <LockClosedIcon className="h-5 w-5 inline mr-2 text-blue-600" />
                            Changer le mot de passe
                          </h3>

                          <button
                            type="button"
                            onClick={() => setShowPasswords((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors select-none"
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
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe actuel
                              </label>
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Entrez votre mot de passe actuel"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nouveau mot de passe
                              </label>
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Minimum 8 caractères"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le nouveau mot de passe
                              </label>
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Retapez votre nouveau mot de passe"
                              />
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
                    </div>
                  )}

                  {/* ONGLET NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Centre de notifications
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {unreadCount > 0
                              ? `${unreadCount} notification(s) non lue(s)`
                              : 'Toutes vos notifications sont lues'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadNotifications()}
                            disabled={notifLoading}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-white ${
                              notifLoading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            <ArrowPathIcon className={`h-4 w-4 ${notifLoading ? 'animate-spin' : ''}`} />
                            Actualiser
                          </button>
                          <button
                            onClick={handleMarkAllAsRead}
                            disabled={notifActionLoading || unreadCount === 0}
                            className={`px-3 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 ${
                              notifActionLoading || unreadCount === 0 ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            Tout marquer comme lu
                          </button>
                        </div>
                      </div>

                      {notifLoading ? (
                        <div className="py-12 text-center text-gray-500">Chargement des notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">Aucune notification</div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                                n.read
                                  ? 'bg-white border-gray-200'
                                  : n.source === 'procurement-reminder'
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="min-w-0">
                                {(n.title || n.badgeLabel) && (
                                  <div className="flex items-center gap-2 mb-1">
                                    {n.title && (
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                        {n.title}
                                      </span>
                                    )}
                                    {n.badgeLabel && (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                                        {n.badgeLabel}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                                  {n.message || 'Notification sans message'}
                                </p>
                                {n.fournisseurNom && (
                                  <p className="text-xs text-gray-500 mt-1">Fournisseur: {n.fournisseurNom}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatNotificationDate(n.createdAt)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {(n.actionPath || n.reminderPath) && (
                                  <button
                                    onClick={() => handleNotificationAction(n)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                      n.source === 'procurement-reminder'
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                  >
                                    {n.actionLabel || 'Voir'}
                                  </button>
                                )}
                                {!n.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(n.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  >
                                    Marquer lue
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotification(n.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
