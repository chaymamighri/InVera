// pages/dashboard/procurement/factures/components/FactureListeTab.jsx
import React from 'react';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import StatutPaiementBadge from './StatutPaiementBadge';

// ✅ Fonction formatPrice locale
const formatPrice = (price) => {
  if (!price) return '0,000 DT';
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price) + ' DT';
};

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

const FactureListeTab = ({ 
  factures, 
  loadingFactures, 
  onViewDetail, 
  onExporterPDF, 
  onUpdatePaiement, 
  exportingId,
  setActiveTab 
}) => {
  if (loadingFactures) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!factures || factures.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune facture générée</p>
          <button onClick={() => setActiveTab('generer')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Générer une facture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-800">Toutes les factures fournisseurs</h2>
        <p className="text-sm text-gray-500 mt-1">Consultez et gérez vos factures</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {factures.map((facture) => (
              <tr key={facture.idFactureFournisseur || facture.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {facture.reference || facture.referenceFactureFournisseur || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(facture.dateFacture || facture.dateFacture)}
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">
                    {facture.fournisseur?.nomFournisseur || facture.nomFournisseur || '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {facture.fournisseur?.email || facture.email || '-'}
                  </p>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {facture.commande?.numeroCommande || facture.numeroCommande || '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  {formatPrice(facture.montantTotal || facture.montantTotal)}
                </td>
                <td className="px-6 py-4 text-center">
                  <StatutPaiementBadge statut={facture.statut || facture.statut} />
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onViewDetail(facture)} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                      title="Voir détails"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onExporterPDF(facture)} 
                      disabled={exportingId === (facture.idFactureFournisseur || facture.id)} 
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" 
                      title="Exporter PDF"
                    >
                      {exportingId === (facture.idFactureFournisseur || facture.id) ? 
                        <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 
                        <DocumentArrowDownIcon className="w-5 h-5" />
                      }
                    </button>
                    {(facture.statut === 'NON_PAYE' || facture.statut === 'NON_PAYE') && (
                      <button 
                        onClick={() => onUpdatePaiement(facture.idFactureFournisseur || facture.id, 'PAYE')} 
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                        title="Marquer comme payée"
                      >
                        <CurrencyDollarIcon className="w-5 h-5" />
                      </button>
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

export default FactureListeTab;