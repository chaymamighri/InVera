// src/pages/dashboard/sales/sales/components/SalesTable.jsx
import React, { useState } from 'react';
import { 
  EyeIcon,
  PrinterIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

// Importez vos modals externes
import OrderDetailsModal from './OrderDetailsModal';

const SalesTable = ({ commandes, loading, onGenerateInvoice }) => {
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

  const handleViewDetails = (commande, e) => {
    e?.stopPropagation();
    setSelectedCommande(commande);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCommande(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-gray-600 text-sm">Chargement des commandes...</p>
      </div>
    );
  }

  // Filtrer uniquement les commandes validées
  const commandesValidees = commandes.filter(cmd => 
    cmd.statut?.toLowerCase() === 'validée' || 
    cmd.status?.toLowerCase() === 'validée'
  );

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {/* En-tête du tableau */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-800">Commandes Validées</h3>
              <p className="text-sm text-gray-600 mt-1">
                {commandesValidees.length} commande{commandesValidees.length !== 1 ? 's' : ''} prête{commandesValidees.length !== 1 ? 's' : ''} pour facturation
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Validée</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° COMMANDE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CLIENT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRODUITS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TOTAL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commandesValidees.map((commande) => (
                <tr 
                  key={commande.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* N° Commande */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-700">
                      {commande.numeroCommande || `CMD-${commande.id}`}
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">
                        {commande.client?.nomComplet || commande.client?.nom || 'Client'}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {commande.client?.entreprise || commande.client?.societe || ''}
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(commande.dateCreation)}
                    </div>
                  </td>

                  {/* Produits */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {commande.produits?.length || 0} produit{commande.produits?.length !== 1 ? 's' : ''}
                      </div>
                      {commande.produits?.[0] && (
                        <div className="text-gray-500 truncate max-w-[180px]">
                          {commande.produits[0].nom || commande.produits[0].libelle}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base font-semibold text-gray-900">
                      {formatCurrency(commande.montantTotal || commande.total)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateInvoice(commande.id); // <-- Appelle la fonction du parent
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center"
                        title="Générer facture"
                      >
                        <PrinterIcon className="h-4 w-4 mr-1.5" />
                        Facture
                      </button>
                      <button
                        onClick={(e) => handleViewDetails(commande, e)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Voir détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {commandesValidees.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <ShoppingCartIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune commande validée</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Les commandes "validée" apparaîtront ici.
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails externe */}
      <OrderDetailsModal
        commande={selectedCommande}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        onGenerateInvoice={onGenerateInvoice} // <-- Passe la fonction au modal de détails
      />
    </>
  );
};

export default SalesTable;