// src/pages/dashboard/sales/invoicing/InvoicingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { commandeService } from '../../../../services/commandeService';
import InvoiceModal from '../sales/components/InvoiceModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const InvoicingPage = () => {
  const [factures, setFactures] = useState([]);
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState('dateFacture');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // États pour le modal
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});

  // Fonction pour effacer un filtre individuel
  const clearSearch = () => setSearchTerm('');
  const clearStatus = () => setStatusFilter('tous');
  const clearDate = () => setDateFilter('');

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchTerm || statusFilter !== 'tous' || dateFilter;

  // Charger les factures
  const loadFactures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await commandeService.getAllInvoices();
      console.log('📦 Factures reçues:', response);
      
      let facturesData = [];
      if (response.data) {
        facturesData = response.data;
      } else if (Array.isArray(response)) {
        facturesData = response;
      }
      
      const facturesTransformees = facturesData.map(fact => ({
        id: fact.idFactureClient || fact.id,
        reference: fact.referenceFactureClient,
        dateFacture: fact.dateFacture,
        montantTotal: fact.montantTotal || 0,
        statut: fact.statut || 'NON_PAYE',
        
        client: fact.client ? {
          id: fact.client.idClient || fact.client.id,
          nom: fact.client.nom || '',
          prenom: fact.client.prenom || '',
          nomComplet: fact.client.nomComplet || 
                      `${fact.client.prenom || ''} ${fact.client.nom || ''}`.trim() ||
                      'Client',
          entreprise: fact.client.entreprise || '',
          typeClient: fact.client.typeClient || 'PARTICULIER',
          telephone: fact.client.telephone || '',
          email: fact.client.email || ''
        } : null,
        
        commande: fact.commande ? {
          id: fact.commande.idCommandeClient || fact.commande.id,
          reference: fact.commande.referenceCommandeClient
        } : null
      }));
      
      setFactures(facturesTransformees);
      setFilteredFactures(facturesTransformees);
      
    } catch (err) {
      console.error('❌ Erreur chargement factures:', err);
      setError('Impossible de charger les factures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  // Filtrer les factures
  useEffect(() => {
    let result = [...factures];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.reference?.toLowerCase().includes(term) ||
        f.client?.nomComplet?.toLowerCase().includes(term) ||
        f.client?.entreprise?.toLowerCase().includes(term) ||
        f.commande?.reference?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'tous') {
      result = result.filter(f => f.statut === statusFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      result = result.filter(f => 
        new Date(f.dateFacture).toDateString() === filterDate
      );
    }

    result.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortField) {
        case 'reference':
          aValue = a.reference || '';
          bValue = b.reference || '';
          break;
        case 'client':
          aValue = a.client?.nomComplet || a.client?.entreprise || '';
          bValue = b.client?.nomComplet || b.client?.entreprise || '';
          break;
        case 'dateFacture':
          aValue = new Date(a.dateFacture).getTime();
          bValue = new Date(b.dateFacture).getTime();
          break;
        case 'montant':
          aValue = a.montantTotal;
          bValue = b.montantTotal;
          break;
        case 'statut':
          aValue = a.statut || '';
          bValue = b.statut || '';
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredFactures(result);
    setCurrentPage(1);
  }, [factures, searchTerm, statusFilter, dateFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFactures = filteredFactures.slice(startIndex, endIndex);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewInvoice = (facture) => {
    const factureDetaillee = {
      ...facture,
      invoiceNumber: facture.reference,
      date: facture.dateFacture,
      clientName: facture.client?.nomComplet,
      clientEmail: facture.client?.email,
      clientPhone: facture.client?.telephone,
      clientAddress: facture.client?.adresse,
      clientType: facture.client?.typeClient,
      total: facture.montantTotal,
      status: facture.statut === 'NON_PAYE' ? 'en_attente' : 'payée'
    };
    
    setSelectedFacture(factureDetaillee);
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadInvoice = async (factureId, e) => {
    e?.stopPropagation();
    setDownloadLoading(prev => ({ ...prev, [factureId]: true }));
    
    try {
      await commandeService.downloadInvoicePDF(factureId);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadLoading(prev => ({ ...prev, [factureId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatMontant = (montant) => {
    if (montant === undefined || montant === null) return '0,000 dt';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(montant) + ' dt';
  };

  const StatusBadge = ({ statut }) => {
    const config = {
      'PAYE': { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        icon: CheckCircleIcon,
        label: 'Payée'
      },
      'NON_PAYE': { 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        icon: ClockIcon,
        label: 'Non payée'
      },
      'ANNULEE': { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        icon: XCircleIcon,
        label: 'Annulée'
      }
    };
    
    const { color, icon: Icon, label } = config[statut] || config['NON_PAYE'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </span>
    );
  };

  // ✅ Cartes statistiques - SANS la carte Montant Total
  const StatCards = () => {
    const stats = {
      total: factures.length,
      payees: factures.filter(f => f.statut === 'PAYE').length,
      nonPayees: factures.filter(f => f.statut === 'NON_PAYE').length
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total factures</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.payees}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Non payées</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.nonPayees}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FilterChip = ({ label, onClear }) => (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
      {label}
      <button onClick={onClear} className="hover:text-blue-900">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </span>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Facturation
              </h1>
              <p className="text-gray-500 mt-1">
                Gérez l'ensemble de vos factures
              </p>
            </div>
          </div>
        
        </div>
      </div>

      {/* Cartes statistiques - 3 cartes au lieu de 4 */}
      <StatCards />

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="PAYE">Payées</option>
              <option value="NON_PAYE">Non payées</option>
              <option value="ANNULEE">Annulées</option>
            </select>
          </div>

          <div className="relative">
            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="date"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Filtres actifs */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {searchTerm && (
              <FilterChip label={`Recherche: ${searchTerm}`} onClear={clearSearch} />
            )}
            {statusFilter !== 'tous' && (
              <FilterChip 
                label={`Statut: ${
                  statusFilter === 'PAYE' ? 'Payée' : 
                  statusFilter === 'NON_PAYE' ? 'Non payée' : 'Annulée'
                }`} 
                onClear={clearStatus} 
              />
            )}
            {dateFilter && (
              <FilterChip label={`Date: ${formatDate(dateFilter)}`} onClear={clearDate} />
            )}
          </div>
        )}

        {/* Résultats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-4">
          <span>
            <span className="font-medium text-gray-900">{filteredFactures.length}</span> facture{filteredFactures.length !== 1 ? 's' : ''} trouvée{filteredFactures.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
            Page {currentPage} / {totalPages || 1}
          </span>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <DocumentTextIcon className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 font-medium">Chargement des factures...</p>
            <p className="text-sm text-gray-400">Veuillez patienter</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadFactures}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Réessayer
            </button>
          </div>
        ) : filteredFactures.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <DocumentTextIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune facture</h3>
            <p className="text-gray-500">Aucune facture ne correspond à vos critères</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'reference', label: 'N° Facture', icon: DocumentTextIcon },
                      { key: 'client', label: 'Client', icon: UserCircleIcon },
                      { key: 'dateFacture', label: 'Date', icon: CalendarIcon },
                      { key: 'commande', label: 'Commande', icon: TagIcon },
                      { key: 'montant', label: 'Montant', icon: CurrencyDollarIcon },
                      { key: 'statut', label: 'Statut', icon: ClockIcon },
                      { key: 'actions', label: '', align: 'right' }
                    ].map((col) => (
                      <th
                        key={col.key}
                        className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''
                        } ${col.align === 'right' ? 'text-right' : ''}`}
                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                      >
                        <div className="flex items-center gap-2">
                          {col.icon && <col.icon className="h-4 w-4" />}
                          <span>{col.label}</span>
                          {sortField === col.key && (
                            <span className="ml-1 text-blue-600">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentFactures.map((facture, index) => (
                    <tr 
                      key={facture.id} 
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors mr-3">
                            <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {facture.reference}
                            </div>
                            <div className="text-xs text-gray-400">
                              #{facture.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {facture.client?.typeClient === 'ENTREPRISE' ? (
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          ) : (
                            <UserCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {facture.client?.nomComplet || facture.client?.entreprise}
                            </div>
                            <div className="text-xs text-gray-500">
                              {facture.client?.typeClient}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {formatDate(facture.dateFacture)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">
                          {facture.commande?.reference || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatMontant(facture.montantTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge statut={facture.statut} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewInvoice(facture)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadInvoice(facture.id, e)}
                            disabled={downloadLoading[facture.id]}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Télécharger PDF"
                          >
                            {downloadLoading[facture.id] ? (
                              <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                            ) : (
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Envoyer par email"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredFactures.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredFactures.length)}</span> sur{' '}
                    <span className="font-medium">{filteredFactures.length}</span> factures
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">5 par page</option>
                      <option value="10">10 par page</option>
                      <option value="20">20 par page</option>
                      <option value="50">50 par page</option>
                    </select>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === i + 1
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de détails */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
        }}
        facture={selectedFacture}
      />
    </div>
  );
};

export default InvoicingPage;