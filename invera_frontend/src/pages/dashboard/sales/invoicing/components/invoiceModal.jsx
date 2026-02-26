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
import * as XLSX from 'xlsx';
import { commandeService } from '../../../../../services/commandeService';
import html2pdf from 'html2pdf.js';
import InvoiceTemplate from './InvoiceTemplate';

const InvoiceModal = ({ isOpen, onClose, facture, onStatusChange }) => {
  //  TOUS LES HOOKS EN PREMIER
  const [updating, setUpdating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

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
                                ligne.produit?.prix ||
                                0;
            
            const totalLigne = ligne.sous_total || 
                              ligne.sousTotal || 
                              ligne.total ||
                              (ligne.quantite * prixUnitaire) || 
                              0;
            
            return {
              description: ligne.produit?.libelle || 
                          ligne.produitLibelle || 
                          ligne.libelle ||
                          'Produit',
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

  //  APRÈS tous les Hooks, on vérifie les conditions
  if (!isOpen || !facture) return null;

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Formatage du montant
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
  
  console.log('🔍 ID facture à payer:', factureId);
  console.log('🔍 ID commande associée:', facture.commandeId);
  
  if (facture.statut === 'PAYE' || updating) return;

  try {
    setUpdating(true);
    
    // Appel API avec l'ID de la facture (11)
    await commandeService.marquerFacturePayee(factureId);
    
    // Passer l'ID de la facture au parent (11)
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

  // Calcul des totaux
  const calculerTotaux = () => {
    const sousTotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const tva = sousTotal * 0.19;
    const totalTTC = sousTotal + tva;
    
    return { sousTotal, tva, totalTTC };
  };

  const totaux = calculerTotaux();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = InvoiceTemplate({ 
      facture, 
      items, 
      totaux, 
      formatDate, 
      formatMontant 
    });
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    try {
      const element = document.createElement('div');
      const htmlContent = InvoiceTemplate({ 
        facture, 
        items, 
        totaux, 
        formatDate, 
        formatMontant 
      });
      
      element.innerHTML = htmlContent;
      document.body.appendChild(element);
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `facture_${facture.referenceFactureClient || facture.reference}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save();
      
      setTimeout(() => {
        document.body.removeChild(element);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const factureData = [
        ['FACTURE', ''],
        ['N°', facture.referenceFactureClient || facture.reference],
        ['Date', formatDate(facture.dateFacture)],
        ['Client', facture.client?.nomComplet || facture.client?.nom || 'N/A'],
        ['Email', facture.client?.email || ''],
        ['Téléphone', facture.client?.telephone || ''],
        ['Statut', facture.statut === 'PAYE' ? 'Payée' : 'Non payée'],
        ['', ''],
        ['ARTICLES', ''],
        ['Description', 'Quantité', 'Prix unitaire', 'Total']
      ];
      
      items.forEach(item => {
        factureData.push([
          item.description,
          item.quantity,
          item.unitPrice,
          item.total
        ]);
      });
      
      factureData.push(
        ['', '', 'Sous-total', totaux.sousTotal],
        ['', '', 'TVA (19%)', totaux.tva],
        ['', '', 'TOTAL TTC', totaux.totalTTC]
      );
      
      const wsFacture = XLSX.utils.aoa_to_sheet(factureData);
      XLSX.utils.book_append_sheet(wb, wsFacture, 'Facture');
      
      const articlesData = items.map(item => ({
        'Description': item.description,
        'Quantité': item.quantity,
        'Prix unitaire (DT)': item.unitPrice,
        'Total (DT)': item.total
      }));
      
      const wsArticles = XLSX.utils.json_to_sheet(articlesData);
      XLSX.utils.book_append_sheet(wb, wsArticles, 'Articles');
      
      XLSX.writeFile(wb, `facture_${facture.referenceFactureClient || facture.reference}.xlsx`);
      
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
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
      {/* Overlay avec blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header minimaliste */}
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
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Exporter"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  </button>
                  
                  {showExportMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            handleExportPDF();
                            setShowExportMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            handleExportExcel();
                            setShowExportMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <TableCellsIcon className="h-4 w-4" />
                          Excel
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handlePrint}
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Imprimer"
                >
                  <PrinterIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
            
            {/* Statut et actions */}
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
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix unitaire
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                            {formatMontant(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">
                            {formatMontant(item.total)}
                          </td>
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
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-600 text-right">
                        Sous-total
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">
                        {formatMontant(totaux.sousTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-600 text-right">
                        TVA (19%)
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">
                        {formatMontant(totaux.tva)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan="3" className="px-6 py-4 text-base font-bold text-gray-900 text-right">
                        TOTAL TTC
                      </td>
                      <td className="px-6 py-4 text-base font-bold text-blue-600 text-right font-mono">
                        {formatMontant(totaux.totalTTC)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pied de page */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimer
              </button>
              
              <button
                onClick={handleExportPDF}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
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