// src/pages/dashboard/sales/components/InvoiceModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { commandeService } from '../../../../../services/commandeService';

const InvoiceModal = ({ isOpen, onClose, facture, commandeId, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  // Charger les articles quand la facture change
  useEffect(() => {
    const loadItems = async () => {
      if (!facture || !facture.commande?.id) {
        setItems([]);
        return;
      }

      try {
        setLoadingItems(true);
        const commandeDetails = await commandeService.getCommandeById(facture.commande.id);
        
        if (commandeDetails && commandeDetails.lignesCommande) {
          const itemsFormatted = commandeDetails.lignesCommande.map(ligne => {
            const prixUnitaire = ligne.prix_unitaire || 
                                ligne.prixUnitaire || 
                                ligne.prix_vente ||
                                ligne.produit?.prix_vente ||
                                ligne.produit?.prix || 0;
            
            const totalLigne = ligne.sous_total || 
                              ligne.sousTotal || 
                              ligne.total ||
                              (ligne.quantite * prixUnitaire) || 0;
            
            return {
              description: ligne.produit?.libelle || 
                          ligne.produitLibelle || 
                          ligne.libelle || 'Produit',
              quantity: ligne.quantite || 0,
              unitPrice: prixUnitaire,
              total: totalLigne
            };
          });
          setItems(itemsFormatted);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('❌ Erreur chargement articles:', error);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    if (isOpen && facture) {
      loadItems();
    }
  }, [facture, isOpen]);

  if (!isOpen || !facture) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatMontant = (montant) => {
    if (montant === undefined || montant === null) return '0,000 DT';
    const nombre = typeof montant === 'number' ? montant : parseFloat(montant);
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(nombre) + ' DT';
  };

  const handleStatusChange = async () => {
    const factureId = facture.id;
    if (facture.statut === 'PAYE' || updating) return;

    try {
      setUpdating(true);
      await commandeService.marquerFacturePayee(factureId);
      if (onStatusChange) {
        await onStatusChange(factureId, 'payée');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(false);
    }
  };

  const calculerTotaux = () => {
    const sousTotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const tva = sousTotal * 0.19;
    const totalTTC = sousTotal + tva;
    return { sousTotal, tva, totalTTC };
  };

  const totaux = calculerTotaux();

  //  Impression: Afficher le PDF dans une nouvelle fenêtre sans téléchargement
const handlePrint = async () => {
  try {
    setPrintLoading(true);
    console.log('🖨️ Impression directe pour facture:', facture.id);
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expirée, veuillez vous reconnecter');
      return;
    }
    
    const apiUrl = 'http://localhost:8081/api';
    const response = await fetch(`${apiUrl}/factures/${facture.id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Ouvrir dans une nouvelle fenêtre et déclencher l'impression immédiatement
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      // Attendre que le PDF soit chargé puis déclencher l'impression
      printWindow.onload = () => {
        printWindow.print();
        // Optionnel: fermer la fenêtre après l'impression
        printWindow.onafterprint = () => {
          printWindow.close();
          URL.revokeObjectURL(pdfUrl);
        };
      };
    } else {
      alert("Veuillez autoriser les popups pour cette application");
      URL.revokeObjectURL(pdfUrl);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('Erreur lors de l\'impression de la facture');
  } finally {
    setPrintLoading(false);
  }
};
  // ✅ Téléchargement du PDF
  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      console.log('📄 Téléchargement PDF pour facture:', facture.id);
      
      const pdfBlob = await commandeService.downloadInvoicePDF(facture.id);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture_${facture.referenceFactureClient || facture.reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement de la facture');
    } finally {
      setExportLoading(false);
    }
  };

  const StatutBadge = () => {
    const isPaye = facture.statut === 'PAYE';
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
        isPaye
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {isPaye ? (
          <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
        ) : (
          <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
        )}
        {isPaye ? 'Payée' : 'En attente'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          
          <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-100">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Facture {facture.referenceFactureClient || facture.reference}
                    </h2>
                    <StatutBadge />
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {formatDate(facture.dateFacture)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="flex items-center justify-between mb-8 p-5 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Statut :</span>
                <StatutBadge />
              </div>
              
              {facture.statut !== 'PAYE' && (
                <button
                  onClick={handleStatusChange}
                  disabled={updating}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Marquer comme payée
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Grille d'informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Client */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  {facture.client?.typeClient === 'ENTREPRISE' ? (
                    <BuildingOfficeIcon className="h-4 w-4" />
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
                  INFORMATIONS CLIENT
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nom / Raison sociale</p>
                    <p className="text-base font-medium text-gray-900">
                      {facture.client?.nomComplet || facture.client?.nom || 'N/A'}
                    </p>
                  </div>
                  
                  {facture.client?.typeClient && (
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="text-sm text-gray-700">{facture.client.typeClient}</p>
                    </div>
                  )}
                  
                  {facture.client?.email && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{facture.client.email}</p>
                    </div>
                  )}
                  
                  {facture.client?.telephone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{facture.client.telephone}</p>
                    </div>
                  )}
                  
                  {facture.client?.adresse && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700">{facture.client.adresse}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Détails facture */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  DÉTAILS FACTURE
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Numéro</p>
                    <p className="text-base font-medium text-gray-900">
                      {facture.referenceFactureClient || facture.reference}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Date d'émission</p>
                    <p className="text-sm text-gray-700">{formatDate(facture.dateFacture)}</p>
                  </div>
                  
                  {facture.commande?.reference && (
                    <div>
                      <p className="text-sm text-gray-500">Commande associée</p>
                      <p className="text-sm text-gray-700">{facture.commande.reference}</p>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-500">Montant total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatMontant(facture.montantTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <TableCellsIcon className="h-5 w-5 text-blue-600" />
                ARTICLES
                {loadingItems && (
                  <div className="ml-2 inline-block animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">{formatMontant(item.unitPrice)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">{formatMontant(item.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                          {loadingItems ? 'Chargement des articles...' : 'Aucun article dans cette facture'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50/50">
                    <tr><td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-600 text-right">Sous-total</td><td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">{formatMontant(totaux.sousTotal)}</td></tr>
                    <tr><td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-600 text-right">TVA (19%)</td><td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">{formatMontant(totaux.tva)}</td></tr>
                    <tr className="border-t-2 border-gray-200"><td colSpan="3" className="px-6 py-4 text-base font-bold text-gray-900 text-right">TOTAL TTC</td><td className="px-6 py-4 text-base font-bold text-blue-600 text-right font-mono">{formatMontant(totaux.totalTTC)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pied de page */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={handlePrint}
                disabled={printLoading}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {printLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full" />
                ) : (
                  <PrinterIcon className="h-4 w-4" />
                )}
                Imprimer
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={exportLoading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {exportLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <DocumentArrowDownIcon className="h-4 w-4" />
                )}
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;