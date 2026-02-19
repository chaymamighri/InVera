import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { commandeService } from '../../../../services/commandeService';
import InvoiceModal from './components/invoiceModal'; 
import FacturesFilters from './components/FacturesFilters';
import FacturesTable from './components/FacturesTable';
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});

  // ✅ Force update state
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Filtres
  const clearSearch = () => setSearchTerm('');
  const clearStatus = () => setStatusFilter('tous');
  const clearDate = () => setDateFilter('');
  const hasActiveFilters = searchTerm || statusFilter !== 'tous' || dateFilter;

  


  // Chargement des factures
  const loadFactures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await commandeService.getAllInvoices();
      
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
          email: fact.client.email || '',
          adresse: fact.client.adresse || ''
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
  }, [factures, searchTerm, statusFilter, dateFilter, sortField, sortOrder, updateTrigger]); // ✅ Ajout de updateTrigger

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
      status: facture.statut === 'NON_PAYE' ? 'en_attente' : 'payée',
      statut: facture.statut // Garder le statut original pour le modal
    };
    
    setSelectedFacture(factureDetaillee);
    setIsInvoiceModalOpen(true);
  };

  // ✅ VERSION CORRIGÉE - Mise à jour immédiate
  const handleStatusChange = async (factureId, newStatus) => {
    console.log('🔄 handleStatusChange appelé avec:', { factureId, newStatus });
    
    // 1. Mettre à jour la liste principale des factures
    setFactures(prevFactures => {
      const updatedFactures = prevFactures.map(facture => {
        if (facture.id === factureId) {
          const updatedStatut = newStatus === 'payée' ? 'PAYE' : 'NON_PAYE';
          console.log('📝 Mise à jour facture', factureId, 'de', facture.statut, 'vers', updatedStatut);
          return { 
            ...facture, 
            statut: updatedStatut,
            // Ajouter un timestamp pour forcer le re-rendu
            _updated: Date.now() 
          };
        }
        return facture;
      });
      
      // 2. Mettre à jour immédiatement filteredFactures aussi
      setFilteredFactures(prevFiltered => 
        prevFiltered.map(facture => {
          if (facture.id === factureId) {
            const updatedStatut = newStatus === 'payée' ? 'PAYE' : 'NON_PAYE';
            return { 
              ...facture, 
              statut: updatedStatut,
              _updated: Date.now() 
            };
          }
          return facture;
        })
      );
      
      return updatedFactures;
    });

    // 3. Mettre à jour la facture sélectionnée si c'est la même
    if (selectedFacture && selectedFacture.id === factureId) {
      setSelectedFacture(prev => ({
        ...prev,
        status: newStatus,
        statut: newStatus === 'payée' ? 'PAYE' : 'NON_PAYE',
        _updated: Date.now()
      }));
    }

    // 4. Forcer un re-rendu supplémentaire
    setUpdateTrigger(prev => prev + 1);
  };

/// ✅ VERSION CORRIGÉE avec logs et meilleure gestion
const handleDownloadInvoice = async (factureId, e) => {
  e?.stopPropagation();
  setDownloadLoading(prev => ({ ...prev, [factureId]: true }));
  
  try {
    console.log('📥 Téléchargement facture ID:', factureId);
    
    // 1. Appel API
    const response = await commandeService.downloadInvoicePDF(factureId);
    
    // 2. LOGS pour déboguer
    console.log('📦 Réponse reçue:', response);
    console.log('📦 Headers:', response.headers);
    console.log('📦 Type contenu:', response.headers['content-type']);
    console.log('📦 Taille données:', response.data?.size || response.data?.length);
    
    // 3. Vérifier que les données existent
    if (!response.data) {
      throw new Error('Aucune donnée reçue');
    }
    
    // 4. Créer le blob avec le bon type
    const blob = new Blob([response.data], { type: 'application/pdf' });
    console.log('📦 Blob créé, taille:', blob.size);
    
    // 5. Vérifier que le blob n'est pas vide
    if (blob.size === 0) {
      throw new Error('Fichier PDF vide');
    }
    
    // 6. Créer l'URL et télécharger
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `facture-${factureId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 7. Nettoyer
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    console.log('✅ Téléchargement réussi');
    
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    
    // Messages d'erreur plus explicites
    if (error.response?.status === 404) {
      alert('Facture non trouvée');
    } else if (error.response?.status === 403) {
      alert('Vous n\'avez pas la permission de télécharger cette facture');
    } else if (error.message === 'Fichier PDF vide') {
      alert('Le fichier PDF est vide');
    } else {
      alert('Erreur lors du téléchargement: ' + error.message);
    }
  } finally {
    setDownloadLoading(prev => ({ ...prev, [factureId]: false }));
  }
};
  const handleSendEmail = async (facture, e) => {
    e?.stopPropagation();
    
    if (!facture.client?.email) {
      alert('Ce client n\'a pas d\'adresse email renseignée');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Email envoyé à ${facture.client.email}`);
    } catch (error) {
      alert('Erreur lors de l\'envoi de l\'email');
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

  // Cartes statistiques
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
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
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
              <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

      {/* Cartes statistiques */}
      <StatCards key={updateTrigger} /> {/* ✅ Force re-rendu des stats */}

      {/* Filtres */}
      <FacturesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        hasActiveFilters={hasActiveFilters}
        onClearSearch={clearSearch}
        onClearStatus={clearStatus}
        onClearDate={clearDate}
        filteredCount={filteredFactures.length}
        currentPage={currentPage}
        totalPages={totalPages}
        formatDate={formatDate}
      />

      {/* Tableau */}
      <FacturesTable
        key={`table-${updateTrigger}`} // ✅ Force re-rendu du tableau
        factures={currentFactures}
        loading={loading}
        error={error}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onView={handleViewInvoice}
        onDownload={handleDownloadInvoice}
        onSendEmail={handleSendEmail}
        downloadLoading={downloadLoading}
        formatDate={formatDate}
        formatMontant={formatMontant}
        onRefresh={loadFactures}
      />

      {/* Pagination */}
      {filteredFactures.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
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
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
        }}
        facture={selectedFacture}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default InvoicingPage;