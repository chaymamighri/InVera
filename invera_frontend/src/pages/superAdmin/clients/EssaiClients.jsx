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
import { useLanguage } from '../../../context/LanguageContext';

const formatDate = (value, locale, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFullName = (client, fallback) => {
  if (client?.typeCompte === 'ENTREPRISE') {
    return client?.raisonSociale || `${client?.prenom || ''} ${client?.nom || ''}`.trim() || fallback;
  }
  return [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.nom || fallback;
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

const getStatusLabel = (status, t) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return t('dashboard.superAdminTrialActiveStatus');
    case 'INACTIF':
      return t('dashboard.superAdminTrialExpiredStatus');
    default:
      return status || 'N/A';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const tabButtonClass = (active) => `px-4 py-2 text-sm font-medium rounded-lg transition ${
  active ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
}`;

const EssaiClients = () => {
  const { t, language, isArabic } = useLanguage();
  const locale = language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR';
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [expandedClientId, setExpandedClientId] = useState(null);

  const statusOptions = [
    { label: t('dashboard.superAdminAll'), value: 'ALL' },
    { label: t('dashboard.superAdminStatusActivePlural'), value: 'ACTIF' },
    { label: t('dashboard.superAdminStatusExpiredPlural'), value: 'INACTIF' },
  ];

  const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const allClients = await clientPlatformService.getAllClients();
      const essaiClients = allClients.filter((client) => client.typeInscription === 'ESSAI');
      const filteredData = filter === 'ALL'
        ? essaiClients
        : essaiClients.filter((client) => client.statut === filter);

      setClients(filteredData);

      if (selectedClient?.id) {
        const freshSelected = filteredData.find((client) => String(client.id) === String(selectedClient.id)) || null;
        setSelectedClient(freshSelected);
      }
    } catch (error) {
      toast.error(t('dashboard.superAdminTrialClientsLoadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients('ALL');
  }, []);

  useEffect(() => {
    if (!loading) loadClients(statusFilter, { silent: true });
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

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((client) => client?.statut === 'ACTIF').length,
    inactive: clients.filter((client) => client?.statut === 'INACTIF').length,
  }), [clients]);

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
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminTrialTotal')}</p><p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p></div>
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminTrialActive')}</p><p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p></div>
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminTrialExpired')}</p><p className="mt-2 text-3xl font-semibold text-gray-500">{stats.inactive}</p></div>
      </section>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button key={option.value} onClick={() => setStatusFilter(option.value)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${statusFilter === option.value ? 'bg-purple-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:text-purple-700'}`}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${isArabic ? 'right-4' : 'left-4'}`} />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('dashboard.superAdminSearchClient')} className={`w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white ${isArabic ? 'pl-4 pr-12' : 'pl-12 pr-4'}`} />
            </div>
            <p className="text-sm text-gray-500">{t('dashboard.superAdminClientCount', { count: filteredClients.length })}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className={`${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold uppercase tracking-wide text-gray-500`}>
                <th className="px-6 py-4">{t('dashboard.superAdminTableClient')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableType')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminRemainingConnections')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableStatus')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableRegistration')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredClients.map((client) => {
                const fullName = getFullName(client, t('dashboard.superAdminTableClient'));
                const isExpanded = expandedClientId === client.id;
                const connexionPercentage = getConnexionPercentage(client.connexionsRestantes, client.connexionsMax);
                const connexionColor = getConnexionColor(client.connexionsRestantes);
                const accountType = client.typeCompte === 'ENTREPRISE' ? t('dashboard.superAdminCompany') : t('dashboard.superAdminIndividual');

                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">{fullName.substring(0, 2).toUpperCase()}</div><div><p className="font-semibold text-gray-900">{fullName}</p><p className="text-sm text-gray-500">{client.email || t('dashboard.superAdminEmailNotProvided')}</p></div></div></td>
                      <td className="px-6 py-4 text-sm text-gray-700">{accountType}</td>
                      <td className="px-6 py-4">
                        {client.statut === 'ACTIF' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <RocketLaunchIcon className={`h-4 w-4 ${connexionColor}`} />
                              <span className={`font-semibold ${connexionColor}`}>{client.connexionsRestantes || 0} / {client.connexionsMax || 30}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${connexionPercentage}%` }} /></div>
                            {client.connexionsRestantes <= 5 && client.connexionsRestantes > 0 && <p className="text-xs text-orange-600">{t('dashboard.superAdminRemainingConnectionsWarning', { count: client.connexionsRestantes })}</p>}
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>{getStatusLabel(client?.statut, t)}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(client?.dateInscription || client?.createdAt, locale, t('dashboard.superAdminNotProvided'))}</td>
                      <td className="px-6 py-4"><button onClick={() => setExpandedClientId(isExpanded ? null : client.id)} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"><InformationCircleIcon className="h-4 w-4" />{isExpanded ? t('dashboard.superAdminHide') : t('dashboard.superAdminDetails')}{isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</button></td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-purple-50/30">
                        <td colSpan="6" className="px-6 py-6">
                          <div className="space-y-6">
                            <div className="flex border-b border-gray-200 gap-2">
                              <button onClick={() => setActiveTab('info')} className={tabButtonClass(activeTab === 'info')}><InformationCircleIcon className="h-4 w-4 inline mr-2" />{t('dashboard.superAdminInformation')}</button>
                            </div>
                            {activeTab === 'info' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminFullName')}</p><p className="font-medium text-gray-900">{fullName}</p></div>
                                <div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-gray-900">{client.email || t('dashboard.superAdminNotProvided')}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminPhone')}</p><p className="font-medium text-gray-900">{client.telephone || t('dashboard.superAdminNotProvided')}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminAccountType')}</p><p className="font-medium text-gray-900">{accountType}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminRemainingConnections')}</p><p className={`font-medium ${connexionColor}`}>{t('dashboard.superAdminConnectionsOutOf', { current: client.connexionsRestantes || 0, max: client.connexionsMax || 30 })}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminRegistrationDate')}</p><p className="font-medium text-gray-900">{formatDate(client.dateInscription, locale, t('dashboard.superAdminNotProvided'))}</p></div>
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

          {filteredClients.length === 0 && <div className="px-6 py-16 text-center text-gray-500">{t('dashboard.superAdminNoTrialClientFound')}</div>}
        </div>
      </div>
    </div>
  );
};

export default EssaiClients;
