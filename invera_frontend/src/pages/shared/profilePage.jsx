import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import Header from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';

const profileCopy = {
  fr: {
    unknown: 'Non renseigné',
    never: 'Jamais',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    loadError: 'Impossible de charger votre profil.',
    offlineTitle: 'Données affichées en mode hors-ligne',
    backToDashboard: 'Retour au tableau de bord',
    disabledAccount: 'Compte désactivé',
    editProfile: 'Modifier le profil',
    personalInfo: 'Informations personnelles',
    professionalInfo: 'Informations professionnelles',
    fullName: 'Nom complet',
    email: 'Email',
    role: 'Rôle',
    memberSince: 'Membre depuis',
    sessionsThisWeek: 'Sessions cette semaine',
    lastLogin: 'Dernière connexion',
    memberSinceHelper: 'Date de création du compte',
    unavailableHelper: 'Date non disponible',
    sessionsHelper: 'Activité récente sur les 7 derniers jours',
    lastLoginHelper: 'Dernière activité',
    noLoginHelper: 'Aucune connexion enregistrée',
    administrator: 'Administrateur',
    salesManager: 'Responsable Commercial',
    procurementManager: 'Responsable Achats',
    salesLead: 'Responsable Ventes',
    user: 'Utilisateur',
  },
  en: {
    unknown: 'Not provided',
    never: 'Never',
    today: 'Today',
    yesterday: 'Yesterday',
    loadError: 'Unable to load your profile.',
    offlineTitle: 'Data shown in offline mode',
    backToDashboard: 'Back to dashboard',
    disabledAccount: 'Account disabled',
    editProfile: 'Edit profile',
    personalInfo: 'Personal information',
    professionalInfo: 'Professional information',
    fullName: 'Full name',
    email: 'Email',
    role: 'Role',
    memberSince: 'Member since',
    sessionsThisWeek: 'Sessions this week',
    lastLogin: 'Last login',
    memberSinceHelper: 'Account creation date',
    unavailableHelper: 'Date not available',
    sessionsHelper: 'Recent activity over the last 7 days',
    lastLoginHelper: 'Latest activity',
    noLoginHelper: 'No recorded login yet',
    administrator: 'Administrator',
    salesManager: 'Sales Manager',
    procurementManager: 'Procurement Manager',
    salesLead: 'Sales Lead',
    user: 'User',
  },
  ar: {
    unknown: 'غير متوفر',
    never: 'أبداً',
    today: 'اليوم',
    yesterday: 'أمس',
    loadError: 'تعذر تحميل ملفك الشخصي.',
    offlineTitle: 'يتم عرض البيانات في وضع غير متصل',
    backToDashboard: 'العودة إلى لوحة التحكم',
    disabledAccount: 'الحساب معطل',
    editProfile: 'تعديل الملف الشخصي',
    personalInfo: 'المعلومات الشخصية',
    professionalInfo: 'المعلومات المهنية',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    memberSince: 'عضو منذ',
    sessionsThisWeek: 'الجلسات هذا الأسبوع',
    lastLogin: 'آخر تسجيل دخول',
    memberSinceHelper: 'تاريخ إنشاء الحساب',
    unavailableHelper: 'التاريخ غير متوفر',
    sessionsHelper: 'النشاط خلال آخر 7 أيام',
    lastLoginHelper: 'آخر نشاط',
    noLoginHelper: 'لا توجد عملية دخول مسجلة',
    administrator: 'المدير',
    salesManager: 'مسؤول المبيعات',
    procurementManager: 'مسؤول المشتريات',
    salesLead: 'مشرف المبيعات',
    user: 'مستخدم',
  },
};

const formatDate = (dateString, locale, fallback) => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatLastLogin = (dateString, locale, copy) => {
  if (!dateString) return copy.never;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return copy.today;
  if (date.toDateString() === yesterday.toDateString()) return copy.yesterday;
  return date.toLocaleDateString(locale);
};

const highlightCardStyles = {
  blue: {
    wrapper: 'border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50',
    label: 'text-blue-600',
  },
  green: {
    wrapper: 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50',
    label: 'text-green-600',
  },
  purple: {
    wrapper: 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50',
    label: 'text-purple-600',
  },
};

const ProfileHighlightCard = ({ label, value, helper, tone = 'blue' }) => {
  const styles = highlightCardStyles[tone] || highlightCardStyles.blue;

  return (
    <div className={`rounded-xl border p-6 ${styles.wrapper}`}>
      <div className={`text-sm font-medium ${styles.label}`}>{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
      <div className="mt-2 text-sm text-gray-500">{helper}</div>
    </div>
  );
};

const ProfilePage = () => {
  const { language, isArabic } = useLanguage();
  const locale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR';
  const copy = profileCopy[language] || profileCopy.fr;

  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: '',
    active: true,
    memberSince: null,
    lastLogin: null,
    sessionsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMe = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await authService.getCurrentUser();
        const me = res?.data;
        
        if (me && me.email) {
          setUserData({
            nom: me.nom || me?.lastName || '',
            prenom: me.prenom || me?.firstName || '',
            email: me.email || '',
            role: me.role || '',
            active: me.active !== false,
            memberSince: me.memberSince || me.createdAt || null,
            lastLogin: me.lastLogin || null,
            sessionsThisWeek: me.sessionsThisWeek || 0,
          });

          // Stocker dans localStorage
          if (me.nom) localStorage.setItem('userNom', me.nom);
          if (me.prenom) localStorage.setItem('userPrenom', me.prenom);
          if (me.email) localStorage.setItem('userEmail', me.email);
          if (me.role) localStorage.setItem('userRole', me.role);
          if (me.memberSince) localStorage.setItem('memberSince', me.memberSince);
          if (me.lastLogin) localStorage.setItem('lastLogin', me.lastLogin);
        } else {
          throw new Error('No data from API');
        }
      } catch (e) {
        console.warn('API /me not available, using localStorage');
        // Ne pas afficher d'erreur à l'utilisateur
        setError('');
        
        // Utiliser les données du localStorage
        const storedMemberSince = localStorage.getItem('memberSince');
        const storedLastLogin = localStorage.getItem('lastLogin');
        
        setUserData({
          nom: localStorage.getItem('userNom') || '',
          prenom: localStorage.getItem('userPrenom') || '',
          email: localStorage.getItem('userEmail') || '',
          role: localStorage.getItem('userRole') || '',
          active: true,
          memberSince: storedMemberSince || new Date().toISOString(),
          lastLogin: storedLastLogin || new Date().toISOString(),
          sessionsThisWeek: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const getRoleLabel = (role) => {
    const normalized = String(role || '').toUpperCase();
    const roles = {
      ADMIN: copy.administrator,
      ADMIN_CLIENT: copy.administrator,
      COMMERCIAL: copy.salesManager,
      RESPONSABLE_ACHAT: copy.procurementManager,
      SALES: copy.salesLead,
      USER: copy.user,
    };
    return roles[normalized] || role || copy.user;
  };

  const initials = useMemo(() => {
    const firstInitial = userData.prenom?.charAt(0)?.toUpperCase() || '';
    const lastInitial = userData.nom?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U';
  }, [userData.nom, userData.prenom]);

  const avatarColor = useMemo(() => {
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
      'bg-gradient-to-br from-cyan-500 to-cyan-600',
    ];

    const seed = `${userData.nom}${userData.prenom}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [userData.nom, userData.prenom]);

  const profileHighlights = [
    {
      label: copy.memberSince,
      value: formatDate(userData.memberSince, locale, copy.unknown),
      helper: userData.memberSince ? copy.memberSinceHelper : copy.unavailableHelper,
      tone: 'blue',
    },
    {
      label: copy.sessionsThisWeek,
      value: String(userData.sessionsThisWeek || 0),
      helper: copy.sessionsHelper,
      tone: 'green',
    },
    {
      label: copy.lastLogin,
      value: formatLastLogin(userData.lastLogin, locale, copy),
      helper: userData.lastLogin ? copy.lastLoginHelper : copy.noLoginHelper,
      tone: 'purple',
    },
  ];

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
          <div className="flex h-screen items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className={`mb-6 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 ${isArabic ? 'flex-row-reverse gap-2' : ''}`}
          >
            <ArrowLeftIcon className={`h-4 w-4 ${isArabic ? '' : 'mr-2'}`} />
            {copy.backToDashboard}
          </Link>

          {error && (
            <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">{copy.offlineTitle}</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-cyan-500">
              <div className={`absolute -bottom-16 ${isArabic ? 'right-8' : 'left-8'}`}>
                <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 border-white shadow-lg ${avatarColor}`}>
                  <span className="text-4xl font-bold text-white">{initials}</span>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-20">
              <div className={`flex items-start justify-between gap-6 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
  {userData.prenom} {userData.nom}
  {!userData.prenom && !userData.nom && (userData.email || 'Utilisateur')}
</h1>
                  <p className="mt-1 text-lg text-gray-600">{getRoleLabel(userData.role)}</p>

                  {userData.active === false && (
                    <p className="mt-2 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                      {copy.disabledAccount}
                    </p>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-medium text-white transition-all hover:from-blue-700 hover:to-blue-600"
                >
                  {copy.editProfile}
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">{copy.personalInfo}</h2>
                  <div className="space-y-4">
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.fullName}</div>
                      <div className="font-medium text-gray-800">
                        {userData.prenom} {userData.nom}
                      </div>
                    </div>
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.email}</div>
                      <div className={`flex items-center font-medium text-gray-800 ${isArabic ? 'flex-row-reverse gap-2' : ''}`}>
                        <EnvelopeIcon className={`h-4 w-4 text-gray-400 ${isArabic ? '' : 'mr-2'}`} />
                        {userData.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">{copy.professionalInfo}</h2>
                  <div className="space-y-4">
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.role}</div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        {getRoleLabel(userData.role)}
                      </span>
                    </div>
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.memberSince}</div>
                      <div className={`flex items-center font-medium text-gray-800 ${isArabic ? 'flex-row-reverse gap-2' : ''}`}>
                        <CalendarIcon className={`h-4 w-4 text-gray-400 ${isArabic ? '' : 'mr-2'}`} />
                        {userData.memberSince ? formatDate(userData.memberSince, locale, copy.unknown) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {profileHighlights.map((item) => (
                  <ProfileHighlightCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    helper={item.helper}
                    tone={item.tone}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;