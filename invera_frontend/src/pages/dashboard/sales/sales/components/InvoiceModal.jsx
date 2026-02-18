// src/pages/dashboard/sales/sales/components/InvoiceModal.jsx
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  PrinterIcon, 
  DocumentArrowDownIcon, 
  EnvelopeIcon,
  QrCodeIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const InvoiceModal = ({ isOpen, onClose, facture }) => {
  const [paymentStatus, setPaymentStatus] = useState(facture?.status || 'en_attente');
  
  if (!isOpen || !facture) return null;

  // ✅ Fonction formatDate définie
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return dateString;
    }
  };

  // ✅ Fonction pour les badges de statut
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'payée':
        return 'bg-green-100 text-green-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'partiellement':
        return 'bg-blue-100 text-blue-800';
      case 'annulée':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ Fonction pour les icônes de paiement
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'carte':
      case 'carte bancaire':
        return <CreditCardIcon className="h-4 w-4 mr-1" />;
      case 'espèces':
      case 'especes':
        return <BanknotesIcon className="h-4 w-4 mr-1" />;
      case 'virement':
        return <BuildingLibraryIcon className="h-4 w-4 mr-1" />;
      default:
        return <QrCodeIcon className="h-4 w-4 mr-1" />;
    }
  };

  // ✅ Handlers pour les actions
  const handleEmailInvoice = (facture) => {
    console.log('📧 Envoi email pour facture:', facture.invoiceNumber);
    // Implémentez votre logique d'envoi d'email ici
    alert('Fonction d\'envoi d\'email à implémenter');
  };

  const handleDownloadPDF = (factureId) => {
    console.log('📥 Téléchargement PDF facture:', factureId);
    // Implémentez votre logique de téléchargement ici
    alert('Fonction de téléchargement PDF à implémenter');
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculer les totaux si nécessaire
  const calculateTotals = () => {
    if (!facture.items || facture.items.length === 0) {
      return {
        subtotal: facture.subtotal || 0,
        discountTotal: facture.discountTotal || 0,
        tax: facture.tax || 0,
        total: facture.total || 0
      };
    }
    
    const subtotal = facture.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountTotal = facture.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const discount = item.discount || 0;
      return sum + (itemTotal * discount / 100);
    }, 0);
    const taxableAmount = subtotal - discountTotal;
    const tax = facture.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const discount = item.discount || 0;
      const taxable = itemTotal - (itemTotal * discount / 100);
      return sum + (taxable * (item.tax || 19) / 100);
    }, 0);
    const total = taxableAmount + tax;
    
    return { subtotal, discountTotal, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:p-0">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:max-w-none">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Facture #{facture.invoiceNumber}</h2>
            <p className="text-sm text-gray-500">Date: {formatDate(facture.date)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEmailInvoice(facture)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Envoyer par email"
            >
              <EnvelopeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDownloadPDF(facture.id)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Télécharger PDF"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Imprimer"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu de la facture */}
        <div className="p-6 print:p-8">
          {/* En-tête facture */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FACTURE</h1>
              <div className="mt-4">
                <p className="font-semibold">Votre Entreprise</p>
                <p className="text-gray-600">123 Avenue Habib Bourguiba</p>
                <p className="text-gray-600">1001 Tunis, Tunisie</p>
                <p className="text-gray-600">Tél: +216 71 123 456</p>
                <p className="text-gray-600">contact@entreprise.tn</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
                <span className="text-sm font-medium">ORIGINAL</span>
              </div>
              <div className="mt-4">
                <p className="text-lg font-bold">#{facture.invoiceNumber}</p>
                <p className="text-gray-600">Date: {formatDate(facture.date)}</p>
                <p className="text-gray-600">Échéance: {formatDate(facture.dueDate || facture.date)}</p>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-3">FACTURÉ À</h3>
              <p className="font-semibold">{facture.clientName}</p>
              <p className="text-gray-600">{facture.clientType}</p>
              {facture.clientEmail && <p className="text-gray-600">{facture.clientEmail}</p>}
              {facture.clientPhone && <p className="text-gray-600">Tél: {facture.clientPhone}</p>}
              {facture.clientAddress && (
                <p className="text-gray-600">{facture.clientAddress}</p>
              )}
            </div>

            {/* Informations paiement */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-3">INFORMATIONS DE PAIEMENT</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadgeClass(paymentStatus)} border-none focus:ring-0`}
                  >
                    <option value="payée">Payée</option>
                    <option value="en_attente">En attente</option>
                    <option value="partiellement">Partiellement payée</option>
                    <option value="annulée">Annulée</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode de paiement:</span>
                  <span className="flex items-center font-medium">
                    {getPaymentMethodIcon(facture.paymentMethod)}
                    {facture.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Référence:</span>
                  <span className="font-medium">{facture.invoiceNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table des articles */}
          {facture.items && facture.items.length > 0 && (
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Quantité</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Prix Unitaire (dt)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Total (dt)</th>
                  </tr>
                </thead>
                <tbody>
                  {facture.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 border text-center">{item.quantity}</td>
                      <td className="px-4 py-3 border text-right">{item.price.toFixed(3)}</td>
                      <td className="px-4 py-3 border text-right font-medium">{(item.price * item.quantity).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Récapitulatif */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-3">NOTES & CONDITIONS</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {facture.notes || "Merci pour votre achat. Tous les produits sont garantis 1 an."}
                </p>
                <ul className="text-gray-600 text-sm list-disc pl-5 space-y-1">
                  <li>Paiement dû dans les 30 jours suivant la date de facturation</li>
                  <li>Les retours sont acceptés dans les 14 jours</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-4">RÉCAPITULATIF</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total:</span>
                    <span className="font-medium">{totals.subtotal.toFixed(3)} dt</span>
                  </div>
                  {totals.discountTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remises:</span>
                      <span className="font-medium text-red-600">-{totals.discountTotal.toFixed(3)} dt</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA (19%):</span>
                    <span className="font-medium">{totals.tax.toFixed(3)} dt</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-blue-600">{totals.total.toFixed(3)} dt</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
            <p className="mt-4">Cette facture est générée électroniquement et ne nécessite pas de signature</p>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between items-center print:hidden">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Statut:</span>
            <span className={`ml-2 px-3 py-1 text-sm rounded ${getStatusBadgeClass(paymentStatus)}`}>
              {paymentStatus === 'payée' ? 'Payée' : 
               paymentStatus === 'en_attente' ? 'En attente de paiement' : 
               paymentStatus === 'partiellement' ? 'Partiellement payée' : 'Annulée'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;