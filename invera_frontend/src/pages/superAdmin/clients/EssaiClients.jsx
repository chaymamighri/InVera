// EssaiClients.jsx - Version avec affichage "Expiré"

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';

const STATUS_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Actifs', value: 'ACTIF' },
  { label: 'Expirés', value: 'INACTIF' },
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

const getStatusPillClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'INACTIF':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'Actif (essai)';
    case 'INACTIF':
      return 'Expiré (30 connexions)';
    default:
      return status || 'N/A';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const tabButtonClass = (active) => `px-4 py-2 text-sm font-medium rounded-lg transition ${
  active ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
}`;

const EssaiClients = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [expandedClientId, setExpandedClientId] = useState(null);

  const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const allClients = await clientPlatformService.getAllClients();
      const essaiClients = allClients.filter(client => client.typeInscription === 'ESSAI');
      
      let filteredData = [...essaiClients];
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
      toast.error('Impossible de charger les clients essai.');
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
    const active = clients.filter((client) => client?.statut === 'ACTIF').length;
    const inactive = clients.filter((client) => client?.statut === 'INACTIF').length;
    return { total, active, inactive };
  }, [clients]);

  const toggleDetails = (clientId) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const getConnexionPercentage = (restantes, max) => {
    if (!max || max === 0) return 0;
    return (restantes / max) * 100;
  };

  const getConnexionColor = (restantes) => {
    if (restantes <= 5) return 'text-red-600';
    if (restantes <= 10) return 'text-orange-500';
    return 'text-emerald-600';
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
      {/* Cartes statistiques */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Total essais</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Actifs (essai)</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Expirés</p>
          <p className="mt-2 text-3xl font-semibold text-gray-500">{stats.inactive}</p>
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
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:text-purple-700'
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
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
              />
            </div>
            <p className="text-sm text-gray-500">
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Connexions restantes</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Inscription</th>
                <th className="px-6 py-4">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredClients.map((client) => {
                const fullName = getFullName(client);
                const isExpanded = expandedClientId === client.id;
                const connexionPercentage = getConnexionPercentage(client.connexionsRestantes, client.connexionsMax);
                const connexionColor = getConnexionColor(client.connexionsRestantes);

                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-gray-50 transition">
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
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {client.typeCompte === 'ENTREPRISE' ? '🏢 Entreprise' : '👤 Particulier'}
                      </td>
                      <td className="px-6 py-4">
                        {client.statut === 'ACTIF' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <RocketLaunchIcon className={`h-4 w-4 ${connexionColor}`} />
                              <span className={`font-semibold ${connexionColor}`}>
                                {client.connexionsRestantes || 0} / {client.connexionsMax || 30}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full transition-all" 
                                style={{ width: `${connexionPercentage}%` }}
                              />
                            </div>
                            {client.connexionsRestantes <= 5 && client.connexionsRestantes > 0 && (
                              <p className="text-xs text-orange-600">⚠️ Plus que {client.connexionsRestantes} connexions</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>
                          {getStatusLabel(client?.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(client?.dateInscription || client?.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleDetails(client.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                        >
                          <InformationCircleIcon className="h-4 w-4" />
                          {isExpanded ? 'Masquer' : 'Détails'}
                          {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-purple-50/30">
                        <td colSpan="6" className="px-6 py-6">
                          <div className="space-y-6">
                            <div className="flex border-b border-gray-200 gap-2">
                              <button onClick={() => setActiveTab('info')} className={tabButtonClass(activeTab === 'info')}>
                                <InformationCircleIcon className="h-4 w-4 inline mr-2" />
                                Informations
                              </button>
                            </div>

                            {activeTab === 'info' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Nom complet</p>
                                  <p className="font-medium text-gray-900">{getFullName(client)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <p className="font-medium text-gray-900">{client.email || 'Non renseigné'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Téléphone</p>
                                  <p className="font-medium text-gray-900">{client.telephone || 'Non renseigné'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Type de compte</p>
                                  <p className="font-medium text-gray-900">{client.typeCompte === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Connexions restantes</p>
                                  <p className={`font-medium ${connexionColor}`}>
                                    {client.connexionsRestantes || 0} sur {client.connexionsMax || 30}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Date d'inscription</p>
                                  <p className="font-medium text-gray-900">{formatDate(client.dateInscription)}</p>
                                </div>
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

          {filteredClients.length === 0 && (
            <div className="px-6 py-16 text-center text-gray-500">
              Aucun client essai ne correspond à cette recherche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssaiClients;