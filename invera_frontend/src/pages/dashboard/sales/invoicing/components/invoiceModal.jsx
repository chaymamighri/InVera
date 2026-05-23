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
  TagIcon
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
  const [client, setClient] = useState({});
  const [commandeInfo, setCommandeInfo] = useState({});

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      try {
        setLoadingItems(true);

        const commandeDetails = await commandeService.getCommandeById(commandeId || facture?.commandeId);

        if (commandeDetails) {
          console.log('[InvoiceModal] Details commande recus:', commandeDetails);
          console.log('[InvoiceModal] Lignes commande:', commandeDetails.lignesCommande);
          
          // ✅ Récupérer correctement la remise client
          const tauxRemiseClient = commandeDetails.tauxRemise || commandeDetails.tauxRemiseClient || 0;
          
          setCommandeInfo({
            tauxRemise: tauxRemiseClient,
            sousTotal: commandeDetails.sousTotal || 0,
            total: commandeDetails.total || 0
          });
          
          console.log('[InvoiceModal] Taux remise client récupéré:', tauxRemiseClient);
          
          if (commandeDetails.client) {
            setClient({
              ...commandeDetails.client,
              raisonSociale: commandeDetails.client.raisonSociale || commandeDetails.client.raison_sociale,
              matriculeFiscal: commandeDetails.client.matriculeFiscal || commandeDetails.client.matricule_fiscale,
              typeClient: commandeDetails.client.typeClient,
              nom: commandeDetails.client.nom,
              prenom: commandeDetails.client.prenom,
              nomComplet: commandeDetails.client.nomComplet || `${commandeDetails.client.prenom || ''} ${commandeDetails.client.nom || ''}`.trim(),
              email: commandeDetails.client.email,
              telephone: commandeDetails.client.telephone,
              adresse: commandeDetails.client.adresse,
              remise: tauxRemiseClient
            });
          }
          
          const itemsFormatted = (commandeDetails.lignesCommande || []).map(ligne => {
            let libelleProduit = 'Produit';
            if (ligne.produitLibelle) {
              libelleProduit = ligne.produitLibelle;
            } else if (ligne.produit?.libelle) {
              libelleProduit = ligne.produit.libelle;
            } else if (ligne.libelle) {
              libelleProduit = ligne.libelle;
            }
            
            const prixUnitaire = parseFloat(ligne.prixUnitaire || 0);
            const quantite = parseInt(ligne.quantite || 1);
            const sousTotalBrut = prixUnitaire * quantite;
            
            let tauxRemiseProduit = 0;
            if (ligne.remiseStandard) {
              tauxRemiseProduit = parseFloat(ligne.remiseStandard);
            } else if (ligne.produit?.categorie?.remiseStandard) {
              tauxRemiseProduit = parseFloat(ligne.produit.categorie.remiseStandard);
            }
            
            const montantRemise = sousTotalBrut * (tauxRemiseProduit / 100);
            const totalHTLigne = sousTotalBrut - montantRemise;
            
            let tauxTVA = 19;
            if (ligne.tauxTVA) {
              tauxTVA = parseFloat(ligne.tauxTVA);
            } else if (ligne.produit?.categorie?.tauxTVA) {
              tauxTVA = parseFloat(ligne.produit.categorie.tauxTVA);
            }
            
            let tauxTVANumerique = tauxTVA;
            if (tauxTVANumerique > 1 && tauxTVANumerique <= 100) {
              tauxTVANumerique = tauxTVANumerique / 100;
            }
            
            const montantTVA = totalHTLigne * tauxTVANumerique;
            const totalTTCLigne = totalHTLigne + montantTVA;
            
            return {
              description: libelleProduit,
              quantity: quantite,
              unitPrice: prixUnitaire,
              sousTotal: sousTotalBrut,
              remise: montantRemise,
              tauxRemise: tauxRemiseProduit,
              totalHT: totalHTLigne,
              tauxTVA: tauxTVANumerique * 100,
              montantTVA: montantTVA,
              totalTTC: totalTTCLigne
            };
          });
          setItems(itemsFormatted);
        }
        
        if (facture?.client && (!client.raisonSociale || !client.matriculeFiscal)) {
          setClient(prev => ({
            ...prev,
            raisonSociale: facture.client.raisonSociale || facture.client.raison_sociale || prev.raisonSociale,
            matriculeFiscal: facture.client.matriculeFiscal || facture.client.matricule_fiscale || prev.matriculeFiscal,
            ...facture.client
          }));
        }
        
      } catch (error) {
        console.error('[InvoiceModal] Erreur chargement:', error);
      } finally {
        setLoadingItems(false);
      }
    };

    if (isOpen && (commandeId || facture?.commandeId)) {
      loadData();
    }
  }, [isOpen, facture, commandeId]);

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

  // Calcul des totaux depuis les items
  const sousTotal = items.reduce((acc, item) => acc + (item.sousTotal || 0), 0);
  const remiseTotale = items.reduce((acc, item) => acc + (item.remise || 0), 0);
  const totalHT = items.reduce((acc, item) => acc + (item.totalHT || 0), 0);
  const tvaTotale = items.reduce((acc, item) => acc + (item.montantTVA || 0), 0);
  
  // ✅ Remise client depuis commandeInfo ou client
  const tauxRemiseGlobale = commandeInfo.tauxRemise || client.remise || 0;
  const montantRemiseGlobale = totalHT * (tauxRemiseGlobale / 100);
  const totalHTApresRemiseClient = totalHT - montantRemiseGlobale;
  const totalTTC = totalHTApresRemiseClient + tvaTotale;

  console.log('[InvoiceModal] Totaux:', {
    sousTotal,
    remiseTotale,
    totalHT,
    tvaTotale,
    tauxRemiseGlobale,
    montantRemiseGlobale,
    totalTTC
  });

  const handleStatusChange = async () => {
    const factureId = facture.id;
    if (facture.statut === 'PAYE' || updating) return;

    try {
      setUpdating(true);
      await commandeService.marquerFacturePayee(factureId);
      if (onStatusChange) {
        await onStatusChange(factureId, 'payee');
      }
    } catch (error) {
      console.error('[InvoiceModal] Erreur:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrintLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:8081/api';
      const response = await fetch(`${apiUrl}/factures/${facture.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' }
      });
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            URL.revokeObjectURL(pdfUrl);
          };
        };
      }
    } catch (error) {
      console.error('[InvoiceModal] Erreur:', error);
      alert('Erreur lors de l\'impression');
    } finally {
      setPrintLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
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
      console.error('[InvoiceModal] Erreur telechargement:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setExportLoading(false);
    }
  };

  const StatutBadge = () => {
    const isPaye = facture.statut === 'PAYE';
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
        isPaye ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {isPaye ? <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" /> : <ClockIcon className="h-3.5 w-3.5 mr-1.5" />}
        {isPaye ? 'Payee' : 'En attente'}
      </span>
    );
  };

  const isEntreprise = client.typeClient === 'ENTREPRISE';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
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
            
            {/* Actions statut */}
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
                      Marquer comme payee
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Informations Client */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  {isEntreprise ? <BuildingOfficeIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  INFORMATIONS {isEntreprise ? 'ENTREPRISE' : 'CLIENT'}
                </h3>
                <div className="space-y-3">
                  {isEntreprise ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Raison sociale</p>
                        <p className="text-base font-medium text-gray-900">
                          {client.raisonSociale || client.nom || 'Non renseignee'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Matricule fiscal</p>
                        <p className="text-sm text-gray-700 font-mono">
                          {client.matriculeFiscal || client.matriculeFiscale || 'Non renseigne'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gerant</p>
                        <p className="text-sm text-gray-700">
                          {client.prenom || ''} {client.nom || ''}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="text-base font-medium text-gray-900">
                        {client.prenom || ''} {client.nom || ''}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Type de client</p>
                    <p className="text-sm text-gray-700">{client.typeClient || 'PARTICULIER'}</p>
                  </div>
                  
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{client.email}</p>
                    </div>
                  )}
                  
                  {client.telephone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{client.telephone}</p>
                    </div>
                  )}
                  
                  {client.adresse && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700">{client.adresse}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Détails facture */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  DETAILS FACTURE
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Numero</p>
                    <p className="text-base font-medium text-gray-900">{facture.referenceFactureClient || facture.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date d'emission</p>
                    <p className="text-sm text-gray-700">{formatDate(facture.dateFacture)}</p>
                  </div>
                  {facture.commande?.reference && (
                    <div>
                      <p className="text-sm text-gray-500">Commande associee</p>
                      <p className="text-sm text-gray-700">{facture.commande.reference}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <TableCellsIcon className="h-5 w-5 text-blue-600" />
                ARTICLES
                {loadingItems && <div className="ml-2 inline-block animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />}
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Qte</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Prix HT</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Sous-total HT</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Remise</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Total HT</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">TVA</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.description}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">{formatMontant(item.unitPrice)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">{formatMontant(item.sousTotal)}</td>
                          <td className="px-6 py-4 text-sm text-red-600 text-right font-mono">
                            {item.remise && item.remise > 0.001 ? (
                              <div className="flex flex-col items-end">
                                <span>-{formatMontant(item.remise)}</span>
                                <span className="text-xs text-red-500">({item.tauxRemise.toFixed(2)}%)</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right font-mono">{formatMontant(item.totalHT)}</td>
                          <td className="px-6 py-4 text-sm text-blue-600 text-right font-mono">
                            {item.montantTVA > 0.001 ? (
                              <div className="flex flex-col items-end">
                                <span>{formatMontant(item.montantTVA)}</span>
                                <span className="text-xs text-blue-500">({item.tauxTVA.toFixed(0)}%)</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-blue-600 text-right font-mono">{formatMontant(item.totalTTC)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          {loadingItems ? 'Chargement...' : 'Aucun article'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION RÉCAPITULATIVE - À DROITE SOUS LE TABLEAU */}
<div className="flex justify-end mt-6">
  <div className="w-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
    <div className="space-y-3 text-sm">
      <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2 mb-3">Récapitulatif</h4>
      
      {/* Sous-total HT */}
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Sous-total HT</span>
        <span className="font-medium text-gray-900">{formatMontant(sousTotal)}</span>
      </div>
      
    {/* Remises produits */}
{remiseTotale > 0.001 && (
  <div className="flex justify-between items-center text-red-600">
    <span>Remises produits</span>
    <span>-{formatMontant(remiseTotale)}</span>
  </div>
)}

{/* Remise client */}
{tauxRemiseGlobale > 0.001 && (
  <div className="flex justify-between items-center text-red-600">
    <span className="flex items-center gap-1">
      <TagIcon className="h-3 w-3 text-green-600" />
      Remise {client.typeClient || 'client'} ({tauxRemiseGlobale}%)
    </span>
    <span>-{formatMontant(montantRemiseGlobale)}</span>
  </div>
)}
      {/* Total HT après toutes remises (avec remise client) */}
      <div className="flex justify-between items-center pt-1 border-t border-gray-200">
        <span className="text-gray-700 font-medium">Total HT après remises</span>
        <span className="font-bold text-gray-900">{formatMontant(totalHTApresRemiseClient)}</span>
      </div>
      
      {/* TVA DYNAMIQUE */}
      <div className="flex justify-between items-center bg-blue-50/30 rounded-lg p-2 -mx-2">
        <span className="text-gray-600">TVA</span>
        <span className="font-medium text-gray-900">{formatMontant(tvaTotale)}</span>
      </div>
      
      {/* Séparateur */}
      <div className="border-t-2 border-gray-300 my-2"></div>
      
      {/* TOTAL TTC */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-gray-900">TOTAL TTC</span>
        <span className="text-lg font-bold text-blue-600">{formatMontant(totalTTC)}</span>
      </div>
      
      {/* Économie totale */}
      {(remiseTotale > 0.001 || montantRemiseGlobale > 0.001) && (
        <div className="text-right pt-2 border-t border-gray-200">
          <span className="text-xs text-green-600 font-medium">
            Économie totale : {formatMontant(remiseTotale + montantRemiseGlobale)}
          </span>
        </div>
      )}
    </div>
  </div>
</div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
              <button onClick={handlePrint} disabled={printLoading} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
                {printLoading ? <div className="animate-spin h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full" /> : <PrinterIcon className="h-4 w-4" />}
                Imprimer
              </button>
              <button onClick={handleExportPDF} disabled={exportLoading} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-sm disabled:opacity-50">
                {exportLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <DocumentArrowDownIcon className="h-4 w-4" />}
                Telecharger PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
