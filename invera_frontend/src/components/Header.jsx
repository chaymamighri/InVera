// src/components/Header.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import logo from '../assets/images/logo.png';
import { notificationService } from '../services/notificationService';

const Header = ({ sidebarCollapsed = false }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // detect new notifications (for toast popup)
  const lastUnreadRef = useRef(0);

  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const user = (() => {
    const name = localStorage.getItem('userName') || 'Utilisateur';
    const email = localStorage.getItem('userEmail') || '';
    const role = (localStorage.getItem('userRole') || 'user').trim();

    const roleTranslations = {
      ADMIN: 'Administrateur',
      COMMERCIAL: 'Responsable Ventes',
      RESPONSABLE_ACHAT: 'Responsable Achats',
      admin: 'Administrateur',
      sales: 'Responsable Ventes',
      procurement: 'Responsable Achats',
      user: 'Utilisateur',
    };

    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return {
      name,
      email,
      roleRaw: role,
      role: roleTranslations[role] || roleTranslations[role.toUpperCase()] || role,
      initials: initials || 'U',
      isAdmin: role.toUpperCase() === 'ADMIN',
    };
  })();

  const handleLogout = () => {
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((item) => {
      localStorage.removeItem(item);
    });
    navigate('/login');
  };

  // ✅ Confirm dialog using react-hot-toast (no browser alert)
  const confirmToast = (message, onConfirm) => {
    toast(
      (t) => (
        <div className="bg-white rounded-xl shadow-lg p-4 w-80 border border-gray-100">
          <p className="text-sm text-gray-800 mb-3">{message}</p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200"
            >
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
      {
        duration: Infinity,
        position: 'top-center',
      }
    );
  };

  const formatDate = (value) => {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return value;
    } catch {
      return value;
    }
  };

  const groupByMonth = (list) => {
    const map = new Map();

    for (const n of list) {
      const d = new Date(n.createdAt);
      const monthValue = !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : 'unknown';

      const monthLabel = !isNaN(d.getTime())
        ? d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
        : 'Inconnu';

      const enriched = { ...n, __monthValue: monthValue };

      if (!map.has(monthLabel)) map.set(monthLabel, []);
      map.get(monthLabel).push(enriched);
    }

    return Array.from(map.entries());
  };

  const loadUnreadCount = async ({ withToast = false } = {}) => {
    if (!user.isAdmin) return;
    try {
      const res = await notificationService.getUnreadCount();
      const n = typeof res.data === 'number' ? res.data : Number(res.data || 0);
      const safe = Number.isFinite(n) ? n : 0;

      // ✅ only toast if dropdown is NOT open
      if (withToast && !isNotifOpen && safe > lastUnreadRef.current) {
        toast.success(`🔔 Vous avez ${safe} notification(s) non lue(s)`);
      }

      lastUnreadRef.current = safe;
      setUnreadCount(safe);
    } catch {
      // silent
    }
  };

  const loadNotifications = async () => {
    if (!user.isAdmin) return;
    setNotifLoading(true);
    try {
      const res = await notificationService.getAll();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        'Erreur notifications';
      toast.error(typeof msg === 'string' ? msg : 'Erreur notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      lastUnreadRef.current = Math.max(0, lastUnreadRef.current - 1);
    } catch {
      toast.error('Impossible de marquer comme lu');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      lastUnreadRef.current = 0;
    } catch {
      toast.error('Impossible de tout marquer comme lu');
    }
  };

  // ✅ Poll unread count (ADMIN only)
  useEffect(() => {
    if (!user.isAdmin) return;

    loadUnreadCount({ withToast: false });

    const t = setInterval(() => {
      loadUnreadCount({ withToast: true });
    }, 15000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.isAdmin, isNotifOpen]);

  // ✅ Close menus on outside click (capture)
  useEffect(() => {
    const onPointerDown = (e) => {
      const inProfile = profileRef.current?.contains(e.target);
      const inNotif = notifRef.current?.contains(e.target);

      if (!inProfile) setIsProfileOpen(false);
      if (!inNotif) setIsNotifOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  // when notif dropdown opens, refresh list + count
  useEffect(() => {
    if (!isNotifOpen) return;
    loadNotifications();
    loadUnreadCount({ withToast: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotifOpen]);

  // ✅ Toggle handlers (close the other dropdown)
  const toggleNotifications = () => {
    setIsProfileOpen(false);
    setIsNotifOpen((p) => !p);
  };

  const toggleProfile = () => {
    setIsNotifOpen(false);
    setIsProfileOpen((p) => !p);
  };

  // ✅ SAME LOGIC AS DASHBOARD: ml-20 when collapsed, ml-64 when expanded
  const leftOffsetClass = sidebarCollapsed ? 'ml-20' : 'ml-64';

  return (
    <header
      className={`${leftOffsetClass} bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg relative z-40 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              {logo && <img src={logo} alt="InVera ERP Logo" className="h-10 w-auto" />}
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-white">InVera ERP</h1>
                <p className="text-xs text-blue-200">Système de Gestion Intégré</p>
              </div>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* 🔔 Notifications (ADMIN only) */}
            {user.isAdmin && (
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

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-[420px] bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Notifications</p>
                          <p className="text-xs text-blue-100">Non lues: {unreadCount}</p>
                        </div>

                        <button
                          onClick={markAllRead}
                          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full"
                        >
                          Tout lire
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await notificationService.deleteRange('week');
                              toast.success(`Supprimé: ${res?.data?.deleted ?? 0}`);
                              await loadNotifications();
                              await loadUnreadCount({ withToast: false });
                            } catch {
                              toast.error('Erreur suppression (7 jours)');
                            }
                          }}
                          className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full"
                        >
                          Supprimer 7 jours
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const res = await notificationService.deleteRange('month');
                              toast.success(`Supprimé: ${res?.data?.deleted ?? 0}`);
                              await loadNotifications();
                              await loadUnreadCount({ withToast: false });
                            } catch {
                              toast.error('Erreur suppression (30 jours)');
                            }
                          }}
                          className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full"
                        >
                          Supprimer 30 jours
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const current = new Date();
                              const ym = `${current.getFullYear()}-${String(
                                current.getMonth() + 1
                              ).padStart(2, '0')}`;
                              const res = await notificationService.deleteMonth(ym);
                              toast.success(`Supprimé (${ym}): ${res?.data?.deleted ?? 0}`);
                              await loadNotifications();
                              await loadUnreadCount({ withToast: false });
                            } catch {
                              toast.error('Erreur suppression (ce mois)');
                            }
                          }}
                          className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full"
                        >
                          Supprimer ce mois
                        </button>

                        <button
                          onClick={() => {
                            confirmToast('Supprimer TOUTES les notifications ?', async () => {
                              try {
                                const res = await notificationService.deleteAll();
                                toast.success(`Supprimé: ${res?.data?.deleted ?? 0}`);
                                await loadNotifications();
                                await loadUnreadCount({ withToast: false });
                              } catch {
                                toast.error('Erreur suppression totale');
                              }
                            });
                          }}
                          className="text-xs bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-full"
                        >
                          Tout supprimer
                        </button>
                      </div>
                    </div>

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
                                      try {
                                        const res = await notificationService.deleteMonth(monthValue);
                                        toast.success(`Supprimé (${monthValue}): ${res?.data?.deleted ?? 0}`);
                                        await loadNotifications();
                                        await loadUnreadCount({ withToast: false });
                                      } catch {
                                        toast.error('Erreur suppression mois');
                                      }
                                    });
                                  }}
                                  className="text-[11px] px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                  Supprimer mois
                                </button>
                              </div>

                              <div className="divide-y divide-gray-100 rounded-xl overflow-hidden border border-gray-100">
                                {items.map((n) => (
                                  <div key={n.id} className={`px-3 py-3 ${n.read ? 'bg-white' : 'bg-yellow-50'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                      <button
                                        onClick={() => !n.read && markRead(n.id)}
                                        className="text-left flex-1"
                                        title={!n.read ? 'Cliquer pour marquer comme lu' : ''}
                                      >
                                        <p className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                                          {n.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(n.createdAt)}</p>
                                      </button>

                                      <button
                                        onClick={() => {
                                          confirmToast('Supprimer cette notification ?', async () => {
                                            try {
                                              await notificationService.deleteOne(n.id);
                                              toast.success('Notification supprimée');
                                              setNotifications((prev) => prev.filter((x) => x.id !== n.id));
                                              await loadUnreadCount({ withToast: false });
                                            } catch {
                                              toast.error('Erreur suppression notification');
                                            }
                                          });
                                        }}
                                        className="text-xs px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                                        title="Supprimer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
                      Cliquez sur une notification non lue pour la marquer comme lue.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="hidden lg:block h-6 w-px bg-white/20"></div>

            {/* Profile */}
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

                <ChevronDownIcon
                  className={`h-4 w-4 text-blue-200 group-hover:text-white transition-transform ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[9999]">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-sm text-blue-100 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
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

                  <div className="border-t border-gray-100"></div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsProfileOpen(false);
                    }}
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