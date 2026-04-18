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

const formatDate = (dateString) => {
  if (!dateString) return 'Non renseigne';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Jamais';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString('fr-FR', {
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
            'Impossible de charger le profil du super admin.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, []);

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
      label: 'Compte cree',
      value: formatDate(admin?.createdAt),
      icon: CalendarDaysIcon,
    },
    {
      label: 'Derniere connexion',
      value: formatDateTime(admin?.lastLogin),
      icon: ClockIcon,
    },
    {
      label: 'Acces',
      value: 'Plateforme complete',
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/super-admin/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour a la gestion
        </Link>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Compte principal</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">{admin.nom}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Profil du super administrateur de la plateforme.
                  </p>
                </div>
              </div>

              <Link
                to="/super-admin/dashboard/settings"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Modifier le compte
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
              <h2 className="text-lg font-semibold text-gray-900">Informations du compte</h2>
              <p className="mt-1 text-sm text-gray-500">
                Donnees utilisees pour identifier et connecter le super admin.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nom</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{admin.nom}</p>
                </div>

                <div className="rounded-xl bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Email
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-gray-900">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <span className="break-all text-base font-semibold">{admin.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={cardClassName}>
                <h2 className="text-lg font-semibold text-gray-900">Statut du compte</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ce compte dispose du niveau d&apos;autorisation le plus eleve.
                </p>

                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span className="font-semibold">Acces total plateforme</span>
                  </div>
                  <p className="mt-2 text-sm text-green-700">
                    Gestion des clients, des abonnements et des parametres sensibles.
                  </p>
                </div>
              </div>

              <div className={cardClassName}>
                <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Accedez aux reglages du compte depuis un seul endroit.
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    to="/super-admin/dashboard/settings"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:border-blue-300 hover:text-blue-700"
                  >
                    Modifier les informations
                  </Link>
                  <Link
                    to="/super-admin/dashboard/settings"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:border-blue-300 hover:text-blue-700"
                  >
                    Changer le mot de passe
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
