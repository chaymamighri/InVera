// src/pages/dashboard/sales/products/components/OrderModal.jsx
import React from 'react';
import { 
  UserIcon, 
  UserPlusIcon, 
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

const OrderModal = ({
  showCreateOrder,
  setShowCreateOrder,
  selectedProducts,
  setSelectedProducts,
  clients,
  selectedClient,
  newClientMode,
  setNewClientMode,
  nouveauClient,
  setNouveauClient,
  remiseAppliquee,
  handleSelectClient,
  handleAddNewClient,
  handleCreateCommande,
  checkDisponibilite,
  typesClient,

}) => {
  // Fonctions internes
  const handleChangeQuantite = (productId, newQuantite) => {
    const updatedProducts = selectedProducts.map(p => 
      p.id === productId 
        ? { ...p, quantiteCommande: Math.max(1, Math.min(newQuantite, p.quantiteStock)) }
        : p
    );
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const calculerTotaux = (products, remise) => {
    const sousTotal = products.reduce((sum, p) => 
      sum + (p.prix * (p.quantiteCommande || 1)), 0
    );
    const montantRemise = sousTotal * (remise / 100);
    const total = sousTotal - montantRemise;
    
    return {
      sousTotal: sousTotal.toFixed(2),
      remise: montantRemise.toFixed(2),
      total: total.toFixed(2)
    };
  };

  if (!showCreateOrder) return null;

  const totaux = calculerTotaux(selectedProducts, remiseAppliquee);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Créer une Commande Client ({selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''})
            </h2>
            <button
              onClick={() => setShowCreateOrder(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Informations sur les produits sélectionnés */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Produits Sélectionnés</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                        <img src={product.imageUrl} alt={product.libelle} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.libelle}</div>
                        <div className="text-sm text-gray-600">
                          {product.quantiteCommande || 1} × {product.prix.toFixed(2)} dt
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleChangeQuantite(product.id, (product.quantiteCommande || 1) - 1)}
                          className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                          disabled={(product.quantiteCommande || 1) <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.quantiteStock}
                          value={product.quantiteCommande || 1}
                          onChange={(e) => handleChangeQuantite(product.id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center py-1.5 border-x"
                        />
                        <button
                          onClick={() => handleChangeQuantite(product.id, (product.quantiteCommande || 1) + 1)}
                          className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                          disabled={(product.quantiteCommande || 1) >= product.quantiteStock}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-gray-700">Sous-total</div>
                  <div className="font-bold text-gray-900">{totaux.sousTotal} dt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sélection du client */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Sélection du Client</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setNewClientMode(false)}
                  className={`px-3 py-1 rounded-lg text-sm ${!newClientMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Client existant
                </button>
                <button
                  onClick={() => setNewClientMode(true)}
                  className={`px-3 py-1 rounded-lg text-sm ${newClientMode ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <UserPlusIcon className="h-4 w-4 inline mr-1" />
                  Nouveau client
                </button>
              </div>
            </div>

            {!newClientMode ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedClient?.id === client.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{client.nom}</div>
                        <div className="text-sm text-gray-600">{client.type}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          📞 {client.telephone}
                        </div>
                        {client.adresse && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {client.adresse}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.type === 'VIP' ? 'bg-purple-100 text-purple-800' :
                        client.type === 'Entreprise' ? 'bg-blue-100 text-blue-800' :
                        client.type === 'Professionnel' ? 'bg-green-100 text-green-800' :
                        client.type === 'Fidèle' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {client.type}
                      </span>
                    </div>
                    {selectedClient?.id === client.id && remiseAppliquee > 0 && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Remise automatique appliquée: {remiseAppliquee}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom et Prénom *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={nouveauClient.nom}
                      onChange={(e) => setNouveauClient({...nouveauClient, nom: e.target.value})}
                      placeholder="Nom"
                    />
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={nouveauClient.prenom}
                      onChange={(e) => setNouveauClient({...nouveauClient, prenom: e.target.value})}
                      placeholder="Prénom"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de client
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={nouveauClient.type}
                      onChange={(e) => setNouveauClient({...nouveauClient, type: e.target.value})}
                    >
                      {typesClient.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={nouveauClient.telephone}
                      onChange={(e) => setNouveauClient({...nouveauClient, telephone: e.target.value})}
                      placeholder="XX XXX XXX"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    value={nouveauClient.adresse}
                    onChange={(e) => setNouveauClient({...nouveauClient, adresse: e.target.value})}
                    placeholder="Numéro, rue, ville, code postal..."
                  />
                </div>
                
                <button
                  onClick={handleAddNewClient}
                  disabled={!nouveauClient.nom || !nouveauClient.telephone}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter le client
                </button>
              </div>
            )}
          </div>

          {/* Vérification de disponibilité */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vérification Disponibilité
            </label>
            <div className={`p-4 rounded-lg ${checkDisponibilite(selectedProducts) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {checkDisponibilite(selectedProducts) ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-700 font-medium">Tous les produits sont disponibles</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700 font-medium">Certains produits ne sont pas disponibles</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProducts.filter(p => p.quantiteStock < (p.quantiteCommande || 1)).length} produit(s) avec stock insuffisant
              </p>
            </div>
          </div>

          {/* Boutons Créer/Annuler */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowCreateOrder(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateCommande}
              disabled={!selectedClient || !checkDisponibilite(selectedProducts)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Créer Commande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;