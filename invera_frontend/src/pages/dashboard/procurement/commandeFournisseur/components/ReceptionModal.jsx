// ReceptionModal.jsx
import React, { useEffect, useState } from 'react';
import { CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const getLocale = (language) => (language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR');

const formatPrice = (price, language) => {
  const amount = Number(price);

  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'TND',
  }).format(Number.isFinite(amount) ? amount : 0);
};

const ReceptionModal = ({ isOpen, onClose, commande, onConfirm }) => {
  const { t, language, isArabic } = useLanguage();
  const lignesCommande = Array.isArray(commande?.lignesCommande) ? commande.lignesCommande : [];
  const [quantitesRecues, setQuantitesRecues] = useState({});
  const [notes, setNotes] = useState('');
  const [numeroBL, setNumeroBL] = useState('');
  const [produitsAReactiver, setProduitsAReactiver] = useState({});
  const [errors, setErrors] = useState({
    numeroBL: '',
    quantiteZero: '',
    quantitesDepassees: {},
  });

  useEffect(() => {
    if (lignesCommande.length) {
      const initialQuantites = {};
      const initialReactiver = {};

      lignesCommande.forEach((ligne) => {
        const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
        initialQuantites[ligneId] = ligne.quantite;

        if (ligne.estInactif) {
          initialReactiver[ligneId] = true;
        }
      });

      setQuantitesRecues(initialQuantites);
      setProduitsAReactiver(initialReactiver);
      setNotes('');
      setNumeroBL('');
      setErrors({
        numeroBL: '',
        quantiteZero: '',
        quantitesDepassees: {},
      });
    } else {
      setQuantitesRecues({});
      setProduitsAReactiver({});
      setNotes('');
      setNumeroBL('');
      setErrors({
        numeroBL: '',
        quantiteZero: '',
        quantitesDepassees: {},
      });
    }
  }, [commande]);

  if (!isOpen || !commande) return null;

  const quantityTooHighMessage = (quantity) =>
    t('dashboard.procurementOrdersComponents.quantityTooHigh', { quantity });

  const handleQuantityChange = (ligneId, value) => {
    const quantite = parseInt(value) || 0;
    const ligne = lignesCommande.find((item) => (item.idLigneCommandeFournisseur || item.id) === ligneId);
    if (!ligne) return;

    if (quantite > ligne.quantite) {
      setErrors((prev) => ({
        ...prev,
        quantitesDepassees: {
          ...prev.quantitesDepassees,
          [ligneId]: quantityTooHighMessage(ligne.quantite),
        },
      }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      quantitesDepassees: {
        ...prev.quantitesDepassees,
        [ligneId]: '',
      },
    }));

    const nextQuantites = {
      ...quantitesRecues,
      [ligneId]: quantite,
    };

    setQuantitesRecues(nextQuantites);
    setErrors((prev) => ({
      ...prev,
      quantiteZero: Object.values(nextQuantites).some((q) => q > 0)
        ? ''
        : t('dashboard.procurementOrdersComponents.atLeastOneReceived'),
    }));
  };

  const handleNumeroBLChange = (value) => {
    setNumeroBL(value);
    setErrors((prev) => ({
      ...prev,
      numeroBL: value.trim() ? '' : t('dashboard.procurementOrdersComponents.deliveryNoteRequired'),
    }));
  };

  const calculerTotauxRecus = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    lignesCommande.forEach((ligne) => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      const prixUnitaire = ligne.prixUnitaire || 0;
      const tauxTVA = ligne.tauxTVA || 20;
      const sousTotalHT = qteRecue * prixUnitaire;
      const montantTVA = (sousTotalHT * tauxTVA) / 100;
      const sousTotalTTC = sousTotalHT + montantTVA;

      totalHT += sousTotalHT;
      totalTVA += montantTVA;
      totalTTC += sousTotalTTC;
    });

    return { totalHT, totalTVA, totalTTC };
  };

  const aAuMoinsUnProduitRecu = Object.values(quantitesRecues).some((q) => q > 0);

  const handleSubmit = () => {
    let hasError = false;
    const newErrors = {
      numeroBL: '',
      quantiteZero: '',
      quantitesDepassees: {},
    };

    if (!numeroBL.trim()) {
      newErrors.numeroBL = t('dashboard.procurementOrdersComponents.deliveryNoteRequired');
      hasError = true;
    }

    if (!aAuMoinsUnProduitRecu) {
      newErrors.quantiteZero = t('dashboard.procurementOrdersComponents.atLeastOneReceived');
      hasError = true;
    }

    lignesCommande.forEach((ligne) => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      if (qteRecue > ligne.quantite) {
        newErrors.quantitesDepassees[ligneId] = quantityTooHighMessage(ligne.quantite);
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const produitsAReactiverMap = {};
    lignesCommande.forEach((ligne) => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      if (ligne.estInactif && qteRecue > 0 && produitsAReactiver[ligneId]) {
        produitsAReactiverMap[ligneId] = true;
      }
    });

    onConfirm({
      quantitesRecues,
      numeroBL,
      notes: notes.trim() || null,
      dateReception: new Date().toISOString(),
      produitsAReactiver: produitsAReactiverMap,
    });
  };

  const totauxRecus = calculerTotauxRecus();
  const toutesRecues = lignesCommande.every((ligne) => {
    const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
    return quantitesRecues[ligneId] === ligne.quantite;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-gradient-to-r from-green-600 to-green-700 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CheckIcon className="h-5 w-5" />
              {t('dashboard.procurementOrdersComponents.receiveTitle', {
                number: commande.numeroCommande,
              })}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200" title={t('dashboard.procurementOrdersComponents.close')}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-medium text-gray-700">{t('dashboard.procurementOrdersComponents.supplier')}</h4>
              <p className="font-medium">{commande.fournisseur?.nomFournisseur}</p>
              <p className="text-sm text-gray-600">{commande.fournisseur?.email}</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboard.procurementOrdersComponents.deliveryNoteNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroBL}
                onChange={(e) => handleNumeroBLChange(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-green-500 ${
                  errors.numeroBL ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder={t('dashboard.procurementOrdersComponents.deliveryNotePlaceholder')}
                required
              />
              {errors.numeroBL && (
                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.numeroBL}
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.product')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.ordered')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.unitPrice')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.received')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.difference')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.status')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                      {t('dashboard.procurementOrdersComponents.activate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lignesCommande.map((ligne) => {
                    const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
                    const qteRecue = quantitesRecues[ligneId] || 0;
                    const ecart = ligne.quantite - qteRecue;
                    const estActif = !ligne.estInactif;
                    const statutCouleur = estActif ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
                    const statutTexte = estActif
                      ? t('dashboard.procurementOrdersComponents.active')
                      : t('dashboard.procurementOrdersComponents.inactive');
                    const estInactifEtRecu = ligne.estInactif && qteRecue > 0;
                    const hasError = errors.quantitesDepassees[ligneId];

                    return (
                      <tr key={ligneId} className={`hover:bg-gray-50 ${estInactifEtRecu ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{ligne.produitLibelle}</div>
                          <div className="text-xs text-gray-500">
                            {t('dashboard.procurementOrdersComponents.reference', { reference: ligne.produitReference })}
                          </div>
                          {ligne.categorie && <div className="text-xs text-gray-400">{ligne.categorie}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{ligne.quantite}</td>
                        <td className="px-4 py-3 text-right">{formatPrice(ligne.prixUnitaire, language)}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={ligne.quantite}
                            value={qteRecue}
                            onChange={(e) => handleQuantityChange(ligneId, e.target.value)}
                            className={`w-20 rounded-lg border px-2 py-1 text-center focus:ring-2 focus:ring-green-500 ${
                              qteRecue === 0 ? 'border-red-300 bg-red-50' : ''
                            } ${hasError ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          {hasError && <p className="mt-1 text-xs text-red-600">{hasError}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {ecart !== 0 && (
                            <span className={ecart > 0 ? 'text-orange-600' : 'text-blue-600'}>
                              {ecart > 0 ? `-${ecart}` : `+${Math.abs(ecart)}`}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statutCouleur}`}>{statutTexte}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {estInactifEtRecu && (
                            <label className="inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={produitsAReactiver[ligneId] || false}
                                onChange={(e) =>
                                  setProduitsAReactiver((prev) => ({
                                    ...prev,
                                    [ligneId]: e.target.checked,
                                  }))
                                }
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="mx-1 text-xs text-gray-500">
                                {produitsAReactiver[ligneId]
                                  ? t('dashboard.procurementOrdersComponents.yes')
                                  : t('dashboard.procurementOrdersComponents.no')}
                              </span>
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!lignesCommande.length && (
                <div className="flex items-center gap-2 border-t bg-orange-50 p-4 text-sm text-orange-700">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>Aucune ligne de commande disponible pour la reception. Rechargez la commande puis reessayez.</span>
                </div>
              )}
            </div>

            {errors.quantiteZero && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600">{errors.quantiteZero}</p>
              </div>
            )}

            <div className="rounded-lg bg-gray-50 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboard.procurementOrdersComponents.receptionNotes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-green-500"
                placeholder={t('dashboard.procurementOrdersComponents.receptionNotesPlaceholder')}
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700">{t('dashboard.procurementOrdersComponents.receptionSummary')}</h4>
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <TotalLine
                    label={t('dashboard.procurementOrdersComponents.totalReceivedHT')}
                    value={formatPrice(totauxRecus.totalHT, language)}
                  />
                  <TotalLine label={t('dashboard.procurementOrdersComponents.totalVAT')} value={formatPrice(totauxRecus.totalTVA, language)} />
                  <TotalLine
                    label={t('dashboard.procurementOrdersComponents.totalReceivedTTC')}
                    value={formatPrice(totauxRecus.totalTTC, language)}
                    strong
                  />
                  {!toutesRecues && (
                    <div className="mt-2 flex items-center gap-2 rounded bg-orange-50 p-2 text-sm text-orange-600">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span>{t('dashboard.procurementOrdersComponents.partialReception')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white pt-4">
              <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">
                {t('dashboard.procurementOrdersComponents.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!aAuMoinsUnProduitRecu}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 ${
                  aAuMoinsUnProduitRecu
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'cursor-not-allowed bg-gray-400 text-gray-200'
                }`}
              >
                <CheckIcon className="h-4 w-4" />
                {t('dashboard.procurementOrdersComponents.confirmReception')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TotalLine = ({ label, value, strong }) => (
  <div className={`flex justify-between ${strong ? 'border-t pt-2 font-semibold' : 'text-sm'}`}>
    <span className={strong ? '' : 'text-gray-600'}>{label}</span>
    <span className={strong ? 'text-green-600' : 'font-medium'}>{value}</span>
  </div>
);

export default ReceptionModal;
