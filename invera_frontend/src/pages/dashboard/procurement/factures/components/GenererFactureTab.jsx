// pages/dashboard/procurement/factures/components/GenererFactureTab.jsx
import React from 'react';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatPrice } from '../../commandeFournisseur/CommandesFournisseurs';

// ✅ Fonction formatDate locale
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const GenererFactureTab = ({ 
  commandesSansFacture, 
  loadingCommandes, 
  generatingId, 
  onGenererFacture, 
  setActiveTab 
}) => {
  if (loadingCommandes) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (commandesSansFacture.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="text-center py-12">
          <CheckCircleIcon className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">Toutes les commandes ont leur facture</p>
          <p className="text-sm text-gray-400 mt-1">Aucune commande réceptionnée en attente de facturation</p>
          <button onClick={() => setActiveTab('liste')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Voir les factures
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-800">Commandes réceptionnées sans facture ({commandesSansFacture.length})</h2>
        <p className="text-sm text-gray-500 mt-1">Générez les factures pour les commandes reçues</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date commande</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {commandesSansFacture.map((commande) => (
              <tr key={commande.idCommandeFournisseur} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{commande.numeroCommande}</td>
                <td className="px-6 py-4"><p className="font-medium text-gray-900">{commande.fournisseur?.nomFournisseur}</p></td>
                <td className="px-6 py-4 text-gray-600">{formatDate(commande.dateCommande)}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{formatPrice(commande.totalTTC || commande.totalHT)}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => onGenererFacture(commande)} disabled={generatingId === commande.idCommandeFournisseur} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto">
                    {generatingId === commande.idCommandeFournisseur ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <DocumentTextIcon className="w-4 h-4" />}
                    Générer facture
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenererFactureTab;