// components/TableauCommandes.jsx - Version CORRIGÉE avec onRecevoir
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
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

// ✅ Constantes locales
const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  FACTUREE: 'FACTUREE',
  ANNULEE: 'ANNULEE',
  REJETEE: 'REJETEE',
};

// ✅ Formatage
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
  }).format(price);
};

// ✅ Badge de statut
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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut]}`}>
      {statut}
    </span>
  );
};

const TableauCommandes = ({
  commandes,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onRecevoir, // ✅ NOUVEAU prop pour la réception
  actionInProgress,
  statuts = StatutCommande,
  onNouvelleCommande,
  showArchives = false,
}) => {

  // Statuts "archivés" (lecture seule)
  const statutsArchives = [
    statuts.ANNULEE,
    statuts.REJETEE,
    statuts.FACTUREE,
  ];

  if (commandes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        {showArchives ? (
          <ArchiveBoxIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        ) : (
          <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        )}
        <p className="text-gray-500 text-lg">
          {showArchives ? 'Aucune commande archivée' : 'Aucune commande trouvée'}
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
            {commandes.map((commande) => {
              // ✅ En mode archive : tous les boutons sauf Voir sont CACHÉS
              const isArchived = showArchives || statutsArchives.includes(commande.statut);

              return (
                <tr
                  key={commande.idCommandeFournisseur}
                  className={`hover:bg-gray-50 ${isArchived ? 'opacity-75 bg-gray-50' : ''}`}
                >
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

                      {/* BROUILLON - UNIQUEMENT si NON archivé et si onStatusChange est défini */}
                      {commande.statut === statuts.BROUILLON && !isArchived && onStatusChange && (
                        <>
                          <button
                            onClick={() => onStatusChange(commande.idCommandeFournisseur, 'valider')}
                            disabled={actionInProgress === `valider-${commande.idCommandeFournisseur}`}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50"
                            title="Valider"
                          >
                            <DocumentCheckIcon className="w-4 h-4" />
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(commande)}
                              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                              title="Modifier"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(commande)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* VALIDEE - UNIQUEMENT si NON archivé et si onStatusChange est défini */}
                      {commande.statut === statuts.VALIDEE && !isArchived && onStatusChange && (
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

                      {/* ENVOYEE - UNIQUEMENT si NON archivé */}
                      {commande.statut === statuts.ENVOYEE && !isArchived && (
                        <>
                          {/* ✅ Utilisation de onRecevoir au lieu de onStatusChange */}
                          {onRecevoir && (
                            <button
                              onClick={() => onRecevoir(commande)}
                              disabled={actionInProgress === `recevoir-${commande.idCommandeFournisseur}`}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Réceptionner"
                            >
                              <TruckIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onStatusChange && (
                            <button
                              onClick={() => onStatusChange(commande.idCommandeFournisseur, 'annuler')}
                              disabled={actionInProgress === `annuler-${commande.idCommandeFournisseur}`}
                              className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded disabled:opacity-50"
                              title="Annuler"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* RECUE - UNIQUEMENT si NON archivé et si onStatusChange est défini */}
                      {commande.statut === statuts.RECUE && !isArchived && onStatusChange && (
                        <button
                          onClick={() => onStatusChange(commande.idCommandeFournisseur, 'facturer')}
                          disabled={actionInProgress === `facturer-${commande.idCommandeFournisseur}`}
                          className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded disabled:opacity-50"
                          title="Facturer"
                        >
                          <DocumentCheckIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Bouton Voir - TOUJOURS visible et actif */}
                      <button
                        onClick={() => onView(commande)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Voir détails"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableauCommandes;