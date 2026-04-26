// ClientsManagementPage.jsx - Version corrigée

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
  CreditCardIcon,
} from '@heroicons/react/24/outline';

import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';

// ⭐ STATUTS pour clients DEFINITIF uniquement
const STATUS_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Validé - En attente paiement', value: 'VALIDE_EN_ATTENTE_PAIEMENT' },
  { label: 'Actifs', value: 'ACTIF' },
  { label: 'Refusés', value: 'REFUSE' },
];

const formatDate = (value) => {
  if (!value) return 'Non renseigné';
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

const getFullName = (client) => {
  if (client?.raisonSociale) return client.raisonSociale;
  return [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.nom || 'Client';
};

const getStatusPillClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EN_ATTENTE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'VALIDE_EN_ATTENTE_PAIEMENT':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'REFUSE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'Actif';
    case 'EN_ATTENTE':
      return 'En attente de validation';
    case 'VALIDE_EN_ATTENTE_PAIEMENT':
      return 'Validé - En attente paiement';
    case 'REFUSE':
      return 'Refusé';
    default:
      return status || 'N/A';
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOffreId, setPaymentOffreId] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');

  // ⭐ Charger UNIQUEMENT les clients DEFINITIF
 const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
  if (silent) {
    setRefreshing(true);
  } else {
    setLoading(true);
  }

  try {
    console.log('🔍 Chargement des clients DEFINITIF...');
    const allDefinitifClients = await clientPlatformService.getDefinitifClients();
    console.log('📊 Clients reçus:', allDefinitifClients);
    
    let filteredData = [...allDefinitifClients];
    
    // Appliquer le filtre de statut
    if (filter !== 'ALL') {
      filteredData = filteredData.filter(client => client.statut === filter);
      console.log('📊 Après filtre statut:', filteredData.length);
    }
    
    setClients(filteredData);

    if (selectedClient?.id) {
      const freshSelected = filteredData.find(
        (client) => String(client.id) === String(selectedClient.id)
      ) || null;
      setSelectedClient(freshSelected);
    }
  } catch (error) {
    console.error('❌ Erreur chargement:', error);
    const message = error?.response?.data?.error || error?.message || 'Impossible de charger les clients.';
    toast.error(message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    loadClients('ALL');
  }, []);

  useEffect(() => {
    if (!loading) {
      loadClients(statusFilter, { silent: true });
    }
  }, [statusFilter]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((client) => {
      const haystack = [
        client?.nom,
        client?.prenom,
        client?.raisonSociale,
        client?.email,
        client?.telephone,
        client?.statut,
        client?.typeCompte,
        client?.typeInscription,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [clients, search]);

  // ⭐ Statistiques UNIQUEMENT sur DEFINITIF
  const stats = useMemo(() => {
    const total = clients.length;
    const pending = clients.filter((client) => client?.statut === 'EN_ATTENTE').length;
    const waitingPayment = clients.filter((client) => client?.statut === 'VALIDE_EN_ATTENTE_PAIEMENT').length;
    const active = clients.filter((client) => client?.statut === 'ACTIF').length;
    const refused = clients.filter((client) => client?.statut === 'REFUSE').length;
    return { total, pending, waitingPayment, active, refused };
  }, [clients]);

  const runAction = async (actionKey, callback, successMessage) => {
    setActionLoading(actionKey);
    try {
      await callback();
      toast.success(successMessage);
      await loadClients(statusFilter, { silent: true });
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "L'action n'a pas pu être exécutée.";
      toast.error(message);
    } finally {
      setActionLoading('');
    }
  };

  // ⭐ Validation du client (EN_ATTENTE → VALIDE_EN_ATTENTE_PAIEMENT)
  const handleValidate = async (client) => {
    await runAction(
      `validate-${client.id}`,
      () => clientPlatformService.validateClient(client.id),
      '✅ Client validé. Email de paiement envoyé.'
    );
  };

  // ⭐ Refus du client
  const handleRefuse = async (client) => {
    const motif = window.prompt('Motif du refus :', client?.motifRefus || '');
    if (motif === null) return;
    await runAction(
      `refuse-${client.id}`,
      () => clientPlatformService.refuseClient(client.id, motif),
      '❌ Client refusé'
    );
  };

  // ⭐ Confirmation paiement (VALIDE_EN_ATTENTE_PAIEMENT → ACTIF)
  const handleConfirmPayment = async (client) => {
    if (!paymentOffreId) {
      toast.error('Veuillez sélectionner une offre');
      return;
    }
    await runAction(
      `payment-${client.id}`,
      () => clientPlatformService.activateAfterPayment(client.id, paymentOffreId, paymentTransactionId),
      '💰 Paiement confirmé - Compte activé'
    );
    setShowPaymentModal(false);
    setPaymentOffreId('');
    setPaymentTransactionId('');
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
      {/* En-tête */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">
              Gestion clients DEFINITIF
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              Validez les inscriptions DEFINITIF
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
              Gérez uniquement les clients en formule DEFINITIF qui nécessitent une validation
              administrative et un paiement. Les comptes ESSAI sont automatiques.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un client DEFINITIF"
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

      {/* Cartes statistiques */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Total DEFINITIF</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">En attente validation</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">En attente paiement</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.waitingPayment}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Refusés</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{stats.refused}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Tableau des clients DEFINITIF */}
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
                {filteredClients.length} client DEFINITIF{filteredClients.length > 1 ? 's' : ''}
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
                            <p className="text-sm text-gray-500">{client.email || 'Email non renseigné'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>
                          {getStatusLabel(client?.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client?.typeCompte || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          DEFINITIF
                        </span>
                      </td>
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

                          {/* ⭐ Bouton Valider - uniquement pour EN_ATTENTE */}
                          {client?.statut === 'EN_ATTENTE' && (
                            <button
                              onClick={() => handleValidate(client)}
                              disabled={actionLoading === `validate-${client.id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Valider
                            </button>
                          )}

                          {/* ⭐ Bouton Confirmer paiement - uniquement pour VALIDE_EN_ATTENTE_PAIEMENT */}
                          {client?.statut === 'VALIDE_EN_ATTENTE_PAIEMENT' && (
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setShowPaymentModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              <CreditCardIcon className="h-4 w-4" />
                              Paiement
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
                Aucun client DEFINITIF ne correspond à cette recherche.
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral - Détails client */}
        <aside className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Détail client DEFINITIF</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez un client DEFINITIF pour consulter ses informations.
            </p>
          </div>

          {selectedClient ? (
            <div className="space-y-6 px-6 py-6">
              {/* ... reste du contenu du panneau latéral ... */}
              
              <div className="space-y-3">
                {selectedClient?.statut === 'EN_ATTENTE' && (
                  <>
                    <button
                      onClick={() => handleValidate(selectedClient)}
                      disabled={actionLoading === `validate-${selectedClient.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Valider et envoyer email de paiement
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

                {selectedClient?.statut === 'VALIDE_EN_ATTENTE_PAIEMENT' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    Confirmer le paiement
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <UserGroupIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">Aucun client DEFINITIF sélectionné</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Cliquez sur `Voir` dans le tableau pour afficher les informations d&apos;un client DEFINITIF.
              </p>
            </div>
          )}
        </aside>
      </section>

      {/* Modal confirmation paiement */}
      {showPaymentModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirmer le paiement</h3>
            <p className="text-sm text-gray-600 mb-4">
              Client: <strong>{getFullName(selectedClient)}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID de l'offre</label>
                <input
                  type="text"
                  value={paymentOffreId}
                  onChange={(e) => setPaymentOffreId(e.target.value)}
                  placeholder="ex: 1 (standard), 2 (premium)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Transaction (optionnel)</label>
                <input
                  type="text"
                  value={paymentTransactionId}
                  onChange={(e) => setPaymentTransactionId(e.target.value)}
                  placeholder="Référence de paiement"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleConfirmPayment(selectedClient)}
                disabled={!paymentOffreId}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagementPage;