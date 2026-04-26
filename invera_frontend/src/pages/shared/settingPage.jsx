import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import api from '../../services/api';
import Header from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';

const settingsCopy = {
  fr: {
    title: 'Parametres',
    profileTab: 'Profil',
    profileDescription: 'Mettez a jour vos informations personnelles',
    securityTab: 'Securite',
    securityDescription: 'Modifiez votre mot de passe',
    backToProfile: 'Retour au profil',
    profileInformation: 'Informations du profil',
    readOnlyEmail: 'Email (lecture seule)',
    lastName: 'Nom',
    firstName: 'Prenom',
    lastNamePlaceholder: 'Votre nom',
    firstNamePlaceholder: 'Votre prenom',
    save: 'Enregistrer',
    saving: 'Mise a jour...',
    disabledAccount: "Votre compte est desactive. Contactez l'administrateur.",
    changePassword: 'Changer le mot de passe',
    hide: 'Masquer',
    show: 'Afficher',
    currentPassword: 'Mot de passe actuel',
    currentPasswordPlaceholder: 'Entrez votre mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    newPasswordPlaceholder: 'Minimum 8 caracteres',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    confirmPasswordPlaceholder: 'Retapez votre nouveau mot de passe',
    passwordHint: 'Astuce: utilisez au moins 8 caracteres avec des chiffres et lettres.',
    updatePassword: 'Mettre a jour',
    updatingPassword: 'Modification...',
    loadError: 'Impossible de charger vos informations.',
    profileSuccess: 'Profil mis a jour avec succes.',
    profileError: 'Erreur lors de la mise a jour du profil.',
    passwordSuccess: 'Mot de passe modifie avec succes.',
    passwordError: 'Erreur lors de la modification du mot de passe.',
    validationLastName: 'Le nom est requis.',
    validationFirstName: 'Le prenom est requis.',
    validationCurrentPassword: 'Le mot de passe actuel est requis.',
    validationNewPassword: 'Le nouveau mot de passe est requis.',
    validationPasswordMin: 'Le mot de passe doit contenir au moins 8 caracteres.',
    validationPasswordMismatch: 'Les mots de passe ne correspondent pas.',
  },
  en: {
    title: 'Settings',
    profileTab: 'Profile',
    profileDescription: 'Update your personal information',
    securityTab: 'Security',
    securityDescription: 'Change your password',
    backToProfile: 'Back to profile',
    profileInformation: 'Profile information',
    readOnlyEmail: 'Email (read only)',
    lastName: 'Last name',
    firstName: 'First name',
    lastNamePlaceholder: 'Your last name',
    firstNamePlaceholder: 'Your first name',
    save: 'Save',
    saving: 'Updating...',
    disabledAccount: 'Your account is disabled. Please contact the administrator.',
    changePassword: 'Change password',
    hide: 'Hide',
    show: 'Show',
    currentPassword: 'Current password',
    currentPasswordPlaceholder: 'Enter your current password',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Minimum 8 characters',
    confirmPassword: 'Confirm new password',
    confirmPasswordPlaceholder: 'Type your new password again',
    passwordHint: 'Tip: use at least 8 characters with both letters and numbers.',
    updatePassword: 'Update',
    updatingPassword: 'Updating...',
    loadError: 'Unable to load your information.',
    profileSuccess: 'Profile updated successfully.',
    profileError: 'Error while updating profile.',
    passwordSuccess: 'Password updated successfully.',
    passwordError: 'Error while changing password.',
    validationLastName: 'Last name is required.',
    validationFirstName: 'First name is required.',
    validationCurrentPassword: 'Current password is required.',
    validationNewPassword: 'New password is required.',
    validationPasswordMin: 'Password must contain at least 8 characters.',
    validationPasswordMismatch: 'Passwords do not match.',
  },
  ar: {
    title: 'الاعدادات',
    profileTab: 'الملف الشخصي',
    profileDescription: 'قم بتحديث معلوماتك الشخصية',
    securityTab: 'الامان',
    securityDescription: 'قم بتغيير كلمة المرور',
    backToProfile: 'العودة الى الملف الشخصي',
    profileInformation: 'معلومات الملف الشخصي',
    readOnlyEmail: 'البريد الالكتروني (للقراءة فقط)',
    lastName: 'اللقب',
    firstName: 'الاسم',
    lastNamePlaceholder: 'لقبك',
    firstNamePlaceholder: 'اسمك',
    save: 'حفظ',
    saving: 'جار التحديث...',
    disabledAccount: 'تم تعطيل حسابك. يرجى التواصل مع المسؤول.',
    changePassword: 'تغيير كلمة المرور',
    hide: 'اخفاء',
    show: 'اظهار',
    currentPassword: 'كلمة المرور الحالية',
    currentPasswordPlaceholder: 'ادخل كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: '8 احرف على الاقل',
    confirmPassword: 'تأكيد كلمة المرور الجديدة',
    confirmPasswordPlaceholder: 'اعد كتابة كلمة المرور الجديدة',
    passwordHint: 'نصيحة: استخدم 8 احرف على الاقل مع ارقام وحروف.',
    updatePassword: 'تحديث',
    updatingPassword: 'جار التعديل...',
    loadError: 'تعذر تحميل معلوماتك.',
    profileSuccess: 'تم تحديث الملف الشخصي بنجاح.',
    profileError: 'حدث خطأ اثناء تحديث الملف الشخصي.',
    passwordSuccess: 'تم تغيير كلمة المرور بنجاح.',
    passwordError: 'حدث خطأ اثناء تغيير كلمة المرور.',
    validationLastName: 'اللقب مطلوب.',
    validationFirstName: 'الاسم مطلوب.',
    validationCurrentPassword: 'كلمة المرور الحالية مطلوبة.',
    validationNewPassword: 'كلمة المرور الجديدة مطلوبة.',
    validationPasswordMin: 'يجب ان تحتوي كلمة المرور على 8 احرف على الاقل.',
    validationPasswordMismatch: 'كلمتا المرور غير متطابقتين.',
  },
};

const SettingsPage = () => {
  const { language, isArabic } = useLanguage();
  const copy = settingsCopy[language] || settingsCopy.fr;

  const [activeTab, setActiveTab] = useState('profile');
  const [loadingMe, setLoadingMe] = useState(true);
  const [me, setMe] = useState(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    nom: '',
    prenom: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingMe(true);
      try {
        const res = await authService.getCurrentUser();
        const data = res?.data;
        setMe(data);
        setProfileForm({
          username: data?.username || '',
          nom: data?.lastName || data?.nom || '',
          prenom: data?.firstName || data?.prenom || '',
          email: data?.email || '',
        });

        const fullName = `${data?.nom || data?.lastName || ''} ${data?.prenom || data?.firstName || ''}`.trim();
        if (data?.role) localStorage.setItem('userRole', data.role);
        if (fullName) localStorage.setItem('userName', fullName);
        if (data?.email) localStorage.setItem('userEmail', data.email);
      } catch {
        toast.error(copy.loadError);
      } finally {
        setLoadingMe(false);
      }
    };

    load();
  }, [copy.loadError]);

  const tabs = useMemo(
    () => [
      {
        id: 'profile',
        name: copy.profileTab,
        icon: <UserIcon className="h-5 w-5" />,
        description: copy.profileDescription,
      },
      {
        id: 'security',
        name: copy.securityTab,
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        description: copy.securityDescription,
      },
    ],
    [copy]
  );

  const validateProfile = () => {
    if (!profileForm.nom.trim()) return copy.validationLastName;
    if (!profileForm.prenom.trim()) return copy.validationFirstName;
    return '';
  };

  const validatePassword = () => {
    if (!passwordForm.oldPassword.trim()) return copy.validationCurrentPassword;
    if (!passwordForm.newPassword.trim()) return copy.validationNewPassword;
    if (passwordForm.newPassword.length < 8) return copy.validationPasswordMin;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return copy.validationPasswordMismatch;
    return '';
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const err = validateProfile();
    if (err) return toast.error(err);

    setSavingProfile(true);
    try {
      await api.put('/auth/update-profile', {
        username: profileForm.username.trim(),
        nom: profileForm.nom.trim(),
        prenom: profileForm.prenom.trim(),
      });

      const res = await authService.getCurrentUser({ force: true });
      const data = res?.data;
      setMe(data);
      setProfileForm({
        username: data?.username || '',
        nom: data?.lastName || data?.nom || '',
        prenom: data?.firstName || data?.prenom || '',
        email: data?.email || profileForm.email,
      });

      const fullName = `${data?.nom || data?.lastName || ''} ${data?.prenom || data?.firstName || ''}`.trim();
      if (fullName) localStorage.setItem('userName', fullName);

      toast.success(copy.profileSuccess);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        copy.profileError;
      toast.error(typeof msg === 'string' ? msg : copy.profileError);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const err = validatePassword();
    if (err) return toast.error(err);

    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords(false);
      toast.success(copy.passwordSuccess);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        copy.passwordError;
      toast.error(typeof msg === 'string' ? msg : copy.passwordError);
    } finally {
      setSavingPassword(false);
    }
  };

  const directionClasses = isArabic ? 'text-right' : 'text-left';
  const inlineRowClasses = isArabic ? 'flex-row-reverse' : 'flex-row';
  const inputDir = isArabic ? 'rtl' : 'ltr';

  if (loadingMe) {
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16" dir={inputDir}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/profile"
            className={`mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 ${isArabic ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {copy.backToProfile}
          </Link>

          <div className={`flex flex-col gap-8 lg:flex-row ${isArabic ? 'lg:flex-row-reverse' : ''}`}>
            <div className="lg:w-1/4">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className={`mb-6 text-xl font-bold text-gray-900 ${directionClasses}`}>{copy.title}</h2>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${inlineRowClasses} ${
                        activeTab === tab.id
                          ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 font-semibold text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}>{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="lg:w-3/4">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-8">
                  <div className={`flex items-center gap-3 ${inlineRowClasses}`}>
                    <div className="rounded-lg bg-blue-100 p-2">{tabs.find((t) => t.id === activeTab)?.icon}</div>
                    <h1 className={`text-2xl font-bold text-gray-900 ${directionClasses}`}>
                      {tabs.find((t) => t.id === activeTab)?.name}
                    </h1>
                  </div>
                  <p className={`mt-3 text-lg text-gray-600 ${directionClasses}`}>
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-8">
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                        <h3 className={`mb-6 text-lg font-semibold text-gray-800 ${directionClasses}`}>
                          <UserIcon className={`inline h-5 w-5 text-blue-600 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                          {copy.profileInformation}
                        </h3>

                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                              <label className={`mb-2 block text-sm font-medium text-gray-700 ${directionClasses}`}>
                                {copy.readOnlyEmail}
                              </label>
                              <input
                                type="email"
                                value={profileForm.email}
                                disabled
                                dir="ltr"
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600"
                              />
                            </div>

                            <div>
                              <label className={`mb-2 block text-sm font-medium text-gray-700 ${directionClasses}`}>
                                {copy.lastName}
                              </label>
                              <input
                                type="text"
                                value={profileForm.nom}
                                onChange={(e) => setProfileForm((p) => ({ ...p, nom: e.target.value }))}
                                dir={inputDir}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder={copy.lastNamePlaceholder}
                              />
                            </div>

                            <div>
                              <label className={`mb-2 block text-sm font-medium text-gray-700 ${directionClasses}`}>
                                {copy.firstName}
                              </label>
                              <input
                                type="text"
                                value={profileForm.prenom}
                                onChange={(e) => setProfileForm((p) => ({ ...p, prenom: e.target.value }))}
                                dir={inputDir}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder={copy.firstNamePlaceholder}
                              />
                            </div>
                          </div>

                          <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'}`}>
                            <button
                              type="submit"
                              disabled={savingProfile}
                              className={`rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-blue-600 ${
                                savingProfile ? 'cursor-not-allowed opacity-70' : ''
                              }`}
                            >
                              {savingProfile ? copy.saving : copy.save}
                            </button>
                          </div>
                        </form>

                        {me?.active === false && (
                          <div className={`mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ${directionClasses}`}>
                            {copy.disabledAccount}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                        <div className={`mb-6 flex items-center justify-between gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                          <h3 className={`text-lg font-semibold text-gray-800 ${directionClasses}`}>
                            <LockClosedIcon className={`inline h-5 w-5 text-blue-600 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                            {copy.changePassword}
                          </h3>

                          <button
                            type="button"
                            onClick={() => setShowPasswords((prev) => !prev)}
                            className={`inline-flex items-center gap-1.5 text-sm text-blue-600 transition-colors hover:text-blue-800 ${isArabic ? 'flex-row-reverse' : ''}`}
                          >
                            {showPasswords ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4" />
                                {copy.hide}
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4" />
                                {copy.show}
                              </>
                            )}
                          </button>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className={`mb-2 block text-sm font-medium text-gray-700 ${directionClasses}`}>
                                {copy.currentPassword}
                              </label>
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                                dir={inputDir}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder={copy.currentPasswordPlaceholder}
                              />
                            </div>

                            <div>
                              <label className={`mb-2 block text-sm font-medium text-gray-700 ${directionClasses}`}>
                                {copy.newPassword}
                              </label>
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                dir={inputDir}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder={copy.newPasswordPlaceholder}
                              />
                            </div>

                            <div>
                              <label className={`mb-2 block text-sm font-medium text-gray-700 ${directionClasses}`}>
                                {copy.confirmPassword}
                              </label>
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                dir={inputDir}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder={copy.confirmPasswordPlaceholder}
                              />
                            </div>

                            <p className={`text-xs text-gray-500 ${directionClasses}`}>{copy.passwordHint}</p>
                          </div>

                          <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'}`}>
                            <button
                              type="submit"
                              disabled={savingPassword}
                              className={`rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-blue-600 ${
                                savingPassword ? 'cursor-not-allowed opacity-70' : ''
                              }`}
                            >
                              {savingPassword ? copy.updatingPassword : copy.updatePassword}
                            </button>
                          </div>
                        </form>
                      </div>
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
