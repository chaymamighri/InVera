// SubscriptionsManagementPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon, TagIcon, UsersIcon } from '@heroicons/react/24/outline';
import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';
import { subscriptionPlatformService } from '../../../servicesPlatform/subscriptionPlatformService';
import OffersManagement from './components/OffersManagement';
import SubscriptionsManagement from './components/SubscriptionsManagement';

const SubscriptionsManagementPage = () => {
  const [activeTab, setActiveTab] = useState('offers');
  const [offers, setOffers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const loadData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [offersData, subscriptionsData] = await Promise.all([
        subscriptionPlatformService.getOffers(false),
        subscriptionPlatformService.getSubscriptions(),
      ]);

      const offersArray = Array.isArray(offersData) ? offersData : (offersData?.data || offersData?.offres || []);
      const subscriptionsArray = Array.isArray(subscriptionsData) ? subscriptionsData : (subscriptionsData?.data || subscriptionsData?.subscriptions || []);

      setOffers(offersArray);
      setSubscriptions(subscriptionsArray);
    } catch (error) {
      toast.error('Impossible de charger les données.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const runAction = async (key, callback, successMessage) => {
    setActionLoading(key);
    try {
      await callback();
      toast.success(successMessage);
      await loadData({ silent: true });
    } catch (error) {
      toast.error("L'action n'a pas pu être exécutée.");
    } finally {
      setActionLoading('');
    }
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">Super Admin</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Gestion des offres et abonnements</h1>
            <p className="mt-1 text-sm text-gray-500">Gérez votre catalogue d'offres et suivez l'état des abonnements clients.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'offers'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
          }`}
        >
          <TagIcon className="h-4 w-4" />
          Gestion des offres
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          Gestion des abonnements
        </button>
      </div>

      {/* Contenu */}
      {activeTab === 'offers' && (
        <OffersManagement offers={offers} onRefresh={loadData} actionLoading={actionLoading} runAction={runAction} />
      )}
      {activeTab === 'subscriptions' && (
        <SubscriptionsManagement subscriptions={subscriptions} onRefresh={loadData} runAction={runAction} />
      )}
    </div>
  );
};

export default SubscriptionsManagementPage;