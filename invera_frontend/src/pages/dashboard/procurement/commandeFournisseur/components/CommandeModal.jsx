// components/commandeModal.jsx - Version avec toasts
import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useFournisseur } from '../../../../../hooks/useFournisseur';
import useProducts from '../../../../../hooks/useProducts';
import toast from 'react-hot-toast';

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
    getProductsByFournisseur,
    loading: loadingProducts,
  } = useProducts();

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
  
  // États pour la modale de sélection des produits
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [produitSelectionneTemp, setProduitSelectionneTemp] = useState(null);
  const [quantiteTemp, setQuantiteTemp] = useState(1);

  // State pour l'ID de la commande en cours d'édition
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
      setProduitsDisponibles(produits);
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

  const handleFournisseurChange = async (e) => {
    const fournisseurId = parseInt(e.target.value);
    setSelectedFournisseur(fournisseurId);
    setFormData(prev => ({
      ...prev,
      fournisseurId: fournisseurId,
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

  const selectProduit = (produit) => {
    setProduitSelectionneTemp(produit);
  };

  const incrementQuantite = () => {
    setQuantiteTemp(prev => prev + 1);
  };

  const decrementQuantite = () => {
    setQuantiteTemp(prev => Math.max(1, prev - 1));
  };

  const handleQuantiteChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantiteTemp(1);
    } else {
      setQuantiteTemp(value);
    }
  };

  const ajouterProduitSelectionne = () => {
    if (!produitSelectionneTemp) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    
    if (quantiteTemp < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }
    
    const prixUnitaireValue = produitSelectionneTemp.prixAchat || produitSelectionneTemp.prix || 0;
    
    if (prixUnitaireValue <= 0) {
      toast.error('Le prix unitaire doit être supérieur à 0');
      return;
    }

    const ligneExistante = lignes.find(l => l.produitId === produitSelectionneTemp.id);
    
    if (ligneExistante) {
      const nouvelleQuantite = ligneExistante.quantite + quantiteTemp;
      modifierQuantiteLigne(ligneExistante.id, nouvelleQuantite);
      toast.success(`Quantité mise à jour : ${produitSelectionneTemp.nom || produitSelectionneTemp.libelle}`);
    } else {
      const tauxTVA = produitSelectionneTemp.tauxTVA || 19;
      const sousTotalHT = quantiteTemp * prixUnitaireValue;
      const montantTVA = sousTotalHT * (tauxTVA / 100);
      const sousTotalTTC = sousTotalHT + montantTVA;

      const nouvelleLigne = {
        id: Date.now() + Math.random(),
        produitId: produitSelectionneTemp.id,
        produitLibelle: produitSelectionneTemp.nom || produitSelectionneTemp.libelle || 'Produit sans nom',
        produitReference: produitSelectionneTemp.reference || `REF-${produitSelectionneTemp.id}`,
        quantite: quantiteTemp,
        prixUnitaire: prixUnitaireValue,
        tauxTVA: tauxTVA,
        sousTotalHT: sousTotalHT,
        montantTVA: montantTVA,
        sousTotalTTC: sousTotalTTC,
        estInactif: !produitSelectionneTemp.estActif,
        categorie: produitSelectionneTemp.categorieNom || 'Sans catégorie',
      };

      setLignes(prev => [...prev, nouvelleLigne]);
      toast.success(`Produit ajouté : ${produitSelectionneTemp.nom || produitSelectionneTemp.libelle}`);
    }
    
    closeProductModal();
  };

  const modifierQuantiteLigne = (id, valeur) => {
    const nouvelleQuantite = parseInt(valeur) || 1;
    if (nouvelleQuantite < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }
    
    setLignes(prev => prev.map(ligne => {
      if (ligne.id !== id) return ligne;
      
      const nouvelleLigne = { ...ligne, quantite: nouvelleQuantite };
      nouvelleLigne.sousTotalHT = nouvelleLigne.quantite * nouvelleLigne.prixUnitaire;
      nouvelleLigne.montantTVA = nouvelleLigne.sousTotalHT * (nouvelleLigne.tauxTVA / 100);
      nouvelleLigne.sousTotalTTC = nouvelleLigne.sousTotalHT + nouvelleLigne.montantTVA;
      
      return nouvelleLigne;
    }));
  };

  const supprimerLigne = (id) => {
    const ligneASupprimer = lignes.find(l => l.id === id);
    setLignes(prev => prev.filter(l => l.id !== id));
    toast.success(`Produit supprimé : ${ligneASupprimer?.produitLibelle}`);
  };

  const totaux = useMemo(() => {
    const totalHT = lignes.reduce((acc, l) => acc + (l.sousTotalHT || 0), 0);
    const totalTVA = lignes.reduce((acc, l) => acc + (l.montantTVA || 0), 0);
    const totalTTC = lignes.reduce((acc, l) => acc + (l.sousTotalTTC || 0), 0);
    return { totalHT, totalTVA, totalTTC };
  }, [lignes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFournisseur) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (lignes.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    if (!formData.dateLivraisonPrevue) {
      toast.error('Veuillez sélectionner une date de livraison');
      return;
    }

    if (!formData.adresseLivraison.trim()) {
      toast.error('Veuillez saisir une adresse de livraison');
      return;
    }

    const commandeData = {
      fournisseur: { idFournisseur: selectedFournisseur },
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
      
      if (currentCommandeId) {
        // Mode édition
        toast.loading('Modification de la commande en cours...', { id: 'commande' });
        await onSave(currentCommandeId, commandeData);
        toast.success('Commande modifiée avec succès', { id: 'commande' });
      } else {
        // Mode création
        toast.loading('Création de la commande en cours...', { id: 'commande' });
        await onSave(commandeData);
        toast.success('Commande créée avec succès', { id: 'commande' });
      }
      
      await onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error(error.response?.data?.message || error.message || 'Erreur lors de l\'enregistrement', { id: 'commande' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = loadingFournisseurs || loadingProducts || loadingProduitsFiltres || loading;

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
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* ÉTAPE 1 : Choix du fournisseur */}
              <section className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  1. Choisir un fournisseur <span className="text-red-500">*</span>
                </h4>
                <select
                  value={formData.fournisseurId}
                  onChange={handleFournisseurChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner un fournisseur --</option>
                  {activeFournisseurs?.map(f => (
                    <option key={f.idFournisseur} value={f.idFournisseur}>
                      {f.nomFournisseur} - {f.email}
                    </option>
                  ))}
                </select>
              </section>

              {/* ÉTAPE 2 : Livraison */}
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

              {/* ÉTAPE 3 : Liste des produits dans la commande */}
              {selectedFournisseur && (
                <section className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      3. Produits dans la commande
                    </h4>
                    {produitsDisponibles.length > 0 && (
                      <button
                        type="button"
                        onClick={openProductModal}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Ajouter un produit
                      </button>
                    )}
                  </div>
                  
                  {lignes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                      <p>Aucun produit sélectionné</p>
                      {produitsDisponibles.length > 0 ? (
                        <button
                          type="button"
                          onClick={openProductModal}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Cliquez ici pour ajouter un produit
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">
                          Aucun produit disponible pour ce fournisseur
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Produit</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Qté</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Prix unit.</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">TVA</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Total HT</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Total TTC</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">Action</th>
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
                                    className="w-6 h-6 rounded border hover:bg-gray-100 flex items-center justify-center"
                                    disabled={ligne.quantite <= 1}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={ligne.quantite}
                                    onChange={(e) => modifierQuantiteLigne(ligne.id, e.target.value)}
                                    className="w-16 px-2 py-1 text-right border rounded text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => modifierQuantiteLigne(ligne.id, ligne.quantite + 1)}
                                    className="w-6 h-6 rounded border hover:bg-gray-100 flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {formatPrice(ligne.prixUnitaire)}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">{ligne.tauxTVA}%</td>
                              <td className="px-4 py-3 text-right text-sm">{formatPrice(ligne.sousTotalHT)}</td>
                              <td className="px-4 py-3 text-right text-sm font-medium">{formatPrice(ligne.sousTotalTTC)}</td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => supprimerLigne(ligne.id)}>
                                  <TrashIcon className="w-4 h-4 text-red-600 hover:text-red-800" />
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

              {/* Totaux */}
              {lignes.length > 0 && (
                <section className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total HT</span>
                        <span className="font-medium">{formatPrice(totaux.totalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total TVA</span>
                        <span className="font-medium">{formatPrice(totaux.totalTVA)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-base">
                        <span className="font-semibold">Total TTC</span>
                        <span className="font-semibold text-blue-600">{formatPrice(totaux.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !selectedFournisseur || lignes.length === 0} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {commande ? 'Modifier' : 'Créer'} la commande
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODALE DE SÉLECTION DES PRODUITS */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeProductModal} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                <h3 className="text-lg font-semibold text-white">
                  Ajouter un produit
                </h3>
                <button onClick={closeProductModal} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <p className="text-sm text-gray-600 mb-3">
                  Fournisseur : <span className="font-semibold">
                    {activeFournisseurs?.find(f => f.idFournisseur === selectedFournisseur)?.nomFournisseur}
                  </span>
                </p>
                
                {produitsDisponibles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                    <p>Aucun produit disponible pour ce fournisseur</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {produitsDisponibles.map(produit => {
                      const estDejaAjoute = lignes.some(l => l.produitId === produit.id);
                      const estActif = produit.estActif !== false;
                      
                      return (
                        <div
                          key={produit.id}
                          onClick={() => !estDejaAjoute && estActif && selectProduit(produit)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            produitSelectionneTemp?.id === produit.id
                              ? 'border-blue-500 bg-blue-50'
                              : estDejaAjoute
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : !estActif
                              ? 'border-orange-200 bg-orange-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">
                                  {produit.nom || produit.libelle}
                                </span>
                                {!estActif && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-700 rounded-full">
                                    Inactif
                                  </span>
                                )}
                                {estDejaAjoute && (
                                  <span className="text-xs px-2 py-0.5 bg-green-200 text-green-700 rounded-full">
                                    Déjà dans la commande
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                <span>Prix: {formatPrice(produit.prixAchat || produit.prix)}</span>
                                <span>Stock: {produit.stock || 0}</span>
                                <span>TVA: {produit.tauxTVA || 19}%</span>
                              </div>
                            </div>
                            {produitSelectionneTemp?.id === produit.id && (
                              <CheckIcon className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Contrôle de quantité - minimum 1 */}
                {produitSelectionneTemp && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité (minimum 1)
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={decrementQuantite}
                        className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        disabled={quantiteTemp <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantiteTemp}
                        onChange={handleQuantiteChange}
                        className="w-24 text-center px-3 py-1 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={incrementQuantite}
                        className="px-3 py-1 border rounded-lg hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={ajouterProduitSelectionne}
                  disabled={!produitSelectionneTemp || quantiteTemp < 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Ajouter à la commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandeModal;