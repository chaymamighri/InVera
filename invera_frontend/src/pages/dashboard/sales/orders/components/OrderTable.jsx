// src/pages/dashboard/sales/orders/components/OrderTable.jsx
import React from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

const OrderTable = ({
  commandes,
  sortField,
  sortDirection,
  onSort,
  onValider,
  onRejeter,
  onVoirDetails,
  getStatusIcon,
  getStatusColor,
  toNumber
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('numero')}
              >
                <div className="flex items-center">
                  N° Commande
                  {sortField === 'numero' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('client')}
              >
                <div className="flex items-center">
                  Client
                  {sortField === 'client' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('dateCreation')}
              >
                <div className="flex items-center">
                  Date
                  {sortField === 'dateCreation' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produits
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('total')}
              >
                <div className="flex items-center">
                  Montant
                  {sortField === 'total' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commandes.map((commande) => (
              <tr key={commande.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-blue-600">{commande.numero}</div>
                  <div className="text-sm text-gray-500">
                    Livraison: {commande.dateLivraisonPrevue}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{commande.client?.nom || 'Client inconnu'}</div>
                  <div className="text-sm text-gray-500">{commande.client?.type || ''}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{commande.dateCreation}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {commande.produits?.length || 0} produit(s)
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-xs">
                    {(commande.produits || []).map(p => p.libelle).join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">
                    {toNumber(commande.total).toFixed(2)} dt
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="line-through">{toNumber(commande.sousTotal).toFixed(2)} dt</span>
                    {toNumber(commande.remise) > 0 && (
                      <span className="text-red-600 ml-2">-{toNumber(commande.remise).toFixed(2)} dt</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(commande.statut)}`}>
                    {getStatusIcon(commande.statut)}
                    <span className="ml-1.5">{commande.statut}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onVoirDetails(commande)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {commande.statut === 'En attente' && (
                      <>
                        <button
                          onClick={() => onValider(commande.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Valider"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onRejeter(commande.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rejeter"
                        >
                          <XCircleIcon className="h-4 w-4" />
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

      {commandes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 text-gray-300">📋</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune commande trouvée</h3>
          <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  );
};

export default OrderTable;