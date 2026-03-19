// src/pages/dashboard/sales/products/components/OrderRecapModal.jsx
import React, { useState } from 'react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { commandeService } from '../../../../../services/commandeService';

const OrderRecapModal = ({
  showRecap,
  setShowRecap,
  selectedProducts,
  selectedClient,
  remiseAppliquee,
  calculerTotaux,
  setShowSuccessPopup,
  setSelectedProducts,
  setSelectedClient,
  onOrderCreated 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (!showRecap) return null;

  const totaux = calculerTotaux(selectedProducts, remiseAppliquee);
  
  // Formater les nombres avec 3 décimales maximum
  const formatNumber = (number) => {
    return typeof number === 'number' 
      ? number.toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3
        })
      : number;
  };

  // Formater spécifiquement pour l'affichage des prix
  const formatPrice = (number) => {
    return typeof number === 'number'
      ? number.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 3
        })
      : number;
  };

  const handleEnregistrerCommande = async () => {
    // Validation
    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Veuillez sélectionner au moins un produit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🔥 CORRECTION: Format exact attendu par le backend
      const commandeData = {
        clientId: Number(selectedClient.idClient || selectedClient.id),
        remiseTotale: Number(remiseAppliquee) || 0,
        produits: selectedProducts.map(p => ({
          produitId: Number(p.idProduit || p.id),
          quantite: Number(p.quantiteCommande) || 1,
          prixUnitaire: Number(p.prixVente || p.prix || 0)
          // ⚠️ NE PAS inclure remisePourcentage ici - le backend ne l'attend pas
        }))
        // ⚠️ NE PAS inclure notes et statut ici - le backend ne les attend pas
      };

      console.log('📤 Données envoyées (format backend):', JSON.stringify(commandeData, null, 2));

      // Appeler le service
      const result = await commandeService.createCommande(commandeData);
      
      console.log('📥 Réponse du backend:', result);
      
      // 🔥 Vérifier la structure de la réponse du backend
      if (result && result.success) {
        console.log("✅ Commande créée avec succès");

        if (onOrderCreated && result.commande) {
          console.log("✅ Nouvelle commande créée:", result.commande);
          onOrderCreated(result.commande);
        }

        // Afficher le modal de succès
        if (setShowSuccessPopup) {
          setShowSuccessPopup(true);
        }
        
        // Réinitialiser les sélections
        if (setSelectedProducts) setSelectedProducts([]);
        if (setSelectedClient) setSelectedClient(null);
        
        // 🔥 REDIRECTION VERS LA PAGE DES COMMANDES
        setTimeout(() => {
          window.location.href = '/dashboard/sales/orders';
        }, 1500);
        
      } else {
        // Gérer le cas où la réponse n'a pas success=true
        const errorMsg = result?.message || 'Erreur inconnue';
        throw new Error(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      
      let errorMessage = 'Erreur lors de la création de la commande';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      alert(`Erreur: ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700 font-medium">Création de la commande en cours...</p>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Récapitulatif de la Commande</h2>
            <button
              onClick={() => setShowRecap(false)}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Informations client */}
          <div className="mb-6 bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Nom</div>
                <div className="font-medium text-gray-900">
                  {selectedClient?.nom || selectedClient?.prenom ? 
                    `${selectedClient?.nom || ''} ${selectedClient?.prenom || ''}`.trim() 
                    : 'Non spécifié'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-medium text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedClient?.typeClient === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    selectedClient?.typeClient === 'ENTREPRISE' ? 'bg-blue-100 text-blue-800' :
                    selectedClient?.typeClient === 'PROFESSIONNEL' ? 'bg-blue-100 text-blue-800' :
                    selectedClient?.typeClient === 'FIDELE' ? 'bg-yellow-100 text-yellow-800' :
                    selectedClient?.typeClient === 'PARTICULIER' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedClient?.typeClient || 'Non spécifié'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Téléphone</div>
                <div className="font-medium text-gray-900">{selectedClient?.telephone || 'Non spécifié'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Adresse</div>
                <div className="font-medium text-gray-900">{selectedClient?.adresse || 'Non spécifiée'}</div>
              </div>
            </div>
          </div>

          {/* Détails des produits */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Détails des Produits ({selectedProducts.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Unitaire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedProducts.map((product, index) => {
                    const prixUnitaire = Number(product.prix || product.prixVente || 0);
                    const quantite = Number(product.quantiteCommande || 1);
                    const sousTotal = prixUnitaire * quantite;
                    
                    return (
                      <tr key={product.idProduit || product.id || index}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            {product.imageUrl ? (
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.libelle} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.className = 'h-10 w-10 rounded bg-gray-100 flex items-center justify-center';
                                    e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs">No image</span>';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.libelle || 'Produit sans nom'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.uniteMesure || 'unité'}
                                {product.categorie && ` • ${product.categorie}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="font-medium">{formatNumber(quantite)}</div>
                          <div className="text-xs text-gray-500">
                            Stock: {formatNumber(product.quantiteStock || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-medium">{formatPrice(prixUnitaire)} dt</div>
                          {product.remiseTemporaire > 0 && (
                            <div className="text-xs text-green-600">
                              Remise: {product.remiseTemporaire}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-blue-600">
                          {formatPrice(sousTotal)} dt
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Récapitulatif Financier
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Sous-total produits</span>
                <span className="font-medium text-gray-800">{formatPrice(totaux.sousTotal)} dt</span>
              </div>
              
              {remiseAppliquee > 0 && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                  <div>
                    <span className="text-gray-600">Remise globale</span>
                    <div className="text-xs text-gray-500">
                      {remiseAppliquee}% (Type: {selectedClient?.typeClient || 'Standard'})
                    </div>
                  </div>
                  <span className="font-medium text-red-600">-{formatPrice(totaux.remise)} dt</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <div>
                  <span className="font-bold text-gray-800">Total à payer</span>
                  <div className="text-xs text-gray-500">
                    {selectedProducts.length} produit(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{formatPrice(totaux.total)} dt</div>
                  <div className="text-sm text-gray-500">
                    TTC
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowRecap(false)}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Retour
            </button>
            
            <button
              onClick={handleEnregistrerCommande}
              disabled={loading || !selectedClient || selectedProducts.length === 0}
              className={`px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 font-medium flex items-center shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                loading ? 'opacity-70' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  En cours...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Enregistrer la Commande
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderRecapModal;
