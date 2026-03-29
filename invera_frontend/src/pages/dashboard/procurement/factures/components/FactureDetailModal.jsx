// pages/dashboard/procurement/factures/components/FactureDetailModal.jsx
import React from 'react';
import {
  DocumentArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { formatPrice } from '../../commandeFournisseur/CommandesFournisseurs';
import StatutPaiementBadge from './StatutPaiementBadge';

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

const FactureDetailModal = ({ 
  showModal, 
  selectedFacture, 
  onClose, 
  onExporterPDF, 
  onUpdatePaiement 
}) => {
  if (!showModal || !selectedFacture) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Détail de la facture</h3>
              <p className="text-sm text-gray-500 mt-1">Référence: {selectedFacture.reference}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">✕</button>
          </div>
          
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b">
              <div><p className="text-xs text-gray-500 uppercase">Date d'émission</p><p className="font-medium text-gray-900">{formatDate(selectedFacture.dateFacture)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase">Montant TTC</p><p className="font-medium text-green-600 text-lg">{formatPrice(selectedFacture.montantTotal)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase">Statut paiement</p><StatutPaiementBadge statut={selectedFacture.statut} /></div>
              <div><p className="text-xs text-gray-500 uppercase">N° Commande</p><p className="font-medium text-gray-900">{selectedFacture.commande?.numeroCommande}</p></div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Fournisseur</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedFacture.fournisseur?.nomFournisseur}</p>
                <p className="text-sm text-gray-600">{selectedFacture.fournisseur?.email}</p>
                <p className="text-sm text-gray-600">{selectedFacture.fournisseur?.telephone}</p>
              </div>
            </div>
            
            {selectedFacture.lignes && selectedFacture.lignes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Détail des articles</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qté</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Prix HT</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">TVA</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedFacture.lignes.map((ligne, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{ligne.produit?.libelle || '-'}</td>
                          <td className="px-4 py-2 text-sm text-right">{ligne.quantite}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatPrice(ligne.prixUnitaire)}</td>
                          <td className="px-4 py-2 text-sm text-right">{ligne.tauxTVA}%</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">{formatPrice(ligne.sousTotalTTC)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
            {selectedFacture.statut === 'NON_PAYE' && (
              <button onClick={() => onUpdatePaiement(selectedFacture.idFactureFournisseur, 'PAYE')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
                <CurrencyDollarIcon className="w-4 h-4" /> Marquer comme payée
              </button>
            )}
            <button onClick={() => onExporterPDF(selectedFacture)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <DocumentArrowDownIcon className="w-4 h-4" /> Exporter PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureDetailModal;