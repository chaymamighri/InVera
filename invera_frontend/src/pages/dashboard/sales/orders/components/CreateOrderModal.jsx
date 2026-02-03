// src/pages/dashboard/sales/orders/components/CreateOrderModal.jsx
import React from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const CreateOrderModal = ({
  show,
  onClose,
  clients,
  produits,
  nouvelleCommande,
  setNouvelleCommande,
  onCreerCommande,
  toNumber
}) => {
  if (!show) return null;

  // Fonctions internes
  const handleAjouterProduit = (produit) => {
    const produitExistantIndex = nouvelleCommande.produits.findIndex(p => p.id === produit.id);
    
    if (produitExistantIndex !== -1) {
      const nouveauxProduits = [...nouvelleCommande.produits];
      nouveauxProduits[produitExistantIndex].quantite += 1;
      nouveauxProduits[produitExistantIndex].sousTotal = toNumber(nouveauxProduits[produitExistantIndex].prix) * nouveauxProduits[produitExistantIndex].quantite;
      setNouvelleCommande({...nouvelleCommande, produits: nouveauxProduits});
    } else {
      setNouvelleCommande({
        ...nouvelleCommande,
        produits: [...nouvelleCommande.produits, {
          ...produit,
          quantite: 1,
          sousTotal: toNumber(produit.prix)
        }]
      });
    }
  };

  const handleModifierQuantite = (produitId, nouvelleQuantite) => {
    const nouveauxProduits = nouvelleCommande.produits.map(p => {
      if (p.id === produitId) {
        const quantite = Math.max(1, toNumber(nouvelleQuantite));
        return {
          ...p,
          quantite,
          sousTotal: toNumber(p.prix) * quantite
        };
      }
      return p;
    });
    
    setNouvelleCommande({...nouvelleCommande, produits: nouveauxProduits});
  };

  const handleSupprimerProduit = (produitId) => {
    const nouveauxProduits = nouvelleCommande.produits.filter(p => p.id !== produitId);
    setNouvelleCommande({...nouvelleCommande, produits: nouveauxProduits});
  };

  const totalProduits = nouvelleCommande.produits.reduce((sum, p) => sum + toNumber(p.sousTotal), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Créer une Nouvelle Commande</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sélection Client */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un client *
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={nouvelleCommande.client}
                    onChange={(e) => setNouvelleCommande({...nouvelleCommande, client: e.target.value})}
                  >
                    <option value="">Choisir un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nom} ({client.type})
                      </option>
                    ))}
                  </select>
                </div>

                {nouvelleCommande.client && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Client sélectionné</h4>
                    <div className="text-sm text-gray-600">
                      {clients.find(c => c.id === parseInt(nouvelleCommande.client))?.nom}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Téléphone: {clients.find(c => c.id === parseInt(nouvelleCommande.client))?.telephone}
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarques
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    value={nouvelleCommande.remarques}
                    onChange={(e) => setNouvelleCommande({...nouvelleCommande, remarques: e.target.value})}
                    placeholder="Instructions spéciales, préférences..."
                  />
                </div>
              </div>
            </div>

            {/* Sélection Produits */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border">
                <div className="p-6 border-b">
                  <h3 className="font-bold text-gray-800 mb-4">Produits à commander</h3>
                  
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2">
                    {produits.map(produit => (
                      <div key={produit.id} className="border rounded-lg p-3 hover:border-blue-300 hover:bg-blue-25 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{produit.libelle}</div>
                            <div className="text-sm text-gray-600">{produit.categorie}</div>
                            <div className="text-sm text-green-600 mt-1">
                              Stock: {produit.quantiteStock} {produit.uniteMesure}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{toNumber(produit.prix).toFixed(2)} dt</div>
                            <button
                              onClick={() => handleAjouterProduit(produit)}
                              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <PlusIcon className="h-3 w-3 mr-1" />
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Produits sélectionnés */}
                <div className="p-6">
                  <h4 className="font-bold text-gray-800 mb-4">
                    Produits sélectionnés ({nouvelleCommande.produits.length})
                  </h4>
                  
                  {nouvelleCommande.produits.length > 0 ? (
                    <div className="space-y-3">
                      {nouvelleCommande.produits.map(produit => (
                        <div key={produit.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{produit.libelle}</div>
                            <div className="text-sm text-gray-600">
                              {toNumber(produit.prix).toFixed(2)} dt / {produit.uniteMesure}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center border rounded-lg overflow-hidden">
                              <button
                                onClick={() => handleModifierQuantite(produit.id, produit.quantite - 1)}
                                className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                                disabled={produit.quantite <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={produits.find(p => p.id === produit.id)?.quantiteStock || 999}
                                value={produit.quantite}
                                onChange={(e) => handleModifierQuantite(produit.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center py-1.5 border-x"
                              />
                              <button
                                onClick={() => handleModifierQuantite(produit.id, produit.quantite + 1)}
                                className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                                disabled={produit.quantite >= (produits.find(p => p.id === produit.id)?.quantiteStock || 999)}
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="font-bold text-blue-600 min-w-20 text-right">
                              {toNumber(produit.sousTotal).toFixed(2)} dt
                            </div>
                            
                            <button
                              onClick={() => handleSupprimerProduit(produit.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total */}
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                          <span>Total</span>
                          <span>{totalProduits.toFixed(2)} dt</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Aucun produit sélectionné. Ajoutez des produits depuis la liste ci-dessus.
                    </div>
                  )}
                  
                  {/* Boutons */}
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={onCreerCommande}
                      disabled={!nouvelleCommande.client || nouvelleCommande.produits.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Créer la Commande
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;