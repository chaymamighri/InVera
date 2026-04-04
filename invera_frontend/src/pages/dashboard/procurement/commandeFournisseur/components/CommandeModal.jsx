// components/commandeModal.jsx - Version corrigée avec fournisseurs actifs uniquement

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useFournisseur } from '../../../../../hooks/useFournisseur';
import useProducts from '../../../../../hooks/useProducts';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(price);
};

// ✅ Récupérer le taux TVA depuis la catégorie du produit
const getTauxTVA = (produit) => {
  if (!produit) return 19;
  if (produit.categorie?.tauxTVA) return produit.categorie.tauxTVA;
  return 19;
};

const CommandeModal = ({ isOpen, onClose, commande, onSave, onSuccess }) => {
  const { 
    fournisseurs, 
    activeFournisseurs,  // Utiliser activeFournisseurs au lieu de fournisseurs
    loading: loadingFournisseurs,
    fetchActiveFournisseurs
  } = useFournisseur();
  
  const { 
    allProducts: produitsBruts,
    loading: loadingProduits,
    loadProducts,
  } = useProducts();

  // ✅ Normalisation des produits
  const produits = useMemo(() => {
    if (!produitsBruts) return [];
    return produitsBruts.map(p => ({
      ...p,
      tauxTVA: getTauxTVA(p),
      estActif: p.estActif !== undefined ? p.estActif : p.active,
      prixAchat: p.prixAchat || p.prix,
      stock: p.stock || p.quantiteStock,
    }));
  }, [produitsBruts]);

  // ✅ Groupement des produits avec comptage
  const produitsGroupes = useMemo(() => {
    if (!produits) return { actifs: [], inactifs: [] };
    return {
      actifs: produits.filter(p => p.estActif === true),
      inactifs: produits.filter(p => p.estActif === false),
    };
  }, [produits]);

  // États
  const [formData, setFormData] = useState({
    fournisseur: { idFournisseur: '', nomFournisseur: '', email: '' },
    dateLivraisonPrevue: '',
    adresseLivraison: '',
  });

  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [afficherInactifs, setAfficherInactifs] = useState(false);
  const [nextId, setNextId] = useState(1);

  const produitsAffiches = useMemo(() => {
    if (afficherInactifs) return produits;
    return produitsGroupes.actifs;
  }, [produits, produitsGroupes, afficherInactifs]);

  // Chargement initial - Utiliser fetchActiveFournisseurs
  useEffect(() => {
    fetchActiveFournisseurs(); 
    loadProducts(0, {});
  }, [fetchActiveFournisseurs, loadProducts]);

  // Initialisation du formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (commande) {
        setFormData({
          fournisseur: commande.fournisseur || { idFournisseur: '', nomFournisseur: '', email: '' },
          dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
          adresseLivraison: commande.adresseLivraison || '',
        });
        setLignes(commande.lignesCommande || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, commande]);

  const resetForm = () => {
    setFormData({
      fournisseur: { idFournisseur: '', nomFournisseur: '', email: '' },
      dateLivraisonPrevue: '',
      adresseLivraison: '',
    });
    setLignes([]);
    setProduitSelectionne(null);
    setQuantite(1);
    setPrixUnitaire(0);
    setAfficherInactifs(false);
    setNextId(1);
  };

  const resetProductSelection = () => {
    setProduitSelectionne(null);
    setQuantite(1);
    setPrixUnitaire(0);
  };

  const handleFournisseurChange = (e) => {
    const fournisseurId = parseInt(e.target.value);
    // Utiliser activeFournisseurs au lieu de fournisseurs
    const selected = activeFournisseurs.find(f => f.idFournisseur === fournisseurId);
    setFormData(prev => ({
      ...prev,
      fournisseur: selected || { idFournisseur: '', nomFournisseur: '', email: '' },
    }));
    resetProductSelection();
  };

  const handleProductSelect = (e) => {
    const productId = parseInt(e.target.value);
    if (!productId || isNaN(productId)) {
      setProduitSelectionne(null);
      return;
    }
    const produit = produits.find(p => p.id === productId);
    if (!produit) {
      setProduitSelectionne(null);
      return;
    }
    setProduitSelectionne(produit);
    if (produit) {
      setPrixUnitaire(produit.prixAchat || produit.prix || 0);
    }
  };

  const ajouterProduit = () => {
    if (!produitSelectionne) {
      alert('Veuillez sélectionner un produit');
      return;
    }
    
    if (!produitSelectionne.id) {
      console.error('Produit sans ID:', produitSelectionne);
      alert('Erreur: produit invalide');
      return;
    }
    
    if (quantite <= 0) {
      alert('La quantité doit être supérieure à 0');
      return;
    }
    if (prixUnitaire <= 0) {
      alert('Le prix unitaire doit être supérieur à 0');
      return;
    }

    const tauxTVA = produitSelectionne.tauxTVA || 19;
    const sousTotalHT = quantite * prixUnitaire;
    const montantTVA = sousTotalHT * (tauxTVA / 100);
    const sousTotalTTC = sousTotalHT + montantTVA;

    const nouvelleLigne = {
      id: nextId,
      produitId: produitSelectionne.id,
      produitLibelle: produitSelectionne.nom || produitSelectionne.libelle || 'Produit sans nom',
      produitReference: produitSelectionne.reference || `REF-${produitSelectionne.id}`,
      quantite,
      prixUnitaire,
      tauxTVA,
      sousTotalHT,
      montantTVA,
      sousTotalTTC,
      estInactif: !produitSelectionne.estActif,
      categorie: produitSelectionne.categorieNom || 'Sans catégorie',
      stockActuel: produitSelectionne.stock || 0,
    };

    setLignes(prev => [...prev, nouvelleLigne]);
    setNextId(prev => prev + 1);
    resetProductSelection();
  };

  const supprimerLigne = (id) => {
    setLignes(prev => prev.filter(l => l.id !== id));
  };

  // Calcul des totaux
  const totaux = useMemo(() => {
    const totalHT = lignes.reduce((acc, l) => acc + l.sousTotalHT, 0);
    const totalTVA = lignes.reduce((acc, l) => acc + l.montantTVA, 0);
    const totalTTC = lignes.reduce((acc, l) => acc + l.sousTotalTTC, 0);
    const detailParTaux = lignes.reduce((acc, l) => {
      const taux = l.tauxTVA || 19;
      if (!acc[taux]) acc[taux] = { ht: 0, tva: 0 };
      acc[taux].ht += l.sousTotalHT;
      acc[taux].tva += l.montantTVA;
      return acc;
    }, {});
    return { totalHT, totalTVA, totalTTC, detailParTaux };
  }, [lignes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fournisseur.idFournisseur) {
      alert('Veuillez sélectionner un fournisseur');
      return;
    }
    if (lignes.length === 0) {
      alert('Veuillez ajouter au moins un article');
      return;
    }
    if (!formData.dateLivraisonPrevue) {
      alert('Veuillez saisir une date de livraison prévue');
      return;
    }
    if (!formData.adresseLivraison.trim()) {
      alert('Veuillez saisir une adresse de livraison');
      return;
    }

    const commandeData = {
      fournisseur: { idFournisseur: formData.fournisseur.idFournisseur },
      dateLivraisonPrevue: new Date(formData.dateLivraisonPrevue).toISOString(),
      adresseLivraison: formData.adresseLivraison,
      lignesCommande: lignes.map(l => ({
        produitId: l.produitId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tauxTVA: l.tauxTVA,
      })),
    };

    try {
      setLoading(true);
      if (commande) {
        await onSave(commande.idCommandeFournisseur, commandeData);
      } else {
        await onSave(commandeData);
      }
      await onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(error.response?.data?.message || error.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = loadingFournisseurs || loadingProduits || loading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-white">
              {commande ? 'Modifier la Bon De Commande' : 'Nouvelle Bon De Commande'}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">
                {loadingFournisseurs ? 'Chargement des fournisseurs...' : 'Chargement des produits...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Section Fournisseur - MODIFIÉE pour n'afficher que les actifs */}
              <section className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">1. Fournisseur</h4>
                {!activeFournisseurs || activeFournisseurs.length === 0 ? (
                  <div className="text-center py-4 text-yellow-600 bg-yellow-50 rounded-lg">
                    ⚠️ Aucun fournisseur actif disponible
                  </div>
                ) : (
                  <select
                    value={formData.fournisseur.idFournisseur || ''}
                    onChange={handleFournisseurChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un fournisseur...</option>
                    {activeFournisseurs.map(f => (
                      <option key={`fournisseur-${f.idFournisseur}`} value={f.idFournisseur}>
                        {f.nomFournisseur} - {f.email}
                      </option>
                    ))}
                  </select>
                )}
              </section>

              {/* Section Livraison */}
              <section className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">2. Livraison</h4>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date prévue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateLivraisonPrevue}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateLivraisonPrevue: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <textarea
                  value={formData.adresseLivraison}
                  onChange={(e) => setFormData(prev => ({ ...prev, adresseLivraison: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Adresse de livraison..."
                  rows="3"
                  required
                />
              </section>

              {/* Section Produits - reste identique */}
              <section className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">3. Produits</h4>
                  {produitsGroupes.inactifs.length > 0 && (
                    <label className="flex items-center text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={afficherInactifs}
                        onChange={(e) => setAfficherInactifs(e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1">
                        Afficher les produits inactifs 
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                          {produitsGroupes.inactifs.length}
                        </span>
                      </span>
                    </label>
                  )}
                </div>

                {!formData.fournisseur.idFournisseur ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Veuillez d'abord sélectionner un fournisseur
                  </div>
                ) : !produitsAffiches?.length ? (
                  <div className="text-center py-8 text-yellow-600 bg-yellow-50 rounded-lg">
                    {afficherInactifs ? '📭 Aucun produit trouvé' : '📦 Aucun produit actif trouvé'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Sélection du produit avec styles différenciés */}
                    <select
                      value={produitSelectionne?.id || ''}
                      onChange={handleProductSelect}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un produit...</option>
                      {produitsGroupes.actifs.length > 0 && (
                        <optgroup label="📦 Produits actifs">
                          {produitsGroupes.actifs.map(p => (
                            <option key={`actif-${p.id}`} value={p.id} className="text-black-700">
                              {p.nom || p.libelle} - {formatPrice(p.prixAchat || p.prix)} - Stock: {p.stock || 0}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {afficherInactifs && produitsGroupes.inactifs.length > 0 && (
                        <optgroup label="⚠️ Produits inactifs" className="text-orange-600">
                          {produitsGroupes.inactifs.map(p => (
                            <option key={`inactif-${p.id}`} value={p.id} className="text-orange-600 bg-orange-50">
                              ⚠️ {p.nom || p.libelle} - {formatPrice(p.prixAchat || p.prix)} - Stock: {p.stock || 0} (INACTIF)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    {/* Reste du code identique... */}
                    {produitSelectionne && (
                      <div className={`p-4 rounded-lg border ${
                        !produitSelectionne.estActif 
                          ? 'bg-orange-50 border-orange-300 shadow-sm' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        {/* ... contenu identique ... */}
                        <div className="flex items-start gap-3">
                          {!produitSelectionne.estActif ? (
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-medium ${
                                !produitSelectionne.estActif ? 'text-orange-800' : 'text-green-800'
                              }`}>
                                {!produitSelectionne.estActif ? '⚠️ Produit inactif' : '✅ Produit actif'}
                              </span>
                              {!produitSelectionne.estActif && (
                                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                  Sera réactivé à la réception
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className={`${
                                !produitSelectionne.estActif ? 'bg-orange-100' : 'bg-green-100'
                              } p-2 rounded`}>
                                <span className="text-gray-600">Stock actuel:</span>
                                <span className="ml-2 font-medium">{produitSelectionne.stock || 0}</span>
                              </div>
                              <div className={`${
                                !produitSelectionne.estActif ? 'bg-orange-100' : 'bg-green-100'
                              } p-2 rounded`}>
                                <span className="text-gray-600">TVA:</span>
                                <span className="ml-2 font-medium">{produitSelectionne.tauxTVA || 19}%</span>
                              </div>
                              <div className={`${
                                !produitSelectionne.estActif ? 'bg-orange-100' : 'bg-green-100'
                              } p-2 rounded`}>
                                <span className="text-gray-600">Prix achat:</span>
                                <span className="ml-2 font-medium">{formatPrice(produitSelectionne.prixAchat || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantité et Prix */}
                    {produitSelectionne && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantité à commander <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={quantite}
                            onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Prix unitaire (TND) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={prixUnitaire}
                            onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.000"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bouton ajout */}
                    <button
                      type="button"
                      onClick={ajouterProduit}
                      disabled={!produitSelectionne}
                      className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        !produitSelectionne
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : !produitSelectionne.estActif
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <PlusIcon className="w-4 h-4" />
                      Ajouter à la commande
                    </button>
                  </div>
                )}

                {/* Tableau des lignes - reste identique */}
                {lignes.length > 0 ? (
                  <div className="mt-6 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Produit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Qté cmd</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Prix unit.</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">TVA</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total HT</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total TTC</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lignes.map((ligne) => (
                          <tr key={`ligne-${ligne.id}`} className={`${
                            ligne.estInactif 
                              ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400' 
                              : 'hover:bg-gray-50'
                          }`}>
                            <td className="px-4 py-2">
                              <div className="font-medium flex items-center gap-1">
                                {ligne.estInactif && (
                                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" title="Produit inactif" />
                                )}
                                <span className={ligne.estInactif ? 'text-orange-800' : 'text-gray-900'}>
                                  {ligne.produitLibelle}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">Réf: {ligne.produitReference}</div>
                              {ligne.categorie && (
                                <div className="text-xs text-gray-400">{ligne.categorie}</div>
                              )}
                              {ligne.estInactif && (
                                <div className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                                  <ExclamationTriangleIcon className="w-3 h-3" />
                                  Sera réactivé à la réception
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">{ligne.quantite}</td>
                            <td className="px-4 py-2 text-right">{formatPrice(ligne.prixUnitaire)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {ligne.tauxTVA}%
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">{formatPrice(ligne.sousTotalHT)}</td>
                            <td className="px-4 py-2 text-right font-medium text-blue-600">
                              {formatPrice(ligne.sousTotalTTC)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => supprimerLigne(ligne.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4 mt-4">Aucun article ajouté</p>
                )}
              </section>

              {/* Section Totaux */}
              {lignes.length > 0 && (
                <section className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">4. Récapitulatif</h4>
                  {Object.entries(totaux.detailParTaux).length > 0 && (
                    <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(totaux.detailParTaux).map(([taux, valeurs]) => (
                        <div key={`tva-${taux}`} className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500">TVA {taux}%</p>
                          <p className="text-sm font-medium">{formatPrice(valeurs.tva)}</p>
                          <p className="text-xs text-gray-400">Base: {formatPrice(valeurs.ht)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total HT</span>
                        <span className="font-medium">{formatPrice(totaux.totalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total TVA</span>
                        <span className="font-medium">{formatPrice(totaux.totalTVA)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total TTC</span>
                        <span className="text-blue-600">{formatPrice(totaux.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 border-t pt-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>En cours...</span>
                    </>
                  ) : (
                    commande ? 'Modifier' : 'Créer'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandeModal;