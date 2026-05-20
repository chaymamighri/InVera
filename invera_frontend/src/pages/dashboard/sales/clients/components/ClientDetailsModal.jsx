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
  const [stats, setStats] = useState({
    totalCommandes: 0,
    totalDepenses: 0,
    commandesEnAttente: 0,
    commandesValidees: 0,
    commandesAnnulees: 0
  });

  const locale = localeByDir(isArabic);
  const isEntreprise = client?.typeClient === 'ENTREPRISE';

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
      if (response?.success) {
        setClientRemise(response.remise || 0);
      }
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
      const orders = response.commandes || [];
      setClientOrders(orders);
      
      // Calculer les statistiques
      const totalDepenses = orders.reduce((sum, order) => sum + (order.total || order.sousTotal || 0), 0);
      const commandesEnAttente = orders.filter(o => o.statut === 'EN_ATTENTE').length;
      const commandesValidees = orders.filter(o => o.statut === 'CONFIRMEE').length;
      const commandesAnnulees = orders.filter(o => o.statut === 'ANNULEE').length;
      
      setStats({
        totalCommandes: orders.length,
        totalDepenses,
        commandesEnAttente,
        commandesValidees,
        commandesAnnulees
      });
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error(t('salesPages.ordersLoadError') || 'Erreur lors du chargement des commandes');
      setClientOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('salesPages.dateNotProvided') || 'Non renseignée';
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
    if (montant === undefined || montant === null) return `0,000 ${t('salesPages.currency') || 'TND'}`;
    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(montant)} ${t('salesPages.currency') || 'TND'}`;
  };

  const getTypeClientLabel = (type) => {
    const labels = {
      PARTICULIER: t('salesPages.individual') || 'Particulier',
      VIP: t('salesPages.vip') || 'VIP',
      PROFESSIONNEL: t('salesPages.company') || 'Professionnel',
      ENTREPRISE: t('salesPages.company') || 'Entreprise',
      FIDELE: t('salesPages.loyalCustomer') || 'Fidèle',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (statut) => {
    const statusLower = statut?.toLowerCase() || '';
    if (statusLower.includes('valid') || statusLower === 'confirme' || statut === 'CONFIRMEE') {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{t('salesPages.validated') || 'Confirmée'}</span>;
    }
    if (statusLower.includes('refus') || statusLower === 'refuse' || statut === 'ANNULEE') {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{t('salesPages.refused') || 'Annulée'}</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{t('salesPages.pending') || 'En attente'}</span>;
  };

  const getTypeBadge = (type) => {
    const types = {
      'PARTICULIER': { label: t('salesPages.individual') || 'Particulier', color: 'bg-gray-100 text-gray-700' },
      'ENTREPRISE': { label: '🏢 ' + (t('salesPages.company') || 'Entreprise'), color: 'bg-indigo-100 text-indigo-700' },
      'PROFESSIONNEL': { label: '💼 ' + (t('salesPages.company') || 'Professionnel'), color: 'bg-blue-100 text-blue-700' },
      'VIP': { label: '⭐ ' + (t('salesPages.vip') || 'VIP'), color: 'bg-purple-100 text-purple-700' },
      'FIDELE': { label: '🔁 ' + (t('salesPages.loyalCustomer') || 'Fidèle'), color: 'bg-teal-100 text-teal-700' }
    };
    const config = types[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>{config.label}</span>;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                {isEntreprise ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEntreprise ? client?.raisonSociale || client?.nom : `${client?.prenom || ''} ${client?.nom || ''}`.trim()}
                </h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {isEntreprise ? (t('salesPages.companyDetails') || 'Détails de l\'entreprise') : (t('salesPages.clientDetails') || 'Détails du client')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {client && (
            <div className="p-6 space-y-6">
              {/* Informations client */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">{t('salesPages.generalInformation') || 'Informations générales'}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Colonne gauche */}
                  <div className="space-y-4">
                    {/* Type de client */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('salesPages.clientType') || 'Type de client'}</p>
                      <div>{getTypeBadge(client.typeClient)}</div>
                    </div>

                    {/* Remise */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('salesPages.clientDiscount') || 'Remise client'}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-green-700">
                          {loadingRemise ? '...' : `${clientRemise}%`}
                        </span>
                        {clientRemise > 0 && (
                          <span className="text-xs text-green-600">{t('salesPages.discountApplied') || 'de réduction'}</span>
                        )}
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {t('salesPages.discountAutoApplied') || 'Appliquée automatiquement sur les commandes'}
                      </p>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('salesPages.contact') || 'Contact'}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{client.telephone || t('salesPages.notProvided') || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{client.email || t('salesPages.notProvided') || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="flex-1">{client.adresse || t('salesPages.notProvidedFeminine') || 'Non renseignée'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="space-y-4">
                    {/* Identité */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('salesPages.identity') || 'Identité'}</p>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        {isEntreprise ? (
                          <>
                            <div>
                              <p className="text-xs text-gray-400">{t('salesPages.companyName') || 'Raison sociale'}</p>
                              <p className="font-medium text-gray-900">{client.raisonSociale || t('salesPages.notProvided') || 'Non renseignée'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{t('salesPages.taxNumber') || 'Matricule fiscal'}</p>
                              <p className="font-mono text-sm text-gray-800">{client.matriculeFiscale || client.matriculeFiscal || t('salesPages.notProvided') || 'Non renseigné'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{t('salesPages.manager') || 'Gérant'}</p>
                              <p className="font-medium text-gray-900">{client.prenom || ''} {client.nom || ''}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs text-gray-400">{t('salesPages.fullName') || 'Nom complet'}</p>
                              <p className="font-medium text-gray-900">{client.prenom || ''} {client.nom || ''}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                        <p className="text-xs text-blue-600 uppercase tracking-wide">{t('salesPages.totalOrders') || 'Commandes'}</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.totalCommandes}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                        <p className="text-xs text-green-600 uppercase tracking-wide">{t('salesPages.totalSpent') || 'Dépenses'}</p>
                        <p className="text-sm font-bold text-green-700">{formatMontant(stats.totalDepenses)}</p>
                      </div>
                    </div>

                    {/* Dernière activité */}
                    {clientOrders.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">{t('salesPages.lastOrder') || 'Dernière commande'}</p>
                        <p className="text-sm font-medium text-purple-800">
                          {formatDate(clientOrders[0]?.dateCommande)}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          {formatMontant(clientOrders[0]?.total || clientOrders[0]?.sousTotal)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Liste des commandes */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">{t('salesPages.orderHistory') || 'Historique des commandes'}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{stats.totalCommandes} {t('salesPages.orders') || 'commande(s)'}</span>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                    <p className="text-gray-500 mt-2">{t('salesPages.loadingOrders') || 'Chargement des commandes...'}</p>
                  </div>
                ) : clientOrders.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {clientOrders.map((order, index) => (
                      <div 
                        key={order.idCommandeClient || order.id || index} 
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-blue-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {order.referenceCommandeClient || `CMD-${order.idCommandeClient}`}
                              </span>
                              {getStatusBadge(order.statut)}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(order.dateCommande)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span>{order.lignesCommande?.length || 0} {t('salesPages.products') || 'produit(s)'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right md:text-right">
                            <p className="text-xs text-gray-500">{t('salesPages.totalAmount') || 'Montant total'}</p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatMontant(order.total || order.sousTotal)}
                            </p>
                            {order.tauxRemise > 0 && (
                              <p className="text-xs text-green-600">{t('salesPages.discount') || 'Remise'} {order.tauxRemise}%</p>
                            )}
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
                    <p className="text-gray-500">{t('salesPages.noOrdersForClient') || 'Aucune commande pour ce client'}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('salesPages.ordersWillAppear') || 'Les commandes apparaîtront ici après création'}</p>
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

export default ClientDetailsModal;