// src/pages/dashboard/sales/sales/components/OrderDetailsModal.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const OrderDetailsModal = ({ commande, isOpen, onClose, onGenerateInvoice }) => {
  // Fonctions utilitaires
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' dt';
  };

  // Si le modal n'est pas ouvert ou si aucune commande n'est sélectionnée
  if (!isOpen || !commande) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header du modal */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Détails de la Commande
            </h2>
            <p className="text-sm text-gray-600">
              {commande.numeroCommande || `CMD-${commande.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu du modal */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations commande */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Informations Commande</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date création:</span>
                    <span className="font-medium">{formatDate(commande.dateCreation)}</span>
                  </div>
                  {commande.dateValidation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date validation:</span>
                      <span className="font-medium text-green-600">{formatDate(commande.dateValidation)}</span>
                    </div>
                  )}
                  {commande.dateLivraisonPrevue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Livraison prévue:</span>
                      <span className="font-medium">{formatDate(commande.dateLivraisonPrevue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode de paiement:</span>
                    <span className="font-medium">{commande.modePaiement || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode de livraison:</span>
                    <span className="font-medium">{commande.modeLivraison || '-'}</span>
                  </div>
                  {commande.statut && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span className={`font-medium ${
                        commande.statut === 'validée' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {commande.statut}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations client */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Informations Client</h3>
                <div className="space-y-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {commande.client?.nomComplet || commande.client?.nom || 'Client non spécifié'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {commande.client?.entreprise || commande.client?.societe || ''}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Tél:</span>
                      <span>{commande.client?.telephone || commande.client?.phone || '-'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Email:</span>
                      <span className="truncate">{commande.client?.email || '-'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Type:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        commande.client?.type === 'VIP' ? 'bg-purple-100 text-purple-800' :
                        commande.client?.type === 'Entreprise' ? 'bg-blue-100 text-blue-800' :
                        commande.client?.type === 'Professionnel' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {commande.client?.type || 'Standard'}
                      </span>
                    </div>
                    {commande.client?.adresse && (
                      <div className="flex items-start text-gray-600">
                        <span className="font-medium mr-2">Adresse:</span>
                        <span className="flex-1">{commande.client.adresse}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {commande.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600 text-sm">{commande.notes}</p>
                </div>
              )}
            </div>

            {/* Produits et résumé */}
            <div className="space-y-4">
              {/* Liste des produits */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Produits ({commande.produits?.length || 0})</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {commande.produits?.map((produit, index) => (
                    <div key={produit.id || index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {produit.nom || produit.libelle || `Produit ${index + 1}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Réf: {produit.reference || produit.code || 'N/A'}
                          </div>
                          {produit.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {produit.description}
                            </div>
                          )}
                          {produit.categorie && (
                            <div className="mt-1">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {produit.categorie}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency((produit.prixUnitaire || produit.prix || 0) * (produit.quantite || 1))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {produit.quantite || 1} × {formatCurrency(produit.prixUnitaire || produit.prix || 0)}
                          </div>
                          {produit.stockDisponible !== undefined && (
                            <div className="text-xs mt-1">
                              Stock: <span className={
                                produit.quantite > produit.stockDisponible ? 'text-red-600' : 'text-green-600'
                              }>
                                {produit.stockDisponible}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {(produit.remiseMontant || produit.remisePourcentage > 0) && (
                        <div className="text-xs text-red-600 border-t pt-2 mt-2">
                          Remise: -{formatCurrency(produit.remiseMontant || 0)}
                          {produit.remisePourcentage > 0 && ` (${produit.remisePourcentage}%)`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Résumé financier */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Résumé Financier</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total:</span>
                    <span>{formatCurrency(commande.sousTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remise:</span>
                    <span className="text-red-600">-{formatCurrency(commande.remiseTotal || 0)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-lg text-blue-700">
                        {formatCurrency(commande.montantTotal || commande.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Fermer
            </button>
            {onGenerateInvoice && (
              <button
                onClick={() => {
                  onGenerateInvoice(commande.id);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Générer Facture
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;