/**
 * SalesTable - Tableau des commandes validées
 * 
 * Affiche la liste des commandes avec pagination et actions.
 * Permet de générer/consulter les factures.
 * 
 * @param {Array} commandes - Liste des commandes à afficher
 * @param {boolean} loading - État de chargement
 * @param {Function} onGenerateInvoice - Génère une facture (commandeId) => void
 * @param {Function} onViewInvoice - Consulte une facture (commandeId) => void
 * @param {Function} onViewDetails - Voir les détails de la commande
 * @param {Object} invoiceStatus - Statut des factures { commandeId: boolean }
 */

import React, { useState, useEffect } from 'react';
import { 
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  UserCircleIcon,
  CalendarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const SalesTable = ({ 
  commandes, 
  loading, 
  onGenerateInvoice, 
  onViewInvoice,
  onViewDetails,
  invoiceStatus = {},
  t = (key) => key,
  locale = 'fr-FR',
  isArabic = false
}) => {
  // États
  const [invoiceLoading, setInvoiceLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  
  // Tri des commandes
  const sortCommandes = (commandesToSort) => {
    if (!sortConfig.key) return commandesToSort;
    
    return [...commandesToSort].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.dateCreation || a.dateCommande);
          bValue = new Date(b.dateCreation || b.dateCommande);
          break;
        case 'numero':
          aValue = a.referenceCommandeClient || a.numeroCommande || `CMD-${a.id || a.idCommandeClient}`;
          bValue = b.referenceCommandeClient || b.numeroCommande || `CMD-${b.id || b.idCommandeClient}`;
          break;
        case 'client':
          aValue = (a.client?.nomComplet || a.client?.nom || 'Client').toLowerCase();
          bValue = (b.client?.nomComplet || b.client?.nom || 'Client').toLowerCase();
          break;
        case 'total':
          aValue = parseFloat(a.montantTotal || a.total || 0);
          bValue = parseFloat(b.montantTotal || b.total || 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Gestion du tri
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Récupère l'icône de tri pour une colonne
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpIcon className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpIcon className="h-3 w-3 text-blue-600" />
      : <ArrowDownIcon className="h-3 w-3 text-blue-600" />;
  };

  // Appliquer le tri aux commandes
  const sortedCommandes = sortCommandes(commandes);
  
  // Pagination
  const totalPages = Math.ceil(sortedCommandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommandes = sortedCommandes.slice(startIndex, endIndex);

  // Log des changements de statut facture
  useEffect(() => {
    console.log('📊 invoiceStatus mis à jour:', invoiceStatus);
  }, [invoiceStatus]);

  // Formate une date (jj/mm/aaaa)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Formate un montant en dinars
  const formatCurrency = (amount) => {
    const value = parseFloat(amount || 0);
    if (isNaN(value)) return `0,00 ${t('currencyLower') || 'dt'}`;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ` ${t('currencyLower') || 'dt'}`;
  };

  // Voir les détails de la commande
  const handleViewDetails = (commande, e) => {
    e?.stopPropagation();
    if (onViewDetails) {
      onViewDetails(commande);
    }
  };

  // Génère une facture pour une commande
  const handleGenerateInvoice = async (commandeId, e) => {
    e?.stopPropagation();
    setInvoiceLoading(prev => ({ ...prev, [commandeId]: true }));
    
    try {
      const result = await onGenerateInvoice(commandeId);
      console.log('✅ Facture générée:', result);
    } catch (error) {
      console.error('❌ Erreur génération facture:', error);
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [commandeId]: false }));
    }
  };

  // Consulte une facture existante
  const handleViewInvoiceClick = (commandeId, e) => {
    e?.stopPropagation();
    if (onViewInvoice) {
      onViewInvoice(commandeId);
    }
  };

  // Change de page
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          {t('loadingOrders') || 'Chargement des commandes...'}
        </h3>
        <p className="text-xs text-gray-400">{t('pleaseWait') || 'Veuillez patienter'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* En-tête du tableau */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {t('validatedOrdersTitle') || 'Commandes validées'}
              </h3>
              <span className="text-xs text-gray-500">
                {t('orderCount', { count: commandes.length }) || `${commandes.length} commande${commandes.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau responsive */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort('numero')}>
                <div className="flex items-center gap-2">
                  {t('orderNumber') || 'N° Commande'}
                  {getSortIcon('numero')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort('client')}>
                <div className="flex items-center gap-2">
                  {t('client') || 'Client'}
                  {getSortIcon('client')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort('date')}>
                <div className="flex items-center gap-2">
                  {t('date') || 'Date'}
                  {getSortIcon('date')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                {t('items') || 'Articles'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort('total')}>
                <div className="flex items-center gap-2">
                  {t('total') || 'Total'}
                  {getSortIcon('total')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                {t('actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentCommandes.map((commande) => {
              const commandeId = commande.id || commande.idCommandeClient;
              const hasInvoice = invoiceStatus[commandeId];
              
              return (
                <tr key={commandeId} className="hover:bg-gray-50/50 transition-colors">
                  
                  {/* Colonne : N° Commande */}
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
                          {t('invoiced') || 'Facturée'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Colonne : Client */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {commande.client?.entreprise ? (
                        <BuildingOfficeIcon className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <UserCircleIcon className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="text-sm text-gray-700">
                        {commande.client?.nomComplet || commande.client?.nom || t('client') || 'Client'}
                      </span>
                    </div>
                  </td>

                  {/* Colonne : Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-300" />
                      <span className="text-sm text-gray-600">
                        {formatDate(commande.dateCreation || commande.dateCommande)}
                      </span>
                    </div>
                  </td>

                  {/* Colonne : Nombre d'articles */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="h-4 w-4 text-gray-300" />
                      <span className="text-sm text-gray-700">
                        {commande.produits?.length || 0}
                      </span>
                    </div>
                  </td>

                  {/* Colonne : Total */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-300" />
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(commande.montantTotal || commande.total)}
                      </span>
                    </div>
                  </td>

                  {/* Colonne : Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      
                      {hasInvoice ? (
                        // Bouton VOIR FACTURE (si facture existe)
                        <button
                          onClick={(e) => handleViewInvoiceClick(commandeId, e)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                          title={t('viewInvoice') || 'Voir la facture'}
                        >
                          <DocumentTextIcon className="h-3.5 w-3.5" />
                          {t('view') || 'Voir'}
                        </button>
                      ) : (
                        // Bouton GÉNÉRER FACTURE (si pas de facture)
                        <button
                          onClick={(e) => handleGenerateInvoice(commandeId, e)}
                          disabled={invoiceLoading[commandeId]}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                          title={t('generateInvoice') || 'Générer la facture'}
                        >
                          {invoiceLoading[commandeId] ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                              {t('generate') || 'Générer'}
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

      {/* Pagination */}
      {sortedCommandes.length > 0 && (
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Sélecteur nombre d'éléments par page */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{t('show') || 'Afficher'}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-xs text-gray-500">{t('perPage') || 'par page'}</span>
            </div>

            {/* Informations de pagination */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <span className="text-xs text-gray-500">
                {t('paginationRange', { 
                  start: startIndex + 1, 
                  end: Math.min(endIndex, sortedCommandes.length), 
                  total: sortedCommandes.length 
                }) || `${startIndex + 1} - ${Math.min(endIndex, sortedCommandes.length)} sur ${sortedCommandes.length}`}
              </span>
              
              {/* Boutons navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                  title={t('previousPage') || 'Page précédente'}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                <span className="text-xs text-gray-600 min-w-[70px] text-center">
                  {t('pageIndicator', { current: currentPage, total: totalPages }) || `Page ${currentPage} sur ${totalPages}`}
                </span>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                  title={t('nextPage') || 'Page suivante'}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTable;