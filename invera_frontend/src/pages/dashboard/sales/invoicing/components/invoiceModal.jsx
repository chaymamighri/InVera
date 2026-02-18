// src/pages/dashboard/sales/invoicing/components/InvoiceModal.jsx
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
  TagIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  MapPinIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { commandeService } from '../../../../../services/commandeService';
import html2pdf from 'html2pdf.js';
import InvoiceTemplate from './InvoiceTemplate';

const InvoiceModal = ({ isOpen, onClose, facture, onStatusChange }) => {
  // 1. Vérification conditionnelle TOUT EN HAUT
  if (!isOpen || !facture) return null;

  // 2. Ensuite seulement, les hooks
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
        console.log('📦 Chargement commande:', facture.commande.id);
        
        const commandeDetails = await commandeService.getCommandeById(facture.commande.id);
        console.log('📦 Détails commande reçus:', commandeDetails);
        
        if (commandeDetails && commandeDetails.lignesCommande) {
          console.log(' Structure de la première ligne:', JSON.stringify(commandeDetails.lignesCommande[0], null, 2));
          
          const itemsFormatted = commandeDetails.lignesCommande.map(ligne => {
            // Afficher tous les champs disponibles
            console.log('📦 Champs disponibles dans ligne:', Object.keys(ligne));
            console.log('📦 Produit dans ligne:', ligne.produit);
            
            // Essayer différentes sources pour le prix
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
              total: totalLigne,
              raw: ligne
            };
          });
          
          console.log('📦 Articles formatés:', itemsFormatted);
          setItems(itemsFormatted);
        } else {
          console.log('📦 Pas de lignes de commande trouvées');
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

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
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

  // changer statut à PAYÉ
  const handleStatusChange = async () => {
    // Ne rien faire si déjà PAYÉ
    if (facture.statut === 'PAYE') {
      console.log('Facture déjà payée');
      return;
    }

    try {
      setUpdating(true);
      console.log(' Marquage facture comme payée:', facture.id);
      
      // Appel API pour marquer comme payée
      await commandeService.marquerFacturePayee(facture.id);
      
      // Mise à jour locale - envoyer 'payée' au parent (format attendu par le parent)
      if (onStatusChange) {
        await onStatusChange(facture.id, 'payée');
      }
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(false);
    }
  };

  // Calcul des totaux à partir des articles réels
  const calculerTotaux = () => {
    const sousTotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const tva = sousTotal * 0.19; // TVA 19%
    const totalTTC = sousTotal + tva;
    
    return {
      sousTotal,
      tva,
      totalTTC
    };
  };

  const totaux = calculerTotaux();

const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  
  // Utilisez le template
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
    // 1. Créer un élément div temporaire
    const element = document.createElement('div');
    
    // 2. Générer le HTML à partir du template
    const htmlContent = InvoiceTemplate({ 
      facture, 
      items, 
      totaux, 
      formatDate, 
      formatMontant 
    });
    
    // 3. Injecter le HTML dans l'élément
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    
    // 4. Options pour le PDF
    const opt = {
      margin:        [0.5, 0.5, 0.5, 0.5], // marges (top, right, bottom, left) en inches
      filename:     `facture_${facture.referenceFactureClient || facture.reference}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    // 5. Générer et télécharger le PDF
    html2pdf().from(element).set(opt).save();
    
    // 6. Nettoyer (supprimer l'élément temporaire)
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
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        facture.statut === 'PAYE'
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      }`}>
        {facture.statut === 'PAYE' ? (
          <CheckCircleIcon className="h-4 w-4 mr-1.5" />
        ) : (
          <ClockIcon className="h-4 w-4 mr-1.5" />
        )}
        {facture.statut === 'PAYE' ? 'Payée' : 'Non payée'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* En-tête */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Facture {facture.referenceFactureClient || facture.reference}
                </h2>
                <p className="text-sm text-gray-500">
                  <CalendarIcon className="inline h-3 w-3 mr-1" />
                  {formatDate(facture.dateFacture)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          handleExportPDF();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => {
                          handleExportCSV();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <TableCellsIcon className="h-4 w-4" />
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        Excel
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handlePrint}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Imprimer"
              >
                <PrinterIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="p-6">
            {/* Statut et actions */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Statut actuel :</span>
                <StatutBadge />
              </div>
              
              {/* ✅ BOUTON CORRIGÉ - Désactivé si déjà PAYÉ */}
              <button
                onClick={handleStatusChange}
                disabled={updating || facture.statut === 'PAYE'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  facture.statut === 'PAYE'
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Mise à jour...
                  </>
                ) : (
                  facture.statut === 'PAYE' ? '✓ Déjà payée' : 'Marquer comme payée'
                )}
              </button>
            </div>

            {/* Informations client et facture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Client */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                  {facture.client?.typeClient === 'ENTREPRISE' ? (
                    <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  )}
                  INFORMATIONS CLIENT
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Nom / Raison sociale</p>
                      <p className="text-sm font-medium text-gray-900">
                        {facture.client?.nomComplet || facture.client?.nom || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {facture.client?.typeClient && (
                    <div className="flex items-start gap-2">
                      <TagIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Type de client</p>
                        <p className="text-sm text-gray-700">{facture.client.typeClient}</p>
                      </div>
                    </div>
                  )}
                  
                  {facture.client?.email && (
                    <div className="flex items-start gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-700">{facture.client.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {facture.client?.telephone && (
                    <div className="flex items-start gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p className="text-sm text-gray-700">{facture.client.telephone}</p>
                      </div>
                    </div>
                  )}
                  
                  {facture.client?.adresse && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Adresse</p>
                        <p className="text-sm text-gray-700">{facture.client.adresse}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Détails facture */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  DÉTAILS FACTURE
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <TagIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Numéro de facture</p>
                      <p className="text-sm font-medium text-gray-900">
                        {facture.referenceFactureClient || facture.reference}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Date d'émission</p>
                      <p className="text-sm text-gray-700">{formatDate(facture.dateFacture)}</p>
                    </div>
                  </div>
                  
                  {facture.commande?.reference && (
                    <div className="flex items-start gap-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Commande associée</p>
                        <p className="text-sm text-gray-700">{facture.commande.reference}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 pt-2">
                    <CreditCardIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Montant total</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatMontant(facture.montantTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TableCellsIcon className="h-5 w-5 text-blue-600" />
                ARTICLES
                {loadingItems && (
                  <div className="ml-2 inline-block animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Prix unitaire (DT)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total (DT)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right font-mono">
                            {formatMontant(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right font-mono">
                            {formatMontant(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          {loadingItems ? 'Chargement des articles...' : 'Aucun article dans cette facture'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                        Sous-total :
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right font-mono">
                        {formatMontant(totaux.sousTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                        TVA (19%) :
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right font-mono">
                        {formatMontant(totaux.tva)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan="3" className="px-4 py-4 text-base font-bold text-gray-900 text-right">
                        TOTAL TTC :
                      </td>
                      <td className="px-4 py-4 text-base font-bold text-blue-600 text-right font-mono">
                        {formatMontant(totaux.totalTTC)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pied de page avec actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimer la facture
              </button>
              
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
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