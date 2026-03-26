// components/product/ProductMovementsTab.jsx
import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useStockMovements } from '../../../../../hooks/useStockMovements'; 

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

const ProductMovementsTab = ({ productId }) => {

  const { 
    movements, 
    loading, 
    error, 
    fetchMovementsByProduct 
  } = useStockMovements();

  useEffect(() => {
    if (productId) {
      fetchMovementsByProduct(productId);
    }
  }, [productId, fetchMovementsByProduct]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => fetchMovementsByProduct(productId)} 
          className="mt-2 text-blue-500 text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun mouvement de stock pour ce produit</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Historique des mouvements</h3>
        <button 
          onClick={() => fetchMovementsByProduct(productId)} 
          className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Rafraîchir
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qté</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Stock avant</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Stock après</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Référence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Document</th>
             </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(m.dateMouvement)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    m.typeMouvement === 'ENTREE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {m.typeMouvement === 'ENTREE' ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    {m.typeMouvement === 'ENTREE' ? 'Entrée' : 'Sortie'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{m.quantite}</td>
                <td className="px-4 py-3 text-right text-gray-500">{m.stockAvant}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-600">{m.stockApres}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {m.reference}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {m.typeDocument === 'COMMANDE_FOURNISSEUR' ? 'Commande' : m.typeDocument}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductMovementsTab;