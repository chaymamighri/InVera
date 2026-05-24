import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { TagIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../context/LanguageContext';
import { subscriptionPlatformService } from '../../../servicesPlatform/subscriptionPlatformService';
import OffersManagement from './components/OffersManagement';
import SubscriptionsManagement from './components/SubscriptionsManagement';

const SubscriptionsManagementPage = () => {
  const { t } = useLanguage();
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

      const offersArray = Array.isArray(offersData)
        ? offersData
        : offersData?.data || offersData?.offres || [];
      const subscriptionsArray = Array.isArray(subscriptionsData)
        ? subscriptionsData
        : subscriptionsData?.data || subscriptionsData?.subscriptions || [];

      setOffers(offersArray);
      setSubscriptions(subscriptionsArray);
    } catch {
      toast.error(t('dashboard.loadingError') || 'Impossible de charger les données.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const runAction = async (key, callback, successMessage) => {
    setActionLoading(key);
    try {
      await callback();
      toast.success(successMessage);
      await loadData({ silent: true });
    } catch {
      toast.error(t('dashboard.actionError') || "L'action n'a pas pu être exécutée.");
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">
              {t('adminLogin.superAdmin')}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {t('dashboard.superAdminSubscriptions')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard.superAdminSubscriptionsDescription')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 rounded-t-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === 'offers'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
          }`}
        >
          <TagIcon className="h-4 w-4" />
          {t('dashboard.superAdminSubscriptionsOffersTab')}
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 rounded-t-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === 'subscriptions'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          {t('dashboard.superAdminSubscriptionsListTab')}
        </button>
      </div>

      {activeTab === 'offers' && (
        <OffersManagement
          offers={offers}
          onRefresh={loadData}
          actionLoading={actionLoading}
          runAction={runAction}
        />
      )}
      {activeTab === 'subscriptions' && (
        <SubscriptionsManagement
          subscriptions={subscriptions}
          onRefresh={loadData}
          runAction={runAction}
        />
      )}
    </div>
  );
};

export default SubscriptionsManagementPage;
