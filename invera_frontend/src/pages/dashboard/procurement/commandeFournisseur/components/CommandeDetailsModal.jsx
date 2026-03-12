// components/commandeDetailsModal.jsx
import React from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

// Constantes
const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  FACTUREE: 'FACTUREE',
  ANNULEE: 'ANNULEE',
  REJETEE: 'REJETEE',
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const CommandeDetailsModal = ({ isOpen, onClose, commande }) => {
  if (!isOpen || !commande) return null;

  const getStatusBadge = (statut) => {
    const colors = {
      [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800',
      [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800',
      [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800',
      [StatutCommande.RECUE]: 'bg-green-100 text-green-800',
      [StatutCommande.FACTUREE]: 'bg-purple-100 text-purple-800',
      [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800',
      [StatutCommande.REJETEE]: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[statut]}`}>
        {statut}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la commande {commande.numeroCommande}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Créée le {formatDate(commande.createdAt)} par {commande.createdBy}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="p-6 space-y-6">
            {/* Infos générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Statut</p>
                {getStatusBadge(commande.statut)}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Date commande</p>
                <p className="font-medium">{formatDate(commande.dateCommande)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Livraison prévue</p>
                <p className="font-medium">{formatDate(commande.dateLivraisonPrevue)}</p>
              </div>
              {commande.dateLivraisonReelle && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Livraison réelle</p>
                  <p className="font-medium">{formatDate(commande.dateLivraisonReelle)}</p>
                </div>
              )}
            </div>

            {/* Fournisseur */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Fournisseur</h4>
              <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nom</p>
                  <p className="font-medium">{commande.fournisseur?.nom}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{commande.fournisseur?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium">{commande.fournisseur?.telephone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Articles</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qté</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Prix unitaire</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {commande.lignesCommande?.map((ligne, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{ligne.produit?.nom}</div>
                          <div className="text-xs text-gray-500">{ligne.produit?.reference}</div>
                        </td>
                        <td className="px-4 py-3 text-right">{ligne.quantite}</td>
                        <td className="px-4 py-3 text-right">{formatPrice(ligne.prixUnitaire)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatPrice(ligne.sousTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totaux */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-medium">{formatPrice(commande.totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA (20%)</span>
                    <span className="font-medium">{formatPrice(commande.totalTVA)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total TTC</span>
                    <span className="text-blue-600">{formatPrice(commande.totalTTC)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandeDetailsModal;