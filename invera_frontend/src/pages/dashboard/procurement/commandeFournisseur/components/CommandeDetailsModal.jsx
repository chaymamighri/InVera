// components/CommandeDetailsModal.jsx
import React, { useEffect, useMemo } from 'react';
import {
  BuildingStorefrontIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  FACTUREE: 'FACTUREE',
  ANNULEE: 'ANNULEE',
};

const STATUTS_RECUS = [StatutCommande.RECUE, StatutCommande.FACTUREE];

const getLocale = (language) => (language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR');

const formatDate = (dateString, language) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatPrice = (price, language) => {
  if (price === null || price === undefined) return 'N/A';

  const amount = Number(price);
  if (!Number.isFinite(amount)) return 'N/A';

  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
};

const getStatusBadge = (statut) => {
  const colors = {
    [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800 border-gray-300',
    [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800 border-blue-300',
    [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [StatutCommande.RECUE]: 'bg-green-100 text-green-800 border-green-300',
    [StatutCommande.FACTUREE]: 'bg-purple-100 text-purple-800 border-purple-300',
    [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span
      className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
        colors[statut] || colors[StatutCommande.BROUILLON]
      }`}
    >
      {statut}
    </span>
  );
};

const useCommandeCalculs = (commande) => {
  const estRecue = useMemo(() => STATUTS_RECUS.includes(commande?.statut), [commande?.statut]);

  const ligneAvecTotaux = useMemo(() => {
    if (!commande?.lignesCommande) return [];

    return commande.lignesCommande.map((ligne) => {
      const quantite = estRecue ? ligne.quantiteRecue || 0 : ligne.quantite || 0;
      const prixUnitaire = ligne.prixUnitaire || 0;
      const tauxTVA = ligne.tauxTVA || 19;
      const sousTotalHT = quantite * prixUnitaire;
      const montantTVA = (sousTotalHT * tauxTVA) / 100;
      const sousTotalTTC = sousTotalHT + montantTVA;

      return {
        ...ligne,
        quantiteUtilisee: quantite,
        sousTotalHT,
        montantTVA,
        sousTotalTTC,
      };
    });
  }, [commande, estRecue]);

  const totaux = useMemo(() => {
    if (!ligneAvecTotaux.length) return { totalHT: 0, totalTVA: 0, totalTTC: 0 };

    return ligneAvecTotaux.reduce(
      (acc, ligne) => ({
        totalHT: acc.totalHT + ligne.sousTotalHT,
        totalTVA: acc.totalTVA + ligne.montantTVA,
        totalTTC: acc.totalTTC + ligne.sousTotalTTC,
      }),
      { totalHT: 0, totalTVA: 0, totalTTC: 0 }
    );
  }, [ligneAvecTotaux]);

  return { estRecue, ligneAvecTotaux, totaux };
};

const CommandeDetailsModal = ({ isOpen, onClose, commande }) => {
  const { t, language, isArabic } = useLanguage();
  const { estRecue, ligneAvecTotaux, totaux } = useCommandeCalculs(commande);

  useEffect(() => {
    if (commande) {
      console.log('Commande recue dans modal:', commande);
    }
  }, [commande]);

  if (!isOpen || !commande) return null;

  const getReceptionStatus = (ligne) => {
    const quantiteRecue = ligne.quantiteRecue || 0;
    const quantiteCommandee = ligne.quantite || 0;

    if (quantiteRecue === 0) {
      return {
        type: 'none',
        text: t('dashboard.procurementOrdersComponents.notReceived'),
        color: 'red',
      };
    }
    if (quantiteRecue === quantiteCommandee) {
      return {
        type: 'full',
        text: t('dashboard.procurementOrdersComponents.fullyReceived'),
        color: 'green',
      };
    }
    return {
      type: 'partial',
      text: t('dashboard.procurementOrdersComponents.partiallyReceived', {
        received: quantiteRecue,
        ordered: quantiteCommandee,
      }),
      color: 'orange',
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        <div className="relative inline-block w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                  <TagIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">
                      {t('dashboard.procurementOrdersComponents.orderDetailsTitle', {
                        number: commande.numeroCommande || 'N/A',
                      })}
                    </h3>
                    {getStatusBadge(commande.statut)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-3 text-white transition-colors hover:bg-white/20"
                title={t('dashboard.procurementOrdersComponents.close')}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(85vh-200px)] overflow-y-auto bg-gray-50 px-8 py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <InfoCard
                  icon={CalendarIcon}
                  label={t('dashboard.procurementOrdersComponents.orderDate')}
                  value={formatDate(commande.dateCommande, language)}
                />
                <InfoCard
                  icon={TruckIcon}
                  label={t('dashboard.procurementOrdersComponents.plannedDelivery')}
                  value={formatDate(commande.dateLivraisonPrevue, language)}
                />
                {commande.dateLivraisonReelle && (
                  <InfoCard
                    icon={TruckIcon}
                    label={t('dashboard.procurementOrdersComponents.realDelivery')}
                    value={formatDate(commande.dateLivraisonReelle, language)}
                    highlight
                  />
                )}
                <InfoCard
                  icon={MapPinIcon}
                  label={t('dashboard.procurementOrdersComponents.deliveryAddress')}
                  value={commande.adresseLivraison || t('dashboard.procurementOrdersComponents.notSpecified')}
                />
              </div>

              <FournisseurCard fournisseur={commande.fournisseur} t={t} />

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                  <h4 className="font-semibold text-gray-900">{t('dashboard.procurementOrdersComponents.itemDetails')}</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">
                          {t('dashboard.procurementOrdersComponents.product')}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">
                          {t('dashboard.procurementOrdersComponents.orderedQty')}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">
                          {t('dashboard.procurementOrdersComponents.receivedQty')}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">
                          {t('dashboard.procurementOrdersComponents.unitPrice')}
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500">TVA</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">
                          {t('dashboard.procurementOrdersComponents.totalHT')}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">
                          {t('dashboard.procurementOrdersComponents.totalTTC')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {ligneAvecTotaux.map((ligne, idx) => {
                        const quantiteRecue = ligne.quantiteRecue || 0;
                        const receptionStatus = getReceptionStatus(ligne);
                        const colorMap = { green: 'text-green-600', orange: 'text-orange-600', red: 'text-red-600' };
                        const badgeColorMap = {
                          green: 'bg-green-100 text-green-800',
                          orange: 'bg-orange-100 text-orange-800',
                          red: 'bg-red-100 text-red-800',
                        };

                        return (
                          <tr key={ligne.idLigneCommandeFournisseur || idx} className="transition-colors hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {ligne.produitLibelle || t('dashboard.procurementOrdersComponents.productWithoutName')}
                              </div>
                              {ligne.produitReference && (
                                <div className="text-sm text-gray-500">
                                  {t('dashboard.procurementOrdersComponents.reference', { reference: ligne.produitReference })}
                                </div>
                              )}
                              {estRecue && (
                                <span
                                  className={`mt-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                                    badgeColorMap[receptionStatus.color]
                                  }`}
                                >
                                  {receptionStatus.text}
                                </span>
                              )}
                              {!estRecue && commande.statut === StatutCommande.ENVOYEE && (
                                <span className="mt-1 inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                  {t('dashboard.procurementOrdersComponents.inDelivery')}
                                </span>
                              )}
                              {!estRecue && commande.statut === StatutCommande.VALIDEE && (
                                <span className="mt-1 inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                  {t('dashboard.procurementOrdersComponents.waitingReception')}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">{ligne.quantite}</td>
                            <td className="px-6 py-4 text-right">
                              {estRecue ? (
                                <div>
                                  <span className={`font-semibold ${colorMap[receptionStatus.color]}`}>{quantiteRecue}</span>
                                  {receptionStatus.type === 'partial' && (
                                    <div className="mt-0.5 text-xs text-orange-500">
                                      {t('dashboard.procurementOrdersComponents.missing', {
                                        count: (ligne.quantite || 0) - quantiteRecue,
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm italic text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">{formatPrice(ligne.prixUnitaire, language)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                {ligne.tauxTVA || 19}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">{formatPrice(ligne.sousTotalHT, language)}</td>
                            <td className="px-6 py-4 text-right font-semibold text-blue-600">
                              {formatPrice(ligne.sousTotalTTC, language)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-96 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold text-gray-700">
                    {t('dashboard.procurementOrdersComponents.amountSummary')}
                  </h4>
                  <div className="space-y-3">
                    <TotalRow label={t('dashboard.procurementOrdersComponents.totalHT')} value={formatPrice(totaux.totalHT, language)} />
                    <TotalRow label={t('dashboard.procurementOrdersComponents.totalVAT')} value={formatPrice(totaux.totalTVA, language)} />
                    <TotalRow
                      label={t('dashboard.procurementOrdersComponents.totalTTC')}
                      value={formatPrice(totaux.totalTTC, language)}
                      isBold
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-100 px-8 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              {t('dashboard.procurementOrdersComponents.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value, highlight }) => (
  <div className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${highlight ? 'text-green-600' : 'text-blue-600'}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-semibold ${highlight ? 'text-green-700' : ''}`}>{value}</p>
      </div>
    </div>
  </div>
);

const FournisseurCard = ({ fournisseur, t }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
      <div className="flex items-center gap-2">
        <BuildingStorefrontIcon className="h-5 w-5 text-gray-600" />
        <h4 className="font-semibold text-gray-900">{t('dashboard.procurementOrdersComponents.supplierInfo')}</h4>
      </div>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-gray-500">{t('dashboard.procurementOrdersComponents.name')}</p>
          <p className="text-base font-semibold text-gray-900">{fournisseur?.nomFournisseur || fournisseur?.nom || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-gray-500">{t('dashboard.procurementOrdersComponents.email')}</p>
          {fournisseur?.email ? (
            <a href={`mailto:${fournisseur.email}`} className="text-base font-medium text-blue-600 hover:text-blue-800">
              {fournisseur.email}
            </a>
          ) : (
            <p className="text-base font-medium text-gray-900">N/A</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-gray-500">{t('dashboard.procurementOrdersComponents.phone')}</p>
          {fournisseur?.telephone ? (
            <a href={`tel:${fournisseur.telephone}`} className="text-base font-medium text-gray-900">
              {fournisseur.telephone}
            </a>
          ) : (
            <p className="text-base font-medium text-gray-900">N/A</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const TotalRow = ({ label, value, isBold }) => (
  <div className={`flex items-center justify-between ${isBold ? 'mt-3 border-t border-gray-200 pt-3' : 'text-sm'}`}>
    <span className={isBold ? 'text-base font-semibold text-gray-900' : 'text-gray-600'}>{label}</span>
    <span className={isBold ? 'text-xl font-bold text-blue-600' : 'font-medium text-gray-900'}>{value}</span>
  </div>
);

export default CommandeDetailsModal;
