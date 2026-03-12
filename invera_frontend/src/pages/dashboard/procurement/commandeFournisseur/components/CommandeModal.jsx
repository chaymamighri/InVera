// components/commandeModal.jsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFournisseur } from '../../../../../hooks/useFournisseur';

// CORRECTION : Utilisez le bon nom d'import
import useProducts from '../../../../../hooks/useProducts'; 

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const CommandeModal = ({ isOpen, onClose, commande, onSave, onSuccess }) => {
  const { fournisseurs, fetchFournisseurs, loading: loadingFournisseurs } = useFournisseur();
  
  const { 
    products,           
    loading: loadingProducts,
    loadProducts,     
  } = useProducts();
  
  const [formData, setFormData] = useState({
    fournisseur: { idFournisseur: '' },
    dateLivraisonPrevue: '',
  });

  const [lignes, setLignes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productsFiltres, setProductsFiltres] = useState([]);

  // Charger les fournisseurs et produits à l'ouverture
  useEffect(() => {
    if (isOpen) {
      fetchFournisseurs();
      // Charger les produits
      if (typeof loadProducts === 'function') {
        loadProducts();
      }
    }
  }, [isOpen, fetchFournisseurs, loadProducts]);

  // Initialiser le formulaire si en mode édition
  useEffect(() => {
    if (commande) {
      setFormData({
        fournisseur: commande.fournisseur,
        dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
      });
      setLignes(commande.lignesCommande || []);
    } else {
      setFormData({ fournisseur: { idFournisseur: '' }, dateLivraisonPrevue: '' });
      setLignes([]);
    }
  }, [commande]);

  // Filtrer les produits quand le fournisseur change
  useEffect(() => {
    if (formData.fournisseur?.idFournisseur && products.length > 0) {
      const produitsDuFournisseur = products.filter(
        p => p.fournisseur?.idFournisseur === formData.fournisseur.idFournisseur
      );
      setProductsFiltres(produitsDuFournisseur);
    } else {
      setProductsFiltres([]);
    }
  }, [formData.fournisseur, products]);

  const handleFournisseurChange = (e) => {
    const fournisseurId = parseInt(e.target.value);
    const selected = fournisseurs.find(f => f.idFournisseur === fournisseurId);
    setFormData({ ...formData, fournisseur: selected || { idFournisseur: '' } });
    setSelectedProduct(''); // Reset produit sélectionné
  };

  const handleProductChange = (e) => {
    const productId = parseInt(e.target.value);
    const product = products.find(p => p.idProduit === productId || p.id === productId);
    setSelectedProduct(productId);
    setPrixUnitaire(product?.prixAchat || 0);
  };

  const ajouterLigne = () => {
    if (!selectedProduct || quantite <= 0) {
      alert('Veuillez sélectionner un produit');
      return;
    }
    const product = products.find(p => p.idProduit === selectedProduct || p.id === selectedProduct);
    
    // Vérifier si le produit est déjà dans la liste
    const existeDeja = lignes.some(l => l.idProduit === selectedProduct || l.id === selectedProduct);
    if (existeDeja) {
      alert('Ce produit est déjà dans la liste');
      return;
    }

    const nouvelleLigne = {
      produit: product,
      quantite,
      prixUnitaire,
      sousTotal: quantite * prixUnitaire,
      idProduit: selectedProduct,
    };
    setLignes([...lignes, nouvelleLigne]);
    setSelectedProduct('');
    setQuantite(1);
    setPrixUnitaire(0);
  };

  const supprimerLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const calculerTotaux = () => {
    const totalHT = lignes.reduce((acc, l) => acc + l.sousTotal, 0);
    const totalTVA = totalHT * 0.2;
    return { totalHT, totalTVA, totalTTC: totalHT + totalTVA };
  };

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

    const { totalHT, totalTVA, totalTTC } = calculerTotaux();
    const commandeData = {
      fournisseur: { idFournisseur: formData.fournisseur.idFournisseur },
      dateCommande: new Date().toISOString(),
      dateLivraisonPrevue: new Date(formData.dateLivraisonPrevue).toISOString(),
      lignesCommande: lignes.map(l => ({
        produit: { idProduit: l.idProduit },
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
      totalHT,
      totalTVA,
      totalTTC,
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
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totaux = calculerTotaux();
  const isLoading = loadingFournisseurs || loadingProducts || loading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {commande ? 'Modifier la commande' : 'Nouvelle commande'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Infos générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.fournisseur.idFournisseur || ''}
                    onChange={handleFournisseurChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.idFournisseur} value={f.idFournisseur}>
                        {f.nom} - {f.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Livraison prévue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateLivraisonPrevue}
                    onChange={(e) => setFormData({ ...formData, dateLivraisonPrevue: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Ajout d'articles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Articles</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <select
                    value={selectedProduct}
                    onChange={handleProductChange}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.fournisseur.idFournisseur}
                  >
                    <option value="">
                      {formData.fournisseur.idFournisseur ? 'Sélectionner un produit' : 'Choisir un fournisseur d\'abord'}
                    </option>
                    {productsFiltres.map(p => (
                      <option key={p.idProduit || p.id} value={p.idProduit || p.id}>
                        {p.nom || p.libelle} - {p.reference}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={quantite}
                    onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Quantité"
                    disabled={!selectedProduct}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prixUnitaire}
                    onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Prix unitaire"
                    disabled={!selectedProduct}
                  />
                  <button
                    type="button"
                    onClick={ajouterLigne}
                    disabled={!selectedProduct}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                {/* Tableau des articles */}
                {lignes.length > 0 ? (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qté</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Prix unitaire</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lignes.map((ligne, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="font-medium">{ligne.produit?.nom || ligne.produit?.libelle}</div>
                              <div className="text-xs text-gray-500">{ligne.produit?.reference}</div>
                            </td>
                            <td className="px-4 py-2 text-right">{ligne.quantite}</td>
                            <td className="px-4 py-2 text-right">{formatPrice(ligne.prixUnitaire)}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatPrice(ligne.sousTotal)}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
                                className="text-red-600 hover:text-red-800"
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
                  <p className="text-center text-gray-500 py-4">Aucun article ajouté</p>
                )}
              </div>

              {/* Totaux */}
              {lignes.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total HT</span>
                        <span className="font-medium">{formatPrice(totaux.totalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">TVA (20%)</span>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '...' : commande ? 'Modifier' : 'Créer'}
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