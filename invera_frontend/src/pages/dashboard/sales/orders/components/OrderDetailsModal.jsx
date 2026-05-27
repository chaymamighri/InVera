// src/pages/dashboard/sales/orders/components/OrderDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CubeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import clientService from '../../../../../services/clientService';

// Badge pour le type de client
const ClientTypeBadge = ({ type }) => {
  const colors = {
    'VIP': 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200',
    'FIDELE': 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
    'ENTREPRISE': 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200',
    'PROFESSIONNEL': 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200',
    'PARTICULIER': 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
  };
  
  const typeLabels = {
    'ENTREPRISE': '🏢 Entreprise',
    'PROFESSIONNEL': '💼 Professionnel',
    'PARTICULIER': '👤 Particulier',
    'VIP': '⭐ VIP',
    'FIDELE': '🔁 Fidèle'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${colors[type] || colors['PARTICULIER']}`}>
      {typeLabels[type] || type}
    </span>
  );
};

// Badge pour le statut
const StatusBadge = ({ statut, t }) => {
  const getStatusConfig = (statut) => {
    switch(statut) {
      case 'CONFIRMEE':
      case 'Confirmé':
        return {
          color: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
          icon: <CheckCircleIcon className="h-5 w-5 mr-1.5" />
        };
      case 'EN_ATTENTE':
      case 'En attente':
        return {
          color: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
          icon: <ClockIcon className="h-5 w-5 mr-1.5" />
        };
      case 'ANNULEE':
      case 'Annulée':
        return {
          color: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200',
          icon: <XCircleIcon className="h-5 w-5 mr-1.5" />
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200',
          icon: <ClockIcon className="h-5 w-5 mr-1.5" />
        };
    }
  };

  const config = getStatusConfig(statut);
  const displayStatut = statut === 'EN_ATTENTE' ? t('salesPages.pending') : 
                        statut === 'CONFIRMEE' ? t('salesPages.confirmed') : 
                        statut === 'ANNULEE' ? t('salesPages.rejected') : statut;

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      {displayStatut}
    </span>
  );
};

// Composant d'info client
const ClientInfoItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
};

// Composant pour afficher les infos client
const ClientInfoSection = ({ client, t }) => {
  const isEntreprise = client?.typeClient === 'ENTREPRISE' || client?.typeClient === 'PROFESSIONNEL';
  
  return (
    <div className="space-y-4">
      {/* Type de client */}
      {client?.typeClient && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">{t('salesPages.clientType')}</div>
          <ClientTypeBadge type={client.typeClient} />
        </div>
      )}
      
      {/* Nom / Raison sociale */}
      {isEntreprise ? (
        <>
          <ClientInfoItem 
            icon={BuildingOfficeIcon}
            label={t('salesPages.companyName')}
            value={client.raisonSociale || client.nom}
          />
          {client.matriculeFiscal && (
            <ClientInfoItem 
              icon={IdentificationIcon}
              label={t('salesPages.taxNumber')}
              value={client.matriculeFiscal}
            />
          )}
          <ClientInfoItem 
            icon={BriefcaseIcon}
            label={t('salesPages.manager')}
            value={client.prenom && client.nom ? `${client.prenom} ${client.nom}` : client.nom}
          />
        </>
      ) : (
        <ClientInfoItem 
          icon={IdentificationIcon}
          label={t('salesPages.fullName')}
          value={client.prenom && client.nom ? `${client.prenom} ${client.nom}` : client.nom}
        />
      )}
      
      {/* Coordonnées communes */}
      <ClientInfoItem 
        icon={PhoneIcon}
        label={t('salesPages.phone')}
        value={client.telephone}
      />
      
      <ClientInfoItem 
        icon={EnvelopeIcon}
        label={t('salesPages.email')}
        value={client.email}
      />
      
      <ClientInfoItem 
        icon={MapPinIcon}
        label={t('salesPages.address')}
        value={client.adresse}
      />
    </div>
  );
};

const calculerRemiseProduit = (produit) => {
  if (produit.remiseProduit > 0) {
    return {
      remiseMontant: produit.remiseProduit,
      tauxRemise: produit.tauxRemiseProduit || 0
    };
  }
  
  if (produit.categorieRemiseStandard > 0) {
    const prixUnitaire = parseFloat(produit.prixUnitaire) || parseFloat(produit.prix) || 0;
    const quantite = parseFloat(produit.quantite) || 1;
    const remiseMontant = (prixUnitaire * quantite) * (produit.categorieRemiseStandard / 100);
    
    return {
      remiseMontant: remiseMontant,
      tauxRemise: produit.categorieRemiseStandard
    };
  }
  
  return {
    remiseMontant: 0,
    tauxRemise: 0
  };
};

const OrderDetailsModal = ({
  show,
  onClose,
  commande: initialCommande,
  toNumber,
  onUpdateSuccess,
  onRefresh,
  t = (key) => key,
  locale = 'fr-FR',
  isArabic = false
}) => {
  const [commande, setCommande] = useState(initialCommande);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [clientRemise, setClientRemise] = useState(0);
  const [loadingRemise, setLoadingRemise] = useState(false);

  // Fonctions utilitaires
  const getPrixUnitaire = (produit) => {
    if (produit.prixUnitaire) return parseFloat(produit.prixUnitaire);
    if (produit.prix) return parseFloat(produit.prix);
    return 0;
  };

  const getSousTotal = (produit) => {
    if (produit.sousTotal) return parseFloat(produit.sousTotal);
    const prix = getPrixUnitaire(produit);
    const qte = parseFloat(produit.quantite) || 0;
    return prix * qte;
  };

  const getTotalLigne = (produit) => {
    if (produit.totalLigne) return parseFloat(produit.totalLigne);
    const sousTotal = getSousTotal(produit);
    const remise = parseFloat(produit.remiseProduit) || 0;
    return sousTotal - remise;
  };

  const formatMontant = (value) => `${toNumber(value).toFixed(3)} ${t('salesPages.currencyLower')}`;

  // Récupérer la remise du client
  useEffect(() => {
    const fetchClientRemise = async () => {
      if (!commande?.client?.typeClient) return;
      
      setLoadingRemise(true);
      try {
        const response = await clientService.getRemiseByType(commande.client.typeClient);
        if (response?.success) {
          setClientRemise(response.remise || 0);
        }
      } catch (error) {
        console.error('Erreur chargement remise client:', error);
      } finally {
        setLoadingRemise(false);
      }
    };
    
    fetchClientRemise();
  }, [commande?.client?.typeClient]);

  useEffect(() => {
    if (initialCommande) {
      const commandeAvecId = {
        ...initialCommande,
        id: initialCommande.id || initialCommande.idCommandeClient,
        idCommandeClient: initialCommande.idCommandeClient || initialCommande.id
      };
      setCommande(commandeAvecId);
    }
  }, [initialCommande]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    if (onUpdateSuccess) {
      onUpdateSuccess();
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!show || !commande) return null;

  const client = commande.client || {};
  const isEntreprise = client?.typeClient === 'ENTREPRISE' || client?.typeClient === 'PROFESSIONNEL';
  const hasClientInfo = client.nom || client.raisonSociale || client.telephone || client.email || client.adresse;

  // Enrichir les produits avec les remises calculées
  const produitsEnrichis = commande.produits?.map(produit => {
    const remiseCalculee = calculerRemiseProduit(produit);
    return {
      ...produit,
      remiseProduit: remiseCalculee.remiseMontant,
      tauxRemiseProduit: remiseCalculee.tauxRemise
    };
  }) || [];

  // Calcul des totaux
  const sousTotal = produitsEnrichis.reduce((sum, p) => {
    const qte = parseFloat(p.quantite) || 0;
    const prix = parseFloat(p.prixUnitaire) || parseFloat(p.prix) || 0;
    return sum + (qte * prix);
  }, 0);
  
  const remiseTotale = produitsEnrichis.reduce((sum, p) => 
    sum + (parseFloat(p.remiseProduit) || 0), 0);
  
  const totalApresRemises = sousTotal - remiseTotale;
  const remiseGlobale = clientRemise > 0 ? clientRemise : parseFloat(commande.tauxRemise || commande.remise || 0);
  const montantRemiseGlobale = totalApresRemises * (remiseGlobale / 100);
  const totalFinal = totalApresRemises - montantRemiseGlobale;
  const pourcentageRemise = toNumber(commande.sousTotal) > 0 
    ? Math.round((toNumber(commande.tauxRemise || commande.remise) / toNumber(commande.sousTotal)) * 100)
    : 0;

  const formatDate = (dateString) => {
    if (!dateString) return t('salesPages.notDefined');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">{t('salesPages.orderDetails')}</h2>
              <p className="text-blue-100 text-sm mt-1 flex items-center">
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                {t('salesPages.number')}: {commande.numero || commande.referenceCommandeClient || 'N/A'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Section 1 : Informations principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Informations commande */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <ClipboardDocumentIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{t('salesPages.orderInformation')}</h3>
                    <p className="text-sm text-gray-600">{t('salesPages.orderDetails')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('salesPages.orderNumber')}</div>
                      <div className="font-medium text-gray-900 text-lg">
                        {commande.numero || commande.referenceCommandeClient || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('salesPages.creationDate')}</div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDate(commande.dateCommande)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('salesPages.orderStatus')}</div>
                      <div className="mt-1">
                        <StatusBadge statut={commande.statut} t={t} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations client */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {isEntreprise ? (
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <UserCircleIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{t('salesPages.client')}</h3>
                  <p className="text-sm text-gray-600">{t('salesPages.clientInformation')}</p>
                </div>
              </div>
              
              {hasClientInfo ? (
                <ClientInfoSection client={client} t={t} />
              ) : (
                <div className="text-center py-4">
                  <UserCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{t('salesPages.noClientInfo')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 : Produits commandés */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-2.5">
                  <CubeIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{t('salesPages.orderedProducts')}</h3>
                  <p className="text-xs text-gray-500">{t('salesPages.itemDetails')}</p>
                </div>
              </div>
              <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                {t('salesPages.itemCount', { count: commande.produits?.length || 0 })}
              </span>
            </div>

            {/* Tableau des produits */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
              {produitsEnrichis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">{t('salesPages.product')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">{t('salesPages.quantityShort')}</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">{t('salesPages.unitPrice')}</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">{t('salesPages.subtotal')}</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">{t('salesPages.discount')}</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">{t('salesPages.total')}</th>
                      </tr>
                    </thead>
                    
                    <tbody className="divide-y divide-gray-200">
                      {produitsEnrichis.map((produit, index) => {
                        const quantite = parseFloat(produit.quantite) || 0;
                        const prixUnitaire = getPrixUnitaire(produit);
                        const sousTotalLigne = quantite * prixUnitaire;
                        const remiseLigne = parseFloat(produit.remiseProduit) || 0;
                        const tauxRemiseLigne = parseFloat(produit.tauxRemiseProduit) || 
                                               (remiseLigne > 0 ? (remiseLigne / sousTotalLigne * 100) : 0);
                        const totalLigne = sousTotalLigne - remiseLigne;

                        return (
                          <tr key={produit.id || produit.produitId || index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {produit.imageUrl && (
                                  <img 
                                    src={produit.imageUrl}
                                    alt={produit.libelle}
                                    className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900">
                                    {produit.libelle || `Produit ${produit.id || produit.produitId}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="font-medium text-gray-900">
                                {quantite}
                                {produit.uniteMesure && (
                                  <span className="text-xs text-gray-500 ml-1">{produit.uniteMesure}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">
                                {prixUnitaire.toFixed(3)} dt
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">
                                {sousTotalLigne.toFixed(3)} dt
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {remiseLigne > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-red-600 font-medium">
                                    -{remiseLigne.toFixed(3)} dt
                                  </span>
                                  {tauxRemiseLigne > 0 && (
                                    <span className="text-xs text-red-500">
                                      ({tauxRemiseLigne.toFixed(1)}%)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-bold text-green-700">
                                {totalLigne.toFixed(3)} dt
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    <tfoot className="bg-gray-50">
                      <tr className="font-medium border-t border-gray-300">
                        <td colSpan="3" className="px-4 py-3 text-right text-gray-600 text-sm">
                          {t('salesPages.subtotal')}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="text-sm font-medium">
                            {sousTotal.toFixed(3)} dt
                          </div>
                        </td>
                        <td className="px-4 py-3 text-red-600">
                          <div className="text-sm font-medium">
                            -{remiseTotale.toFixed(3)} dt
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700">
                          <div className="text-sm">
                            {totalApresRemises.toFixed(3)} dt
                          </div>
                        </td>
                      </tr>
                      
                      {remiseGlobale > 0 && (
                        <tr className="bg-green-50">
                          <td colSpan="5" className="px-4 py-2.5 text-right text-gray-900">
                            <div className="text-sm font-medium flex items-center justify-end gap-1">
                              <TagIcon className="h-3 w-3 text-green-600" />
                              {t('salesPages.globalDiscount')} ({remiseGlobale.toFixed(1)}%)
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-red-600 text-sm">
                              -{montantRemiseGlobale.toFixed(3)} dt
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      <tr className="bg-green-50 border-t border-green-200">
                        <td colSpan="5" className="px-4 py-3 text-right text-gray-900">
                          <div className="font-bold">{t('salesPages.orderTotal')}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700">
                          <div className="text-base">{totalFinal.toFixed(3)} dt</div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <CubeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('salesPages.noProduct')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3 : Récapitulatif financier */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{t('salesPages.financialSummary')}</h3>
                <p className="text-sm text-gray-600">{t('salesPages.amountAndDiscountDetails')}</p>
              </div>
            </div>
            
            <div className="max-w-md ml-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('salesPages.productsSubtotal')}</span>
                  <span className="font-medium">{sousTotal.toFixed(3)} dt</span>
                </div>
                
                {remiseTotale > 0 && (
                  <div className="flex justify-between items-center py-2 bg-white/50 rounded-lg px-3">
                    <span className="text-gray-600">{t('salesPages.productDiscounts')}</span>
                    <span className="font-semibold text-green-600">-{remiseTotale.toFixed(3)} dt</span>
                  </div>
                )}
                
                {remiseGlobale > 0 && (
                  <div className="flex justify-between items-center py-2 bg-white/50 rounded-lg px-3">
                    <span className="text-gray-600 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-green-600" />
                      {t('salesPages.discount')} ({pourcentageRemise}%)
                    </span>
                    <span className="font-semibold text-green-600">-{montantRemiseGlobale.toFixed(3)} dt</span>
                  </div>
                )}
                
                <div className="border-t border-green-200 pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">{t('salesPages.orderTotal')}</div>
                      {client.typeClient && ( 
                        <div className="text-xs text-green-600 mt-1">
                          {t('salesPages.discountAppliedForClient', { type: client.typeClient })}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {totalFinal.toFixed(3)} dt
                      </div>
                      {(remiseTotale > 0 || montantRemiseGlobale > 0) && (
                        <div className="text-xs text-green-500 mt-1">
                          {t('salesPages.savings')}: {(remiseTotale + montantRemiseGlobale).toFixed(3)} dt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 : Remarques */}
          {commande.remarques && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-100 mb-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800">{t('salesPages.remarks')}</h3>
              </div>
              <div className="text-sm text-gray-700 bg-white/70 p-3 rounded-lg border border-yellow-200">
                {commande.remarques}
              </div>
            </div>
          )}

          {/* Section 5 : Actions */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-3">
           { /*  {commande.statut === 'EN_ATTENTE' && (
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg hover:from-amber-700 hover:to-yellow-700 text-sm font-medium transition-colors flex items-center gap-2"
                  title={t('salesPages.editOrder')}
                >
                  <PencilIcon className="h-4 w-4" />
                  {t('salesPages.edit')}
                </button>
              )}*/}

              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                {t('salesPages.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;