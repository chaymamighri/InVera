/**
 * OrderDetailsModal - Modale affichant les détails d'une commande
 *
 * Affiche :
 * - Infos client (nom, contact, entreprise)
 * - Produits commandés avec quantité et prix
 * - Total de la commande
 * - Statut : validée / facturée
 *
 * Permet :
 * - Générer une facture si elle n'existe pas
 * - Consulter la facture si elle existe
 * - Fermer la modale
 *
 * Props :
 * - commande : objet commande
 * - isOpen : booléen ouverture modale
 * - onClose : fonction fermeture
 * - onGenerateInvoice : fonction génération facture
 * - onViewInvoice : fonction consulter facture
 * - hasInvoice : booléen facture existante
 */

import React, { useState } from 'react';
import { 
  XMarkIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const OrderDetailsModal = ({ 
  commande, 
  isOpen, 
  onClose, 
  onGenerateInvoice,
  onViewInvoice,
  hasInvoice = false // Nouvelle prop pour savoir si une facture existe
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !commande) return null;

  const client = commande.client || {};
  const produits = commande.produits || [];
  const total = parseFloat(commande.montantTotal || commande.total || 0);
  const hasContact = client.telephone || client.email || client.adresse;

  const handleGenerateInvoice = async () => {
    if (!onGenerateInvoice) return;
    
    try {
      setIsGenerating(true);
      await onGenerateInvoice(commande.id);
      onClose();
    } catch (error) {
      console.error('Erreur génération facture:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewInvoice = () => {
    if (onViewInvoice) {
      onViewInvoice(commande.id);
      onClose(); // Optionnel: fermer cette modale après avoir ouvert la facture
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        
        {/* Header avec badge de statut facture */}
        <div className={`px-6 py-4 flex-shrink-0 ${
          hasInvoice 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                {hasInvoice ? (
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Commande {commande.referenceCommandeClient || commande.numeroCommande || `#${commande.id}`}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-white/30 text-white px-2.5 py-1 rounded-full">
                    Validée
                  </span>
                  {hasInvoice && (
                    <span className="text-xs bg-blue-500/30 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                      <DocumentTextIcon className="h-3 w-3" />
                      Facturée
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Client */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">CLIENT</p>
            
            <p className="font-medium text-gray-900">
              {client.nomComplet || client.nom || 'Client'}
            </p>
            {client.entreprise && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <BuildingOfficeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                {client.entreprise}
              </p>
            )}

            {hasContact && (
              <div className="space-y-2 mt-3 bg-gray-50 p-3 rounded-lg">
                {client.telephone && (
                  <p className="text-sm text-gray-700 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {client.telephone}
                  </p>
                )}
                {client.email && (
                  <p className="text-sm text-gray-700 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {client.email}
                  </p>
                )}
                {client.adresse && (
                  <p className="text-sm text-gray-700 flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span>{client.adresse}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Produits */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">
              ARTICLES ({produits.length})
            </p>
            
            {produits.length > 0 ? (
              <div className="space-y-3">
                {produits.map((p, idx) => {
                  const quantite = parseFloat(p.quantite || 1);
                  const prix = parseFloat(p.prixUnitaire || p.prix || 0);
                  
                  return (
                    <div key={p.id || idx} className="flex justify-between items-start py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {p.nom || p.libelle || `Produit ${idx + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {quantite} × {prix.toFixed(2)} dt
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {(quantite * prix).toFixed(2)} dt
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun article</p>
            )}
          </div>

          {/* Total */}
          <div className={`p-4 rounded-lg border ${
            hasInvoice 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Commande</span>
              <span className={`text-2xl font-bold ${
                hasInvoice ? 'text-blue-700' : 'text-green-700'
              }`}>
                {total.toFixed(2)} dt
              </span>
            </div>
            {hasInvoice && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <DocumentTextIcon className="h-3 w-3" />
                Une facture a déjà été générée pour cette commande
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Retour
            </button>

            {hasInvoice ? (
              // Si facture existe → Bouton CONSULTER
              <button
                onClick={handleViewInvoice}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
              >
                <EyeIcon className="h-5 w-5" />
                Consulter la facture
              </button>
            ) : (
              // Si pas de facture → Bouton GÉNÉRER
              <button
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
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