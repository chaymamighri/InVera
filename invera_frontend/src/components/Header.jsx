/**
 * COMPOSANT HEADER - Barre de navigation principale
 * 
 * @description
 * Composant d'en-tête fixe qui gère la navigation, les notifications, 
 * et le profil utilisateur. Il s'adapte dynamiquement à l'état du menu 
 * latéral et au rôle de l'utilisateur.
 * 
 * @example
 * // Utilisation dans App.jsx
 * <Header userRole={user.role} />
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import logo from '../assets/images/logo.png';
import { notificationService } from '../services/notificationService';
import commandeFournisseurService from '../services/commandeFournisseurService';
import procurementReminderService from '../services/procurementReminderService';
import { useSidebar } from '../context/SidebarContext';

/**
 * Normalise le rôle utilisateur pour la comparaison
 * @param {string} value - Rôle brut
 * @returns {string} Rôle normalisé en majuscules sans préfixe ROLE_
 */

const normalizeRole = (value) => String(value || '').trim().toUpperCase().replace(/^ROLE_/, '');

const Header = ({ userRole }) => {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // ===== ÉTATS LOCAUX =====
  const [isProfileOpen, setIsProfileOpen] = useState(false);      // Menu profil ouvert/fermé
  const [isNotifOpen, setIsNotifOpen] = useState(false);         // Panneau notifications ouvert/fermé
  const [notifLoading, setNotifLoading] = useState(false);       // Chargement des notifications
  const [serverUnreadCount, setServerUnreadCount] = useState(0); // Notifications non lues (API)
  const [serverNotifications, setServerNotifications] = useState([]); // Notifications API
  const [localReminders, setLocalReminders] = useState([]);      // Rappels locaux (commandes fournisseurs)

  // ===== REFS =====
  const lastUnreadRef = useRef(0);                    // Dernier compteur connu
  const initialUnreadSnapshotRef = useRef(false);     // Premier chargement effectué
  const profileRef = useRef(null);                    // Référence menu profil
  const notifRef = useRef(null);                      // Référence panneau notifications

  // ===== DONNÉES UTILISATEUR =====
  /**
   * Informations utilisateur enrichies et traduites
   * @property {string} name - Nom complet
   * @property {string} email - Email
   * @property {string} role - Rôle traduit en français
   * @property {string} initials - Initiales (max 2 caractères)
   * @property {boolean} isAdmin - Est-ce un administrateur ?
   * @property {boolean} canUseNotifications - Peut voir les notifications ?
   * @property {boolean} canUseProcurementReminders - Peut voir les rappels achats ?
   */
  const user = useMemo(() => {
    const name = localStorage.getItem('userName') || 'Utilisateur';
    const email = localStorage.getItem('userEmail') || '';
    const role = (userRole || localStorage.getItem('userRole') || 'user').trim();
    const normalizedRole = normalizeRole(role);

    // Traduction des rôles
    const roleTranslations = {
      ADMIN: 'Administrateur',
      COMMERCIAL: 'Responsable Ventes',
      RESPONSABLE_ACHAT: 'Responsable Achats',
      PROCUREMENT: 'Responsable Achats',
      admin: 'Administrateur',
      sales: 'Responsable Ventes',
      procurement: 'Responsable Achats',
      user: 'Utilisateur',
    };

    // Génération des initiales
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return {
      name,
      email,
      roleRaw: role,
      normalizedRole,
      role: roleTranslations[role] || roleTranslations[normalizedRole] || roleTranslations[normalizedRole.toLowerCase()] || role,
      initials: initials || 'U',
      isAdmin: normalizedRole === 'ADMIN',
      // Les responsables achats et admins peuvent voir les notifications
      canUseNotifications: ['ADMIN', 'RESPONSABLE_ACHAT', 'PROCUREMENT'].includes(normalizedRole),
      // Seuls les responsables achats voient les rappels
      canUseProcurementReminders: ['RESPONSABLE_ACHAT', 'PROCUREMENT'].includes(normalizedRole),
    };
  }, [userRole]);

  // ===== NOTIFICATIONS =====
  /**
   * Nombre total de notifications non lues (API + locales)
   */
  const unreadCount = useMemo(() => {
    const localUnreadCount = localReminders.filter((item) => !item.read).length;
    return serverUnreadCount + localUnreadCount;
  }, [localReminders, serverUnreadCount]);

  /**
   * Toutes les notifications fusionnées (API + locales), triées par date
   */
  const notifications = useMemo(() => {
    return [...serverNotifications, ...localReminders].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [localReminders, serverNotifications]);

  // ===== FONCTIONS MÉTIER =====
  
  /**
   * Déconnexion de l'utilisateur
   * Supprime les données de session et redirige vers login
   */
  const handleLogout = () => {
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((item) => {
      localStorage.removeItem(item);
    });
    navigate('/login');
  };

  /**
   * Toast de confirmation avant action destructive
   * @param {string} message - Message à afficher
   * @param {Function} onConfirm - Callback en cas de confirmation
   */
  const confirmToast = (message, onConfirm) => {
    toast(
      (t) => (
        <div className="bg-white rounded-xl shadow-lg p-4 w-80 border border-gray-100">
          <p className="text-sm text-gray-800 mb-3">{message}</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200">
              Annuler
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await onConfirm();
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Confirmer
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    );
  };

  /**
   * Formatage des dates pour affichage
   * @param {string|Date} value - Date à formater
   * @returns {string} Date formatée ou valeur originale
   */
  const formatDate = (value) => {
    try {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
      return value;
    } catch {
      return value;
    }
  };

  /**
   * Regroupe les notifications par mois
   * @param {Array} list - Liste des notifications
   * @returns {Array} [nomMois, notifications[]]
   */
  const groupByMonth = (list) => {
    const map = new Map();
    list.forEach((notification) => {
      const date = new Date(notification.createdAt);
      const monthValue = !Number.isNaN(date.getTime())
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : 'unknown';
      const monthLabel = !Number.isNaN(date.getTime())
        ? date.toLocaleString(undefined, { month: 'long', year: 'numeric' })
        : 'Inconnu';
      const enriched = { ...notification, __monthValue: monthValue };
      if (!map.has(monthLabel)) {
        map.set(monthLabel, []);
      }
      map.get(monthLabel).push(enriched);
    });
    return Array.from(map.entries());
  };

  // ===== CHARGEMENT DES DONNÉES =====
  
  /**
   * Charge le compteur de notifications non lues depuis l'API
   */
  const loadUnreadCount = async () => {
    if (!user.canUseNotifications) return 0;
    try {
      const res = await notificationService.getUnreadCount();
      const n = typeof res.data === 'number' ? res.data : Number(res.data || 0);
      const safe = Number.isFinite(n) ? n : 0;
      setServerUnreadCount(safe);
      return safe;
    } catch {
      return 0;
    }
  };

  /**
   * Charge toutes les notifications depuis l'API
   */
  const loadNotifications = async () => {
    if (!user.canUseNotifications) return;
    setNotifLoading(true);
    try {
      const res = await notificationService.getAll();
      setServerNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data || error?.message || 'Erreur notifications';
      toast.error(typeof msg === 'string' ? msg : 'Erreur notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  /**
   * Charge les rappels locaux (commandes fournisseurs)
   * @param {Object} options - Options de chargement
   * @param {boolean} options.sync - Synchroniser avec l'API (défaut: true)
   */
  const loadLocalReminders = async ({ sync = true } = {}) => {
    if (!user.canUseProcurementReminders) {
      setLocalReminders([]);
      return [];
    }
    try {
      if (!sync) {
        const storedReminders = procurementReminderService.getStoredReminders();
        setLocalReminders(storedReminders);
        return storedReminders;
      }
      const data = await commandeFournisseurService.getAllCommandes();
      const reminders = procurementReminderService.syncCommandes(Array.isArray(data) ? data : []);
      setLocalReminders(reminders);
      return reminders;
    } catch {
      const storedReminders = procurementReminderService.getStoredReminders();
      setLocalReminders(storedReminders);
      return storedReminders;
    }
  };

  // ===== ACTIONS SUR NOTIFICATIONS =====
  
  /**
   * Marque une notification comme lue
   * @param {string|number} id - Identifiant de la notification
   */
  const markRead = async (id) => {
    // Notification locale (rappel achat)
    if (procurementReminderService.isReminderId(id)) {
      procurementReminderService.markRead(id);
      return;
    }
    // Notification API
    try {
      await notificationService.markRead(id);
      setServerNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      setServerUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Impossible de marquer comme lu');
    }
  };

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllRead = async () => {
    procurementReminderService.markAllRead();
    try {
      await notificationService.markAllRead();
      setServerNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setServerUnreadCount(0);
    } catch {
      toast.error('Impossible de tout marquer comme lu');
    }
  };

  /**
   * Action sur un rappel achat (redirection vers la commande)
   * @param {Object} reminder - Rappel concerné
   */
  const handleReminderAction = (reminder) => {
    procurementReminderService.markRead(reminder.id);
    setIsNotifOpen(false);
    navigate(reminder.reminderPath);
  };

  /**
   * Supprime une notification
   * @param {Object} notification - Notification à supprimer
   */
  const handleDeleteNotification = async (notification) => {
    if (notification.source === 'procurement-reminder') {
      procurementReminderService.dismiss(notification.id);
      toast.success('Notification supprimée');
      return;
    }
    try {
      await notificationService.deleteOne(notification.id);
      toast.success('Notification supprimée');
      setServerNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      await loadUnreadCount();
    } catch {
      toast.error('Erreur suppression notification');
    }
  };

  /**
   * Supprime les notifications d'une période
   * @param {string} range - 'week' (7 jours) ou 'month' (30 jours)
   */
  const handleDeleteRange = async (range) => {
    let deleted = 0;
    try {
      const res = await notificationService.deleteRange(range);
      deleted += Number(res?.data?.deleted || 0);
    } catch {
      toast.error(`Erreur suppression (${range === 'week' ? '7 jours' : '30 jours'})`);
      return;
    }
    deleted += procurementReminderService.dismissRange(range);
    toast.success(`Supprimé: ${deleted}`);
    await loadNotifications();
    await loadUnreadCount();
  };

  /**
   * Supprime les notifications d'un mois spécifique
   * @param {string} monthValue - Mois au format YYYY-MM
   */
  const handleDeleteMonth = async (monthValue) => {
    let deleted = 0;
    try {
      const res = await notificationService.deleteMonth(monthValue);
      deleted += Number(res?.data?.deleted || 0);
    } catch {
      toast.error('Erreur suppression mois');
      return;
    }
    deleted += procurementReminderService.dismissMonth(monthValue);
    toast.success(`Supprimé (${monthValue}): ${deleted}`);
    await loadNotifications();
    await loadUnreadCount();
  };

  /**
   * Supprime TOUTES les notifications
   */
  const handleDeleteAll = async () => {
    let deleted = 0;
    try {
      const res = await notificationService.deleteAll();
      deleted += Number(res?.data?.deleted || 0);
    } catch {
      toast.error('Erreur suppression totale');
      return;
    }
    deleted += procurementReminderService.dismissAll();
    toast.success(`Supprimé: ${deleted}`);
    await loadNotifications();
    await loadUnreadCount();
  };

  // ===== EFFETS =====
  
  /**
   * Effet : Polling des notifications et rappels
   * - Notifications : rafraîchissement toutes les 15 secondes
   * - Rappels achats : rafraîchissement toutes les 60 secondes
   */
  useEffect(() => {
    if (!user.canUseNotifications) return undefined;
    loadUnreadCount();
    const unreadInterval = window.setInterval(() => {
      loadUnreadCount();
    }, 15000);
    let reminderInterval = null;
    if (user.canUseProcurementReminders) {
      loadLocalReminders();
      reminderInterval = window.setInterval(() => {
        loadLocalReminders();
      }, 60000);
    }
    return () => {
      window.clearInterval(unreadInterval);
      if (reminderInterval) {
        window.clearInterval(reminderInterval);
      }
    };
  }, [user.canUseNotifications, user.canUseProcurementReminders]);

  /**
   * Effet : Notification toast à l'arrivée de nouvelles notifications
   * Affiche un toast lorsque le nombre de notifications non lues augmente
   */
  useEffect(() => {
    if (!user.canUseNotifications) {
      setServerUnreadCount(0);
      setServerNotifications([]);
      setLocalReminders([]);
      lastUnreadRef.current = 0;
      initialUnreadSnapshotRef.current = false;
      return;
    }
    // Premier chargement
    if (!initialUnreadSnapshotRef.current) {
      if (unreadCount > 0) {
        toast(`Vous avez ${unreadCount} notification(s) non lue(s)`);
      }
      lastUnreadRef.current = unreadCount;
      initialUnreadSnapshotRef.current = true;
      return;
    }
    // Nouvelles notifications
    if (!isNotifOpen && unreadCount > lastUnreadRef.current) {
      toast.success(`Vous avez ${unreadCount} notification(s) non lue(s)`);
    }
    lastUnreadRef.current = unreadCount;
  }, [isNotifOpen, unreadCount, user.canUseNotifications]);

  /**
   * Effet : Fermeture des menus au clic exterieur
   */
  useEffect(() => {
    const onPointerDown = (event) => {
      const inProfile = profileRef.current?.contains(event.target);
      const inNotif = notifRef.current?.contains(event.target);
      if (!inProfile) setIsProfileOpen(false);
      if (!inNotif) setIsNotifOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  /**
   * Effet : Charge les notifications quand le panneau s'ouvre
   */
  useEffect(() => {
    if (!isNotifOpen) return;
    loadNotifications();
    loadUnreadCount();
    loadLocalReminders();
  }, [isNotifOpen]);

  /**
   * Effet : Écoute les mises à jour des rappels
   */
  useEffect(() => {
    if (!user.canUseProcurementReminders) return undefined;
    const handleReminderUpdate = () => {
      setLocalReminders(procurementReminderService.getStoredReminders());
    };
    window.addEventListener(procurementReminderService.REMINDER_EVENT, handleReminderUpdate);
    return () => window.removeEventListener(procurementReminderService.REMINDER_EVENT, handleReminderUpdate);
  }, [user.canUseProcurementReminders]);

  // ===== GESTIONNAIRES D'OUVERTURE =====
  const toggleNotifications = () => {
    setIsProfileOpen(false);
    setIsNotifOpen((prev) => !prev);
  };

  const toggleProfile = () => {
    setIsNotifOpen(false);
    setIsProfileOpen((prev) => !prev);
  };

  // ===== CALCUL DES CLASSES CSS (adaptation au menu latéral) =====
  const isDashboardPage = location.pathname.startsWith('/dashboard/');
  const leftMarginClass = isDashboardPage ? (collapsed ? 'left-20' : 'left-64') : 'left-0';
  const widthClass = isDashboardPage ? (collapsed ? 'w-[calc(100%-80px)]' : 'w-[calc(100%-256px)]') : 'w-full';

  // ===== RENDU =====
  return (
    <header className={`fixed top-0 z-40 transition-all duration-300 ${leftMarginClass} ${widthClass}`}>
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ===== LOGO & TITRE ===== */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                {logo && <img src={logo} alt="InVera ERP Logo" className="h-10 w-auto" />}
                <div className="hidden md:block">
                  <h1 className="text-lg font-bold text-white">InVera ERP</h1>
                  <p className="text-xs text-blue-200">Système de Gestion Intégré</p>
                </div>
              </Link>
            </div>

            {/* ===== ACTIONS DROITES ===== */}
            <div className="flex items-center space-x-4">
              {/* BOUTON NOTIFICATIONS */}
              {user.canUseNotifications && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                    title="Notifications"
                  >
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 text-[11px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center ring-2 ring-blue-900">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-400 rounded-full ring-2 ring-blue-900"></span>
                    )}
                  </button>

                  {/* PANEL NOTIFICATIONS */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-[420px] bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                      {/* En-tête avec filtres */}
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Notifications</p>
                            <p className="text-xs text-blue-100">Non lues: {unreadCount}</p>
                          </div>
                          <button onClick={markAllRead} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full">
                            Tout lire
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => handleDeleteRange('week')} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full">
                            Supprimer 7 jours
                          </button>
                          <button onClick={() => handleDeleteRange('month')} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full">
                            Supprimer 30 jours
                          </button>
                          <button
                            onClick={() => {
                              const current = new Date();
                              const monthValue = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                              handleDeleteMonth(monthValue);
                            }}
                            className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full"
                          >
                            Supprimer ce mois
                          </button>
                          <button
                            onClick={() => confirmToast('Supprimer TOUTES les notifications ?', async () => await handleDeleteAll())}
                            className="text-xs bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-full"
                          >
                            Tout supprimer
                          </button>
                        </div>
                      </div>

                      {/* Liste des notifications */}
                      <div className="max-h-[380px] overflow-auto">
                        {notifLoading ? (
                          <div className="p-4 text-sm text-gray-500">Chargement...</div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-500">Aucune notification</div>
                        ) : (
                          <div className="p-2">
                            {groupByMonth(notifications).map(([monthLabel, items]) => (
                              <div key={monthLabel} className="mb-3">
                                <div className="px-3 py-2 text-xs font-bold text-gray-600 flex items-center justify-between">
                                  <span>{monthLabel}</span>
                                  <button
                                    onClick={() => {
                                      const monthValue = items?.[0]?.__monthValue;
                                      if (!monthValue) return;
                                      confirmToast(`Supprimer toutes les notifications de ${monthValue} ?`, async () => {
                                        await handleDeleteMonth(monthValue);
                                      });
                                    }}
                                    className="text-[11px] px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  >
                                    Supprimer mois
                                  </button>
                                </div>
                                <div className="divide-y divide-gray-100 rounded-xl overflow-hidden border border-gray-100">
                                  {items.map((notification) => {
                                    const isReminder = notification.source === 'procurement-reminder';
                                    const containerClasses = notification.read
                                      ? 'bg-white'
                                      : isReminder
                                      ? 'bg-amber-50'
                                      : 'bg-yellow-50';
                                    return (
                                      <div key={notification.id} className={`px-3 py-3 ${containerClasses}`}>
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <button
                                              onClick={() => { if (!notification.read) markRead(notification.id); }}
                                              className="text-left w-full"
                                              title={!notification.read ? 'Cliquer pour marquer comme lu' : ''}
                                            >
                                              {(notification.title || notification.badgeLabel) && (
                                                <div className="flex items-center gap-2 mb-1">
                                                  {notification.title && (
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                      {notification.title}
                                                    </span>
                                                  )}
                                                  {notification.badgeLabel && (
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                                                      {notification.badgeLabel}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                              <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                                                {notification.message}
                                              </p>
                                              {notification.fournisseurNom && (
                                                <p className="text-xs text-gray-500 mt-1">Fournisseur: {notification.fournisseurNom}</p>
                                              )}
                                              <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                                            </button>
                                            {isReminder && (
                                              <div className="mt-3 flex items-center justify-between gap-3">
                                                <p className="text-xs text-amber-700">{notification.actionHint || 'Traitez cette commande rapidement.'}</p>
                                                <button
                                                  onClick={() => handleReminderAction(notification)}
                                                  className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                                                >
                                                  {notification.actionLabel || 'Voir'}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => confirmToast('Supprimer cette notification ?', async () => await handleDeleteNotification(notification))}
                                            className="text-xs px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                                            title="Supprimer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
                        Cliquez sur une notification pour la marquer comme lue. Les rappels achat incluent aussi un accès direct à la commande concernée.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="hidden lg:block h-6 w-px bg-white/20"></div>

              {/* MENU PROFIL */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                  aria-label="Menu profil"
                >
                  <div className="h-9 w-9 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50">
                    <span className="text-white font-bold text-sm">{user.initials}</span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-semibold text-sm truncate max-w-[150px]">{user.name.split(' ')[0]}</p>
                    <p className="text-xs text-blue-200 opacity-90 truncate max-w-[150px]">{user.role}</p>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-blue-200 group-hover:text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[9999]">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-sm text-blue-100 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">{user.role}</span>
                    </div>
                    <div className="py-2">
                      <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50" onClick={() => setIsProfileOpen(false)}>
                        <UserCircleIcon className="h-5 w-5 mr-3 text-blue-600" />
                        Mon profil
                      </Link>
                      <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50" onClick={() => setIsProfileOpen(false)}>
                        <svg className="h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Paramètres
                      </Link>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <button onClick={() => { handleLogout(); setIsProfileOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl">
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
      </div>
    </header>
  );
};

export default Header;