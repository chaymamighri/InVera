// src/pages/dashboard/sales/sales/components/OrderDetailsModal.jsx
import React, { useState } from 'react';
import { 
  XMarkIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const OrderDetailsModal = ({ commande, isOpen, onClose, onGenerateInvoice }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !commande) return null;

  // Données client
  const client = commande.client || {};
  const produits = commande.produits || [];
  const total = parseFloat(commande.montantTotal || commande.total || 0);

  // Vérifier si le client a des coordonnées
  const hasContact = client.telephone || client.email || client.adresse;

  const handleGenerateInvoice = async () => {
    if (!onGenerateInvoice) return;
    
    try {
      setIsGenerating(true);
      
      // Appeler la fonction du parent pour générer la facture
      // Cette fonction doit ouvrir automatiquement InvoiceModal avec la facture générée
      await onGenerateInvoice(commande.id);
      
      // Fermer cette modale après génération
      onClose();
      
    } catch (error) {
      console.error('Erreur génération facture:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        
        {/* Header avec badge de validation - FIXE */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Commande {commande.numeroCommande || `#${commande.id}`}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-white/30 text-white px-2.5 py-1 rounded-full">
                    ✓ Validée
                  </span>
                  <span className="text-xs text-white/80">
                    Prête pour facturation
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors flex-shrink-0"
              title="Fermer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu - SCROLLABLE */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Client - Informations complètes */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              INFORMATIONS CLIENT
            </p>
            
            <div className="mb-3">
              <p className="font-medium text-gray-900 text-base">
                {client.nomComplet || client.nom || 'Client'}
              </p>
              {client.entreprise && (
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                  {client.entreprise}
                </p>
              )}
            </div>

            {hasContact && (
              <div className="space-y-2 mt-3 bg-gray-50 p-3 rounded-lg">
                {client.telephone && (
                  <p className="text-sm text-gray-700 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {client.telephone}
                  </p>
                )}
                {client.email && (
                  <p className="text-sm text-gray-700 flex items-center truncate">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {client.email}
                  </p>
                )}
                {client.adresse && (
                  <p className="text-sm text-gray-700 flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{client.adresse}</span>
                  </p>
                )}
              </div>
            )}

            {client.type && (
              <div className="mt-3">
                <span className="text-xs px-2.5 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                  {client.type}
                </span>
              </div>
            )}
          </div>

          {/* Produits */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              ARTICLES ({produits.length})
            </p>
            
            {produits.length > 0 ? (
              <div className="space-y-3">
                {produits.map((p, idx) => {
                  const quantite = parseFloat(p.quantite || 1);
                  const prix = parseFloat(p.prixUnitaire || p.prix || 0);
                  
                  return (
                    <div key={p.id || idx} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-medium text-gray-900">
                          {p.nom || p.libelle || `Produit ${idx + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {quantite} × {prix.toFixed(2)} dt
                        </p>
                        {p.reference && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Réf: {p.reference}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {(quantite * prix).toFixed(2)} dt
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun article dans cette commande</p>
            )}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700">Total TTC</span>
                <p className="text-xs text-gray-500 mt-0.5">Toutes taxes comprises</p>
              </div>
              <span className="text-2xl font-bold text-green-700">
                {total.toFixed(2)} dt
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-green-200 text-xs text-green-600">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              <span>Commande validée - Prête pour facturation</span>
            </div>
          </div>
        </div>

        {/* Actions - FIXES en bas */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            {/* Bouton Retour */}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Retour
            </button>

            {/* Bouton Facture - OUVRE L'AUTRE MODALE */}
            {onGenerateInvoice && (
              <button
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5" />
                    <span>Générer la facture</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;