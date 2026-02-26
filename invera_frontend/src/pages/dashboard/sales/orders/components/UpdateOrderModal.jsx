// src/pages/dashboard/sales/orders/components/UpdateOrderModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  CubeIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import useOrders from '../../../../../hooks/useOrders';
import useProducts from '../../../../../hooks/useProducts';
import ProductSelectionModal from './ProductSelectionModal';

const UpdateOrderModal = ({
  show,
  onClose,
  commande,
  toNumber,
  onUpdateSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const { handleUpdateCommande } = useOrders();
  const { products: catalogueProduits } = useProducts({ limit: 100 });
  
  const [formData, setFormData] = useState({
    statut: '',
    remarques: '',
    adresse: '',
    produits: []
  });

  const enrichirProduitsAvecCategories = useCallback((produits) => {
    return produits.map(p => {
      const produitCatalogue = catalogueProduits.find(cp => cp.idProduit === p.produitId);
      if (produitCatalogue) {
        return {
          ...p,
          categorie: produitCatalogue.categorie,
          categorieNom: produitCatalogue.categorieNom || produitCatalogue.categorie?.nomCategorie
        };
      }
      return p;
    });
  }, [catalogueProduits]);

  const calculerTotaux = () => {
    const sousTotal = formData.produits.reduce((sum, p) => {
      const quantite = parseInt(p.quantite) || 0;
      const prixUnitaire = parseFloat(p.prixUnitaire) || 0;
      return sum + (quantite * prixUnitaire);
    }, 0);
    const total = sousTotal;
    return { sousTotal, total };
  };

  // Initialisation
 
useEffect(() => {
  if (commande) {
    const produitsAvecCategories = commande.produits?.map(p => ({
      idLigneCommandeClient: p.idLigneCommandeClient || p.ligneId,  // ← À conserver
      produitId: p.produitId || p.id,
      libelle: p.libelle,
      quantite: p.quantite,
      prixUnitaire: p.prixUnitaire || p.prix,
      sousTotal: p.sousTotal || 0,
      categorieNom: p.categorieNom
    })) || [];

    console.log('📦 Produits initialisés:', produitsAvecCategories.map(p => ({
      libelle: p.libelle,
      idLigne: p.idLigneCommandeClient,
      produitId: p.produitId
    })));

    setFormData({
      statut: commande.statut || 'EN_ATTENTE',
      remarques: commande.remarques || '',
      adresse: commande.client?.adresse || '',
      produits: produitsAvecCategories
    });
  }
}, [commande]); 

  if (!show || !commande) return null;

  const handleStatusChange = (e) => {
    setFormData({ ...formData, statut: e.target.value });
  };

  const handleQuantityChange = (produitId, newQuantity) => {
    const updatedProduits = formData.produits.map(p => {
      if (p.produitId === produitId || p.idLigneCommandeClient === produitId) {
        const quantite = parseInt(newQuantity) || 0;
        const prixUnitaire = parseFloat(p.prixUnitaire) || 0;
        const sousTotal = quantite * prixUnitaire;
        return { ...p, quantite, sousTotal };
      }
      return p;
    });
    setFormData({ ...formData, produits: updatedProduits });
  };
  
  const handleAdresseChange = (e) => {
  setFormData({ ...formData, adresse: e.target.value });
};


  const handleRemoveProduct = (produitId) => {
    const updatedProduits = formData.produits.filter(p => 
      p.produitId !== produitId && p.idLigneCommandeClient !== produitId
    );
    setFormData({ ...formData, produits: updatedProduits });
    toast.success('Produit supprimé');
  };



 // Dans UpdateOrderModal.jsx - Fonction handleAddProducts CORRIGÉE
const handleAddProducts = (selectedProducts) => {
  console.log('📦 Produits sélectionnés (bruts):', selectedProducts);
  
  const nouveauxProduits = selectedProducts.map(p => {
    // ✅ Vérifier que l'ID du produit est présent
    if (!p.idProduit) {
      console.error('❌ Produit sans ID!', p);
      return null;
    }
    
    return {
      idLigneCommandeClient: undefined,  // Nouveau produit, pas d'ID de ligne
      produitId: p.idProduit,             // ← TRÈS IMPORTANT: garder l'ID du produit
      libelle: p.libelle,
      quantite: p.quantiteCommande || 1,
      prixUnitaire: p.prixVente || 0,
      sousTotal: (p.prixVente || 0) * (p.quantiteCommande || 1),
      categorieNom: p.categorieNom || p.displayCategorie
    };
  }).filter(p => p !== null); // Enlever les produits invalides

  console.log('🆕 Nouveaux produits formatés avec produitId:', 
    nouveauxProduits.map(p => ({
      libelle: p.libelle,
      produitId: p.produitId
    }))
  );

  setFormData({
    ...formData,
    produits: [...formData.produits, ...nouveauxProduits]
  });

  toast.success(`${nouveauxProduits.length} produit(s) ajouté(s)`);
};

// Dans UpdateOrderModal.jsx - handleSubmit
const handleSubmit = async () => {
  try {
    setLoading(true); // ← CORRIGÉ: true, pas false
    
    const totaux = calculerTotaux();
    
    console.log('🔍 Produits avec leurs IDs:', 
      formData.produits.map(p => ({
        libelle: p.libelle,
        produitId: p.produitId,          
        idLigne: p.idLigneCommandeClient   
      }))
    );
    
    // Préparer les données des produits
    const produitsData = formData.produits.map(p => {
      if (!p.produitId) {
        throw new Error(`ProduitId manquant pour ${p.libelle}`);
      }
      
      const produitData = {
        produitId: p.produitId,
        quantite: parseInt(p.quantite),
        prixUnitaire: parseFloat(p.prixUnitaire)
      };
      
      const idLigne = p.idLigneCommandeClient;
      
      if (idLigne && typeof idLigne === 'number' && !isNaN(idLigne) && idLigne > 0) {
        produitData.id = idLigne;
        console.log(`🔄 Produit existant: ${p.libelle} | ID Ligne: ${idLigne} | Produit ID: ${p.produitId}`);
      } else {
        console.log(`🆕 Nouveau produit: ${p.libelle} | Produit ID: ${p.produitId}`);
      }
      
      return produitData;
    });

    console.log('📦 Produits préparés:', produitsData);
    
    // Construire les données complètes de la commande
    const commandeData = {
      statut: formData.statut,
      produits: produitsData,
      sousTotal: totaux.sousTotal,
      montantRemise: 0,
      total: totaux.total,
      clientId: commande.client?.id,
      clientAdresse: formData.adresse,
      clientTelephone: commande.client?.telephone, 
      clientEmail: commande.client?.email 
    };
    
    console.log('📤 DONNÉES FINALES ENVOYÉES:', JSON.stringify(commandeData, null, 2));

    // Appel à la fonction de mise à jour
    const result = await handleUpdateCommande(commande.id, commandeData);
    console.log('📥 RÉPONSE BACKEND:', result);
    
    if (result && result.success !== false) {
      toast.success('Commande mise à jour avec succès');
      
      if (onUpdateSuccess) {
        console.log('🟡 Appel de onUpdateSuccess');
        onUpdateSuccess(result.commande || result);
      }
      
      console.log('🔚 Fermeture du modal');
      onClose();
    } else {
      throw new Error(result?.message || 'Échec de la mise à jour');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error(error.message || 'Erreur lors de la mise à jour');
    
  } finally {
    setLoading(false); // ← GARANTI que loading revient à false
  }
};

  const totaux = calculerTotaux();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-lg">
          
          {/* En-tête */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Modifier la Commande
                </h2>
                <p className="text-amber-100 text-sm mt-1">
                  Numéro : {commande.numero}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            
            {/* ADRESSE DE LIVRAISON */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 text-blue-600" />
                Adresse de livraison
              </h3>
              <textarea
                value={formData.adresse}
                onChange={handleAdresseChange}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Adresse de livraison..."
              />
            </div>

            {/* PRODUITS */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800 flex items-center">
                  <CubeIcon className="h-4 w-4 mr-2 text-amber-600" />
                  Produits dans la commande
                </h3>
                <button
                  onClick={() => setShowProductSelection(true)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Ajouter des produits
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Quantité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Prix unit.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.produits.map((produit) => (
                      <tr key={produit.produitId || produit.idLigneCommandeClient} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {produit.libelle || `Produit ${produit.id}`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {produit.categorieNom ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {produit.categorieNom}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={produit.quantite}
                            onChange={(e) => handleQuantityChange(produit.produitId || produit.idLigneCommandeClient, e.target.value)}
                            className="w-24 px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {parseFloat(produit.prixUnitaire).toFixed(3)} dt
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-green-600">
                            {(parseInt(produit.quantite) * parseFloat(produit.prixUnitaire)).toFixed(3)} dt
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveProduct(produit.produitId || produit.idLigneCommandeClient)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {formData.produits.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          <CubeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>Aucun produit dans la commande</p>
                          <p className="text-sm mt-2">
                            Cliquez sur "Ajouter des produits" pour commencer
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t border-gray-300">
                      <td colSpan="4" className="px-4 py-3 text-right font-medium">
                        TOTAL COMMANDE:
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-700">
                        {totaux.total.toFixed(3)} dt
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || formData.produits.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg hover:from-amber-700 hover:to-yellow-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4" />
                    Mettre à jour
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductSelectionModal
        show={showProductSelection}
        onClose={() => setShowProductSelection(false)}
        existingProduits={formData.produits}
        onConfirmSelection={handleAddProducts}
        toNumber={toNumber}
      />
    </>
  );
};

export default UpdateOrderModal;