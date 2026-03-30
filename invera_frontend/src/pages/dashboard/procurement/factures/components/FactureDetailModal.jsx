// pages/dashboard/procurement/factures/components/FactureDetailModal.jsx
import React from 'react';
import {
  DocumentArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import StatutPaiementBadge from './StatutPaiementBadge';

// ✅ Fonction formatPrice locale
const formatPrice = (price) => {
  if (!price && price !== 0) return '0,000 DT';
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

const FactureDetailModal = ({ showModal, selectedFacture, onClose, onExporterPDF, onUpdatePaiement }) => {
  if (!showModal || !selectedFacture) return null;

  // ✅ Récupération des données
  const reference = selectedFacture.reference || '-';
  const dateFacture = selectedFacture.dateFacture;
  const montantTotal = selectedFacture.montantTotal || 0;
  const statut = selectedFacture.statut;
  const factureId = selectedFacture.idFactureFournisseur;
  
  // ✅ Fournisseur
  const fournisseur = selectedFacture.fournisseur;
  const fournisseurNom = fournisseur?.nomFournisseur || '-';
  const fournisseurEmail = fournisseur?.email || '-';
  const fournisseurTelephone = fournisseur?.telephone || '-';
  const fournisseurAdresse = fournisseur?.adresse || '-';
  const fournisseurVille = fournisseur?.ville || '-';
  // ✅ Supprimer ou commenter les variables qui n'existent pas
  // const fournisseurCodePostal = fournisseur?.codePostal || '';
  // const fournisseurPays = fournisseur?.pays || '';
  
  // ✅ Commande
  const commande = selectedFacture.commande;
  const numeroCommande = commande?.numeroCommande || '-';
  const dateCommande = commande?.dateCommande;
  const numeroBonLivraison = commande?.numeroBonLivraison || '-';
  
  // ✅ Lignes - CORRECTION : les lignes sont dans selectedFacture.lignesCommande
  const lignesCommande = selectedFacture.lignesCommande || [];

  // ✅ Calcul des totaux
  const totalHT = lignesCommande.reduce((sum, ligne) => sum + (ligne.sousTotalHT || 0), 0);
  const totalTVA = lignesCommande.reduce((sum, ligne) => sum + (ligne.montantTVA || 0), 0);

  console.log('📊 Données extraites:', {
    reference,
    montantTotal,
    statut,
    fournisseurNom,
    numeroCommande,
    nbLignes: lignesCommande.length,
    totalHT,
    totalTVA
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-white">Détail de la facture fournisseur</h3>
              <p className="text-sm text-blue-100 mt-1">Référence: {reference}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              ✕
            </button>
          </div>
          
          <div className="px-6 py-6">
            {/* Infos générales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date d'émission</p>
                <p className="font-semibold text-gray-900 mt-1">{formatDate(dateFacture)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Montant TTC</p>
                <p className="font-bold text-green-600 text-xl mt-1">{formatPrice(montantTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Statut paiement</p>
                <div className="mt-1">
                  <StatutPaiementBadge statut={statut} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">N° Commande</p>
                <p className="font-semibold text-gray-900 mt-1 font-mono">{numeroCommande}</p>
              </div>
            </div>
            
            {/* Fournisseur */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                Fournisseur
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 text-lg">{fournisseurNom}</p>
                <p className="text-sm text-gray-600 mt-1">{fournisseurAdresse}</p>
                {fournisseurVille && <p className="text-sm text-gray-600">{fournisseurVille}</p>}
                <p className="text-sm text-gray-600 mt-2">{fournisseurEmail}</p>
                <p className="text-sm text-gray-600">{fournisseurTelephone}</p>
              </div>
            </div>
            
            {/* Informations commande */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                Informations commande
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">N° Commande</p>
                    <p className="font-medium text-gray-900 mt-1 font-mono">{numeroCommande}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Date commande</p>
                    <p className="font-medium text-gray-900 mt-1">{dateCommande ? formatDate(dateCommande) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Bon de livraison</p>
                    <p className="font-medium text-gray-900 mt-1 font-mono">{numeroBonLivraison}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total HT</p>
                    <p className="font-medium text-gray-900 mt-1">{formatPrice(totalHT)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Détail des articles */}
            {lignesCommande && lignesCommande.length > 0 ? (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Détail des articles ({lignesCommande.length})
                </h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qté</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix HT</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">TVA</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {lignesCommande.map((ligne, idx) => {
                        const produit = ligne.produit;
                        const produitLibelle = produit?.libelle || 'Produit non défini';
                        const quantite = ligne.quantite || 0;
                        const prixUnitaire = ligne.prixUnitaire || 0;
                        const tauxTVA = produit?.categorie?.tauxTVA || 20;
                        const totalTTC = ligne.sousTotalTTC || (quantite * prixUnitaire * (1 + tauxTVA / 100));
                        const referenceProduit = produit?.reference || '';
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{produitLibelle}</div>
                              {referenceProduit && (
                                <div className="text-xs text-gray-500 mt-0.5">Réf: {referenceProduit}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{quantite}</td>
                            <td className="px-4 py-3 text-sm text-right font-mono">{formatPrice(prixUnitaire)}</td>
                            <td className="px-4 py-3 text-sm text-right">{tauxTVA}%</td>
                            <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-gray-900">{formatPrice(totalTTC)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-800">Total TTC</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">{formatPrice(montantTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Aucun détail d'article disponible</p>
                <p className="text-xs text-gray-400 mt-1">Cette facture ne contient aucun article</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
            {statut === 'NON_PAYE' && (
              <button 
                onClick={() => onUpdatePaiement(factureId, 'PAYE')} 
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <CurrencyDollarIcon className="w-4 h-4" /> 
                Marquer comme payée
              </button>
            )}
            <button 
              onClick={() => onExporterPDF(selectedFacture)} 
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" /> 
              Exporter PDF
            </button>
            <button 
              onClick={onClose} 
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureDetailModal;