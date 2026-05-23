// components/CommandeModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useFournisseur } from '../../../../../hooks/useFournisseur';
import useProducts from '../../../../../hooks/useProducts';
import { useLanguage } from '../../../../../context/LanguageContext';

const getLocale = (language) => (language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR');

const formatPrice = (price, language) => {
  const amount = Number(price);

  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const CommandeModal = ({ isOpen, onClose, commande, onSave, onSuccess }) => {
  const { t, language, isArabic } = useLanguage();
  const { activeFournisseurs, loading: loadingFournisseurs, fetchActiveFournisseurs } = useFournisseur();
  const { getProductsByFournisseur, loading: loadingProducts } = useProducts();

  const [formData, setFormData] = useState({
    fournisseurId: '',
    dateLivraisonPrevue: '',
    adresseLivraison: '',
  });
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [produitsDisponibles, setProduitsDisponibles] = useState([]);
  const [loadingProduitsFiltres, setLoadingProduitsFiltres] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [produitSelectionneTemp, setProduitSelectionneTemp] = useState(null);
  const [quantiteTemp, setQuantiteTemp] = useState(1);
  const [currentCommandeId, setCurrentCommandeId] = useState(null);

  useEffect(() => {
    fetchActiveFournisseurs();
  }, [fetchActiveFournisseurs]);

  useEffect(() => {
    if (isOpen) {
      if (commande) {
        const fournisseurId = commande.fournisseur?.idFournisseur || 
                              commande.fournisseurId || 
                              '';
        
        const commandeId = commande.idCommandeFournisseur || commande.id;
        
        setSelectedFournisseur(fournisseurId);
        setCurrentCommandeId(commandeId);
        setFormData({
          fournisseurId: fournisseurId,
          dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
          adresseLivraison: commande.adresseLivraison || '',
        });
        
        if (fournisseurId) {
          chargerProduitsDuFournisseur(fournisseurId);
        }
        
        const lignesExistantes = (commande.lignesCommande || []).map((ligne, index) => {
          const quantiteVal = ligne.quantite || 0;
          const prixUnitaireVal = ligne.prixUnitaire || 0;
          const tauxTVAVal = ligne.tauxTVA || 19;
          
          const sousTotalHT = ligne.sousTotalHT || (quantiteVal * prixUnitaireVal);
          const montantTVA = ligne.montantTVA || (sousTotalHT * tauxTVAVal / 100);
          const sousTotalTTC = ligne.sousTotalTTC || (sousTotalHT + montantTVA);
          
          return {
            id: ligne.idLigneCommandeFournisseur || index + 1,
            produitId: ligne.produitId || ligne.produit?.idProduit,
            produitLibelle: ligne.produitLibelle || ligne.produit?.libelle || 'Produit',
            produitReference: ligne.produitReference || ligne.produit?.reference || '',
            quantite: quantiteVal,
            prixUnitaire: prixUnitaireVal,
            tauxTVA: tauxTVAVal,
            sousTotalHT: sousTotalHT,
            montantTVA: montantTVA,
            sousTotalTTC: sousTotalTTC,
            estInactif: false,
            categorie: ligne.categorie || ligne.produit?.categorie?.nomCategorie || '',
          };
        });
        
        setLignes(lignesExistantes);
      } else {
        resetForm();
      }
    }
  }, [isOpen, commande]);


 const chargerProduitsDuFournisseur = async (fournisseurId) => {
  setLoadingProduitsFiltres(true);
  try {
    const produits = await getProductsByFournisseur(fournisseurId);
    // ✅ Filtrer uniquement les produits actifs
    const produitsActifs = produits.filter(p => p.estActif !== false && p.active !== false);
    setProduitsDisponibles(produitsActifs);
  } catch (error) {
    console.error('❌ Erreur chargement produits:', error);
    toast.error('Erreur lors du chargement des produits');
    setProduitsDisponibles([]);
  } finally {
    setLoadingProduitsFiltres(false);
  }
};


  const resetForm = () => {
    setFormData({
      fournisseurId: '',
      dateLivraisonPrevue: '',
      adresseLivraison: '',
    });
    setSelectedFournisseur(null);
    setCurrentCommandeId(null);
    setProduitsDisponibles([]);
    setLignes([]);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!commande) {
      resetForm();
      return;
    }

    const fournisseurId = commande.fournisseur?.idFournisseur || commande.fournisseurId || '';
    const commandeId = commande.idCommandeFournisseur || commande.id;

    setSelectedFournisseur(fournisseurId);
    setCurrentCommandeId(commandeId);
    setFormData({
      fournisseurId,
      dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
      adresseLivraison: commande.adresseLivraison || '',
    });

    if (fournisseurId) {
      chargerProduitsDuFournisseur(fournisseurId);
    }

    const lignesExistantes = (commande.lignesCommande || []).map((ligne, index) => {
      const quantiteVal = ligne.quantite || 0;
      const prixUnitaireVal = ligne.prixUnitaire || 0;
      const tauxTVAVal = ligne.tauxTVA || 19;
      const sousTotalHT = ligne.sousTotalHT || quantiteVal * prixUnitaireVal;
      const montantTVA = ligne.montantTVA || (sousTotalHT * tauxTVAVal) / 100;
      const sousTotalTTC = ligne.sousTotalTTC || sousTotalHT + montantTVA;

      return {
        id: ligne.idLigneCommandeFournisseur || index + 1,
        produitId: ligne.produitId || ligne.produit?.idProduit,
        produitLibelle: ligne.produitLibelle || ligne.produit?.libelle || t('dashboard.procurementOrdersComponents.product'),
        produitReference: ligne.produitReference || ligne.produit?.reference || '',
        quantite: quantiteVal,
        prixUnitaire: prixUnitaireVal,
        tauxTVA: tauxTVAVal,
        sousTotalHT,
        montantTVA,
        sousTotalTTC,
        estInactif: false,
        categorie: ligne.categorie || ligne.produit?.categorie?.nomCategorie || '',
      };
    });

    setLignes(lignesExistantes);
  }, [isOpen, commande]);

  const handleFournisseurChange = async (e) => {
    const fournisseurId = parseInt(e.target.value);
    setSelectedFournisseur(fournisseurId);
    setFormData((prev) => ({
      ...prev,
      fournisseurId,
    }));
    setLignes([]);

    if (fournisseurId) {
      await chargerProduitsDuFournisseur(fournisseurId);
    } else {
      setProduitsDisponibles([]);
    }
  };

  const openProductModal = () => {
    setIsProductModalOpen(true);
    setProduitSelectionneTemp(null);
    setQuantiteTemp(1);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProduitSelectionneTemp(null);
    setQuantiteTemp(1);
  };

  const modifierQuantiteLigne = (id, valeur) => {
    const nouvelleQuantite = parseInt(valeur) || 1;
    if (nouvelleQuantite < 1) {
      toast.error(t('dashboard.procurementOrdersComponents.minQuantityError'));
      return;
    }

    setLignes((prev) =>
      prev.map((ligne) => {
        if (ligne.id !== id) return ligne;

        const nouvelleLigne = { ...ligne, quantite: nouvelleQuantite };
        nouvelleLigne.sousTotalHT = nouvelleLigne.quantite * nouvelleLigne.prixUnitaire;
        nouvelleLigne.montantTVA = nouvelleLigne.sousTotalHT * (nouvelleLigne.tauxTVA / 100);
        nouvelleLigne.sousTotalTTC = nouvelleLigne.sousTotalHT + nouvelleLigne.montantTVA;
        return nouvelleLigne;
      })
    );
  };

  const ajouterProduitSelectionne = () => {
    if (!produitSelectionneTemp) {
      toast.error(t('dashboard.procurementOrdersComponents.selectProductError'));
      return;
    }

    if (quantiteTemp < 1) {
      toast.error(t('dashboard.procurementOrdersComponents.minQuantityError'));
      return;
    }

    const prixUnitaireValue = produitSelectionneTemp.prixAchat || produitSelectionneTemp.prix || 0;
    if (prixUnitaireValue <= 0) {
      toast.error(t('dashboard.procurementOrdersComponents.unitPricePositiveError'));
      return;
    }

    const productName = produitSelectionneTemp.nom || produitSelectionneTemp.libelle;
    const ligneExistante = lignes.find((ligne) => ligne.produitId === produitSelectionneTemp.id);

    if (ligneExistante) {
      const nouvelleQuantite = ligneExistante.quantite + quantiteTemp;
      modifierQuantiteLigne(ligneExistante.id, nouvelleQuantite);
      toast.success(t('dashboard.procurementOrdersComponents.quantityUpdated', { name: productName }));
    } else {
      const tauxTVA = produitSelectionneTemp.tauxTVA || 19;
      const sousTotalHT = quantiteTemp * prixUnitaireValue;
      const montantTVA = sousTotalHT * (tauxTVA / 100);
      const sousTotalTTC = sousTotalHT + montantTVA;

      setLignes((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          produitId: produitSelectionneTemp.id,
          produitLibelle: productName || t('dashboard.procurementOrdersComponents.productWithoutName'),
          produitReference: produitSelectionneTemp.reference || `REF-${produitSelectionneTemp.id}`,
          quantite: quantiteTemp,
          prixUnitaire: prixUnitaireValue,
          tauxTVA,
          sousTotalHT,
          montantTVA,
          sousTotalTTC,
          estInactif: !produitSelectionneTemp.estActif,
          categorie: produitSelectionneTemp.categorieNom || '',
        },
      ]);
      toast.success(t('dashboard.procurementOrdersComponents.productAdded', { name: productName }));
    }

    closeProductModal();
  };

  const supprimerLigne = (id) => {
    const ligneASupprimer = lignes.find((ligne) => ligne.id === id);
    setLignes((prev) => prev.filter((ligne) => ligne.id !== id));
    toast.success(t('dashboard.procurementOrdersComponents.productDeleted', { name: ligneASupprimer?.produitLibelle || '' }));
  };

  const handleQuantiteChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantiteTemp(Number.isNaN(value) || value < 1 ? 1 : value);
  };

  const totaux = useMemo(() => {
    const totalHT = lignes.reduce((acc, ligne) => acc + (ligne.sousTotalHT || 0), 0);
    const totalTVA = lignes.reduce((acc, ligne) => acc + (ligne.montantTVA || 0), 0);
    const totalTTC = lignes.reduce((acc, ligne) => acc + (ligne.sousTotalTTC || 0), 0);
    return { totalHT, totalTVA, totalTTC };
  }, [lignes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFournisseur) {
      toast.error(t('dashboard.procurementOrdersComponents.selectSupplierError'));
      return;
    }
    if (lignes.length === 0) {
      toast.error(t('dashboard.procurementOrdersComponents.addOneProductError'));
      return;
    }
    if (!formData.dateLivraisonPrevue) {
      toast.error(t('dashboard.procurementOrdersComponents.selectDeliveryDateError'));
      return;
    }
    if (!formData.adresseLivraison.trim()) {
      toast.error(t('dashboard.procurementOrdersComponents.deliveryAddressError'));
      return;
    }

    const commandeData = {
      fournisseur: { idFournisseur: selectedFournisseur },
      dateLivraisonPrevue: new Date(formData.dateLivraisonPrevue).toISOString(),
      adresseLivraison: formData.adresseLivraison,
      lignesCommande: lignes.map((ligne) => ({
        produitId: ligne.produitId,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tauxTVA: ligne.tauxTVA,
      })),
    };

    try {
      setLoading(true);

      if (currentCommandeId) {
        toast.loading(t('dashboard.procurementOrdersComponents.updateLoading'), { id: 'commande' });
        await onSave(currentCommandeId, commandeData);
        toast.success(t('dashboard.procurementOrdersComponents.updateSuccess'), { id: 'commande' });
      } else {
        toast.loading(t('dashboard.procurementOrdersComponents.createLoading'), { id: 'commande' });
        await onSave(commandeData);
        toast.success(t('dashboard.procurementOrdersComponents.createSuccess'), { id: 'commande' });
      }

      await onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || error.message || t('dashboard.procurementOrdersComponents.saveError'), {
        id: 'commande',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = loadingFournisseurs || loadingProducts || loadingProduitsFiltres || loading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h3 className="text-lg font-semibold text-white">
              {commande
                ? t('dashboard.procurementOrdersComponents.editOrderTitle')
                : t('dashboard.procurementOrdersComponents.newOrderTitle')}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200" title={t('dashboard.procurementOrdersComponents.close')}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-2 text-gray-500">{t('common.loading')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <section className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">
                  {t('dashboard.procurementOrdersComponents.chooseSupplierStep')} <span className="text-red-500">*</span>
                </h4>
                <select
                  value={formData.fournisseurId}
                  onChange={handleFournisseurChange}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('dashboard.procurementOrdersComponents.selectSupplier')}</option>
                  {activeFournisseurs?.map((fournisseur) => (
                    <option key={fournisseur.idFournisseur} value={fournisseur.idFournisseur}>
                      {fournisseur.nomFournisseur} - {fournisseur.email}
                    </option>
                  ))}
                </select>
              </section>

              <section className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">{t('dashboard.procurementOrdersComponents.deliveryStep')}</h4>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    {t('dashboard.procurementOrdersComponents.plannedDate')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateLivraisonPrevue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateLivraisonPrevue: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <textarea
                  value={formData.adresseLivraison}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adresseLivraison: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder={t('dashboard.procurementOrdersComponents.deliveryAddressPlaceholder')}
                  rows="3"
                  required
                />
              </section>

              {selectedFournisseur && (
                <section className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">{t('dashboard.procurementOrdersComponents.productsStep')}</h4>
                    {produitsDisponibles.length > 0 && (
                      <button
                        type="button"
                        onClick={openProductModal}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                        {t('dashboard.procurementOrdersComponents.addProduct')}
                      </button>
                    )}
                  </div>

                  {lignes.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed py-8 text-center text-gray-400">
                      <p>{t('dashboard.procurementOrdersComponents.noProductSelected')}</p>
                      {produitsDisponibles.length > 0 ? (
                        <button
                          type="button"
                          onClick={openProductModal}
                          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {t('dashboard.procurementOrdersComponents.clickAddProduct')}
                        </button>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400">{t('dashboard.procurementOrdersComponents.noProductForSupplier')}</p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              {t('dashboard.procurementOrdersComponents.product')}
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t('dashboard.procurementOrdersComponents.qty')}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">
                              {t('dashboard.procurementOrdersComponents.unitPrice')}
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium">TVA</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t('dashboard.procurementOrdersComponents.totalHT')}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t('dashboard.procurementOrdersComponents.totalTTC')}</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">{t('dashboard.procurementOrdersComponents.action')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lignes.map((ligne) => (
                            <tr key={ligne.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{ligne.produitLibelle}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => modifierQuantiteLigne(ligne.id, ligne.quantite - 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded border hover:bg-gray-100"
                                    disabled={ligne.quantite <= 1}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={ligne.quantite}
                                    onChange={(e) => modifierQuantiteLigne(ligne.id, e.target.value)}
                                    className="w-16 rounded border px-2 py-1 text-right text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => modifierQuantiteLigne(ligne.id, ligne.quantite + 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded border hover:bg-gray-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm">{formatPrice(ligne.prixUnitaire, language)}</td>
                              <td className="px-4 py-3 text-center text-sm">{ligne.tauxTVA}%</td>
                              <td className="px-4 py-3 text-right text-sm">{formatPrice(ligne.sousTotalHT, language)}</td>
                              <td className="px-4 py-3 text-right text-sm font-medium">{formatPrice(ligne.sousTotalTTC, language)}</td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => supprimerLigne(ligne.id)}>
                                  <TrashIcon className="h-4 w-4 text-red-600 hover:text-red-800" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {lignes.length > 0 && (
                <section className="rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <TotalLine label={t('dashboard.procurementOrdersComponents.totalHT')} value={formatPrice(totaux.totalHT, language)} />
                      <TotalLine label={t('dashboard.procurementOrdersComponents.totalVAT')} value={formatPrice(totaux.totalTVA, language)} />
                      <TotalLine
                        label={t('dashboard.procurementOrdersComponents.totalTTC')}
                        value={formatPrice(totaux.totalTTC, language)}
                        strong
                      />
                    </div>
                  </div>
                </section>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
                  {t('dashboard.procurementOrdersComponents.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFournisseur || lignes.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {commande
                    ? t('dashboard.procurementOrdersComponents.updateOrder')
                    : t('dashboard.procurementOrdersComponents.createOrder')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeProductModal} />
            <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <h3 className="text-lg font-semibold text-white">{t('dashboard.procurementOrdersComponents.addProductModalTitle')}</h3>
                <button onClick={closeProductModal} className="text-white hover:text-gray-200">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4">
                <p className="mb-3 text-sm text-gray-600">
                  {t('dashboard.procurementOrdersComponents.supplier')}:{' '}
                  <span className="font-semibold">
                    {activeFournisseurs?.find((fournisseur) => fournisseur.idFournisseur === selectedFournisseur)?.nomFournisseur}
                  </span>
                </p>

                {produitsDisponibles.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <ExclamationTriangleIcon className="mx-auto mb-3 h-12 w-12 text-yellow-500" />
                    <p>{t('dashboard.procurementOrdersComponents.noProductForSupplier')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {produitsDisponibles.map((produit) => {
                      const estDejaAjoute = lignes.some((ligne) => ligne.produitId === produit.id);
                      const estActif = produit.estActif !== false;

                      return (
                        <div
                          key={produit.id}
                          onClick={() => !estDejaAjoute && estActif && setProduitSelectionneTemp(produit)}
                          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                            produitSelectionneTemp?.id === produit.id
                              ? 'border-blue-500 bg-blue-50'
                              : estDejaAjoute
                              ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                              : !estActif
                              ? 'cursor-not-allowed border-orange-200 bg-orange-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{produit.nom || produit.libelle}</span>
                                {!estActif && (
                                  <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs text-orange-700">
                                    {t('dashboard.procurementOrdersComponents.inactive')}
                                  </span>
                                )}
                                {estDejaAjoute && (
                                  <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs text-green-700">
                                    {t('dashboard.procurementOrdersComponents.alreadyInOrder')}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex gap-4 text-sm text-gray-500">
                                <span>
                                  {t('dashboard.procurementOrdersComponents.price')}:{' '}
                                  {formatPrice(produit.prixAchat || produit.prix, language)}
                                </span>
                                <span>
                                  {t('dashboard.procurementOrdersComponents.stock')}: {produit.stock || 0}
                                </span>
                                <span>TVA: {produit.tauxTVA || 19}%</span>
                              </div>
                            </div>
                            {produitSelectionneTemp?.id === produit.id && <CheckIcon className="h-5 w-5 text-blue-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {produitSelectionneTemp && (
                  <div className="mt-4 rounded-lg border bg-gray-50 p-3">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('dashboard.procurementOrdersComponents.quantityMinimum')}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantiteTemp((prev) => Math.max(1, prev - 1))}
                        className="rounded-lg border px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                        disabled={quantiteTemp <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantiteTemp}
                        onChange={handleQuantiteChange}
                        className="w-24 rounded-lg border px-3 py-1 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantiteTemp((prev) => prev + 1)}
                        className="rounded-lg border px-3 py-1 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
                <button type="button" onClick={closeProductModal} className="rounded-lg border px-4 py-2 hover:bg-gray-100">
                  {t('dashboard.procurementOrdersComponents.cancel')}
                </button>
                <button
                  type="button"
                  onClick={ajouterProduitSelectionne}
                  disabled={!produitSelectionneTemp || quantiteTemp < 1}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {t('dashboard.procurementOrdersComponents.addToOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TotalLine = ({ label, value, strong }) => (
  <div className={`flex justify-between ${strong ? 'border-t pt-2 text-base' : 'text-sm'}`}>
    <span className={strong ? 'font-semibold' : ''}>{label}</span>
    <span className={strong ? 'font-semibold text-blue-600' : 'font-medium'}>{value}</span>
  </div>
);

export default CommandeModal;
