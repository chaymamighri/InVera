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
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';

const InvoiceModal = ({ isOpen, onClose, sale }) => {
  const [paymentStatus, setPaymentStatus] = useState(sale?.status || 'payée');
  
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('Fonctionnalité PDF à implémenter');
  };

  const handleEmailInvoice = () => {
    alert(`Facture envoyée à ${sale.clientEmail}`);
  };

  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);

    // Ici, vous pouvez ajouter un appel API pour mettre à jour le statut
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'payée':
        return 'bg-green-100 text-green-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'annulée':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'carte bancaire':
        return <CreditCardIcon className="h-4 w-4 mr-1" />;
      case 'virement':
        return <BuildingLibraryIcon className="h-4 w-4 mr-1" />;
      default:
        return <BanknotesIcon className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:p-0">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:max-w-none">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Facture #{sale.invoiceNumber}</h2>
            <p className="text-sm text-gray-500">Date: {formatDate(sale.date)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEmailInvoice}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Envoyer par email"
            >
              <EnvelopeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownloadPDF}
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
                <p className="text-lg font-bold">#{sale.invoiceNumber}</p>
                <p className="text-gray-600">Date: {formatDate(sale.date)}</p>
                <p className="text-gray-600">Échéance: {formatDate(sale.dueDate || sale.date)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Informations client */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-3">FACTURÉ À</h3>
              <p className="font-semibold">{sale.clientName}</p>
              <p className="text-gray-600">{sale.clientType || 'Client'}</p>
              <p className="text-gray-600">{sale.clientEmail}</p>
              <p className="text-gray-600">Tél: {sale.clientPhone}</p>
              {sale.clientAddress && (
                <p className="text-gray-600">{sale.clientAddress}</p>
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
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
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
                    {getPaymentMethodIcon(sale.paymentMethod)}
                    {sale.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Référence transaction:</span>
                  <span className="font-medium">TRX{sale.id?.toString().padStart(6, '0') || '000001'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table des articles */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Quantité</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Prix Unitaire (dt)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Remise (%)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">TVA (%)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Total (dt)</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, index) => {
                  const itemTotal = item.price * item.quantity;
                  const discountAmount = itemTotal * (item.discount / 100);
                  const taxableAmount = itemTotal - discountAmount;
                  const taxAmount = taxableAmount * (item.tax / 100);
                  const finalTotal = taxableAmount + taxAmount;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-500">REF: PROD{item.productId?.toString().padStart(4, '0') || '0000'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 border text-center">{item.quantity}</td>
                      <td className="px-4 py-3 border text-right">{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 border text-center">{item.discount}%</td>
                      <td className="px-4 py-3 border text-center">{item.tax}%</td>
                      <td className="px-4 py-3 border text-right font-medium">{finalTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Récapitulatif */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-3">NOTES & CONDITIONS</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {sale.notes || "Merci pour votre achat. Tous les produits sont garantis 1 an."}
                </p>
                <ul className="text-gray-600 text-sm list-disc pl-5 space-y-1">
                  <li>Paiement dû dans les 30 jours suivant la date de facturation</li>
                  <li>Pénalité de retard de 1.5% par mois</li>
                  <li>Les retours sont acceptés dans les 14 jours</li>
                  <li>Pour toute question, contactez-nous à contact@entreprise.tn</li>
                </ul>
              </div>
              
              {/* QR Code pour paiement */}
              <div className="mt-4 flex items-center space-x-3 p-4 border rounded-lg print:hidden">
                <QrCodeIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Paiement mobile disponible</p>
                  <p className="text-xs text-gray-500">Scannez pour payer via application mobile</p>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-4">RÉCAPITULATIF</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total:</span>
                    <span className="font-medium">{sale.subtotal?.toFixed(2) || '0.00'} dt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remises:</span>
                    <span className="font-medium text-red-600">-{sale.discountTotal?.toFixed(2) || '0.00'} dt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA ({sale.items?.[0]?.tax || 19}%):</span>
                    <span className="font-medium">{sale.tax?.toFixed(2) || '0.00'} dt</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-blue-600">{sale.total?.toFixed(2) || '0.00'} dt</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant payé:</span>
                      <span className="font-medium text-green-600">{sale.total?.toFixed(2) || '0.00'} dt</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Solde dû:</span>
                      <span className="font-medium">{paymentStatus === 'payée' ? '0.00 dt' : sale.total?.toFixed(2) || '0.00' + ' dt'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-medium">Adresse</p>
                <p>123 Avenue Habib Bourguiba, 1001 Tunis</p>
              </div>
              <div>
                <p className="font-medium">Contact</p>
                <p>Tél: +216 71 123 456 | Email: contact@entreprise.tn</p>
              </div>
              <div>
                <p className="font-medium">Informations légales</p>
                <p>RNE: 12345678A | Matricule Fiscal: 12345678</p>
              </div>
            </div>
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
          <div className="flex space-x-3">
            {paymentStatus !== 'payée' && (
              <button
                onClick={() => handlePaymentStatusChange('payée')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Marquer comme payée
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;