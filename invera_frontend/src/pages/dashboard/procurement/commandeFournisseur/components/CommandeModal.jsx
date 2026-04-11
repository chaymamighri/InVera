// components/commandeModal.jsx - Version CORRIGÉE

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useFournisseur } from '../../../../../hooks/useFournisseur';
import useProducts from '../../../../../hooks/useProducts';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price);
};

const getTauxTVA = (produit) => {
  if (!produit) return 19;
  if (produit.categorie?.tauxTVA) return produit.categorie.tauxTVA;
  return 19;
};

const CommandeModal = ({ isOpen, onClose, commande, onSave, onSuccess }) => {
  const { 
    activeFournisseurs,
    loading: loadingFournisseurs,
    fetchActiveFournisseurs
  } = useFournisseur();
  
  const { 
    allProducts: produitsBruts,
    loading: loadingProduits,
    loadProducts,
  } = useProducts();

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

  const produitsGroupes = useMemo(() => {
    if (!produits) return { actifs: [], inactifs: [] };
    return {
      actifs: produits.filter(p => p.estActif === true),
      inactifs: produits.filter(p => p.estActif === false),
    };
  }, [produits]);

  const [formData, setFormData] = useState({
    fournisseurId: '',
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

  useEffect(() => {
    fetchActiveFournisseurs(); 
    loadProducts(0, {});
  }, [fetchActiveFournisseurs, loadProducts]);

  // ✅ INITIALISATION CORRIGÉE
  useEffect(() => {
    if (isOpen) {
      if (commande) {
        // Mode édition - Récupération correcte du fournisseur
        const fournisseurId = commande.fournisseur?.idFournisseur || 
                              commande.fournisseurId || 
                              '';
        
        setFormData({
          fournisseurId: fournisseurId,
          dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
          adresseLivraison: commande.adresseLivraison || '',
        });
        
        // ✅ Transformation correcte des lignes existantes
        const lignesExistantes = (commande.lignesCommande || []).map((ligne, index) => {
          // Calculer les totaux si non fournis
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
            estInactif: ligne.estInactif || false,
            categorie: ligne.categorie || ligne.produit?.categorie?.nomCategorie || '',
          };
        });
        
        setLignes(lignesExistantes);
        const maxId = Math.max(...lignesExistantes.map(l => l.id), 0);
        setNextId(maxId + 1);
      } else {
        resetForm();
      }
    }
  }, [isOpen, commande]);

  const resetForm = () => {
    setFormData({
      fournisseurId: '',
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
    setFormData(prev => ({
      ...prev,
      fournisseurId: fournisseurId,
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
    setPrixUnitaire(produit.prixAchat || produit.prix || 0);
  };

  // ✅ MODIFICATION DE LIGNE CORRIGÉE
  const modifierLigne = (id, champ, valeur) => {
    setLignes(prev => prev.map(ligne => {
      if (ligne.id !== id) return ligne;
      
      const nouvelleLigne = { ...ligne };
      
      if (champ === 'quantite') {
        nouvelleLigne.quantite = parseInt(valeur) || 0;
      }
      if (champ === 'prixUnitaire') {
        nouvelleLigne.prixUnitaire = parseFloat(valeur) || 0;
      }
      
      // Recalculer les totaux
      const tauxTVA = nouvelleLigne.tauxTVA || 19;
      nouvelleLigne.sousTotalHT = nouvelleLigne.quantite * nouvelleLigne.prixUnitaire;
      nouvelleLigne.montantTVA = nouvelleLigne.sousTotalHT * (tauxTVA / 100);
      nouvelleLigne.sousTotalTTC = nouvelleLigne.sousTotalHT + nouvelleLigne.montantTVA;
      
      return nouvelleLigne;
    }));
  };

  const ajouterProduit = () => {
    if (!produitSelectionne) {
      alert('Veuillez sélectionner un produit');
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
      quantite: quantite,
      prixUnitaire: prixUnitaire,
      tauxTVA: tauxTVA,
      sousTotalHT: sousTotalHT,
      montantTVA: montantTVA,
      sousTotalTTC: sousTotalTTC,
      estInactif: !produitSelectionne.estActif,
      categorie: produitSelectionne.categorieNom || 'Sans catégorie',
    };

    setLignes(prev => [...prev, nouvelleLigne]);
    setNextId(prev => prev + 1);
    resetProductSelection();
  };

  const supprimerLigne = (id) => {
    setLignes(prev => prev.filter(l => l.id !== id));
  };

  const totaux = useMemo(() => {
    const totalHT = lignes.reduce((acc, l) => acc + (l.sousTotalHT || 0), 0);
    const totalTVA = lignes.reduce((acc, l) => acc + (l.montantTVA || 0), 0);
    const totalTTC = lignes.reduce((acc, l) => acc + (l.sousTotalTTC || 0), 0);
    const detailParTaux = lignes.reduce((acc, l) => {
      const taux = l.tauxTVA || 19;
      if (!acc[taux]) acc[taux] = { ht: 0, tva: 0 };
      acc[taux].ht += l.sousTotalHT || 0;
      acc[taux].tva += l.montantTVA || 0;
      return acc;
    }, {});
    return { totalHT, totalTVA, totalTTC, detailParTaux };
  }, [lignes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fournisseurId) {
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

    // ✅ Construction correcte des données
    const commandeData = {
      fournisseur: { idFournisseur: formData.fournisseurId },
      dateLivraisonPrevue: new Date(formData.dateLivraisonPrevue).toISOString(),
      adresseLivraison: formData.adresseLivraison,
      lignesCommande: lignes.map(l => ({
        idLigneCommandeFournisseur: l.id > 0 ? l.id : null,
        produitId: l.produitId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tauxTVA: l.tauxTVA,
      })),
    };

    console.log("📦 Envoi modification:", JSON.stringify(commandeData, null, 2));

    try {
      setLoading(true);
      await onSave(commande.idCommandeFournisseur, commandeData);
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
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-white">
              {commande ? 'Modifier le Bon De Commande' : 'Nouveau Bon De Commande'}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              <section className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">1. Fournisseur</h4>
                <select
                  value={formData.fournisseurId}
                  onChange={handleFournisseurChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un fournisseur...</option>
                  {activeFournisseurs?.map(f => (
                    <option key={f.idFournisseur} value={f.idFournisseur}>
                      {f.nomFournisseur} - {f.email}
                    </option>
                  ))}
                </select>
              </section>

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

              <section className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">3. Produits</h4>
                </div>

                <div className="space-y-4">
                  <select
                    value={produitSelectionne?.id || ''}
                    onChange={handleProductSelect}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un produit...</option>
                    {produitsAffiches.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom || p.libelle} - {formatPrice(p.prixAchat || p.prix)} - TVA: {p.tauxTVA}%
                      </option>
                    ))}
                  </select>

                  {produitSelectionne && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          value={quantite}
                          onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire</label>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={prixUnitaire}
                          onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={ajouterProduit}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <PlusIcon className="w-4 h-4 inline mr-2" />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}

                  {lignes.length > 0 && (
                    <div className="mt-6 border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left">Produit</th>
                            <th className="px-4 py-3 text-right">Qté</th>
                            <th className="px-4 py-3 text-right">Prix unit.</th>
                            <th className="px-4 py-3 text-center">TVA</th>
                            <th className="px-4 py-3 text-right">Total HT</th>
                            <th className="px-4 py-3 text-right">Total TTC</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lignes.map((ligne) => (
                            <tr key={ligne.id}>
                              <td className="px-4 py-3">{ligne.produitLibelle}</td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  value={ligne.quantite}
                                  onChange={(e) => modifierLigne(ligne.id, 'quantite', e.target.value)}
                                  className="w-20 px-2 py-1 text-right border rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={ligne.prixUnitaire}
                                  onChange={(e) => modifierLigne(ligne.id, 'prixUnitaire', e.target.value)}
                                  className="w-24 px-2 py-1 text-right border rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">{ligne.tauxTVA}%</td>
                              <td className="px-4 py-3 text-right">{formatPrice(ligne.sousTotalHT)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatPrice(ligne.sousTotalTTC)}</td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => supprimerLigne(ligne.id)}>
                                  <TrashIcon className="w-4 h-4 text-red-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              {lignes.length > 0 && (
                <section className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span>Total HT</span>
                        <span className="font-medium">{formatPrice(totaux.totalHT)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TVA</span>
                        <span className="font-medium">{formatPrice(totaux.totalTVA)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total TTC</span>
                        <span className="font-semibold text-blue-600">{formatPrice(totaux.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {commande ? 'Modifier' : 'Créer'}
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