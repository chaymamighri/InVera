import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PlayCircleIcon,
  ServerStackIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';

const STATUS_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Actifs', value: 'ACTIF' },
  { label: 'Refuses', value: 'REFUSE' },
];

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

const getFullName = (client) => [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.nom || 'Client';

const getStatusPillClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EN_ATTENTE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'REFUSE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';

const ClientsManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let data = [];
      if (filter === 'PENDING_ONLY') {
        data = await clientPlatformService.getPendingClients();
      } else if (filter !== 'ALL') {
        data = await clientPlatformService.getClientsByStatus(filter);
      } else {
        data = await clientPlatformService.getAllClients();
      }

      const list = Array.isArray(data) ? data : [];
      setClients(list);

      if (selectedClient?.id) {
        const freshSelected =
          list.find((client) => String(client.id) === String(selectedClient.id)) || null;
        setSelectedClient(freshSelected);
      }
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Impossible de charger les clients de la plateforme.';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients('ALL');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      loadClients(statusFilter, { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((client) => {
      const haystack = [
        client?.nom,
        client?.prenom,
        client?.email,
        client?.telephone,
        client?.statut,
        client?.typeCompte,
        client?.typeInscription,
        client?.nomBaseDonnees,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [clients, search]);

  const stats = useMemo(() => {
    const total = clients.length;
    const pending = clients.filter((client) => client?.statut === 'EN_ATTENTE').length;
    const active = clients.filter((client) => client?.statut === 'ACTIF').length;
    const refused = clients.filter((client) => client?.statut === 'REFUSE').length;

    return { total, pending, active, refused };
  }, [clients]);

  const runAction = async (actionKey, callback, successMessage) => {
    setActionLoading(actionKey);
    try {
      await callback();
      toast.success(successMessage);
      await loadClients(statusFilter, { silent: true });
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

  const handleRefuse = async (client) => {
    const motif = window.prompt('Motif du refus :', client?.motifRefus || '');
    if (motif === null) return;

    await runAction(
      `refuse-${client.id}`,
      () => clientPlatformService.refuseClient(client.id, motif),
      'Client refuse'
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
              Gestion clients
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              Supervisez les clients de la plateforme
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
              Consultez les inscriptions, validez les nouveaux clients, refusez une demande ou
              activez une base de donnees depuis un seul espace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un client"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
              />
            </div>

            <button
              onClick={() => loadClients(statusFilter, { silent: true })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Clients total</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">En attente</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Refuses</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{stats.refused}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      statusFilter === option.value
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} affiche
                {filteredClients.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Inscription</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredClients.map((client) => {
                  const fullName = getFullName(client);
                  const isSelected = String(selectedClient?.id) === String(client.id);

                  return (
                    <tr
                      key={client.id}
                      className={`transition hover:bg-purple-50/40 ${isSelected ? 'bg-purple-50/60' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">
                            {fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{fullName}</p>
                            <p className="text-sm text-gray-500">{client.email || 'Email non renseigne'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>
                          {client?.statut || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client?.typeCompte || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client?.typeInscription || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(client?.dateInscription || client?.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Voir
                          </button>

                          {client?.statut === 'EN_ATTENTE' && (
                            <button
                              onClick={() =>
                                runAction(
                                  `validate-${client.id}`,
                                  () => clientPlatformService.validateClient(client.id),
                                  'Client valide'
                                )
                              }
                              disabled={actionLoading === `validate-${client.id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Valider
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="px-6 py-16 text-center text-gray-500">
                Aucun client ne correspond a cette recherche.
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Detail client</h2>
            <p className="mt-1 text-sm text-gray-500">
              Selectionnez un client pour consulter ses informations et executer des actions.
            </p>
          </div>

          {selectedClient ? (
            <div className="space-y-6 px-6 py-6">
              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-lg font-bold text-purple-700">
                    {getFullName(selectedClient).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{getFullName(selectedClient)}</p>
                    <p className="text-sm text-gray-500">{selectedClient.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{selectedClient?.statut || 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Telephone</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{selectedClient?.telephone || 'Non renseigne'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Type de compte</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{selectedClient?.typeCompte || 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Type d inscription</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{selectedClient?.typeInscription || 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Base de donnees</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{selectedClient?.nomBaseDonnees || 'Non creee'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Connexions restantes</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedClient?.connexionsRestantes ?? 'Non applicable'}
                  </p>
                </div>
              </div>

              {selectedClient?.motifRefus && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Motif du refus</p>
                  <p className="mt-2 text-sm text-rose-700">{selectedClient.motifRefus}</p>
                </div>
              )}

              <div className="space-y-3">
                {selectedClient?.statut === 'EN_ATTENTE' && (
                  <>
                    <button
                      onClick={() =>
                        runAction(
                          `validate-side-${selectedClient.id}`,
                          () => clientPlatformService.validateClient(selectedClient.id),
                          'Client valide'
                        )
                      }
                      disabled={actionLoading === `validate-side-${selectedClient.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Valider le client
                    </button>

                    <button
                      onClick={() => handleRefuse(selectedClient)}
                      disabled={actionLoading === `refuse-${selectedClient.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Refuser la demande
                    </button>
                  </>
                )}

                {selectedClient?.statut !== 'ACTIF' && (
                  <button
                    onClick={() =>
                      runAction(
                        `activate-${selectedClient.id}`,
                        () => clientPlatformService.activateClient(selectedClient.id),
                        'Client active et base creee'
                      )
                    }
                    disabled={actionLoading === `activate-${selectedClient.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                  >
                    <PlayCircleIcon className="h-5 w-5" />
                    Activer et creer la base
                  </button>
                )}

                {selectedClient?.nomBaseDonnees && (
                  <button
                    onClick={() =>
                      runAction(
                        `drop-db-${selectedClient.id}`,
                        () => clientPlatformService.dropDatabase(selectedClient.id),
                        'Base de donnees supprimee'
                      )
                    }
                    disabled={actionLoading === `drop-db-${selectedClient.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-purple-300 hover:text-purple-700 disabled:opacity-60"
                  >
                    <ServerStackIcon className="h-5 w-5" />
                    Supprimer la base
                  </button>
                )}
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                <div className="mb-2 flex items-center gap-2 font-medium text-gray-700">
                  <ClockIcon className="h-4 w-4" />
                  Chronologie
                </div>
                <p>Creation : {formatDate(selectedClient?.createdAt || selectedClient?.dateInscription)}</p>
                <p className="mt-1">Activation : {formatDate(selectedClient?.dateActivation)}</p>
                <p className="mt-1">Validation : {formatDate(selectedClient?.dateValidation)}</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <UserGroupIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">Aucun client selectionne</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Cliquez sur `Voir` dans le tableau pour afficher les informations d un client.
              </p>
              <button
                onClick={() => setStatusFilter('EN_ATTENTE')}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
              >
                <NoSymbolIcon className="h-4 w-4" />
                Voir les demandes en attente
              </button>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default ClientsManagementPage;
