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
          'Impossible de charger le profil du super admin.';
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
    if (!profile.nom.trim()) return 'Le nom est requis.';
    if (profile.nom.trim().length < 2) return 'Le nom doit contenir au moins 2 caracteres.';
    if (!profile.email.trim()) return "L'email est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) return 'Email invalide.';
    return '';
  };

  const validatePassword = () => {
    if (!password.oldPassword.trim()) return 'Ancien mot de passe requis.';
    if (!password.newPassword.trim()) return 'Nouveau mot de passe requis.';
    if (password.newPassword.length < 8) {
      return 'Le nouveau mot de passe doit contenir au moins 8 caracteres.';
    }
    if (password.newPassword !== password.confirmPassword) {
      return 'La confirmation du mot de passe ne correspond pas.';
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
      toast.success('Profil mis a jour');
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Erreur lors de la mise a jour du profil.';
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
      toast.success(response?.message || 'Mot de passe modifie');
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Erreur lors du changement de mot de passe.';
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/super-admin/dashboard/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour au profil
        </Link>

        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Parametres du compte</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                    Reglages Super Admin
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Modifiez les informations du compte et gerez la securite d&apos;acces.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <p className="font-medium text-gray-900">{profile.email || 'superadmin@invera.com'}</p>
                <p>Compte principal de la plateforme</p>
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
                  <h2 className="text-lg font-semibold text-gray-900">Informations du profil</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Nom et email utilises pour le compte super admin.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Nom complet</span>
                  <input
                    type="text"
                    value={profile.nom}
                    onChange={(e) => setProfile((prev) => ({ ...prev, nom: e.target.value }))}
                    className={inputClassName}
                    placeholder="Nom du super admin"
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
                  L&apos;email du compte principal doit rester valide et accessible.
                </p>
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className={`inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition ${
                    savingProfile ? 'cursor-not-allowed opacity-70' : 'hover:bg-blue-700'
                  }`}
                >
                  {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
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
                    <h2 className="text-lg font-semibold text-gray-900">Mot de passe</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Changez le mot de passe du compte principal.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      Ancien mot de passe
                    </span>
                    <input
                      type="password"
                      value={password.oldPassword}
                      onChange={(e) =>
                        setPassword((prev) => ({ ...prev, oldPassword: e.target.value }))
                      }
                      className={inputClassName}
                      placeholder="Entrez le mot de passe actuel"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </span>
                    <input
                      type="password"
                      value={password.newPassword}
                      onChange={(e) =>
                        setPassword((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      className={inputClassName}
                      placeholder="Minimum 8 caracteres"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      Confirmation
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
                      placeholder="Confirmez le mot de passe"
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  Utilisez un mot de passe unique et different de l&apos;ancien pour proteger le
                  compte le plus sensible de la plateforme.
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={savingPassword}
                  className={`mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition ${
                    savingPassword ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-800'
                  }`}
                >
                  {savingPassword ? 'Modification...' : 'Mettre a jour le mot de passe'}
                </button>
              </section>

              <section className={sectionClassName}>
                <h2 className="text-lg font-semibold text-gray-900">Rappel</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Les modifications appliquees ici concernent uniquement le compte super admin et
                  utilisent les endpoints backend dedies a la plateforme.
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
