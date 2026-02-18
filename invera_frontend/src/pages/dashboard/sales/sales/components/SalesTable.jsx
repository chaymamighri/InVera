// src/pages/dashboard/sales/sales/components/SalesTable.jsx
import React, { useState } from 'react';
import { 
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  CalendarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

import OrderDetailsModal from './OrderDetailsModal';
import InvoiceTemplate from '../../invoicing/components/InvoiceTemplate';

const SalesTable = ({ commandes, loading, onGenerateInvoice, invoiceStatus = {} }) => {
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  
  const itemsPerPage = 5;
  const totalPages = Math.ceil(commandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommandes = commandes.slice(startIndex, endIndex);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    const value = parseFloat(amount || 0);
    if (isNaN(value)) return '0,00 dt';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' dt';
  };

  // Fonctions pour le template
  const formatMontantForTemplate = (montant) => {
    if (!montant) return '0,000 DT';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(montant) + ' DT';
  };

  const formatDateForTemplate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = (commande, e) => {
    e?.stopPropagation();
    setSelectedCommande(commande);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCommande(null);
  };

  // Affichage de la facture avec le template
  const displayInvoiceWithTemplate = (facture) => {
    const printWindow = window.open('', '_blank');
    
    const items = facture.commande?.lignesCommande?.map(ligne => ({
      description: ligne.produit?.libelle || 'Produit',
      quantity: ligne.quantite || 0,
      unitPrice: ligne.prix_unitaire || 0,
      total: ligne.sous_total || 0
    })) || [];

    const totaux = {
      sousTotal: facture.montantTotal || 0,
      tva: (facture.montantTotal || 0) * 0.19,
      totalTTC: (facture.montantTotal || 0) * 1.19
    };

    const htmlContent = InvoiceTemplate({
      facture: facture,
      items: items,
      totaux: totaux,
      formatDate: formatDateForTemplate,
      formatMontant: formatMontantForTemplate
    });
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Génération de la facture
  const handleGenerateInvoice = async (commandeId, e) => {
    e?.stopPropagation();
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
    
    try {
      const result = await onGenerateInvoice(commandeId);
      
      if (result && result.facture) {
        displayInvoiceWithTemplate(result.facture);
      }
      
    } catch (error) {
      console.error('Erreur génération facture:', error);
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [commandeId]: false }));
    }
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  };

  // État de chargement
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Chargement des commandes
        </h3>
        <p className="text-xs text-gray-400">
          Veuillez patienter...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm shadow-blue-200">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    Commandes validées
                  </h3>
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium rounded-full shadow-sm">
                    {commandes.length} commande{commandes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                    Prêtes pour facturation
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-xs text-gray-400">
                    {new Date().toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    N° Commande
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Articles
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </span>
                </th>
                <th className="px-6 py-4 text-right">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentCommandes.map((commande, index) => {
                const commandeId = commande.id || commande.idCommande;
                const hasInvoice = invoiceStatus[commandeId];
                
                return (
                  <tr 
                    key={commandeId}
                    className={`
                      group transition-all duration-200
                      ${hoveredRow === index ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30' : 'hover:bg-gray-50/50'}
                    `}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* N° Commande avec badge de statut facture */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`p-1.5 rounded-lg transition-colors ${
                            hasInvoice 
                              ? 'bg-green-50 group-hover:bg-green-100' 
                              : 'bg-emerald-50 group-hover:bg-emerald-100'
                          }`}>
                            {hasInvoice ? (
                              <DocumentDuplicateIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                          {hasInvoice && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-1 ring-white"></span>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {(() => {
                              const reference = 
                                commande.referenceCommandeClient || 
                                commande.numero || 
                                commande.numeroCommande;
                              
                              if (reference) return reference;
                              
                              const id = commandeId;
                              if (id) {
                                const idNum = parseInt(id);
                                if (!isNaN(idNum)) {
                                  return `CMD-${String(idNum).padStart(5, '0')}`;
                                }
                                return `CMD-${id}`;
                              }
                              
                              return 'CMD-00000';
                            })()}
                          </span>
                          {/* Badge d'état de facture */}
                          {hasInvoice && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                                Facturée
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {commande.client?.entreprise ? (
                            <div className="p-1.5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                              <BuildingOfficeIcon className="h-4 w-4 text-indigo-600" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                              <UserCircleIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                            {commande.client?.nomComplet || commande.client?.nom || 'Client'}
                          </div>
                          {commande.client?.entreprise && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-gray-400 truncate max-w-[150px]">
                                {commande.client.entreprise}
                              </span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                                PRO
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                        <span className="text-sm text-gray-600">
                          {formatDate(commande.dateCreation)}
                        </span>
                      </div>
                    </td>

                    {/* Articles */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-gray-50 rounded-md group-hover:bg-gray-100 transition-colors">
                          <CubeIcon className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {commande.produits?.length || 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          {commande.produits?.length > 1 ? 'articles' : 'article'}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <CurrencyDollarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCurrency(commande.montantTotal || commande.total)}
                        </span>
                      </div>
                    </td>

                    {/* Actions avec boutons plus petits */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleViewDetails(commande, e)}
                          className="relative p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 group/btn"
                          title="Voir les détails"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-gray-800 text-white text-[8px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                            Détails
                          </span>
                        </button>
                        
                        <button
                          onClick={(e) => handleGenerateInvoice(commandeId, e)}
                          disabled={invoiceLoading[commandeId]}
                          className={`
                            inline-flex items-center gap-1 px-2.5 py-1.5 
                            ${hasInvoice 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            }
                            text-white text-[11px] font-medium rounded-md
                            transition-all duration-200 shadow-sm hover:shadow
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${hoveredRow === index ? 'shadow-sm' : ''}
                          `}
                        >
                          {invoiceLoading[commandeId] ? (
                            <>
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>...</span>
                            </>
                          ) : (
                            <>
                              <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                              <span>{hasInvoice ? 'Voir' : 'Facture'}</span>
                              {hasInvoice && (
                                <span className="ml-0.5 text-[9px] bg-white/20 px-1 py-0.5 rounded-full">
                                  ✓
                                </span>
                              )}
                              <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5 opacity-70" />
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* État vide */}
        {commandes.length === 0 && !loading && (
          <div className="text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-4">
              <ShoppingBagIcon className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Aucune commande validée
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Les commandes validées apparaîtront ici. Vous pouvez créer une nouvelle commande ou attendre la validation des commandes en cours.
            </p>
          </div>
        )}

        {/* Pagination */}
        {commandes.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{startIndex + 1}</span>
                  {' - '}
                  <span className="font-medium text-gray-700">{Math.min(endIndex, commandes.length)}</span>
                  {' sur '}
                  <span className="font-medium text-gray-700">{commandes.length}</span>
                  {' commandes'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all duration-200"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(pageNum)}
                        className={`
                          min-w-[28px] h-7 px-1.5 text-[11px] font-medium rounded-md transition-all
                          ${currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all duration-200"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-xs text-gray-400">
                {totalPages} page{totalPages !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <OrderDetailsModal
        commande={selectedCommande}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        onGenerateInvoice={onGenerateInvoice}
      />
    </>
  );
};

export default SalesTable;