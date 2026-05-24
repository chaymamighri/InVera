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

const getOffreName = (client, fallback) => {
  if (client?.offreDemande?.nom) return client.offreDemande.nom;
  if (client?.offreNom) return client.offreNom;
  if (client?.abonnementDemande?.offreAbonnement?.nom) return client.abonnementDemande.offreAbonnement.nom;
  return fallback;
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

const getStatusLabel = (status, t) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return t('dashboard.superAdminStatusActive');
    case 'EN_ATTENTE':
      return t('dashboard.superAdminStatusPendingValidation');
    case 'VALIDE':
      return t('dashboard.superAdminStatusValidatedPaymentPending');
    case 'REFUSE':
      return t('dashboard.superAdminStatusRefused');
    default:
      return status || 'N/A';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const tabButtonClass = (active) => `px-4 py-2 text-sm font-medium rounded-lg transition ${
  active ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
}`;

const DefinitifClients = () => {
  const { t, language, isArabic } = useLanguage();
  const locale = language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR';
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

  const statusOptions = [
    { label: t('dashboard.superAdminAll'), value: 'ALL' },
    { label: t('dashboard.superAdminStatusPending'), value: 'EN_ATTENTE' },
    { label: t('dashboard.superAdminStatusValidated'), value: 'VALIDE' },
    { label: t('dashboard.superAdminStatusActivePlural'), value: 'ACTIF' },
    { label: t('dashboard.superAdminRefused'), value: 'REFUSE' },
  ];

  const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const allClients = await clientPlatformService.getAllClients();
      const definitifClients = allClients.filter((client) => client.typeInscription === 'DEFINITIF');
      const filteredData = filter === 'ALL'
        ? definitifClients
        : definitifClients.filter((client) => client.statut === filter);

      setClients(filteredData);

      if (selectedClient?.id) {
        const freshSelected = filteredData.find((client) => String(client.id) === String(selectedClient.id)) || null;
        setSelectedClient(freshSelected);
      }
    } catch (error) {
      toast.error(t('dashboard.superAdminDefinitiveClientsLoadError'));
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
    pending: clients.filter((client) => client?.statut === 'EN_ATTENTE').length,
    validated: clients.filter((client) => client?.statut === 'VALIDE').length,
    active: clients.filter((client) => client?.statut === 'ACTIF').length,
    refused: clients.filter((client) => client?.statut === 'REFUSE').length,
  }), [clients]);

  const runAction = async (actionKey, callback, successMessage) => {
    setActionLoading(actionKey);
    try {
      await callback();
      toast.success(successMessage);
      await loadClients(statusFilter, { silent: true });
    } catch (error) {
      toast.error(t('dashboard.actionError'));
    } finally {
      setActionLoading('');
    }
  };

  const handleValidate = async (client) => {
    await runAction(
      `validate-${client.id}`,
      () => clientPlatformService.validateClient(client.id),
      t('dashboard.superAdminClientValidated')
    );
  };

  const handleRefuse = async (client) => {
    const motif = window.prompt(t('dashboard.superAdminRefusalPrompt'), client?.motifRefus || '');
    if (motif === null) return;
    await runAction(
      `refuse-${client.id}`,
      () => clientPlatformService.refuseClient(client.id, motif),
      t('dashboard.superAdminClientRefused')
    );
  };

  const getDocumentList = (client) => {
    const documents = [];
    if (client.typeCompte === 'ENTREPRISE') {
      if (client.gerantCinUrl) documents.push({ name: 'CIN', type: 'gerantcin', url: client.gerantCinUrl });
      if (client.patenteUrl) documents.push({ name: 'Patente', type: 'patente', url: client.patenteUrl });
      if (client.rneUrl) documents.push({ name: 'RNE', type: 'rne', url: client.rneUrl });
    } else if (client.cinUrl) {
      documents.push({ name: 'CIN', type: 'cin', url: client.cinUrl });
    }
    return documents;
  };

  const handleViewDocument = async (clientId, doc) => {
    setDocumentLoading(true);
    try {
      const blob = await clientPlatformService.getDocument(clientId, doc.type);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success(t('dashboard.superAdminDocumentOpened'));
    } catch (error) {
      toast.error(t('dashboard.superAdminDocumentLoadError'));
    } finally {
      setDocumentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminDefinitiveTotal')}</p><p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p></div>
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminStatusPendingValidation')}</p><p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p></div>
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminValidated')}</p><p className="mt-2 text-3xl font-semibold text-blue-600">{stats.validated}</p></div>
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminStatusActivePlural')}</p><p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p></div>
        <div className={summaryCardClass}><p className="text-sm font-medium text-gray-500">{t('dashboard.superAdminRefused')}</p><p className="mt-2 text-3xl font-semibold text-rose-600">{stats.refused}</p></div>
      </section>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button key={option.value} onClick={() => setStatusFilter(option.value)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${statusFilter === option.value ? 'bg-emerald-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700'}`}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${isArabic ? 'right-4' : 'left-4'}`} />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('dashboard.superAdminSearchClient')} className={`w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-300 focus:bg-white ${isArabic ? 'pl-4 pr-12' : 'pl-12 pr-4'}`} />
            </div>
            <p className="text-sm text-gray-500">{t('dashboard.superAdminClientCount', { count: filteredClients.length })}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className={`${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold uppercase tracking-wide text-gray-500`}>
                <th className="px-6 py-4">{t('dashboard.superAdminTableClient')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableOffer')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableStatus')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableType')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableRegistration')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminTableActions')}</th>
                <th className="px-6 py-4">{t('dashboard.superAdminDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredClients.map((client) => {
                const fullName = getFullName(client, t('dashboard.superAdminTableClient'));
                const offreName = getOffreName(client, t('dashboard.superAdminNoOfferSelected'));
                const isExpanded = expandedClientId === client.id;
                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-700">{fullName.substring(0, 2).toUpperCase()}</div><div><p className="font-semibold text-gray-900">{fullName}</p><p className="text-sm text-gray-500">{client.email || t('dashboard.superAdminEmailNotProvided')}</p></div></div></td>
                      <td className="px-6 py-4"><span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{offreName}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>{getStatusLabel(client?.statut, t)}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client.typeCompte === 'ENTREPRISE' ? t('dashboard.superAdminCompany') : client.typeCompte ? t('dashboard.superAdminIndividual') : 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(client?.dateInscription || client?.createdAt, locale, t('dashboard.superAdminNotProvided'))}</td>
                      <td className="px-6 py-4"><div className="flex flex-wrap gap-2">{client?.statut === 'EN_ATTENTE' && (<><button onClick={() => handleValidate(client)} disabled={actionLoading === `validate-${client.id}`} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><CheckCircleIcon className="h-4 w-4" />{t('dashboard.superAdminValidate')}</button><button onClick={() => handleRefuse(client)} disabled={actionLoading === `refuse-${client.id}`} className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"><XCircleIcon className="h-4 w-4" />{t('dashboard.superAdminRefuse')}</button></>)}</div></td>
                      <td className="px-6 py-4"><button onClick={() => setExpandedClientId(isExpanded ? null : client.id)} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"><InformationCircleIcon className="h-4 w-4" />{isExpanded ? t('dashboard.superAdminHide') : t('dashboard.superAdminDetails')}{isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</button></td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-emerald-50/30">
                        <td colSpan="7" className="px-6 py-6">
                          <div className="space-y-6">
                            <div className="flex border-b border-gray-200 gap-2">
                              <button onClick={() => setActiveTab('info')} className={tabButtonClass(activeTab === 'info')}><InformationCircleIcon className="h-4 w-4 inline mr-2" />{t('dashboard.superAdminInformation')}</button>
                              <button onClick={() => setActiveTab('documents')} className={tabButtonClass(activeTab === 'documents')}><DocumentTextIcon className="h-4 w-4 inline mr-2" />{t('dashboard.superAdminDocuments')}</button>
                            </div>
                            {activeTab === 'info' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminFullName')}</p><p className="font-medium">{fullName}</p></div>
                                <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{client.email || t('dashboard.superAdminNotProvided')}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminPhone')}</p><p className="font-medium">{client.telephone || t('dashboard.superAdminNotProvided')}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminChosenOffer')}</p><p className="font-medium text-emerald-700">{offreName}</p></div>
                                <div><p className="text-xs text-gray-500">{t('dashboard.superAdminRegistrationDate')}</p><p className="font-medium">{formatDate(client.dateInscription, locale, t('dashboard.superAdminNotProvided'))}</p></div>
                                {client.motifRefus && <div><p className="text-xs text-gray-500">{t('dashboard.superAdminRefusalReason')}</p><p className="font-medium text-rose-600">{client.motifRefus}</p></div>}
                              </div>
                            )}
                            {activeTab === 'documents' && (
                              <div className="space-y-3">
                                {getDocumentList(client).map((doc) => (
                                  <div key={doc.type} className="flex items-center justify-between border rounded-lg p-3">
                                    <div className="flex items-center gap-3"><DocumentTextIcon className="h-8 w-8 text-blue-500" /><div><p className="font-medium">{doc.name}</p><p className="text-xs text-gray-500">{t('dashboard.superAdminClickToOpen')}</p></div></div>
                                    <button disabled={documentLoading} onClick={() => handleViewDocument(client.id, doc)} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><EyeIcon className="h-4 w-4 inline mr-1" />{t('dashboard.superAdminOpen')}</button>
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
