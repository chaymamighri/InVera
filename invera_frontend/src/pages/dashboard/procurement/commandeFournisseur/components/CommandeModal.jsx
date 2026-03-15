// components/commandeModal.jsx - Version simplifiée (saisie manuelle uniquement)
import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFournisseur } from '../../../../../hooks/useFournisseur';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(price);
};

const CommandeModal = ({ isOpen, onClose, commande, onSave, onSuccess }) => {
  // Récupération des fournisseurs uniquement (plus de produits)
  const { fournisseurs, fetchAllFournisseurs, loading: loadingFournisseurs } = useFournisseur();

  // États du formulaire
  const [formData, setFormData] = useState({
    fournisseur: { idFournisseur: '', nomFournisseur: '', email: '' },
    dateLivraisonPrevue: '',
    adresseLivraison: ''
  });

  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);

  // États pour la saisie manuelle (simplifiée)
  const [manualProductName, setManualProductName] = useState('');
  const [manualProductRef, setManualProductRef] = useState('');
  const [manualProductTVA, setManualProductTVA] = useState(20);
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(0);

  // Chargement initial
  useEffect(() => {
    fetchAllFournisseurs();
  }, []);

  // Gestion de l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      if (commande) {
        setFormData({
          fournisseur: commande.fournisseur || { idFournisseur: '', nomFournisseur: '', email: '' },
          dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
          adresseLivraison: commande.adresseLivraison || ''
        });
        setLignes(commande.lignesCommande || []);
      } else {
        setFormData({
          fournisseur: { idFournisseur: '', nomFournisseur: '', email: '' },
          dateLivraisonPrevue: '',
          adresseLivraison: ''
        });
        setLignes([]);
        resetForm();
      }
    }
  }, [isOpen, commande]);

  const resetForm = () => {
    setManualProductName('');
    setManualProductRef('');
    setManualProductTVA(20);
    setQuantite(1);
    setPrixUnitaire(0);
  };

  const handleFournisseurChange = (e) => {
    const fournisseurId = parseInt(e.target.value);
    const selected = fournisseurs.find(f => f.idFournisseur === fournisseurId);
    setFormData({
      ...formData,
      fournisseur: selected || { idFournisseur: '', nomFournisseur: '', email: '' }
    });
  };

  // ✅ Ajout d'un produit manuel
  const ajouterProduitManuel = () => {
    // Validations
    if (!manualProductName.trim()) {
      alert('Veuillez saisir un nom de produit');
      return;
    }

    if (!manualProductRef.trim()) {
      alert('La référence est obligatoire');
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

    // Calculs avec TVA
    const sousTotalHT = quantite * prixUnitaire;
    const montantTVA = sousTotalHT * (manualProductTVA / 100);
    const sousTotalTTC = sousTotalHT + montantTVA;

    // Création de la ligne
    const nouvelleLigne = {
      id: Date.now(), // ID temporaire unique
      produitLibelle: manualProductName,
      produitReference: manualProductRef,
      quantite,
      prixUnitaire,
      tva: manualProductTVA,
      sousTotalHT,
      montantTVA,
      sousTotalTTC,
      isManual: true
    };

    // Ajout à la liste
    setLignes([...lignes, nouvelleLigne]);
    
    // Réinitialisation du formulaire
    resetForm();
  };

  const supprimerLigne = (id) => {
    setLignes(lignes.filter(l => l.id !== id));
  };

  // Calcul des totaux
  const calculerTotaux = () => {
    const totalHT = lignes.reduce((acc, l) => acc + l.sousTotalHT, 0);
    const totalTVA = lignes.reduce((acc, l) => acc + l.montantTVA, 0);
    const totalTTC = lignes.reduce((acc, l) => acc + l.sousTotalTTC, 0);
    
    return { totalHT, totalTVA, totalTTC };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
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

    // Construction des données pour le backend
    const commandeData = {
      fournisseur: {
        idFournisseur: formData.fournisseur.idFournisseur
      },
      dateLivraisonPrevue: new Date(formData.dateLivraisonPrevue).toISOString(),
      adresseLivraison: formData.adresseLivraison,
      lignesCommande: lignes.map(l => ({
        produitLibelle: l.produitLibelle,
        produitReference: l.produitReference,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tva: l.tva
      }))
    };

    console.log('📤 Données envoyées au backend:', JSON.stringify(commandeData, null, 2));

    try {
      setLoading(true);

      if (commande) {
        await onSave(commande.idCommandeFournisseur, commandeData);
      } else {
        await onSave(commandeData);
      }

      await onSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Erreur:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totaux = calculerTotaux();
  const isLoading = loadingFournisseurs || loading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <h3 className="text-lg font-semibold text-white">
              {commande ? 'Modifier la commande' : 'Nouvelle commande fournisseur'}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Chargement des fournisseurs...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Sélection du fournisseur */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">1. Sélectionner un fournisseur</h4>
                <select
                  value={formData.fournisseur.idFournisseur || ''}
                  onChange={handleFournisseurChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choisir un fournisseur...</option>
                  {fournisseurs.map(f => (
                    <option key={f.idFournisseur} value={f.idFournisseur}>
                      {f.nomFournisseur} - {f.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date et adresse de livraison */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">2. Date et adresse de livraison</h4>
                
                <input
                  type="date"
                  value={formData.dateLivraisonPrevue}
                  onChange={(e) => setFormData({ ...formData, dateLivraisonPrevue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                
                <textarea
                  value={formData.adresseLivraison}
                  onChange={(e) => setFormData({ ...formData, adresseLivraison: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Saisir l'adresse de livraison..."
                  rows="3"
                  required
                />
              </div>

              {/* Ajout d'articles - SAISIE MANUELLE UNIQUEMENT */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">3. Ajouter un produit</h4>

                {!formData.fournisseur.idFournisseur ? (
                  <div className="text-center py-4 text-gray-500">
                    Veuillez d'abord sélectionner un fournisseur
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ligne 1: Nom et Référence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nom du produit <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualProductName}
                          onChange={(e) => setManualProductName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Clavier mécanique"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Référence <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualProductRef}
                          onChange={(e) => setManualProductRef(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: REF-001"
                        />
                      </div>
                    </div>

                    {/* Ligne 2: Quantité, Prix, TVA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantité <span className="text-red-500">*</span>
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

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          TVA (%) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={manualProductTVA}
                          onChange={(e) => setManualProductTVA(parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="20">20% (Standard)</option>
                          <option value="10">10% (Réduit)</option>
                          <option value="5.5">5.5% (Super réduit)</option>
                          <option value="0">0% (Exonéré)</option>
                        </select>
                      </div>
                    </div>

                    {/* Bouton d'ajout */}
                    <button
                      type="button"
                      onClick={ajouterProduitManuel}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Ajouter le produit à la commande
                    </button>
                  </div>
                )}

                {/* Tableau des articles */}
                {lignes.length > 0 ? (
                  <div className="mt-6 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Produit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Qté</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Prix unit.</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">TVA</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total HT</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total TTC</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lignes.map((ligne) => (
                          <tr key={ligne.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="font-medium">{ligne.produitLibelle}</div>
                              <div className="text-xs text-gray-500">Réf: {ligne.produitReference}</div>
                            </td>
                            <td className="px-4 py-2 text-right">{ligne.quantite}</td>
                            <td className="px-4 py-2 text-right">{formatPrice(ligne.prixUnitaire)}</td>
                            <td className="px-4 py-2 text-right">{ligne.tva}%</td>
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
              </div>

              {/* Totaux */}
              {lignes.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">4. Récapitulatif</h4>
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total HT</span>
                        <span className="font-medium">{formatPrice(totaux.totalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">TVA</span>
                        <span className="font-medium">{formatPrice(totaux.totalTVA)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total TTC</span>
                        <span className="text-blue-600">{formatPrice(totaux.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end gap-3 border-t pt-4">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {commande ? 'Modifier la commande' : 'Créer la commande'}
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