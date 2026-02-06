// src/pages/dashboard/sales/products/components/OrderRecapModal.jsx
import React from 'react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const OrderRecapModal = ({
  showRecap,
  setShowRecap,
  selectedProducts,
  selectedClient,
  remiseAppliquee,
  calculerTotaux,
  handleEnregistrerCommande
}) => {
  if (!showRecap) return null;

  const totaux = calculerTotaux(selectedProducts, remiseAppliquee);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Récapitulatif de la Commande</h2>
            <button
              onClick={() => setShowRecap(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Informations client */}
          <div className="mb-6 bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Nom</div>
                <div className="font-medium text-gray-900">{selectedClient?.nom}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-medium text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedClient?.type === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    selectedClient?.type === 'Entreprise' ? 'bg-blue-100 text-blue-800' :
                    selectedClient?.type === 'Professionnel' ? 'bg-green-100 text-green-800' :
                    selectedClient?.type === 'Fidèle' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedClient?.type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Téléphone</div>
                <div className="font-medium text-gray-900">{selectedClient?.telephone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Adresse</div>
                <div className="font-medium text-gray-900">{selectedClient?.adresse}</div>
              </div>
            </div>
          </div>

          {/* Détails des produits */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Détails des Produits</h3>
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
                  {selectedProducts.map(product => (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
                            <img src={product.imageUrl} alt={product.libelle} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.libelle}</div>
                            <div className="text-sm text-gray-500">{product.uniteMesure}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{product.quantiteCommande || 1}</td>
                      <td className="px-4 py-3 text-gray-900">{product.prix.toFixed(2)} dt</td>
                      <td className="px-4 py-3 font-medium text-blue-600">
                        {(product.prix * (product.quantiteCommande || 1)).toFixed(2)} dt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="mb-6 bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Totaux</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{totaux.sousTotal} dt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remise ({remiseAppliquee}%)</span>
                <span className="font-medium text-red-600">-{totaux.remise} dt</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-blue-600">{totaux.total} dt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Enregistrer */}
          <div className="flex justify-end">
            <button
              onClick={handleEnregistrerCommande}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 font-medium flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Enregistrer la Commande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderRecapModal;