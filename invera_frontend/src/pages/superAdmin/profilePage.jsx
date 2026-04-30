import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { superAdminService } from '../../servicesPlatform/superAdminService';
import { useLanguage } from '../../context/LanguageContext';

const profileCopy = {
  fr: {
    unknown: 'Non renseigne',
    never: 'Jamais',
    loadError: 'Impossible de charger le profil du super admin.',
    backToManagement: 'Retour a la gestion',
    mainAccount: 'Compte principal',
    title: 'Profil du super administrateur de la plateforme.',
    editAccount: 'Modifier le compte',
    accountCreated: 'Compte cree',
    lastLogin: 'Derniere connexion',
    access: 'Acces',
    fullPlatform: 'Plateforme complete',
    accountInformation: 'Informations du compte',
    accountInformationDescription:
      'Donnees utilisees pour identifier et connecter le super admin.',
    name: 'Nom',
    email: 'Email',
    accountStatus: 'Statut du compte',
    accountStatusDescription:
      "Ce compte dispose du niveau d'autorisation le plus eleve.",
    fullPlatformAccess: 'Acces total plateforme',
    fullPlatformAccessDescription:
      'Gestion des clients, des abonnements et des parametres sensibles.',
    quickActions: 'Actions rapides',
    quickActionsDescription:
      'Accedez aux reglages du compte depuis un seul endroit.',
    editInformation: 'Modifier les informations',
    changePassword: 'Changer le mot de passe',
  },
  en: {
    unknown: 'Not provided',
    never: 'Never',
    loadError: 'Unable to load the super admin profile.',
    backToManagement: 'Back to management',
    mainAccount: 'Main account',
    title: 'Profile of the platform super administrator.',
    editAccount: 'Edit account',
    accountCreated: 'Account created',
    lastLogin: 'Last login',
    access: 'Access',
    fullPlatform: 'Full platform',
    accountInformation: 'Account information',
    accountInformationDescription:
      'Data used to identify and sign in the super admin.',
    name: 'Name',
    email: 'Email',
    accountStatus: 'Account status',
    accountStatusDescription:
      'This account has the highest authorization level.',
    fullPlatformAccess: 'Full platform access',
    fullPlatformAccessDescription:
      'Management of clients, subscriptions, and sensitive settings.',
    quickActions: 'Quick actions',
    quickActionsDescription:
      'Access account settings from one place.',
    editInformation: 'Edit information',
    changePassword: 'Change password',
  },
  ar: {
    unknown: 'غير متوفر',
    never: 'ابدا',
    loadError: 'تعذر تحميل ملف المشرف العام.',
    backToManagement: 'العودة الى الادارة',
    mainAccount: 'الحساب الرئيسي',
    title: 'الملف الشخصي للمشرف العام على المنصة.',
    editAccount: 'تعديل الحساب',
    accountCreated: 'تاريخ انشاء الحساب',
    lastLogin: 'اخر تسجيل دخول',
    access: 'الوصول',
    fullPlatform: 'المنصة كاملة',
    accountInformation: 'معلومات الحساب',
    accountInformationDescription:
      'البيانات المستعملة للتعريف بالمشرف العام وتسجيل دخوله.',
    name: 'الاسم',
    email: 'البريد الالكتروني',
    accountStatus: 'حالة الحساب',
    accountStatusDescription:
      'هذا الحساب يمتلك اعلى مستوى من الصلاحيات.',
    fullPlatformAccess: 'وصول كامل للمنصة',
    fullPlatformAccessDescription:
      'ادارة العملاء والاشتراكات والاعدادات الحساسة.',
    quickActions: 'اجراءات سريعة',
    quickActionsDescription:
      'يمكنك الوصول الى اعدادات الحساب من مكان واحد.',
    editInformation: 'تعديل المعلومات',
    changePassword: 'تغيير كلمة المرور',
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

const formatDateTime = (dateString, locale, fallback) => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mapAdminInfo = (data = {}) => ({
  id: data?.id ?? null,
  nom: data?.nom || 'Super Admin',
  email: data?.email || 'superadmin@invera.com',
  createdAt: data?.createdAt || null,
  lastLogin: data?.lastLogin || null,
});

const syncAdminInfo = (admin) => {
  const stored = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  localStorage.setItem(
    'adminInfo',
    JSON.stringify({
      ...stored,
      id: admin.id,
      nom: admin.nom,
      email: admin.email,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin,
    })
  );
};

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm';

const Profile = () => {
  const { language, isArabic } = useLanguage();
  const locale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR';
  const copy = profileCopy[language] || profileCopy.fr;

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdmin = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await superAdminService.getMe();
        const mappedAdmin = mapAdminInfo(data);
        setAdmin(mappedAdmin);
        syncAdminInfo(mappedAdmin);
      } catch (err) {
        const fallback = mapAdminInfo(JSON.parse(localStorage.getItem('adminInfo') || '{}'));
        setAdmin(fallback);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            copy.loadError
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [copy.loadError]);

  const initials = useMemo(() => {
    if (!admin?.nom) return 'SA';
    return admin.nom
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [admin]);

  const summaryCards = [
    {
      label: copy.accountCreated,
      value: formatDate(admin?.createdAt, locale, copy.unknown),
      icon: CalendarDaysIcon,
    },
    {
      label: copy.lastLogin,
      value: formatDateTime(admin?.lastLogin, locale, copy.never),
      icon: ClockIcon,
    },
    {
      label: copy.access,
      value: copy.fullPlatform,
      icon: ShieldCheckIcon,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/super-admin/dashboard/clients"
          className={`inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 ${isArabic ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {copy.backToManagement}
        </Link>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-6 md:px-8">
            <div className={`flex flex-col gap-5 md:flex-row md:items-center md:justify-between ${isArabic ? 'md:flex-row-reverse text-right' : ''}`}>
              <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">{copy.mainAccount}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">{admin.nom}</h1>
                  <p className="mt-1 text-sm text-gray-500">{copy.title}</p>
                </div>
              </div>

              <Link
                to="/super-admin/dashboard/settings"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {copy.editAccount}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 border-b border-gray-200 px-6 py-6 md:grid-cols-3 md:px-8">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl bg-gray-50 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={cardClassName}>
              <h2 className="text-lg font-semibold text-gray-900">{copy.accountInformation}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {copy.accountInformationDescription}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{copy.name}</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{admin.nom}</p>
                </div>

                <div className="rounded-xl bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {copy.email}
                  </p>
                  <div className={`mt-2 flex items-center gap-2 text-gray-900 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <span className="break-all text-base font-semibold">{admin.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={cardClassName}>
                <h2 className="text-lg font-semibold text-gray-900">{copy.accountStatus}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {copy.accountStatusDescription}
                </p>

                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className={`flex items-center gap-2 text-green-800 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span className="font-semibold">{copy.fullPlatformAccess}</span>
                  </div>
                  <p className="mt-2 text-sm text-green-700">
                    {copy.fullPlatformAccessDescription}
                  </p>
                </div>
              </div>

              <div className={cardClassName}>
                <h2 className="text-lg font-semibold text-gray-900">{copy.quickActions}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {copy.quickActionsDescription}
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    to="/super-admin/dashboard/settings"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:border-blue-300 hover:text-blue-700"
                  >
                    {copy.editInformation}
                  </Link>
                  <Link
                    to="/super-admin/dashboard/settings"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:border-blue-300 hover:text-blue-700"
                  >
                    {copy.changePassword}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
