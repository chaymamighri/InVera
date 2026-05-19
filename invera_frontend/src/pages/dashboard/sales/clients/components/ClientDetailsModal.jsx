import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { commandeService } from '../../../../../services/commandeService';
import clientService from '../../../../../services/clientService';

const localeByDir = (isArabic) => (isArabic ? 'ar-TN' : 'fr-FR');

const ClientDetailsModal = ({ open, onClose, client, t, isArabic }) => {
  const [clientOrders, setClientOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientRemise, setClientRemise] = useState(0);
  const [loadingRemise, setLoadingRemise] = useState(false);
  const locale = localeByDir(isArabic);

  useEffect(() => {
    if (client && open) {
      loadClientOrders();
      loadClientRemise();
    }
  }, [client, open]);

  const loadClientRemise = async () => {
    if (!client?.typeClient) return;

    setLoadingRemise(true);
    try {
      const response = await clientService.getRemiseByType(client.typeClient);
      if (response?.success) setClientRemise(response.remise || 0);
    } catch (error) {
      console.error('Erreur chargement remise:', error);
    } finally {
      setLoadingRemise(false);
    }
  };

  const loadClientOrders = async () => {
    const clientId = client?.idClient || client?.id;
    if (!clientId) return;

    setLoading(true);
    try {
      const response = await commandeService.getCommandesByClientId(clientId);
      setClientOrders(response.commandes || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error(t('salesPages.ordersLoadError'));
      setClientOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('salesPages.dateNotProvided');
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatMontant = (montant) => {
    if (montant === undefined || montant === null) return `0,000 ${t('salesPages.currency')}`;
    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(montant)} ${t('salesPages.currency')}`;
  };

  const getTypeClientLabel = (type) => {
    const labels = {
      PARTICULIER: t('salesPages.individual'),
      VIP: t('salesPages.vip'),
      PROFESSIONNEL: t('salesPages.company'),
      ENTREPRISE: t('salesPages.company'),
      FIDELE: t('salesPages.loyalCustomer'),
    };
    return labels[type] || type;
  };

  const getStatusBadge = (statut) => {
    const statusLower = statut?.toLowerCase() || '';
    if (statusLower.includes('valid') || statusLower === 'confirme' || statut === 'CONFIRMEE') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{t('salesPages.validated')}</span>;
    }
    if (statusLower.includes('refus') || statusLower === 'refuse' || statut === 'ANNULEE') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{t('salesPages.refused')}</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{t('salesPages.pending')}</span>;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">{t('salesPages.clientDetails')}</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {client && (
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('salesPages.personalInformation')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label={t('salesPages.fullName')} value={`${client.prenom || ''} ${client.nom || ''}`.trim()} />
                  <Info label={t('salesPages.email')} value={client.email || t('salesPages.notProvided')} />
                  <Info label={t('salesPages.phone')} value={client.telephone || t('salesPages.notProvided')} />
                  <Info label={t('salesPages.address')} value={client.adresse || t('salesPages.notProvidedFeminine')} />
                  <div>
                    <p className="text-sm text-gray-500">{t('salesPages.clientType')}</p>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {getTypeClientLabel(client.typeClient)}
                    </span>
                  </div>
                  <Info label={t('salesPages.remise')} value={loadingRemise ? '...' : `${clientRemise}%`} valueClass="font-semibold text-blue-600" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('salesPages.ordersCount', { count: clientOrders.length })}
                </h3>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                    <p className="text-gray-500 mt-2">{t('salesPages.loadingOrders')}</p>
                  </div>
                ) : clientOrders.length > 0 ? (
                  <div className="space-y-3">
                    {clientOrders.map((order) => (
                      <div key={order.idCommandeClient || order.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-900">
                                {order.referenceCommandeClient || `CMD-${order.idCommandeClient}`}
                              </span>
                              {getStatusBadge(order.statut)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>{formatDate(order.dateCommande)}</div>
                              <div>{t('salesPages.productsCount', { count: order.lignesCommande?.length || 0 })}</div>
                            </div>
                          </div>
                          <div className={isArabic ? 'text-left' : 'text-right'}>
                            <p className="text-sm text-gray-500">{t('salesPages.total')}</p>
                            <p className="text-xl font-bold text-blue-600">{formatMontant(order.total || order.sousTotal)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-500">{t('salesPages.noOrdersForClient')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, valueClass = 'text-gray-900' }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-base ${valueClass}`}>{value}</p>
  </div>
);

export default ClientDetailsModal;
