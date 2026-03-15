// components/commandeDetailsModal.jsx - Version finale corrigée
import React, { useEffect } from 'react';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  TruckIcon,
  CurrencyDollarIcon,
  TagIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price);
};

const CommandeDetailsModal = ({ isOpen, onClose, commande }) => {
  useEffect(() => {
    if (commande) {
      console.log('📦 Commande reçue dans modal:', commande);
    }
  }, [commande]);

  if (!isOpen || !commande) return null;

  const getStatusBadge = (statut) => {
    const colors = {
      [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800 border-gray-300',
      [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800 border-blue-300',
      [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [StatutCommande.RECUE]: 'bg-green-100 text-green-800 border-green-300',
      [StatutCommande.FACTUREE]: 'bg-purple-100 text-purple-800 border-purple-300',
      [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800 border-red-300',
      [StatutCommande.REJETEE]: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${colors[statut] || colors[StatutCommande.BROUILLON]}`}>
        {statut}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* ✅ Modal plus large - max-w-6xl au lieu de max-w-5xl */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl shadow-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-full max-w-6xl">

          {/* En-tête avec dégradé */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <TagIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      Commande {commande.numeroCommande || 'N/A'}
                    </h3>
                    {getStatusBadge(commande.statut)}
                  </div>                
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors"
                  title="Exporter"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors"
                  title="Fermer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Corps - hauteur ajustée */}
          <div className="px-8 py-6 bg-gray-50 max-h-[calc(85vh-200px)] overflow-y-auto">
            <div className="space-y-6">

              {/* Informations de livraison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date commande */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Date commande</p>
                      <p className="font-semibold">{formatDate(commande.dateCommande)}</p>
                    </div>
                  </div>
                </div>

                {/* Livraison prévue */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Livraison prévue</p>
                      <p className="font-semibold">{formatDate(commande.dateLivraisonPrevue)}</p>
                    </div>
                  </div>
                </div>

                {/* ✅ Livraison réelle - S'affiche si elle existe */}
                {commande.dateLivraisonReelle && (
                  <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm bg-green-50">
                    <div className="flex items-center gap-3">
                      <TruckIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Livraison réelle</p>
                        <p className="font-semibold text-green-700">
                          {formatDate(commande.dateLivraisonReelle)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fournisseur */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Informations fournisseur</h4>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</p>
                      <p className="text-base font-semibold text-gray-900">
                        {commande.fournisseur?.nomFournisseur || commande.fournisseur?.nom || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                      <a href={`mailto:${commande.fournisseur?.email}`} className="text-base text-blue-600 hover:text-blue-800 font-medium">
                        {commande.fournisseur?.email || 'N/A'}
                      </a>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</p>
                      <a href={`tel:${commande.fournisseur?.telephone}`} className="text-base text-gray-900 font-medium">
                        {commande.fournisseur?.telephone || 'N/A'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Articles - Version qui gère les produits normaux ET manuels */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Détail des articles</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commande.lignesCommande && commande.lignesCommande.length > 0 ? (
                        commande.lignesCommande.map((ligne, index) => {
                          // 🔍 Log pour debug (à supprimer après)
                          console.log('📦 Rendu ligne:', ligne);

                          return (
                            <tr key={ligne.idLigneCommandeFournisseur || index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {ligne.produitLibelle || 'Produit sans nom'}
                                  {ligne.isManual && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Manuel
                                    </span>
                                  )}
                                </div>
                                {ligne.produitReference && (
                                  <div className="text-sm text-gray-500">
                                    Réf: {ligne.produitReference}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                {ligne.quantite}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                {formatPrice(ligne.prixUnitaire)}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-blue-600">
                                {formatPrice(ligne.sousTotal)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            Aucun article dans cette commande
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Récapitulatif des montants</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total HT</span>
                      <span className="font-medium text-gray-900">{formatPrice(commande.totalHT)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">TVA (20%)</span>
                      <span className="font-medium text-gray-900">{formatPrice(commande.totalTVA)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-900">Total TTC</span>
                        <span className="text-xl font-bold text-blue-600">{formatPrice(commande.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied */}
          <div className="bg-gray-100 px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
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