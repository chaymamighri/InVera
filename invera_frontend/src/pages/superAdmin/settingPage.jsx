import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { superAdminService } from '../../servicesPlatform/superAdminService';
import { useLanguage } from '../../context/LanguageContext';

const syncAdminInfo = (admin) => {
  const stored = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  localStorage.setItem(
    'adminInfo',
    JSON.stringify({
      ...stored,
      id: admin?.id ?? stored?.id,
      nom: admin?.nom || stored?.nom,
      email: admin?.email || stored?.email,
      createdAt: admin?.createdAt || stored?.createdAt,
      lastLogin: admin?.lastLogin || stored?.lastLogin,
    })
  );
};

const inputClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const sectionClassName = 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm';

const Settings = () => {
  const { t, isArabic } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    id: null,
    nom: '',
    email: '',
    createdAt: null,
    lastLogin: null,
  });

  const [password, setPassword] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadAdmin = async () => {
      setLoading(true);

      try {
        const data = await superAdminService.getMe();
        setProfile({
          id: data?.id ?? null,
          nom: data?.nom || '',
          email: data?.email || '',
          createdAt: data?.createdAt || null,
          lastLogin: data?.lastLogin || null,
        });
        syncAdminInfo(data);
      } catch (error) {
        const fallback = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        setProfile({
          id: fallback?.id ?? null,
          nom: fallback?.nom || '',
          email: fallback?.email || '',
          createdAt: fallback?.createdAt || null,
          lastLogin: fallback?.lastLogin || null,
        });

        const msg =
          error?.response?.data?.error ||
          error?.message ||
          t('dashboard.superAdminProfileLoadError');
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, []);

  const initials = useMemo(() => {
    if (!profile.nom) return 'SA';
    return profile.nom
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [profile.nom]);

  const validateProfile = () => {
    if (!profile.nom.trim()) return t('dashboard.superAdminNameRequired');
    if (profile.nom.trim().length < 2) return t('dashboard.superAdminNameTooShort');
    if (!profile.email.trim()) return t('dashboard.superAdminEmailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) return t('dashboard.superAdminInvalidEmail');
    return '';
  };

  const validatePassword = () => {
    if (!password.oldPassword.trim()) return t('dashboard.superAdminOldPasswordRequired');
    if (!password.newPassword.trim()) return t('dashboard.superAdminNewPasswordRequired');
    if (password.newPassword.length < 8) {
      return t('dashboard.superAdminPasswordTooShort');
    }
    if (password.newPassword !== password.confirmPassword) {
      return t('dashboard.superAdminPasswordMismatch');
    }
    return '';
  };

  const handleProfileSave = async () => {
    const validationError = validateProfile();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await superAdminService.updateProfile({
        nom: profile.nom.trim(),
        email: profile.email.trim(),
      });

      setProfile((prev) => ({
        ...prev,
        id: updated?.id ?? prev.id,
        nom: updated?.nom || prev.nom,
        email: updated?.email || prev.email,
        createdAt: updated?.createdAt || prev.createdAt,
        lastLogin: updated?.lastLogin || prev.lastLogin,
      }));

      syncAdminInfo(updated);
      toast.success(t('dashboard.superAdminProfileUpdated'));
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        t('dashboard.superAdminProfileUpdateError');
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    const validationError = validatePassword();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSavingPassword(true);
    try {
      const response = await superAdminService.changePassword({
        oldPassword: password.oldPassword,
        newPassword: password.newPassword,
      });

      setPassword({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(response?.message || t('dashboard.superAdminPasswordUpdated'));
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        t('dashboard.superAdminPasswordUpdateError');
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/super-admin/dashboard/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('dashboard.superAdminSettingsBack')}
        </Link>

        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">{t('dashboard.superAdminSettingsEyebrow')}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                    {t('dashboard.superAdminSettingsTitle')}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('dashboard.superAdminSettingsDescription')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <p className="font-medium text-gray-900">{profile.email || 'superadmin@invera.com'}</p>
                <p>{t('dashboard.superAdminPrimaryAccount')}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className={sectionClassName}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.superAdminProfileInfo')}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('dashboard.superAdminProfileInfoDescription')}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">{t('dashboard.superAdminFullName')}</span>
                  <input
                    type="text"
                    value={profile.nom}
                    onChange={(e) => setProfile((prev) => ({ ...prev, nom: e.target.value }))}
                    className={inputClassName}
                    placeholder={t('dashboard.superAdminNamePlaceholder')}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                  <div className="relative">
                    <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className={`${inputClassName} pl-12`}
                      placeholder="admin@invera.com"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-600">
                  {t('dashboard.superAdminEmailHelp')}
                </p>
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className={`inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition ${
                    savingProfile ? 'cursor-not-allowed opacity-70' : 'hover:bg-blue-700'
                  }`}
                >
                  {savingProfile ? t('dashboard.superAdminSaving') : t('dashboard.superAdminSave')}
                </button>
              </div>
            </section>

            <div className="space-y-6">
              <section className={sectionClassName}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <LockClosedIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.superAdminPassword')}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('dashboard.superAdminPasswordDescription')}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      {t('dashboard.superAdminOldPassword')}
                    </span>
                    <input
                      type="password"
                      value={password.oldPassword}
                      onChange={(e) =>
                        setPassword((prev) => ({ ...prev, oldPassword: e.target.value }))
                      }
                      className={inputClassName}
                      placeholder={t('dashboard.superAdminOldPasswordPlaceholder')}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      {t('dashboard.superAdminNewPassword')}
                    </span>
                    <input
                      type="password"
                      value={password.newPassword}
                      onChange={(e) =>
                        setPassword((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      className={inputClassName}
                      placeholder={t('dashboard.superAdminNewPasswordPlaceholder')}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      {t('dashboard.superAdminConfirmPassword')}
                    </span>
                    <input
                      type="password"
                      value={password.confirmPassword}
                      onChange={(e) =>
                        setPassword((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder={t('dashboard.superAdminConfirmPasswordPlaceholder')}
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  {t('dashboard.superAdminPasswordAdvice')}
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={savingPassword}
                  className={`mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition ${
                    savingPassword ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-800'
                  }`}
                >
                  {savingPassword ? t('dashboard.superAdminUpdating') : t('dashboard.superAdminUpdatePassword')}
                </button>
              </section>

              <section className={sectionClassName}>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.superAdminReminder')}</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {t('dashboard.superAdminSettingsReminder')}
                </p>
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
