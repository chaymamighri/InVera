/**
 * ClientManagePage - Gestion des clients
 * 
 * RÔLE : Gérer le CRUD des clients (création, modification, suppression, consultation)
 * ROUTE : /dashboard/sales/clients
 * 
 * FONCTIONNALITÉS :
 * - Liste des clients avec pagination
 * - Filtres (recherche par nom/téléphone)
 * - Tri (ID, date de création)
 * - Création de client (modale)
 * - Modification de client (modale)
 * - Suppression avec confirmation
 * - Consultation des détails
 * - Cartes statistiques
 * 
 * COMPOSANTS UTILISÉS : * - ClientFilters : Barre de filtres et tri
 * - ClientStats : Cartes statistiques
 * - ClientFormModal : Modal création client
 * - UpdateClientModal : Modal modification client
 * - ClientDetailsModal : Modal détails client
 * - ConfirmDeleteModal : Modal confirmation suppression
 * 
 * HOOK UTILISÉ : useClients()
 */

import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import ClientFormModal from './components/ClientFormModal';
import UpdateClientModal from './components/UpdateClientModal';
import ClientDetailsModal from './components/ClientDetailsModal';
import ClientFilters from './components/ClientFilters';
import ClientStats from './components/ClientStats';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import useClients from '../../../../hooks/useClient';
import { useLanguage } from '../../../../context/LanguageContext';

// ✅ Textes de fallback pour les traductions manquantes
const FALLBACK_TEXTS = {
  'salesPages.clientManagementTitle': 'Gestion des clients',
  'salesPages.newClient': 'Nouveau client',
  'salesPages.total': 'Total',
  'salesPages.individual': 'Particulier',
  'salesPages.company': 'Entreprise',
  'salesPages.vip': 'VIP',
  'salesPages.loyalCustomer': 'Client fidèle',
  'salesPages.id': 'ID',
  'salesPages.nameSurname': 'Nom et prénom',
  'salesPages.phone': 'Téléphone',
  'salesPages.address': 'Adresse',
  'salesPages.type': 'Type',
  'salesPages.actions': 'Actions',
  'salesPages.noClientsFound': 'Aucun client trouvé',
  'salesPages.edit': 'Modifier',
  'salesPages.viewDetails': 'Voir détails',
  'salesPages.delete': 'Supprimer',
  'salesPages.of': 'de',
  'salesPages.clients': 'clients',
  'salesPages.show': 'Afficher',
  'salesPages.perPage': 'par page',
  'salesPages.firstPage': 'Première page',
  'salesPages.previousPage': 'Page précédente',
  'salesPages.nextPage': 'Page suivante',
  'salesPages.lastPage': 'Dernière page',
  'salesPages.loadingError': 'Erreur de chargement',
  'salesPages.particulier': 'Particulier',
  'salesPages.entreprise': 'Entreprise',
  'salesPages.professionnel': 'Professionnel',
  'salesPages.fidele': 'Fidèle',
  'salesPages.clientsCount': 'clients',
  'salesPages.searchPlaceholder': 'Rechercher par nom, prénom ou téléphone...',
  'salesPages.sortBy': 'Trier par',
  'salesPages.date': 'Date',
  'salesPages.idSort': 'ID',
  'salesPages.ascending': 'Croissant',
  'salesPages.descending': 'Décroissant',
  'salesPages.createClient': 'Créer un client',
  'salesPages.editClient': 'Modifier le client',
  'salesPages.clientDetails': 'Détails du client',
  'salesPages.confirmDelete': 'Confirmer la suppression',
  'salesPages.deleteConfirmation': 'Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.',
  'salesPages.cancel': 'Annuler',
  'salesPages.confirm': 'Confirmer',
  'salesPages.save': 'Enregistrer',
  'salesPages.update': 'Mettre à jour',
  'salesPages.name': 'Nom',
  'salesPages.firstName': 'Prénom',
  'salesPages.email': 'Email',
  'salesPages.phoneNumber': 'Numéro de téléphone',
  'salesPages.addressLabel': 'Adresse',
  'salesPages.clientType': 'Type de client',
  'salesPages.remise': 'Remise (%)',
  'salesPages.createdAt': 'Date de création',
  'salesPages.actionsLabel': 'Actions',
    'salesPages.individuals': 'Particuliers',
  'salesPages.companies': 'Entreprises',
  'salesPages.loyal': 'Fidèles',
  'salesPages.par': 'PAR',  // Particuliers
  'salesPages.ent': 'ENT',  // Entreprises
  'salesPages.fid': 'FID', 
};

const ClientManagePage = () => {
  const { t } = useLanguage();
  
  // ✅ Fonction de traduction avec fallback
  const safeT = (key) => {
    const translated = t(key);
    // Si la traduction retourne la clé elle-même (non trouvée) ou est vide
    if (!translated || translated === key) {
      return FALLBACK_TEXTS[key] || key;
    }
    return translated;
  };

  const [openModal, setOpenModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [filters, setFilters] = useState({ search: '' });
  
  // État pour le tri
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { 
    clients, 
    loading, 
    error, 
    fetchClients, 
    createClient,
    updateClient,
    deleteClient,
    checkTelephone,
    getRemiseForType,
    clientTypes 
  } = useClients(filters);

  // Fonction de tri
  const sortedClients = useMemo(() => {
    if (!clients) return [];
    
    return [...clients].sort((a, b) => {
      let valueA, valueB;
      
      if (sortBy === 'id') {
        valueA = a.idClient;
        valueB = b.idClient;
      } else {
        valueA = a.createdAt ? new Date(a.createdAt).getTime() : a.idClient;
        valueB = b.createdAt ? new Date(b.createdAt).getTime() : b.idClient;
      }
      
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [clients, sortBy, sortOrder]);

  // Pagination
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedClients.slice(startIndex, endIndex);
  }, [sortedClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((sortedClients?.length || 0) / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setOpenModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setOpenUpdateModal(true);
  };

  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setOpenDetailsModal(true);
  };

  // Fonctions pour la suppression
  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteClient(clientToDelete.idClient);
      toast.success('Client supprimé avec succès');
      fetchClients();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setOpenDeleteModal(false);
      setClientToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteModal(false);
    setClientToDelete(null);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setSelectedClient(null);
  };

  const handleUpdateModalClose = () => {
    setOpenUpdateModal(false);
    setSelectedClient(null);
  };

  const handleDetailsModalClose = () => {
    setOpenDetailsModal(false);
    setSelectedClient(null);
  };

  const handleModalSuccess = (message) => {
    fetchClients();
    toast.success(message);
  };

  const getTypeClientLabel = (type) => {
    const labels = {
      'PARTICULIER': safeT('salesPages.individual'),
      'VIP': safeT('salesPages.vip'),
      'PROFESSIONNEL': safeT('salesPages.company'),
      'ENTREPRISE': safeT('salesPages.company'),
      'FIDELE': safeT('salesPages.loyalCustomer')
    };
    return labels[type] || type;
  };

  const getTypeClientClasses = (type) => {
    const classes = {
      'PARTICULIER': 'bg-gray-100 text-gray-800',
      'VIP': 'bg-purple-100 text-purple-800',
      'PROFESSIONNEL': 'bg-indigo-100 text-indigo-800',
      'ENTREPRISE': 'bg-indigo-100 text-indigo-800',
      'FIDELE': 'bg-green-100 text-green-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
          <p className="font-medium">{safeT('salesPages.loadingError')}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">{safeT('salesPages.clientManagementTitle')}</h1>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAddClient}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{safeT('salesPages.newClient')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <ClientStats clients={clients} t={safeT} />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ClientFilters 
          filters={filters} 
          setFilters={setFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          t={safeT}
        />
      </div>

      {/* Table */}
      <div className="table-container bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{safeT('salesPages.id')}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{safeT('salesPages.nameSurname')}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{safeT('salesPages.phone')}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{safeT('salesPages.address')}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{safeT('salesPages.type')}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{safeT('salesPages.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedClients?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-500">{safeT('salesPages.noClientsFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients?.map((client) => (
                  <tr key={client.idClient} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{client.idClient}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.prenom || ''} {client.nom || ''}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{client.email || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.telephone || ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.adresse || ''}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getTypeClientClasses(client.typeClient)}`}>
                        {getTypeClientLabel(client.typeClient)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={safeT('salesPages.edit')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleViewDetails(client)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={safeT('salesPages.viewDetails')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(client)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={safeT('salesPages.delete')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && sortedClients?.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                <span> - </span>
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedClients.length)}</span>
                <span> {safeT('salesPages.of')} </span>
                <span className="font-medium">{sortedClients.length}</span>
                <span> {safeT('salesPages.clients')}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{safeT('salesPages.show')}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">{safeT('salesPages.perPage')}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  title={safeT('salesPages.firstPage')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  title={safeT('salesPages.previousPage')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1.5 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  title={safeT('salesPages.nextPage')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  title={safeT('salesPages.lastPage')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création */}
      <ClientFormModal
        open={openModal}
        onClose={handleModalClose}
        client={selectedClient}
        onSuccess={handleModalSuccess}
        checkTelephone={checkTelephone}
        getRemiseForType={getRemiseForType}
        clientTypes={clientTypes}
        createClient={createClient}
        t={safeT}
      />

      {/* Modal de modification */}
      <UpdateClientModal
        open={openUpdateModal}
        onClose={handleUpdateModalClose}
        client={selectedClient}
        onSuccess={handleModalSuccess}
        updateClient={updateClient}
        t={safeT}
      />

      {/* Modal de détails */}
      <ClientDetailsModal
        open={openDetailsModal}
        onClose={handleDetailsModalClose}
        client={selectedClient}
        t={safeT}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={openDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        clientName={clientToDelete ? `${clientToDelete.prenom || ''} ${clientToDelete.nom || ''}`.trim() : ''}
        t={safeT}
      />
    </div>
  );
};

export default ClientManagePage;