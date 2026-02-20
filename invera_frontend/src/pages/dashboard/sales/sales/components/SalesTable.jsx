// src/pages/dashboard/sales/sales/components/SalesTable.jsx
import React, { useState, useEffect } from 'react';
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import OrderDetailsModal from './OrderDetailsModal';

const SalesTable = ({ 
  commandes, 
  loading, 
  onGenerateInvoice, 
  onViewInvoice, // Ajouter cette prop
  invoiceStatus = {} 
}) => {
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  
  
  const totalPages = Math.ceil(commandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommandes = commandes.slice(startIndex, endIndex);


  // Vérifier les changements de invoiceStatus
  useEffect(() => {
    console.log('📊 invoiceStatus mis à jour:', invoiceStatus);
  }, [invoiceStatus]);

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

  const handleViewDetails = (commande, e) => {
    e?.stopPropagation();
    setSelectedCommande(commande);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCommande(null);
  };

  const handleGenerateInvoice = async (commandeId, e) => {
    e?.stopPropagation();
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
    
    try {
      const result = await onGenerateInvoice(commandeId);
      console.log('✅ Facture générée:', result);
      
      // Le parent (SalesPage) mettra à jour invoiceStatus
      
    } catch (error) {
      console.error('❌ Erreur génération facture:', error);
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [commandeId]: false }));
    }
  };

  const handleViewInvoiceClick = (commandeId, e) => {
    e?.stopPropagation();
    if (onViewInvoice) {
      onViewInvoice(commandeId);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Chargement des commandes
        </h3>
        <p className="text-xs text-gray-400">Veuillez patienter...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Commandes validées
                </h3>
                <span className="text-xs text-gray-500">
                  {commandes.length} commande{commandes.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N° Commande</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Articles</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentCommandes.map((commande) => {
                const commandeId = commande.id || commande.idCommandeClient;
                const hasInvoice = invoiceStatus[commandeId];
                
                return (
                  <tr key={commandeId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${hasInvoice ? 'bg-green-50' : 'bg-emerald-50'}`}>
                          {hasInvoice ? (
                            <DocumentTextIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {commande.referenceCommandeClient || commande.numeroCommande || `CMD-${commandeId}`}
                        </span>
                        {hasInvoice && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                            Facturée
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {commande.client?.entreprise ? (
                          <BuildingOfficeIcon className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <UserCircleIcon className="h-4 w-4 text-blue-400" />
                        )}
                        <span className="text-sm text-gray-700">
                          {commande.client?.nomComplet || commande.client?.nom || 'Client'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-300" />
                        <span className="text-sm text-gray-600">
                          {formatDate(commande.dateCreation)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CubeIcon className="h-4 w-4 text-gray-300" />
                        <span className="text-sm text-gray-700">
                          {commande.produits?.length || 0}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-300" />
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCurrency(commande.montantTotal || commande.total)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
  onClick={(e) => handleViewDetails(commande, e)}
  className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
  title="Voir les détails de la commande"
>
  <EyeIcon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
</button>
                        {hasInvoice ? (
                          // ✅ Bouton VOIR FACTURE
                          <button
                            onClick={(e) => handleViewInvoiceClick(commandeId, e)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                            title="Voir la facture"
                          >
                            <DocumentTextIcon className="h-3.5 w-3.5" />
                            Voir
                          </button>
                        ) : (
                          // ✅ Bouton GÉNÉRER FACTURE
                          <button
                            onClick={(e) => handleGenerateInvoice(commandeId, e)}
                            disabled={invoiceLoading[commandeId]}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                            title="Générer la facture"
                          >
                            {invoiceLoading[commandeId] ? (
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                                Générer
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

{/* Pagination avec contrôle du nombre d'éléments */}
{commandes.length > 0 && (
  <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Contrôle du nombre d'éléments par page */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Afficher</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1); // Revenir à la première page
          }}
          className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="text-xs text-gray-500">par page</span>
      </div>

      {/* Information de pagination */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <span className="text-xs text-gray-500">
          {startIndex + 1} - {Math.min(endIndex, commandes.length)} sur {commandes.length}
        </span>
        
        {/* Boutons de navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            title="Page précédente"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          
          <span className="text-xs text-gray-600 min-w-[70px] text-center">
            Page {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            title="Page suivante"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
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
        onViewInvoice={onViewInvoice}
        hasInvoice={selectedCommande ? invoiceStatus[selectedCommande.id] : false}
      />
    </>
  );
};

export default SalesTable;