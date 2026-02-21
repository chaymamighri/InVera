import React from 'react';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

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

const FacturesTable = ({
  factures,
  loading,
  error,
  sortField,
  sortOrder,
  onSort,
  onView,
  onDownload,
  onSendEmail,
  downloadLoading,
  formatDate,
  formatMontant,
  onRefresh
}) => {
  
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return <span className="ml-1 text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
            <DocumentTextIcon className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des factures...</p>
          <p className="text-sm text-gray-400">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onRefresh}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (factures.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-500">Aucune facture ne correspond à vos critères</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                { key: 'statut', label: 'Statut' },
                { key: 'actions', label: 'Action', align: 'right' }
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${col.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => col.key !== 'actions' && onSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.icon && <col.icon className="h-4 w-4 text-gray-500" />}
                    <span>{col.label}</span>
                    <SortIcon field={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {factures.map((facture) => (
              <tr 
                key={facture.id} 
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => onView(facture)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(facture);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      title="Voir détails"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(facture, e);
                      }}
                      disabled={downloadLoading?.[facture.id]}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Télécharger PDF"
                    >
                      {downloadLoading?.[facture.id] ? (
                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                      ) : (
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendEmail(facture, e);
                      }}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
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
    </div>
  );
};

export default FacturesTable;