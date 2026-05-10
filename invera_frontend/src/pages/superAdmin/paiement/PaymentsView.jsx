// pages/superAdmin/paiement/PaymentsView.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { paymentService } from '../../../servicesPlatform/paymentService';
import {
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const PaymentsView = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const itemsPerPage = 10;

  // STATUTS pour paiements
  const STATUS_OPTIONS = [
    { label: 'Tous', value: 'all' },
    { label: 'Succès', value: 'SUCCES' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Échec', value: 'ECHEC' },
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllPayments();
      const paymentsData = Array.isArray(response) ? response : (response.data || []);
      setPayments(paymentsData);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Impossible de charger les paiements');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Application des filtres
  const getFilteredPayments = () => {
    let filtered = [...payments];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.statut === statusFilter);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const clientFullName = `${p.clientPrenom || ''} ${p.clientNom || ''}`.toLowerCase();
        return (
          (p.id?.toString() || '').toLowerCase().includes(searchLower) ||
          clientFullName.includes(searchLower) ||
          (p.clientEmail || '').toLowerCase().includes(searchLower) ||
          (p.offreNom || '').toLowerCase().includes(searchLower) ||
          (p.statut || '').toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  };

  const filteredPayments = getFilteredPayments();
  
  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Statistiques
  const stats = useMemo(() => {
    const total = payments.length;
    const success = payments.filter(p => p.statut === 'SUCCES').length;
    const pending = payments.filter(p => p.statut === 'EN_ATTENTE').length;
    const failed = payments.filter(p => p.statut === 'ECHEC').length;
    const totalAmount = payments
      .filter(p => p.statut === 'SUCCES')
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    return { total, success, pending, failed, totalAmount };
  }, [payments]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      setError('Aucun paiement à exporter');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setExporting(true);
      const filename = searchTerm || statusFilter !== 'all' 
        ? 'paiements_filtres' 
        : 'tous_les_paiements';
      paymentService.exportToCSV(filteredPayments, filename);
    } catch (err) {
      console.error('Erreur export:', err);
      setError('Erreur lors de l\'export');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  // Ouvrir le modal avec les détails
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (montant, devise = 'XAF') => {
    const numAmount = typeof montant === 'number' ? montant : parseFloat(montant);
    if (isNaN(numAmount)) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getStatusBadge = (statut) => {
    const statusMap = {
      'SUCCES': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Succès' },
      'EN_ATTENTE': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' },
      'ECHEC': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Échec' }
    };
    
    const statusInfo = statusMap[statut] || { bg: 'bg-gray-100', text: 'text-gray-700', label: statut || 'Inconnu' };
    
    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.bg} ${statusInfo.text} border-transparent`}>
        {statusInfo.label}
      </span>
    );
  };

  const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchPayments} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg">
          Réessayer
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">
              Gestion financière
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              Paiements des abonnements
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
              Consultez l'historique des paiements, filtrez par statut et exportez les données.
              Les paiements en succès activent automatiquement les abonnements clients.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher un paiement..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cartes statistiques */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Total Paiements</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Paiements réussis</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.success}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">En attente</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Échecs</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{stats.failed}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Montant total (succès)</p>
          <p className="mt-2 text-3xl font-semibold text-purple-600">{formatAmount(stats.totalAmount)}</p>
        </div>
      </section>

      {/* Tableau des paiements */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    statusFilter === option.value
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:text-purple-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exporting || filteredPayments.length === 0}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                {exporting ? 'Export...' : 'Exporter CSV'}
              </button>
            
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Offre</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentPayments.map((payment) => {
                const clientFullName = `${payment.clientPrenom || ''} ${payment.clientNom || ''}`.trim() || 'Client inconnu';

                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">#{payment.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">
                          {clientFullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{clientFullName}</p>
                          <p className="text-sm text-gray-500">{payment.clientEmail || 'Email non renseigné'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {payment.offreNom || 'Offre inconnue'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatAmount(payment.montant, payment.devise)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(payment.dateDemande)}</td>
                    <td className="px-6 py-4">{getStatusBadge(payment.statut)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-200 transition"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="px-6 py-16 text-center text-gray-500">
              Aucun paiement ne correspond à cette recherche.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Précédent
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                Suivant
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails - Version sans onglets, toutes les infos sur une seule page */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* En-tête */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Détails du paiement #{selectedPayment.id}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDate(selectedPayment.dateDemande)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Corps du modal - Toutes les informations sur une seule page */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Section Paiement */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Informations paiement
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">ID Paiement</p>
                    <p className="font-mono text-gray-900 mt-1">#{selectedPayment.id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Statut</p>
                    <div className="mt-1">{getStatusBadge(selectedPayment.statut)}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Montant</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {formatAmount(selectedPayment.montant, selectedPayment.devise)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date de la demande</p>
                    <p className="text-gray-900 mt-1">{formatDate(selectedPayment.dateDemande)}</p>
                  </div>
                  {selectedPayment.dateConfirmation && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Date de confirmation</p>
                      <p className="text-gray-900 mt-1">{formatDate(selectedPayment.dateConfirmation)}</p>
                    </div>
                  )}
                  {selectedPayment.konnectPaymentId && (
                    <div className="bg-gray-50 rounded-lg p-4 col-span-full">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">ID Transaction Konnect</p>
                      <p className="text-sm font-mono text-gray-600 mt-1 break-all">{selectedPayment.konnectPaymentId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Client */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Informations client
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nom complet</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedPayment.clientPrenom} {selectedPayment.clientNom}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-gray-900 mt-1 break-all">{selectedPayment.clientEmail || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Section Offre */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Informations offre
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Offre souscrite</p>
                    <p className="font-semibold text-indigo-700 mt-1">{selectedPayment.offreNom || 'Offre inconnue'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Durée</p>
                    <p className="text-gray-900 mt-1">{selectedPayment.dureeMois || 'N/A'} mois</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Prix de l'offre</p>
                    <p className="text-gray-900 mt-1">{formatAmount(selectedPayment.offrePrix, selectedPayment.offreDevise)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Devise</p>
                    <p className="text-gray-900 mt-1">{selectedPayment.devise || 'XAF'}</p>
                  </div>
                
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;