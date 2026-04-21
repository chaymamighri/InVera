import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  NoSymbolIcon,
  PauseCircleIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  PlusIcon,
  PowerIcon,
  TrashIcon,
  UserPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';
import { subscriptionPlatformService } from '../../../servicesPlatform/subscriptionPlatformService';

const OFFER_TYPES = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'ENTREPRISE', label: 'Entreprise' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'ALL', label: 'Tous' },
  { value: 'ACTIF', label: 'Actifs' },
  { value: 'SUSPENDU', label: 'Suspendus' },
  { value: 'ANNULE', label: 'Annules' },
  { value: 'EXPIRE', label: 'Expires' },
];

const defaultOfferForm = {
  nom: '',
  typeOffre: 'CLIENT',
  dureeMois: 1,
  prix: '',
  devise: 'TND',
  description: '',
};

const formatDate = (value) => {
  if (!value) return 'Non renseigne';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (value, devise = 'TND') => {
  if (value === null || value === undefined || value === '') return 'Non defini';
  return `${Number(value).toFixed(2)} ${devise}`;
};

const getOfferStateClass = (offer) => {
  if (offer?.deleted) return 'bg-gray-100 text-gray-600 border-gray-200';
  if (offer?.active) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const getSubscriptionStatusClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'SUSPENDU':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ANNULE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'EXPIRE':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';

const getClientDisplayName = (client) =>
  [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.nom || client?.email || 'Client';

const SubscriptionsManagementPage = () => {
  const [offers, setOffers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [offerForm, setOfferForm] = useState(defaultOfferForm);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const loadData = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [offersData, subscriptionsData, clientsData] = await Promise.all([
        subscriptionPlatformService.getOffers(false),
        subscriptionPlatformService.getSubscriptions(subscriptionStatusFilter === 'ALL' ? undefined : subscriptionStatusFilter),
        clientPlatformService.getAllClients(),
      ]);

      const offerList = Array.isArray(offersData) ? offersData : [];
      const subscriptionList = Array.isArray(subscriptionsData) ? subscriptionsData : [];
      const clientList = Array.isArray(clientsData) ? clientsData : [];

      setOffers(offerList);
      setSubscriptions(subscriptionList);
      setClients(clientList);

      if (selectedOffer?.id) {
        setSelectedOffer(offerList.find((offer) => String(offer.id) === String(selectedOffer.id)) || null);
      }

      if (selectedSubscription?.id) {
        setSelectedSubscription(
          subscriptionList.find((subscription) => String(subscription.id) === String(selectedSubscription.id)) || null
        );
      }
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Impossible de charger la gestion des abonnements.';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      loadData({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionStatusFilter]);

  const stats = useMemo(() => {
    const offersActive = offers.filter((offer) => offer?.active && !offer?.deleted).length;
    const subscriptionsActive = subscriptions.filter((item) => item?.statut === 'ACTIF').length;
    const subscriptionsSuspended = subscriptions.filter((item) => item?.statut === 'SUSPENDU').length;

    return {
      totalOffers: offers.length,
      offersActive,
      totalSubscriptions: subscriptions.length,
      subscriptionsActive,
      subscriptionsSuspended,
    };
  }, [offers, subscriptions]);

  const resetOfferForm = () => {
    setOfferForm(defaultOfferForm);
    setEditingOfferId(null);
  };

  const fillOfferForm = (offer) => {
    setOfferForm({
      nom: offer?.nom || '',
      typeOffre: offer?.typeOffre || 'CLIENT',
      dureeMois: offer?.dureeMois ?? 1,
      prix: offer?.prix ?? '',
      devise: offer?.devise || 'TND',
      description: offer?.description || '',
    });
    setEditingOfferId(offer?.id || null);
    setSelectedOffer(offer);
  };

  const handleOfferFormChange = (field, value) => {
    setOfferForm((current) => ({ ...current, [field]: value }));
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    setSavingOffer(true);

    try {
      const payload = {
        ...offerForm,
        dureeMois: Number(offerForm.dureeMois),
        prix: Number(offerForm.prix),
      };

      if (editingOfferId) {
        await subscriptionPlatformService.updateOffer(editingOfferId, payload);
        toast.success('Offre mise a jour');
      } else {
        await subscriptionPlatformService.createOffer(payload);
        toast.success('Offre creee');
      }

      resetOfferForm();
      await loadData({ silent: true });
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "L'offre n'a pas pu etre enregistree.";
      toast.error(message);
    } finally {
      setSavingOffer(false);
    }
  };

  const runAction = async (key, callback, successMessage) => {
    setActionLoading(key);
    try {
      await callback();
      toast.success(successMessage);
      await loadData({ silent: true });
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "L'action n'a pas pu etre executee.";
      toast.error(message);
    } finally {
      setActionLoading('');
    }
  };

  const handleAssignOffer = async (offer) => {
    if (!selectedClientId) {
      toast.error('Selectionnez d abord un client.');
      return;
    }

    await runAction(
      `assign-${offer.id}`,
      () => subscriptionPlatformService.assignOfferToClient(selectedClientId, offer.id),
      'Offre attribuee au client'
    );
  };

  const handleSuspend = async (subscription) => {
    const motif = window.prompt('Motif de suspension :', '');
    if (motif === null) return;

    await runAction(
      `suspend-${subscription.id}`,
      () => subscriptionPlatformService.suspendSubscription(subscription.id, motif),
      'Abonnement suspendu'
    );
  };

  const handleDeleteOffer = async (offer) => {
    const confirmed = window.confirm(
      `Supprimer logiquement l'offre "${offer.nom}" ? Elle ne sera plus disponible pour les nouvelles souscriptions.`
    );
    if (!confirmed) return;

    await runAction(
      `delete-offer-${offer.id}`,
      () => subscriptionPlatformService.deleteOffer(offer.id),
      'Offre retiree du catalogue'
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">
              Gestion abonnements
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              Pilotez les offres et les souscriptions de la plateforme
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
              Creez les offres disponibles, attribuez-les aux clients, puis suivez l etat des
              abonnements en cours depuis une seule interface super admin.
            </p>
          </div>

          <button
            onClick={() => loadData({ silent: true })}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Offres total</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalOffers}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Offres actives</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.offersActive}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Abonnements total</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalSubscriptions}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Abonnements actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.subscriptionsActive}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Suspendus</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.subscriptionsSuspended}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">
                Catalogue
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {editingOfferId ? "Modifier l'offre" : 'Creer une offre'}
              </h2>
            </div>
            {editingOfferId && (
              <button
                type="button"
                onClick={resetOfferForm}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
              >
                Annuler
              </button>
            )}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleOfferSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nom de l offre</label>
              <input
                value={offerForm.nom}
                onChange={(event) => handleOfferFormChange('nom', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
                placeholder="Ex: Offre Entreprise 1 an"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Type d offre</label>
                <select
                  value={offerForm.typeOffre}
                  onChange={(event) => handleOfferFormChange('typeOffre', event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
                >
                  {OFFER_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Duree</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={offerForm.dureeMois}
                  onChange={(event) => handleOfferFormChange('dureeMois', event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
                  placeholder="Ex: 6"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_140px]">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Prix</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerForm.prix}
                  onChange={(event) => handleOfferFormChange('prix', event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
                  placeholder="79.00"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Devise</label>
                <input
                  value={offerForm.devise}
                  onChange={(event) => handleOfferFormChange('devise', event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows="4"
                value={offerForm.description}
                onChange={(event) => handleOfferFormChange('description', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
                placeholder="Resume de l offre et de son usage cible"
              />
            </div>

            <button
              type="submit"
              disabled={savingOffer}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {editingOfferId ? <PencilSquareIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
              {editingOfferId ? 'Mettre a jour l offre' : 'Creer l offre'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-gray-900">Offres disponibles</h2>
            <p className="mt-1 text-sm text-gray-500">
              Activez, desactivez, modifiez ou attribuez une offre a un client existant.
            </p>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <select
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white"
              >
                <option value="">Selectionner un client pour attribuer une offre</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {getClientDisplayName(client)} - {client.email || 'sans email'}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-700">
                {selectedClientId
                  ? 'Client selectionne pour les attributions'
                  : 'Choisissez un client avant de cliquer sur Attribuer'}
              </div>
            </div>

            <div className="grid gap-4">
              {offers.map((offer) => (
                <article
                  key={offer.id}
                  className={`rounded-2xl border p-5 transition ${
                    String(selectedOffer?.id) === String(offer.id)
                      ? 'border-purple-300 bg-purple-50/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{offer.nom}</h3>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getOfferStateClass(offer)}`}>
                          {offer.deleted ? 'Supprimee' : offer.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="rounded-full bg-gray-100 px-3 py-1">{offer.typeOffreLabel || offer.typeOffre}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1">{offer.dureeLabel || `${offer.dureeMois} mois`}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1">{formatPrice(offer.prix, offer.devise)}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          {offer.abonnementsAssocies} abonnement{offer.abonnementsAssocies > 1 ? 's' : ''}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-gray-500">
                        {offer.description || 'Aucune description pour cette offre.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[360px] lg:justify-end">
                      <button
                        onClick={() => fillOfferForm(offer)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Modifier
                      </button>

                      <button
                        onClick={() => handleAssignOffer(offer)}
                        disabled={!offer.active || offer.deleted || actionLoading === `assign-${offer.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                        Attribuer
                      </button>

                      {offer.active && !offer.deleted ? (
                        <button
                          onClick={() =>
                            runAction(
                              `deactivate-offer-${offer.id}`,
                              () => subscriptionPlatformService.deactivateOffer(offer.id),
                              'Offre desactivee'
                            )
                          }
                          disabled={actionLoading === `deactivate-offer-${offer.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        >
                          <PauseCircleIcon className="h-4 w-4" />
                          Desactiver
                        </button>
                      ) : !offer.deleted ? (
                        <button
                          onClick={() =>
                            runAction(
                              `activate-offer-${offer.id}`,
                              () => subscriptionPlatformService.activateOffer(offer.id),
                              'Offre reactivee'
                            )
                          }
                          disabled={actionLoading === `activate-offer-${offer.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        >
                          <PlayCircleIcon className="h-4 w-4" />
                          Reactiver
                        </button>
                      ) : null}

                      {!offer.deleted && (
                        <button
                          onClick={() => handleDeleteOffer(offer)}
                          disabled={actionLoading === `delete-offer-${offer.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {offers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
                  Aucune offre n est encore configuree.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Souscriptions clients</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Suivez les abonnements reels et appliquez les actions de cycle de vie.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUBSCRIPTION_STATUSES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSubscriptionStatusFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      subscriptionStatusFilter === option.value
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Offre</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Periode</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {subscriptions.map((subscription) => {
                  const isSelected = String(selectedSubscription?.id) === String(subscription.id);
                  return (
                    <tr
                      key={subscription.id}
                      className={`transition hover:bg-purple-50/40 ${isSelected ? 'bg-purple-50/60' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{subscription.clientNom || 'Client'}</p>
                        <p className="text-sm text-gray-500">{subscription.clientEmail || 'Email non renseigne'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p className="font-medium">{subscription.offreNom || 'Offre non liee'}</p>
                        <p className="text-gray-500">{subscription.typeOffre || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatPrice(subscription.montant, subscription.devise)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {subscription.duree || subscription.periodType || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSubscriptionStatusClass(subscription.statut)}`}>
                          {subscription.statut || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedSubscription(subscription)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {subscriptions.length === 0 && (
              <div className="px-6 py-16 text-center text-gray-500">
                Aucun abonnement ne correspond au filtre actuel.
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Detail abonnement</h2>
            <p className="mt-1 text-sm text-gray-500">
              Selectionnez une souscription pour executer des actions de gestion.
            </p>
          </div>

          {selectedSubscription ? (
            <div className="space-y-6 px-6 py-6">
              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">
                      {selectedSubscription.offreNom || 'Souscription'}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900">
                      {selectedSubscription.clientNom || 'Client'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{selectedSubscription.clientEmail}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSubscriptionStatusClass(selectedSubscription.statut)}`}>
                    {selectedSubscription.statut}
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Montant</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatPrice(selectedSubscription.montant, selectedSubscription.devise)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Periode</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedSubscription.duree || selectedSubscription.periodType || 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date debut</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(selectedSubscription.dateDebut)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date fin</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(selectedSubscription.dateFin)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Prochain renouvellement</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(selectedSubscription.dateProchainRenouvellement)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Auto renouvellement</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedSubscription.autoRenouvellement ? 'Active' : 'Desactive'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Offre encore active</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedSubscription.offreToujoursActive ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedSubscription.statut === 'ACTIF' && (
                  <button
                    onClick={() => handleSuspend(selectedSubscription)}
                    disabled={actionLoading === `suspend-${selectedSubscription.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                  >
                    <PauseCircleIcon className="h-5 w-5" />
                    Suspendre
                  </button>
                )}

                {selectedSubscription.statut === 'SUSPENDU' && (
                  <button
                    onClick={() =>
                      runAction(
                        `reactivate-${selectedSubscription.id}`,
                        () => subscriptionPlatformService.reactivateSubscription(selectedSubscription.id),
                        'Abonnement reactive'
                      )
                    }
                    disabled={actionLoading === `reactivate-${selectedSubscription.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <PlayCircleIcon className="h-5 w-5" />
                    Reactiver
                  </button>
                )}

                {selectedSubscription.statut !== 'ANNULE' && (
                  <button
                    onClick={() =>
                      runAction(
                        `cancel-${selectedSubscription.id}`,
                        () => subscriptionPlatformService.cancelSubscription(selectedSubscription.id),
                        'Abonnement annule'
                      )
                    }
                    disabled={actionLoading === `cancel-${selectedSubscription.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Annuler l abonnement
                  </button>
                )}

                <button
                  onClick={() =>
                    runAction(
                      `renew-${selectedSubscription.id}`,
                      () => subscriptionPlatformService.renewSubscription(selectedSubscription.id),
                      'Abonnement renouvele'
                    )
                  }
                  disabled={actionLoading === `renew-${selectedSubscription.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                  Renouveler
                </button>

                <button
                  onClick={() =>
                    runAction(
                      `auto-renew-${selectedSubscription.id}`,
                      () =>
                        subscriptionPlatformService.updateAutoRenewal(
                          selectedSubscription.id,
                          !selectedSubscription.autoRenouvellement
                        ),
                      'Auto renouvellement mis a jour'
                    )
                  }
                  disabled={actionLoading === `auto-renew-${selectedSubscription.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-purple-300 hover:text-purple-700 disabled:opacity-60"
                >
                  <PowerIcon className="h-5 w-5" />
                  {selectedSubscription.autoRenouvellement
                    ? 'Desactiver auto renouvellement'
                    : 'Activer auto renouvellement'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <CheckBadgeIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">Aucun abonnement selectionne</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Ouvrez une ligne du tableau pour voir les dates, le statut et les actions disponibles.
              </p>
              <button
                onClick={() => setSubscriptionStatusFilter('ACTIF')}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
              >
                <NoSymbolIcon className="h-4 w-4" />
                Voir les abonnements actifs
              </button>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default SubscriptionsManagementPage;
