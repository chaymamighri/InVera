import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckBadgeIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  XCircleIcon,
  UsersIcon,
  ClockIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../context/LanguageContext';
import { subscriptionPlatformService } from '../../../../servicesPlatform/subscriptionPlatformService';

const localeByLanguage = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar',
};

const formatDate = (value, locale, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatPrice = (value, devise = 'TND', fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  return `${Number(value).toFixed(2)} ${devise}`;
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
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'EN_ATTENTE_VALIDATION':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return <PlayCircleIcon className="h-4 w-4" />;
    case 'SUSPENDU':
      return <PauseCircleIcon className="h-4 w-4" />;
    case 'ANNULE':
      return <XCircleIcon className="h-4 w-4" />;
    case 'EXPIRE':
      return <ClockIcon className="h-4 w-4" />;
    default:
      return <InformationCircleIcon className="h-4 w-4" />;
  }
};

const statusLabel = (status, t) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return t('dashboard.superAdminStatusActive');
    case 'SUSPENDU':
      return t('dashboard.superAdminStatusSuspended');
    case 'ANNULE':
      return t('dashboard.superAdminStatusCancelled');
    case 'EXPIRE':
      return t('dashboard.superAdminStatusExpired');
    case 'EN_ATTENTE_VALIDATION':
      return t('dashboard.superAdminStatusPendingValidation');
    default:
      return status || 'N/A';
  }
};

const MotifModal = ({ isOpen, onClose, onConfirm, title, actionType, isLoading, t }) => {
  const [motif, setMotif] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!motif.trim()) {
      setError(t('dashboard.superAdminMotifRequired'));
      return;
    }
    setError('');
    onConfirm(motif.trim());
  };

  const handleClose = () => {
    setMotif('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-xl transition-all">
          <div className="mb-4 flex justify-center">
            <div className={`rounded-full p-3 ${actionType === 'suspend' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {actionType === 'suspend' ? (
                <PauseCircleIcon className="h-8 w-8 text-amber-600" />
              ) : (
                <PlayCircleIcon className="h-8 w-8 text-emerald-600" />
              )}
            </div>
          </div>
          <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">{title}</h3>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('dashboard.superAdminMotif')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={t('dashboard.superAdminMotifPlaceholder')}
              rows="4"
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            >
              {t('header.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                actionType === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              {isLoading ? t('common.loading') : t('header.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionsManagement = ({ subscriptions, onRefresh }) => {
  const { t, language, isArabic } = useLanguage();
  const locale = localeByLanguage[language] || localeByLanguage.fr;
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('ALL');
  const [hoveredSubscriptionId, setHoveredSubscriptionId] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, subscription: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: 'ALL', label: t('dashboard.superAdminStatusAll') },
      { value: 'ACTIF', label: t('dashboard.superAdminStatusActivePlural') },
      { value: 'SUSPENDU', label: t('dashboard.superAdminStatusSuspendedPlural') },
      { value: 'ANNULE', label: t('dashboard.superAdminStatusCancelledPlural') },
      { value: 'EXPIRE', label: t('dashboard.superAdminStatusExpiredPlural') },
      { value: 'EN_ATTENTE_VALIDATION', label: t('dashboard.superAdminStatusPending') },
    ],
    [t]
  );

  const statusesWithCounts = statusOptions.map((status) => ({
    ...status,
    count: status.value === 'ALL'
      ? subscriptions.length
      : subscriptions.filter((s) => s.statut === status.value).length,
  }));

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.statut === 'ACTIF').length,
    suspended: subscriptions.filter((s) => s.statut === 'SUSPENDU').length,
    expired: subscriptions.filter((s) => s.statut === 'EXPIRE').length,
    cancelled: subscriptions.filter((s) => s.statut === 'ANNULE').length,
    pending: subscriptions.filter((s) => s.statut === 'EN_ATTENTE_VALIDATION').length,
  };

  const filteredSubscriptions =
    subscriptionStatusFilter === 'ALL'
      ? subscriptions
      : subscriptions.filter((sub) => sub.statut === subscriptionStatusFilter);

  const openModal = (type, subscription) => {
    setModalConfig({ isOpen: true, type, subscription });
  };

  const closeModal = () => {
    setModalConfig({ isOpen: false, type: null, subscription: null });
  };

  const handleConfirmWithMotif = async (motif) => {
    const { type, subscription } = modalConfig;
    if (!subscription) return;

    setIsSubmitting(true);

    try {
      const response =
        type === 'suspend'
          ? await subscriptionPlatformService.suspendSubscription(subscription.id, motif)
          : await subscriptionPlatformService.reactivateSubscription(subscription.id, motif);

      setSelectedSubscription({ ...subscription, ...response });
      closeModal();
      toast.success(
        type === 'suspend'
          ? t('dashboard.superAdminSubscriptionSuspended')
          : t('dashboard.superAdminSubscriptionReactivated')
      );

      if (onRefresh) {
        onRefresh().catch((err) => console.error('Erreur refresh:', err));
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        t('dashboard.actionError');
      toast.error(errorMessage);
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    const { type, subscription } = modalConfig;
    const clientName = subscription?.clientNom || t('dashboard.superAdminThisClient');
    if (type === 'suspend') return t('dashboard.superAdminSuspendSubscriptionTitle', { client: clientName });
    if (type === 'reactivate') return t('dashboard.superAdminReactivateSubscriptionTitle', { client: clientName });
    return '';
  };

  const formattedPrice = (subscription) =>
    formatPrice(subscription.montant, subscription.devise, t('dashboard.superAdminUndefined'));

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <MotifModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirmWithMotif}
        title={getModalTitle()}
        actionType={modalConfig.type}
        isLoading={isSubmitting}
        t={t}
      />

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard label={t('dashboard.superAdminPaymentsTotal')} value={stats.total} color="purple" icon={UsersIcon} />
        <SummaryCard label={t('dashboard.superAdminStatusActivePlural')} value={stats.active} color="emerald" icon={PlayCircleIcon} />
        <SummaryCard label={t('dashboard.superAdminStatusSuspendedPlural')} value={stats.suspended} color="amber" icon={PauseCircleIcon} />
        <SummaryCard label={t('dashboard.superAdminStatusPending')} value={stats.pending} color="blue" icon={ClockIcon} />
        <SummaryCard label={t('dashboard.superAdminExpiredCancelled')} value={stats.expired + stats.cancelled} color="gray" icon={XCircleIcon} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('dashboard.superAdminClientSubscriptions')}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t('dashboard.superAdminSubscriptionCount', { count: filteredSubscriptions.length })}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statusesWithCounts.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSubscriptionStatusFilter(option.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      subscriptionStatusFilter === option.value
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className={`${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold uppercase tracking-wide text-gray-500`}>
                  <th className="px-4 py-3">{t('dashboard.superAdminTableClient')}</th>
                  <th className="px-4 py-3">{t('dashboard.superAdminTableOffer')}</th>
                  <th className="px-4 py-3">{t('dashboard.superAdminTableAmount')}</th>
                  <th className="px-4 py-3">{t('dashboard.superAdminTablePeriod')}</th>
                  <th className="px-4 py-3">{t('dashboard.superAdminTableStatus')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredSubscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedSubscription?.id === subscription.id
                        ? 'border-l-4 border-l-purple-500 bg-purple-50 shadow-sm'
                        : hoveredSubscriptionId === subscription.id
                          ? 'bg-gray-50'
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSubscription(subscription)}
                    onMouseEnter={() => setHoveredSubscriptionId(subscription.id)}
                    onMouseLeave={() => setHoveredSubscriptionId(null)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-lg p-1.5 ${selectedSubscription?.id === subscription.id ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          {subscription.typeCompte === 'ENTREPRISE' ? (
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{subscription.clientNom || t('dashboard.superAdminTableClient')}</p>
                          <p className="text-xs text-gray-500">{subscription.clientEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{subscription.offreNom || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{formattedPrice(subscription)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{t('dashboard.superAdminDurationMonths', { count: subscription.dureeMois })}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(subscription.statut)}
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getSubscriptionStatusClass(subscription.statut)}`}>
                          {statusLabel(subscription.statut, t)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubscription(subscription);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          selectedSubscription?.id === subscription.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                        {t('dashboard.superAdminDetails')}
                        {selectedSubscription?.id === subscription.id && <ChevronRightIcon className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubscriptions.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <UsersIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                <p>{t('dashboard.superAdminNoSubscriptionFound')}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
              {t('dashboard.superAdminSubscriptionDetail')}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {selectedSubscription
                ? t('dashboard.superAdminSubscriptionSelected', { id: selectedSubscription.id })
                : t('dashboard.superAdminClickSubscriptionDetails')}
            </p>
          </div>

          {selectedSubscription ? (
            <div className="space-y-4 p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <p className="text-xs font-medium text-emerald-600">
                    {t('dashboard.superAdminSubscriptionSelectedShort')}
                  </p>
                </div>
                <button onClick={() => setSelectedSubscription(null)} className="text-xs text-gray-400 transition hover:text-gray-600">
                  x
                </button>
              </div>

              <div className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                      {selectedSubscription.offreNom || t('dashboard.superAdminSubscription')}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="rounded-lg bg-white p-1.5 shadow-sm">
                        {selectedSubscription.typeCompte === 'ENTREPRISE' ? (
                          <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{selectedSubscription.clientNom}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{selectedSubscription.clientEmail}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getSubscriptionStatusClass(selectedSubscription.statut)}`}>
                    {getStatusIcon(selectedSubscription.statut)}
                    {statusLabel(selectedSubscription.statut, t)}
                  </span>
                </div>
              </div>

              <DetailRow label={t('dashboard.superAdminTableAmount')} value={formattedPrice(selectedSubscription)} />
              <DetailRow label={t('dashboard.superAdminTablePeriod')} value={t('dashboard.superAdminDurationMonths', { count: selectedSubscription.dureeMois })} />
              <DetailRow label={t('dashboard.superAdminStartDate')} value={formatDate(selectedSubscription.dateDebut, locale, t('dashboard.superAdminNotProvided'))} />
              <DetailRow label={t('dashboard.superAdminEndDate')} value={formatDate(selectedSubscription.dateFin, locale, t('dashboard.superAdminNotProvided'))} />

              <div className="space-y-2 border-t border-gray-100 pt-4">
                {selectedSubscription.statut === 'ACTIF' && (
                  <button
                    onClick={() => openModal('suspend', selectedSubscription)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                  >
                    <PauseCircleIcon className="h-4 w-4" />
                    {t('dashboard.superAdminSuspendSubscription')}
                  </button>
                )}
                {selectedSubscription.statut === 'SUSPENDU' && (
                  <button
                    onClick={() => openModal('reactivate', selectedSubscription)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <PlayCircleIcon className="h-4 w-4" />
                    {t('dashboard.superAdminReactivateSubscription')}
                  </button>
                )}
                {selectedSubscription.statut === 'EN_ATTENTE_VALIDATION' && (
                  <InfoBox tone="blue" icon={ClockIcon} text={t('dashboard.superAdminPendingValidationPayment')} />
                )}
                {(selectedSubscription.statut === 'ANNULE' || selectedSubscription.statut === 'EXPIRE') && (
                  <InfoBox tone="gray" icon={InformationCircleIcon} text={t('dashboard.superAdminNoActionAvailable')} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100">
                <CheckBadgeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-base font-medium text-gray-700">
                {t('dashboard.superAdminNoSubscriptionSelected')}
              </p>
              <p className="mt-1 max-w-xs text-sm text-gray-400">
                {t('dashboard.superAdminClickSubscriptionActions')}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <ChevronRightIcon className="h-3 w-3" />
                <span>{t('dashboard.superAdminSelectSubscriptionStart')}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, color, icon: Icon }) => {
  const colorClasses = {
    purple: 'from-purple-50 border-purple-100 text-purple-600 bg-purple-100',
    emerald: 'from-emerald-50 border-emerald-100 text-emerald-600 bg-emerald-100',
    amber: 'from-amber-50 border-amber-100 text-amber-600 bg-amber-100',
    blue: 'from-blue-50 border-blue-100 text-blue-600 bg-blue-100',
    gray: 'from-gray-50 border-gray-200 text-gray-500 bg-gray-100',
  }[color];
  const [gradient, border, text, bg] = colorClasses.split(' ');

  return (
    <div className={`rounded-xl bg-gradient-to-br ${gradient} to-white border ${border} p-4 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${text}`}>{label}</p>
          <p className={`text-2xl font-bold ${color === 'purple' ? 'text-gray-900' : text}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-5 w-5 ${text}`} />
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

const InfoBox = ({ tone, icon: Icon, text }) => {
  const classes =
    tone === 'blue'
      ? 'bg-blue-50 border-blue-100 text-blue-700'
      : 'bg-gray-50 border-gray-100 text-gray-500';

  return (
    <div className={`rounded-lg border p-3 text-center ${classes}`}>
      <div className="flex items-center justify-center gap-2 text-xs">
        <Icon className="h-4 w-4" />
        <span>{text}</span>
      </div>
    </div>
  );
};

export default SubscriptionsManagement;
