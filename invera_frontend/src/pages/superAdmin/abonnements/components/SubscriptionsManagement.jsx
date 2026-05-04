// components/SubscriptionsManagement.jsx
import React, { useState } from 'react';
import {
  CheckBadgeIcon,
  CreditCardIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  XCircleIcon,
  UsersIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { subscriptionPlatformService } from '../../../../servicesPlatform/subscriptionPlatformService';

const formatDate = (value) => {
  if (!value) return 'Non renseigné';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatPrice = (value, devise = 'TND') => {
  if (value === null || value === undefined || value === '') return 'Non défini';
  return `${Number(value).toFixed(2)} ${devise}`;
};

const getSubscriptionStatusClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'SUSPENDU': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ANNULE': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'EXPIRE': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'EN_ATTENTE_VALIDATION': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getSubscriptionStatusLabel = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF': return 'Actif';
    case 'SUSPENDU': return 'Suspendu';
    case 'ANNULE': return 'Annulé';
    case 'EXPIRE': return 'Expiré';
    case 'EN_ATTENTE_VALIDATION': return 'En attente validation';
    default: return status || 'N/A';
  }
};

const getStatusIcon = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF': return <PlayCircleIcon className="h-4 w-4" />;
    case 'SUSPENDU': return <PauseCircleIcon className="h-4 w-4" />;
    case 'ANNULE': return <XCircleIcon className="h-4 w-4" />;
    case 'EXPIRE': return <ClockIcon className="h-4 w-4" />;
    default: return <InformationCircleIcon className="h-4 w-4" />;
  }
};

const SUBSCRIPTION_STATUSES = [
  { value: 'ALL', label: 'Tous', count: 0 },
  { value: 'ACTIF', label: 'Actifs', count: 0 },
  { value: 'SUSPENDU', label: 'Suspendus', count: 0 },
  { value: 'ANNULE', label: 'Annulés', count: 0 },
  { value: 'EXPIRE', label: 'Expirés', count: 0 },
  { value: 'EN_ATTENTE_VALIDATION', label: 'En attente', count: 0 },
];

// Tooltip component
const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);
  
  if (!content) return children;
  
  return (
    <div className="relative inline-block w-full">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Modal de confirmation générique
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, icon, confirmButtonClass }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
          <div className="flex justify-center mb-4">
            <div className={`rounded-full p-3 ${confirmButtonClass === 'bg-red-600' ? 'bg-red-100' : confirmButtonClass === 'bg-amber-600' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {icon}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-gray-600 text-center mb-6">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {cancelText || 'Annuler'}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${confirmButtonClass || 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {confirmText || 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionsManagement = ({ subscriptions, onRefresh, runAction }) => {
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('ALL');
  const [hoveredSubscriptionId, setHoveredSubscriptionId] = useState(null);
  
  // États pour les modals
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    subscription: null,
  });

  // Mettre à jour les comptes des statuts
  const statusesWithCounts = SUBSCRIPTION_STATUSES.map(status => ({
    ...status,
    count: subscriptions.filter(s => s.statut === status.value).length
  }));

  const openModal = (type, subscription) => {
    setModalConfig({
      isOpen: true,
      type,
      subscription,
    });
  };

  const closeModal = () => {
    setModalConfig({
      isOpen: false,
      type: null,
      subscription: null,
    });
  };


const handleConfirm = async () => {
  const { type, subscription } = modalConfig;
  
  if (!subscription) return;
  
  try {
    let apiCall;
    let newStatut;
    let successMessage;
    
    switch (type) {
      case 'suspend':
        apiCall = () => subscriptionPlatformService.suspendSubscription(subscription.id);
        newStatut = 'SUSPENDU';
        successMessage = 'Abonnement suspendu avec succès';
        break;
      case 'reactivate':
        apiCall = () => subscriptionPlatformService.reactivateSubscription(subscription.id);
        newStatut = 'ACTIF';
        successMessage = 'Abonnement réactivé avec succès';
        break;
      case 'cancel':
        apiCall = () => subscriptionPlatformService.cancelSubscription(subscription.id);
        newStatut = 'ANNULE';
        successMessage = 'Abonnement annulé avec succès';
        break;
      default:
        return;
    }
    
    const response = await apiCall();
    
    // ✅ Mise à jour immédiate de l'UI
    const updatedSubscription = { ...subscription, statut: newStatut, ...response };
    setSelectedSubscription(updatedSubscription);
    
    // ✅ Note: pas besoin de mettre à jour subscriptions manuellement
    // car onRefresh va rafraîchir toute la liste
    
    // ✅ Afficher le succès
    if (runAction) {
      await runAction(`${type}-${subscription.id}`, () => Promise.resolve(), successMessage);
    }
    
    // ✅ Rafraîchir la liste depuis le backend
    if (onRefresh) {
      await onRefresh();
    }
    
  } catch (error) {
    console.error(`Erreur lors de ${type}:`, error);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Une erreur est survenue';
    alert(`Erreur: ${errorMessage}`);
  }
  
  closeModal();
};

  const getModalConfig = () => {
    const { type, subscription } = modalConfig;
    const clientName = subscription?.clientNom || 'ce client';
    
    switch (type) {
      case 'suspend':
        return {
          title: 'Confirmer la suspension',
          message: `Êtes-vous sûr de vouloir suspendre l'abonnement de ${clientName} ?\n\nL'abonnement sera désactivé temporairement et pourra être réactivé ultérieurement.`,
          confirmText: 'Suspendre',
          cancelText: 'Annuler',
          icon: <PauseCircleIcon className="h-8 w-8 text-amber-600" />,
          confirmButtonClass: 'bg-amber-600 hover:bg-amber-700',
        };
      case 'reactivate':
        return {
          title: 'Confirmer la réactivation',
          message: `Êtes-vous sûr de vouloir réactiver l'abonnement de ${clientName} ?\n\nL'abonnement redevient actif immédiatement.`,
          confirmText: 'Réactiver',
          cancelText: 'Annuler',
          icon: <PlayCircleIcon className="h-8 w-8 text-emerald-600" />,
          confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case 'cancel':
        return {
          title: "Confirmer l'annulation",
          message: `⚠️ Attention : Êtes-vous sûr de vouloir ANNULER définitivement l'abonnement de ${clientName} ?\n\nCette action est irréversible et l'abonnement ne pourra plus être réactivé.`,
          confirmText: 'Annuler',
          cancelText: 'Retour',
          icon: <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />,
          confirmButtonClass: 'bg-red-600 hover:bg-red-700',
        };
      default:
        return null;
    }
  };

  const isActionAllowed = (subscription, action) => {
    const status = subscription?.statut;
    
    switch (action) {
      case 'SUSPENDRE':
        return status === 'ACTIF';
      case 'REACTIVER':
        return status === 'SUSPENDU';
      case 'ANNULER':
        return status === 'ACTIF' || status === 'SUSPENDU';
      default:
        return false;
    }
  };

  const getActionTooltip = (subscription, action) => {
    const status = subscription?.statut;
    
    switch (action) {
      case 'SUSPENDRE':
        if (status !== 'ACTIF') return 'Seul un abonnement actif peut être suspendu';
        return '';
      case 'REACTIVER':
        if (status !== 'SUSPENDU') return 'Seul un abonnement suspendu peut être réactivé';
        return '';
      case 'ANNULER':
        if (status !== 'ACTIF' && status !== 'SUSPENDU') return 'Seuls les abonnements actifs ou suspendus peuvent être annulés';
        return '';
      default:
        return '';
    }
  };

  // Statistiques des abonnements
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.statut === 'ACTIF').length,
    suspended: subscriptions.filter(s => s.statut === 'SUSPENDU').length,
    expired: subscriptions.filter(s => s.statut === 'EXPIRE').length,
    cancelled: subscriptions.filter(s => s.statut === 'ANNULE').length,
    pending: subscriptions.filter(s => s.statut === 'EN_ATTENTE_VALIDATION').length,
  };

  const filteredSubscriptions = subscriptionStatusFilter === 'ALL' 
    ? subscriptions 
    : subscriptions.filter(sub => sub.statut === subscriptionStatusFilter);

  const modalConfigData = getModalConfig();

  return (
    <div className="space-y-6">
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalConfigData?.title}
        message={modalConfigData?.message}
        confirmText={modalConfigData?.confirmText}
        cancelText={modalConfigData?.cancelText}
        icon={modalConfigData?.icon}
        confirmButtonClass={modalConfigData?.confirmButtonClass}
      />

      {/* Cartes statistiques - Abonnements */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-medium">Actifs</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <PlayCircleIcon className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Suspendus</p>
              <p className="text-2xl font-bold text-amber-600">{stats.suspended}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <PauseCircleIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">En attente</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Expirés/Annulés</p>
              <p className="text-2xl font-bold text-gray-500">{stats.expired + stats.cancelled}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <XCircleIcon className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Tableau */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Souscriptions clients</h2>
                <p className="text-xs text-gray-500 mt-0.5">{filteredSubscriptions.length} abonnement(s)</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statusesWithCounts.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSubscriptionStatusFilter(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
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
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Offre</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Période</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredSubscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedSubscription?.id === subscription.id 
                        ? 'bg-purple-50 border-l-4 border-l-purple-500 shadow-sm' 
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
                        <div className={`p-1.5 rounded-lg ${selectedSubscription?.id === subscription.id ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          {subscription.typeCompte === 'ENTREPRISE' ? (
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{subscription.clientNom || 'Client'}</p>
                          <p className="text-xs text-gray-500">{subscription.clientEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-gray-800">{subscription.offreNom || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{formatPrice(subscription.montant, subscription.devise)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{subscription.dureeMois} mois</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(subscription.statut)}
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getSubscriptionStatusClass(subscription.statut)}`}>
                          {getSubscriptionStatusLabel(subscription.statut)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedSubscription(subscription); }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          selectedSubscription?.id === subscription.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                        Détails
                        {selectedSubscription?.id === subscription.id && (
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSubscriptions.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <UsersIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Aucun abonnement trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Détails */}
        <aside className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-purple-50 to-white">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
              Détail abonnement
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedSubscription 
                ? `Abonnement #${selectedSubscription.id} sélectionné` 
                : 'Cliquez sur un abonnement pour voir les détails'}
            </p>
          </div>
          {selectedSubscription ? (
            <div className="p-5 space-y-4">
              {/* Badge de sélection */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-emerald-600">Abonnement sélectionné</p>
                </div>
                <button
                  onClick={() => setSelectedSubscription(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-purple-50 to-white p-4 border border-purple-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-purple-600 tracking-wider">{selectedSubscription.offreNom || 'Souscription'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="p-1.5 rounded-lg bg-white shadow-sm">
                        {selectedSubscription.typeCompte === 'ENTREPRISE' ? (
                          <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{selectedSubscription.clientNom}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedSubscription.clientEmail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getSubscriptionStatusClass(selectedSubscription.statut)}`}>
                      {getStatusIcon(selectedSubscription.statut)}
                      {getSubscriptionStatusLabel(selectedSubscription.statut)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs font-medium text-gray-500">Montant</p>
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(selectedSubscription.montant, selectedSubscription.devise)}</p>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs font-medium text-gray-500">Période</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedSubscription.dureeMois} mois</p>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs font-medium text-gray-500">Date début</p>
                  <p className="text-sm text-gray-700">{formatDate(selectedSubscription.dateDebut)}</p>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs font-medium text-gray-500">Date fin</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(selectedSubscription.dateFin)}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100">
                {/* Suspendre - visible seulement pour ACTIF */}
                {selectedSubscription.statut === 'ACTIF' && (
                  <Tooltip content={getActionTooltip(selectedSubscription, 'SUSPENDRE')}>
                    <button 
                      onClick={() => openModal('suspend', selectedSubscription)} 
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <PauseCircleIcon className="h-4 w-4" />
                      Suspendre l'abonnement
                    </button>
                  </Tooltip>
                )}

                {/* Réactiver - visible seulement pour SUSPENDU */}
                {selectedSubscription.statut === 'SUSPENDU' && (
                  <Tooltip content={getActionTooltip(selectedSubscription, 'REACTIVER')}>
                    <button 
                      onClick={() => openModal('reactivate', selectedSubscription)} 
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <PlayCircleIcon className="h-4 w-4" />
                      Réactiver l'abonnement
                    </button>
                  </Tooltip>
                )}

                {/* Annuler - visible pour ACTIF ou SUSPENDU */}
                {(selectedSubscription.statut === 'ACTIF' || selectedSubscription.statut === 'SUSPENDU') && (
                  <Tooltip content={getActionTooltip(selectedSubscription, 'ANNULER')}>
                    <button 
                      onClick={() => openModal('cancel', selectedSubscription)} 
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Annuler l'abonnement
                    </button>
                  </Tooltip>
                )}

                {/* Message pour EN_ATTENTE_VALIDATION */}
                {selectedSubscription.statut === 'EN_ATTENTE_VALIDATION' && (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-700">
                      <ClockIcon className="h-4 w-4" />
                      <span>En attente de validation admin et paiement</span>
                    </div>
                  </div>
                )}

                {/* Message pour ANNULE ou EXPIRE */}
                {(selectedSubscription.statut === 'ANNULE' || selectedSubscription.statut === 'EXPIRE') && (
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <InformationCircleIcon className="h-4 w-4" />
                      <span>Aucune action disponible pour cet abonnement</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <CheckBadgeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-base font-medium text-gray-700">Aucun abonnement sélectionné</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Cliquez sur un abonnement dans le tableau pour afficher les détails et actions disponibles
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <ChevronRightIcon className="h-3 w-3" />
                <span>Sélectionnez un abonnement pour commencer</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SubscriptionsManagement;