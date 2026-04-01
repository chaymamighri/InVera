// pages/dashboard/procurement/factures/components/FactureListeTab.jsx
import React, { useState, useMemo } from 'react';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import StatutPaiementBadge from './StatutPaiementBadge';

// ✅ Fonction formatPrice locale
const formatPrice = (price) => {
  if (!price) return '0,000 DT';
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price) + ' DT';
};

// ✅ Fonction formatDate locale
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const FactureListeTab = ({ 
  factures, 
  loadingFactures, 
  onViewDetail, 
  onExporterPDF, 
  onUpdatePaiement, 
  exportingId,
  setActiveTab 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('TOUS');
  
  // ✅ État pour le tri par date
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' ou 'desc'

  // ✅ Filtrer les factures par recherche et statut
  const facturesFiltrees = useMemo(() => {
    let filtered = factures.filter(facture => {
      // Recherche textuelle
      const reference = (facture.reference || facture.referenceFactureFournisseur || '').toLowerCase();
      const fournisseur = (facture.fournisseur?.nomFournisseur || facture.nomFournisseur || '').toLowerCase();
      const numeroCommande = (facture.commande?.numeroCommande || facture.numeroCommande || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchRecherche = searchTerm === '' || 
        reference.includes(searchLower) ||
        fournisseur.includes(searchLower) ||
        numeroCommande.includes(searchLower);
      
      // Filtre par statut
      const matchStatut = filterStatut === 'TOUS' || facture.statut === filterStatut;
      
      return matchRecherche && matchStatut;
    });
    
    // ✅ Tri par date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateFacture);
      const dateB = new Date(b.dateFacture);
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [factures, searchTerm, filterStatut, sortOrder]);

  // ✅ Statistiques
  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'PAYE').length,
    nonPayees: factures.filter(f => f.statut === 'NON_PAYE').length,
    filtrees: facturesFiltrees.length
  };

  // ✅ Toggle du tri
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  if (loadingFactures) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!factures || factures.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune facture générée</p>
          <button onClick={() => setActiveTab('generer')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Générer une facture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* En-tête avec filtres */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">Toutes les factures fournisseurs</h2>
            <p className="text-sm text-gray-500 mt-1">
              Consultez et gérez vos factures
            </p>
          </div>
          
          {/* Filtres */}
          <div className="flex gap-2">
            {/* Barre de recherche */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="réf, fournisseur, commande... "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 w-64 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filtre par statut */}
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="TOUS">📊 Tous les statuts</option>
              <option value="PAYE">✅ Payée</option>
              <option value="NON_PAYE">⏳ Non payée</option>
            </select>
            
            {/* Bouton reset */}
            {(searchTerm || filterStatut !== 'TOUS') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatut('TOUS');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-100"
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
              
              {/* ✅ Colonne Date avec flèches de tri */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
                >
                  Date
                  <span className="flex flex-col">
                    {sortOrder === 'desc' ? (
                      <ArrowDownIcon className="w-3 h-3 text-blue-600" />
                    ) : sortOrder === 'asc' ? (
                      <ArrowUpIcon className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowsUpDownIcon className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </span>
                </button>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Commande</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {facturesFiltrees.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Aucune facture ne correspond à vos critères</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatut('TOUS');
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Réinitialiser les filtres
                  </button>
                </td>
              </tr>
            ) : (
              facturesFiltrees.map((facture) => (
                <tr key={facture.idFactureFournisseur || facture.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {facture.reference || facture.referenceFactureFournisseur || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">
                    {formatDate(facture.dateFacture)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {facture.fournisseur?.nomFournisseur || facture.nomFournisseur || '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {facture.fournisseur?.email || facture.email || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm font-mono">
                    {facture.commande?.numeroCommande || facture.numeroCommande || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatPrice(facture.montantTotal)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatutPaiementBadge statut={facture.statut} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onViewDetail(facture)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Voir détails"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onExporterPDF(facture)} 
                        disabled={exportingId === (facture.idFactureFournisseur || facture.id)} 
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" 
                        title="Exporter PDF"
                      >
                        {exportingId === (facture.idFactureFournisseur || facture.id) ? 
                          <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 
                          <DocumentArrowDownIcon className="w-5 h-5" />
                        }
                      </button>
                      {facture.statut === 'NON_PAYE' && (
                        <button 
                          onClick={() => onUpdatePaiement(facture.idFactureFournisseur || facture.id, 'PAYE')} 
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                          title="Marquer comme payée"
                        >
                          <CurrencyDollarIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Info sur les résultats filtrés */}
        {searchTerm || filterStatut !== 'TOUS' ? (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
            <span>
              {facturesFiltrees.length} résultat(s) sur {factures.length} facture(s)
            </span>
            <span className="text-xs text-gray-400">
              {searchTerm && `Recherche: "${searchTerm}"`}
              {searchTerm && filterStatut !== 'TOUS' && ' • '}
              {filterStatut !== 'TOUS' && `Statut: ${filterStatut === 'PAYE' ? 'Payée' : 'Non payée'}`}
            </span>
          </div>
        ) : (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
            <span>{factures.length} facture(s) au total</span>
          
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureListeTab;