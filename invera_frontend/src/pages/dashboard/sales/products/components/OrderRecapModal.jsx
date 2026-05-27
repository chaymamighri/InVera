// src/pages/dashboard/sales/products/components/OrderRecapModal.jsx

/**
 * OrderRecapModal - Modal de récapitulatif de commande
 * 
 * RÔLE : Afficher le résumé de la commande avant validation finale
 * 
 * FONCTIONNALITÉS :
 * - Affichage des informations client
 * - Liste des produits sélectionnés avec quantités, prix et remises par produit
 * - Calcul des totaux (sous-total, remises produits, remise client, total)
 * - Validation et envoi au backend
 * - Redirection vers la page des commandes après succès
 * - Gestion des erreurs
 */

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
  onOrderCreated,
  t = (key) => key,
  locale = 'fr-FR',
  isArabic = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (!showRecap) return null;

  // ========== FONCTIONS POUR LES REMISES PAR PRODUIT ==========
  
  /**
   * Récupère le pourcentage de remise applicable à un produit
   * Priorité: remise catégorie > remise temporaire > 0
   */
  const getRemiseForProduct = (product) => {
    // Remise de catégorie (priorité 1)
    if (product.categorieRemise && product.categorieRemise > 0) {
      return product.categorieRemise;
    }
    // Remise temporaire du produit (priorité 2)
    if (product.remiseTemporaire && product.remiseTemporaire > 0) {
      return product.remiseTemporaire;
    }
    // Remise standard du produit
    if (product.remise && product.remise > 0) {
      return product.remise;
    }
    return 0;
  };

  /**
   * Calcule le prix unitaire après remise produit
   */
  const getPrixApresRemise = (product, prixUnitaire, remise) => {
    if (remise > 0) {
      return prixUnitaire * (1 - remise / 100);
    }
    return prixUnitaire;
  };

  // Calcul des totaux avec prise en compte des remises produits
  const calculerTotauxAvecRemisesProduits = (products, remiseClient) => {
    let sousTotalOriginal = 0;
    let sousTotalApresRemisesProduits = 0;
    let montantTotalRemisesProduits = 0;
    
    products.forEach(product => {
      const prixUnitaireOriginal = Number(product.prixVente || product.prix || 0);
      const quantite = Number(product.quantiteCommande || 1);
      const remiseProduit = getRemiseForProduct(product);
      const prixApresRemise = getPrixApresRemise(product, prixUnitaireOriginal, remiseProduit);
      
      const totalOriginal = prixUnitaireOriginal * quantite;
      const totalApresRemise = prixApresRemise * quantite;
      
      sousTotalOriginal += totalOriginal;
      sousTotalApresRemisesProduits += totalApresRemise;
      montantTotalRemisesProduits += (totalOriginal - totalApresRemise);
    });
    
    // Remise globale client
    const montantRemiseClient = sousTotalApresRemisesProduits * (remiseClient / 100);
    const totalFinal = sousTotalApresRemisesProduits - montantRemiseClient;
    
    return {
      sousTotalOriginal,
      sousTotalApresRemisesProduits,
      montantTotalRemisesProduits,
      montantRemiseClient,
      totalFinal
    };
  };

  const totaux = calculerTotauxAvecRemisesProduits(selectedProducts, remiseAppliquee);
  
  // Formater les nombres
  const formatNumber = (number) => {
    return typeof number === 'number' 
      ? number.toLocaleString(locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3
        })
      : number;
  };

  const formatPrice = (number) => {
    return typeof number === 'number'
      ? number.toLocaleString(locale, {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3
        })
      : number;
  };

  const handleEnregistrerCommande = async () => {
    if (!selectedClient) {
      alert(t('selectClient'));
      return;
    }

    if (selectedProducts.length === 0) {
      alert(t('selectAtLeastOneProduct'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const commandeData = {
        clientId: Number(selectedClient.idClient || selectedClient.id),
        remiseTotale: Number(remiseAppliquee) || 0,
        produits: selectedProducts.map(p => ({
          produitId: Number(p.idProduit || p.id),
          quantite: Number(p.quantiteCommande) || 1,
          prixUnitaire: Number(p.prixVente || p.prix || 0)
        }))
      };

      console.log('📤 Données envoyées:', JSON.stringify(commandeData, null, 2));

      const result = await commandeService.createCommande(commandeData);
      
      console.log('📥 Réponse du backend:', result);
      
      if (result && result.success) {
        console.log("✅ Commande créée avec succès");

        if (onOrderCreated && result.commande) {
          onOrderCreated(result.commande);
        }

        if (setShowSuccessPopup) {
          setShowSuccessPopup(true);
        }
        
        if (setSelectedProducts) setSelectedProducts([]);
        if (setSelectedClient) setSelectedClient(null);
        
        setTimeout(() => {
          window.location.href = '/dashboard/sales/orders';
        }, 1500);
        
      } else {
        const errorMsg = result?.message || t('unknownError');
        throw new Error(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      
      let errorMessage = t('orderCreateError');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      alert(`${t('errorPrefix')} ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
        
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700 font-medium">{t('creatingOrder')}</p>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{t('orderSummary')}</h2>
            <button
              onClick={() => setShowRecap(false)}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Erreur */}
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
            <h3 className="font-bold text-gray-800 mb-4">{t('clientInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t('name')}</div>
                <div className="font-medium text-gray-900">
                  {selectedClient?.nom || selectedClient?.prenom ? 
                    `${selectedClient?.nom || ''} ${selectedClient?.prenom || ''}`.trim() 
                    : t('notSpecified')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('type')}</div>
                <div className="font-medium text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedClient?.typeClient === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    selectedClient?.typeClient === 'ENTREPRISE' ? 'bg-blue-100 text-blue-800' :
                    selectedClient?.typeClient === 'FIDELE' ? 'bg-yellow-100 text-yellow-800' :
                    selectedClient?.typeClient === 'PARTICULIER' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedClient?.typeClient || t('notSpecified')}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('phone')}</div>
                <div className="font-medium text-gray-900">{selectedClient?.telephone || t('notSpecified')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('address')}</div>
                <div className="font-medium text-gray-900">{selectedClient?.adresse || t('notSpecified')}</div>
              </div>
            </div>
          </div>

          {/* Détails des produits avec remises */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4">{t('productDetailsWithCount', { count: selectedProducts.length })}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('product')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('quantity')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('unitPrice')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('subtotal')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedProducts.map((product, index) => {
                    const prixUnitaireOriginal = Number(product.prixVente || product.prix || 0);
                    const quantite = Number(product.quantiteCommande || 1);
                    const remiseProduit = getRemiseForProduct(product);
                    const prixUnitaireApresRemise = getPrixApresRemise(product, prixUnitaireOriginal, remiseProduit);
                    const sousTotalOriginal = prixUnitaireOriginal * quantite;
                    const sousTotalApresRemise = prixUnitaireApresRemise * quantite;
                    const economie = sousTotalOriginal - sousTotalApresRemise;
                    
                    return (
                      <tr key={product.idProduit || product.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.libelle} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                                  <span className="text-white text-xs font-bold">
                                    {product.libelle?.charAt(0).toUpperCase() || 'P'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.libelle || t('unnamedProduct')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.uniteMesure || 'unité'}
                                {product.categorie && ` • ${product.categorie}`}
                              </div>
                              {remiseProduit > 0 && (
                                <div className="text-xs text-green-600 font-medium mt-1">
                                  Remise {remiseProduit}% appliquée
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-medium">{formatNumber(quantite)}</div>
                          <div className="text-xs text-gray-500">
                            {t('stock')}: {formatNumber(product.quantiteStock || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {remiseProduit > 0 ? (
                            <div>
                              <div className="text-gray-400 line-through text-sm">
                                {formatPrice(prixUnitaireOriginal)} dt
                              </div>
                              <div className="text-gray-900 font-medium text-green-600">
                                {formatPrice(prixUnitaireApresRemise)} dt
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-900 font-medium">
                              {formatPrice(prixUnitaireOriginal)} dt
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {remiseProduit > 0 ? (
                            <div>
                              <div className="text-gray-400 line-through text-sm">
                                {formatPrice(sousTotalOriginal)} dt
                              </div>
                              <div className="font-medium text-blue-600">
                                {formatPrice(sousTotalApresRemise)} dt
                              </div>
                              <div className="text-xs text-green-600">
                                Économie: {formatPrice(economie)} dt
                              </div>
                            </div>
                          ) : (
                            <div className="font-medium text-blue-600">
                              {formatPrice(sousTotalOriginal)} dt
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux détaillés */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('financialSummary')}
            </h3>
            <div className="space-y-3">
              {/* Sous-total original */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('subtotalOriginal') || 'Sous-total original'}</span>
                <span className="font-medium text-gray-500 line-through">
                  {formatPrice(totaux.sousTotalOriginal)} dt
                </span>
              </div>
              
              {/* Remises produits */}
              {totaux.montantTotalRemisesProduits > 0 && (
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-gray-600">{t('productDiscounts') || 'Remises produits'}</span>
                    <div className="text-xs text-gray-500">
                      Appliquées automatiquement par catégorie
                    </div>
                  </div>
                  <span className="font-medium text-red-600">-{formatPrice(totaux.montantTotalRemisesProduits)} dt</span>
                </div>
              )}
              
              {/* Sous-total après remises produits */}
              <div className="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <span className="text-gray-700 font-medium">
                  {t('subtotalAfterProductDiscount') || 'Sous-total après remises produits'}
                </span>
                <span className="font-bold text-gray-900">
                  {formatPrice(totaux.sousTotalApresRemisesProduits)} dt
                </span>
              </div>
              
              {/* Remise client */}
              {remiseAppliquee > 0 && (
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-gray-600">{t('clientDiscount') || 'Remise client'}</span>
                    <div className="text-xs text-gray-500">
                      {remiseAppliquee}% ({selectedClient?.typeClient || t('standard')})
                    </div>
                  </div>
                  <span className="font-medium text-red-600">-{formatPrice(totaux.montantRemiseClient)} dt</span>
                </div>
              )}
              
              {/* Total final */}
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
                <div>
                  <span className="font-bold text-gray-800 text-lg">{t('totalToPay')}</span>
                  <div className="text-xs text-gray-500">
                    {t('productCount', { count: selectedProducts.length })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(totaux.totalFinal)} dt
                  </div>
                  <div className="text-sm text-gray-500">{t('taxIncluded')}</div>
                </div>
              </div>

              {/* Économie totale */}
              {(totaux.montantTotalRemisesProduits > 0 || totaux.montantRemiseClient > 0) && (
                <div className="flex justify-end pt-2">
                  <div className="text-xs text-green-600 font-medium">
                    Économie totale: {formatPrice(totaux.montantTotalRemisesProduits + totaux.montantRemiseClient)} dt
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowRecap(false)}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              {t('back')}
            </button>
            
            <button
              onClick={handleEnregistrerCommande}
              disabled={loading || !selectedClient || selectedProducts.length === 0}
              className={`px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 font-medium flex items-center shadow-sm hover:shadow disabled:opacity-50 ${
                loading ? 'opacity-70' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('inProgress')}
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {t('saveOrder')}
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