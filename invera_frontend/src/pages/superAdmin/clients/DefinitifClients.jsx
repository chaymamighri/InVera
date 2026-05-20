// DefinitifClients.jsx - Inscriptions définitives

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';

const STATUS_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Validé', value: 'VALIDE' },
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
  if (client?.typeCompte === 'ENTREPRISE') {
    return client?.raisonSociale || `${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Client';
  }
  return [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.nom || 'Client';
};

const getOffreName = (client) => {
  if (client?.offreDemande?.nom) return client.offreDemande.nom;
  if (client?.offreNom) return client.offreNom;
  if (client?.abonnementDemande?.offreAbonnement?.nom) return client.abonnementDemande.offreAbonnement.nom;
  return 'Aucune offre sélectionnée';
};

const getStatusPillClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EN_ATTENTE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'VALIDE':
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
    case 'VALIDE':
      return 'Validé (en attente paiement)';
    case 'REFUSE':
      return 'Refusé';
    default:
      return status || 'N/A';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const tabButtonClass = (active) => `px-4 py-2 text-sm font-medium rounded-lg transition ${
  active ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
}`;

const DefinitifClients = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [documentLoading, setDocumentLoading] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState(null);

  const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const allClients = await clientPlatformService.getAllClients();
      const definitifClients = allClients.filter(client => client.typeInscription === 'DEFINITIF');
      
      let filteredData = [...definitifClients];
      if (filter !== 'ALL') {
        filteredData = filteredData.filter(client => client.statut === filter);
      }
      
      setClients(filteredData);

      if (selectedClient?.id) {
        const freshSelected = filteredData.find(
          (client) => String(client.id) === String(selectedClient.id)
        ) || null;
        setSelectedClient(freshSelected);
      }
    } catch (error) {
      toast.error('Impossible de charger les clients définitifs.');
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
        client?.nom, client?.prenom, client?.raisonSociale,
        client?.email, client?.telephone, client?.statut, client?.typeCompte,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [clients, search]);

  const stats = useMemo(() => {
    const total = clients.length;
    const pending = clients.filter((client) => client?.statut === 'EN_ATTENTE').length;
    const validated = clients.filter((client) => client?.statut === 'VALIDE').length;
    const active = clients.filter((client) => client?.statut === 'ACTIF').length;
    const refused = clients.filter((client) => client?.statut === 'REFUSE').length;
    return { total, pending, validated, active, refused };
  }, [clients]);

  const runAction = async (actionKey, callback, successMessage) => {
    setActionLoading(actionKey);
    try {
      await callback();
      toast.success(successMessage);
      await loadClients(statusFilter, { silent: true });
    } catch (error) {
      toast.error("L'action n'a pas pu être exécutée.");
    } finally {
      setActionLoading('');
    }
  };

  const handleValidate = async (client) => {
    await runAction(
      `validate-${client.id}`,
      () => clientPlatformService.validateClient(client.id),
      '✅ Client validé avec succès'
    );
  };

  const handleRefuse = async (client) => {
    const motif = window.prompt('Motif du refus :', client?.motifRefus || '');
    if (motif === null) return;
    await runAction(
      `refuse-${client.id}`,
      () => clientPlatformService.refuseClient(client.id, motif),
      '❌ Client refusé'
    );
  };

  const getDocumentList = (client) => {
    const documents = [];
    if (client.typeCompte === 'ENTREPRISE') {
      if (client.gerantCinUrl) documents.push({ name: 'CIN du gérant', type: 'gerantcin', url: client.gerantCinUrl });
      if (client.patenteUrl) documents.push({ name: 'Patente', type: 'patente', url: client.patenteUrl });
      if (client.rneUrl) documents.push({ name: 'Registre National des Entreprises', type: 'rne', url: client.rneUrl });
    } else {
      if (client.cinUrl) documents.push({ name: 'CIN', type: 'cin', url: client.cinUrl });
    }
    return documents;
  };

  const handleViewDocument = async (clientId, doc) => {
    setDocumentLoading(true);
    try {
      const blob = await clientPlatformService.getDocument(clientId, doc.type);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('Document ouvert');
    } catch (error) {
      toast.error("Impossible de charger le document");
    } finally {
      setDocumentLoading(false);
    }
  };

  const toggleDetails = (clientId) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes statistiques */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Total définitifs</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">En attente validation</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Validés</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.validated}</p>
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

      {/* Filtres et tableau */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  statusFilter === option.value
                    ? 'bg-emerald-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un client"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-emerald-300 focus:bg-white"
              />
            </div>
            <p className="text-sm text-gray-500">
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Offre</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Inscription</th>
                <th className="px-6 py-4">Actions</th>
                <th className="px-6 py-4">Détails</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredClients.map((client) => {
                const fullName = getFullName(client);
                const offreName = getOffreName(client);
                const isExpanded = expandedClientId === client.id;

                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-700">
                            {fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{fullName}</p>
                            <p className="text-sm text-gray-500">{client.email || 'Email non renseigné'}</p>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {offreName}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>
                          {getStatusLabel(client?.statut)}
                        </span>
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client.typeCompte || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(client?.dateInscription || client?.createdAt)}
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {client?.statut === 'EN_ATTENTE' && (
                            <>
                              <button
                                onClick={() => handleValidate(client)}
                                disabled={actionLoading === `validate-${client.id}`}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Valider
                              </button>
                              <button
                                onClick={() => handleRefuse(client)}
                                disabled={actionLoading === `refuse-${client.id}`}
                                className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                Refuser
                              </button>
                            </>
                          )}
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleDetails(client.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                          <InformationCircleIcon className="h-4 w-4" />
                          {isExpanded ? 'Masquer' : 'Détails'}
                          {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </button>
                       </td>
                     </tr>
                    
                    {isExpanded && (
                      <tr className="bg-emerald-50/30">
                        <td colSpan="7" className="px-6 py-6">
                          <div className="space-y-6">
                            <div className="flex border-b border-gray-200 gap-2">
                              <button onClick={() => setActiveTab('info')} className={tabButtonClass(activeTab === 'info')}>
                                <InformationCircleIcon className="h-4 w-4 inline mr-2" />
                                Informations
                              </button>
                              <button onClick={() => setActiveTab('documents')} className={tabButtonClass(activeTab === 'documents')}>
                                <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                                Documents
                              </button>
                            </div>

                            {activeTab === 'info' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500">Nom complet</p><p className="font-medium">{getFullName(client)}</p></div>
                                <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{client.email || 'Non renseigné'}</p></div>
                                <div><p className="text-xs text-gray-500">Téléphone</p><p className="font-medium">{client.telephone || 'Non renseigné'}</p></div>
                                <div><p className="text-xs text-gray-500">Offre choisie</p><p className="font-medium text-emerald-700">{offreName}</p></div>
                                <div><p className="text-xs text-gray-500">Date d'inscription</p><p className="font-medium">{formatDate(client.dateInscription)}</p></div>
                                {client.motifRefus && <div><p className="text-xs text-gray-500">Motif de refus</p><p className="font-medium text-rose-600">{client.motifRefus}</p></div>}
                              </div>
                            )}

                            {activeTab === 'documents' && (
                              <div className="space-y-3">
                                {getDocumentList(client).map((doc, idx) => (
                                  <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                      <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                                      <div><p className="font-medium">{doc.name}</p><p className="text-xs text-gray-500">Cliquez pour ouvrir</p></div>
                                    </div>
                                    <button onClick={() => handleViewDocument(client.id, doc)} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                      <EyeIcon className="h-4 w-4 inline mr-1" />
                                      Ouvrir
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                         </td>
                       </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default DefinitifClients;