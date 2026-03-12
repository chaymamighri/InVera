// components/TableauCommandes.jsx - VERSION AVEC ARCHIVES
import React from 'react';
import {
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  DocumentCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  ArrowPathIcon,  // ← NOUVEAU: pour la restauration
} from '@heroicons/react/24/outline';
import { formatDate, formatPrice, getStatusBadge } from '../CommandesFournisseurs';

const TableauCommandes = ({
  commandes,
  onView,
  onEdit,
  onDelete,
  onRestore,           // ← NOUVEAU: fonction pour restaurer
  onStatusChange,
  actionInProgress,
  statuts,
  onNouvelleCommande,
  showArchives = false, // ← NOUVEAU: mode archives
}) => {
  if (commandes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">
          {showArchives ? 'Aucune commande archivée trouvée' : 'Aucune commande trouvée'}
        </p>
        {!showArchives && (
          <button
            onClick={onNouvelleCommande}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer votre première commande
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date commande</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livraison prévue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total TTC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commandes.map((commande) => (
              <tr key={commande.idCommandeFournisseur} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {commande.numeroCommande || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {commande.fournisseur?.nomFournisseur || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {commande.fournisseur?.email || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(commande.dateCommande)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(commande.dateLivraisonPrevue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {formatPrice(commande.totalTTC)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(commande.statut)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    
                    {/* ===== MODE ARCHIVES ===== */}
                    {showArchives ? (
                      // En mode archives: seulement voir et restaurer
                      <>
                        <button
                          onClick={() => onRestore?.(commande.idCommandeFournisseur)}
                          disabled={actionInProgress === `restore-${commande.idCommandeFournisseur}`}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Restaurer la commande"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onView(commande)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Voir détails"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      /* ===== MODE NORMAL ===== */
                      <>
                        {/* Actions pour BROUILLON */}
                        {commande.statut === statuts.BROUILLON && (
                          <>
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'valider')}
                              disabled={actionInProgress === `valider-${commande.idCommandeFournisseur}`}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50"
                              title="Valider"
                            >
                              <DocumentCheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEdit(commande)}
                              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                              title="Modifier"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(commande)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Actions pour VALIDEE */}
                        {commande.statut === statuts.VALIDEE && (
                          <>
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'envoyer')}
                              disabled={actionInProgress === `envoyer-${commande.idCommandeFournisseur}`}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50"
                              title="Envoyer"
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                              disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                              className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded disabled:opacity-50"
                              title="Annuler"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Actions pour ENVOYEE */}
                        {commande.statut === statuts.ENVOYEE && (
                          <>
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'recevoir')}
                              disabled={actionInProgress === `recevoir-${commande.idCommandeFournisseur}`}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Recevoir"
                            >
                              <TruckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                              disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                              className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded disabled:opacity-50"
                              title="Annuler"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Actions pour RECUE et FACTUREE */}
                        {(commande.statut === statuts.RECUE || commande.statut === statuts.FACTUREE) && (
                          // Seulement le bouton Voir
                          null
                        )}

                        {/* Actions pour ANNULEE */}
                        {commande.statut === statuts.ANNULEE && null}

                        {/* Bouton Voir pour tous (en mode normal) */}
                        <button
                          onClick={() => onView(commande)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Voir détails"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableauCommandes;