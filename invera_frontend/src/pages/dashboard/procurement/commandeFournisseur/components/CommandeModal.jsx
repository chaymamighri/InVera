// components/commandeModal.jsx - Version avec spinner puis grille + recherche
import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useFournisseur } from '../../../../../hooks/useFournisseur';
import useProducts from '../../../../../hooks/useProducts'; 

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(price);
};

const CommandeModal = ({ isOpen, onClose, commande, onSave, onSuccess }) => {
  // Récupération des fournisseurs
  const { fournisseurs, fetchAllFournisseurs, loading: loadingFournisseurs } = useFournisseur();
  
  // Récupération des produits existants
  const { products, loadProducts, loading: loadingProducts } = useProducts();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    fournisseur: { idFournisseur: '', nomFournisseur: '', email: '' },
    dateLivraisonPrevue: '',
  });

  const [lignes, setLignes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productsFiltres, setProductsFiltres] = useState([]);
  const [searchProductTerm, setSearchProductTerm] = useState('');
  
  // ✅ Mode de saisie manuelle
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualProductName, setManualProductName] = useState('');
  const [manualProductRef, setManualProductRef] = useState('');

  // ✅ État pour la grille de produits
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showCatalogGrid, setShowCatalogGrid] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);

  // ✅ Chargement initial UNE SEULE FOIS
  useEffect(() => {
    fetchAllFournisseurs();
    loadProducts();
  }, []); // ← Ne dépend de rien

  // ✅ Gestion de l'ouverture du modal
  useEffect(() => {
    if (isOpen) {

      
      if (commande) {
        setFormData({
          fournisseur: commande.fournisseur || { idFournisseur: '', nomFournisseur: '', email: '' },
          dateLivraisonPrevue: commande.dateLivraisonPrevue?.split('T')[0] || '',
        });
        setLignes(commande.lignesCommande || []);
      } else {
        setFormData({
          fournisseur: { idFournisseur: '', nomFournisseur: '', email: '' },
          dateLivraisonPrevue: '',
        });
        setLignes([]);
        resetProductFields();
      }
    }
  }, [isOpen, commande]);

  // ✅ Filtrer les produits quand le fournisseur change
  useEffect(() => {
    if (formData.fournisseur?.idFournisseur && products.length > 0) {
      const produitsDuFournisseur = products.filter(
        p => p.fournisseur?.idFournisseur === formData.fournisseur.idFournisseur
      );
      setProductsFiltres(produitsDuFournisseur);
      setCatalogProducts(produitsDuFournisseur);
    } else {
      setProductsFiltres([]);
      setCatalogProducts([]);
    }
  }, [formData.fournisseur, products]);

  // ✅ Filtrer les produits par recherche (pour la grille)
  const produitsFiltresEtRecherches = catalogProducts.filter(p => 
    (p.nom || p.libelle || '').toLowerCase().includes(searchProductTerm.toLowerCase()) ||
    (p.reference || '').toLowerCase().includes(searchProductTerm.toLowerCase())
  );

  const resetProductFields = () => {
    setSelectedProduct('');
    setQuantite(1);
    setPrixUnitaire(0);
    setSearchProductTerm('');
    setIsManualEntry(false);
    setManualProductName('');
    setManualProductRef('');
    setShowCatalogGrid(false);
  };

  const handleFournisseurChange = (e) => {
    const fournisseurId = parseInt(e.target.value);
    const selected = fournisseurs.find(f => f.idFournisseur === fournisseurId);
    setFormData({ 
      ...formData, 
      fournisseur: selected || { idFournisseur: '', nomFournisseur: '', email: '' } 
    });
    resetProductFields();
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product.idProduit || product.id);
    setPrixUnitaire(product?.prixAchat || 0);
    setSearchProductTerm('');
    setShowCatalogGrid(false);
    setIsManualEntry(false);
  };

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    setShowCatalogGrid(false);
    setSelectedProduct('');
    setSearchProductTerm('');
  };

  const toggleCatalogGrid = () => {
    if (!showCatalogGrid) {
      // Afficher le spinner immédiatement
      setCatalogLoading(true);
      setShowCatalogGrid(true);
      setIsManualEntry(false);
      setSelectedProduct('');
      
      // Simuler un délai de chargement (ou utiliser un vrai chargement)
      setTimeout(() => {
        setCatalogLoading(false);
      }, 800); // 800ms de chargement
    } else {
      setShowCatalogGrid(false);
    }
  };

  const ajouterLigne = () => {
    // Validation
    if (quantite <= 0) {
      alert('La quantité doit être supérieure à 0');
      return;
    }
    if (prixUnitaire <= 0) {
      alert('Le prix unitaire doit être supérieur à 0');
      return;
    }

    // Mode saisie manuelle
    if (isManualEntry) {
      if (!manualProductName.trim()) {
        alert('Veuillez saisir un nom de produit');
        return;
      }

      const nouvelleLigne = {
        produit: {
          nom: manualProductName,
          reference: manualProductRef || 'Nouveau produit',
          idProduit: `manual-${Date.now()}`
        },
        quantite,
        prixUnitaire,
        sousTotal: quantite * prixUnitaire,
        idProduit: `manual-${Date.now()}`,
        isManual: true
      };
      setLignes([...lignes, nouvelleLigne]);
      resetProductFields();
    } 
    // Mode sélection catalogue
    else {
      if (!selectedProduct) {
        alert('Veuillez sélectionner un produit');
        return;
      }
      
      const product = products.find(p => p.idProduit === selectedProduct || p.id === selectedProduct);
      
      const existeDeja = lignes.some(l => l.idProduit === selectedProduct);
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
        isManual: false
      };
      setLignes([...lignes, nouvelleLigne]);
      resetProductFields();
    }
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
    
    const lignesCommande = lignes.map(l => {
      if (l.isManual) {
        return {
          produitManuel: {
            nom: l.produit.nom,
            reference: l.produit.reference
          },
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
        };
      } else {
        return {
          produitId: l.idProduit,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
        };
      }
    });

    const commandeData = {
      fournisseur: { idFournisseur: formData.fournisseur.idFournisseur },
      dateCommande: new Date().toISOString(),
      dateLivraisonPrevue: new Date(formData.dateLivraisonPrevue).toISOString(),
      lignesCommande,
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
      alert('Erreur lors de la sauvegarde');
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
              <p className="mt-2 text-gray-500">Chargement des données...</p>
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

              {/* Date de livraison */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">2. Date de livraison prévue</h4>
                <input
                  type="date"
                  value={formData.dateLivraisonPrevue}
                  onChange={(e) => setFormData({ ...formData, dateLivraisonPrevue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Ajout d'articles */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">3. Ajouter des articles</h4>
                
                {!formData.fournisseur.idFournisseur ? (
                  <div className="text-center py-4 text-gray-500">
                    Veuillez d'abord sélectionner un fournisseur
                  </div>
                ) : (
                  <>
                    {/* Switch entre catalogue et saisie manuelle */}
                    <div className="flex gap-4 mb-4">
                      <button
                        type="button"
                        onClick={toggleCatalogGrid}
                        className={`flex-1 py-2 px-4 rounded-lg border ${
                          showCatalogGrid && !isManualEntry
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        📦 Catalogue produits
                      </button>
                      <button
                        type="button"
                        onClick={toggleManualEntry}
                        className={`flex-1 py-2 px-4 rounded-lg border ${
                          isManualEntry 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ✏️ Nouveau produit
                      </button>
                    </div>

                    {isManualEntry ? (
                      /* Formulaire de saisie manuelle */
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nom du produit <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={manualProductName}
                            onChange={(e) => setManualProductName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Produit spécial hors catalogue"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Référence (optionnel)
                          </label>
                          <input
                            type="text"
                            value={manualProductRef}
                            onChange={(e) => setManualProductRef(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: REF-MANU-001"
                          />
                        </div>
                      </div>
                    ) : showCatalogGrid ? (
                      /* Grille du catalogue */
                      <div className="mb-4">
                        {catalogLoading ? (
                          /* 🔵 SPINNER UNIQUEMENT */
                          <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                          </div>
                        ) : (
                          /* Grille de produits avec recherche */
                          <>
                            {/* Barre de recherche */}
                            <div className="relative mb-4">
                              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                value={searchProductTerm}
                                onChange={(e) => setSearchProductTerm(e.target.value)}
                                placeholder="Rechercher dans le catalogue..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Grille de produits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 border rounded-lg">
                              {produitsFiltresEtRecherches.length > 0 ? (
                                produitsFiltresEtRecherches.map(product => (
                                  <button
                                    key={product.idProduit || product.id}
                                    type="button"
                                    onClick={() => handleProductSelect(product)}
                                    className={`p-3 text-left border rounded-lg transition-all ${
                                      selectedProduct === (product.idProduit || product.id)
                                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200'
                                        : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="font-medium text-gray-900 truncate">
                                      {product.nom || product.libelle}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {product.reference || 'Sans réf.'}
                                    </div>
                                    <div className="text-sm font-semibold text-blue-600 mt-2">
                                      {formatPrice(product.prixAchat || 0)}
                                    </div>
                                    {product.stock !== undefined && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Stock: {product.stock}
                                      </div>
                                    )}
                                  </button>
                                ))
                              ) : (
                                <div className="col-span-3 text-center py-8 text-gray-500">
                                  Aucun produit trouvé pour ce fournisseur
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}

                    {/* Quantité et prix (affichés si un produit est sélectionné) */}
                    {(selectedProduct || isManualEntry) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          />
                        </div>
                      </div>
                    )}

                    {/* Bouton d'ajout */}
                    {(selectedProduct || isManualEntry) && (
                      <button
                        type="button"
                        onClick={ajouterLigne}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Ajouter à la commande
                      </button>
                    )}
                  </>
                )}

                {/* Tableau des articles */}
                {lignes.length > 0 ? (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Produit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Qté</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Prix unitaire</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lignes.map((ligne, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="font-medium">
                                {ligne.produit?.nom || ligne.produit?.libelle}
                                {ligne.isManual && (
                                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                    Nouveau
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ligne.produit?.reference || 'Sans référence'}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">{ligne.quantite}</td>
                            <td className="px-4 py-2 text-right">{formatPrice(ligne.prixUnitaire)}</td>
                            <td className="px-4 py-2 text-right font-medium text-blue-600">{formatPrice(ligne.sousTotal)}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
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
                  <p className="text-center text-gray-500 py-4">Aucun article ajouté</p>
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