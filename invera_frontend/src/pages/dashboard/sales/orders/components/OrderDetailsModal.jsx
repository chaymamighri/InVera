// src/pages/dashboard/sales/orders/components/OrderDetailsModal.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const OrderDetailsModal = ({
  show,
  onClose,
  commande,
  getStatusIcon,
  getStatusColor,
  toNumber
}) => {
  if (!show || !commande) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Détails de la Commande</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4">Informations Commande</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Numéro</div>
                  <div className="font-medium text-gray-900">{commande.numero}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date création</div>
                  <div className="font-medium text-gray-900">{commande.dateCreation}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Livraison prévue</div>
                  <div className="font-medium text-gray-900">{commande.dateLivraisonPrevue}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Statut</div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(commande.statut)}`}>
                    {getStatusIcon(commande.statut)}
                    <span className="ml-1.5">{commande.statut}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Client</div>
                  <div className="font-medium text-gray-900">{commande.client?.nom || 'Client inconnu'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="font-medium text-gray-900">{commande.client?.type || ''}</div>
                </div>
                {commande.remarques && (
                  <div>
                    <div className="text-sm text-gray-600">Remarques</div>
                    <div className="font-medium text-gray-900">{commande.remarques}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Détails des produits */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Produits commandés</h3>
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
                  {(commande.produits || []).map(produit => (
                    <tr key={produit.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{produit.libelle}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{toNumber(produit.quantite)}</td>
                      <td className="px-4 py-3 text-gray-900">{toNumber(produit.prix).toFixed(2)} dt</td>
                      <td className="px-4 py-3 font-medium text-blue-600">
                        {toNumber(produit.sousTotal).toFixed(2)} dt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Récapitulatif financier</h3>
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{toNumber(commande.sousTotal).toFixed(2)} dt</span>
              </div>
              {toNumber(commande.remise) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Remise</span>
                  <span className="font-medium text-red-600">-{toNumber(commande.remise).toFixed(2)} dt</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    {toNumber(commande.total).toFixed(2)} dt
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;