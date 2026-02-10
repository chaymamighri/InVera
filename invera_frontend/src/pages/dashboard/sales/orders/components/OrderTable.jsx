// src/pages/dashboard/sales/orders/components/OrderTable.jsx
import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  XMarkIcon,
  CalendarIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const OrderTable = ({
  commandes,
  sortField,
  sortDirection,
  onSort,
  onValider,
  onRejeter,
  onVoirDetails,
  toNumber
}) => {
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fonction pour formater le montant
  const formatMontant = (montant) => {
    return toNumber(montant).toLocaleString('fr-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' dt';
  };

  // Fonction pour calculer le pourcentage de remise
  const calculerPourcentageRemise = (sousTotal, remise) => {
    if (toNumber(sousTotal) === 0 || toNumber(remise) === 0) return 0;
    return Math.round((toNumber(remise) / toNumber(sousTotal)) * 100);
  };

  // Fonction pour obtenir la couleur selon le type de client
  const getClientTypeColor = (type) => {
    switch(type?.toUpperCase()) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FIDELE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENTREPRISE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PROFESSIONNEL':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'STANDARD':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fonction pour obtenir l'icône selon le type de client
  const getClientTypeIcon = (type) => {
    switch(type?.toUpperCase()) {
      case 'ENTREPRISE':
        return <BuildingOfficeIcon className="h-3 w-3 mr-1" />;
      case 'PROFESSIONNEL':
        return <BriefcaseIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  // Calculs de pagination (recalculés à chaque render)
  const totalPages = Math.max(1, Math.ceil(commandes.length / itemsPerPage));
  const startIndex = Math.min((currentPage - 1) * itemsPerPage, commandes.length);
  const endIndex = Math.min(startIndex + itemsPerPage, commandes.length);
  const currentCommandes = commandes.slice(startIndex, endIndex);

  // Navigation de pagination
  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  // Gestion du changement d'items par page
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    
    // Recalculer la page courante pour rester dans les limites
    const newTotalPages = Math.ceil(commandes.length / newItemsPerPage);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  // Générer les numéros de page
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];
    
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }
      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2);
      }
      
      if (start > 2) pages.push('...');
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (end < totalPages - 1) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    
    return pages;
  };

  // Réinitialiser à la première page si les données changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [commandes.length]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête avec statistiques */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mt-1">
              {commandes.length} commande{commandes.length !== 1 ? 's' : ''} trouvée{commandes.length !== 1 ? 's' : ''}
              {currentCommandes.length < commandes.length && ` (${currentCommandes.length} affichées)`}
            </p>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('numero')}
              >
                <div className="flex items-center">
                  <ShoppingBagIcon className="h-3 w-3 mr-1.5 text-gray-500" />
                  N° COMMANDE
                  {sortField === 'numero' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                      <ChevronDownIcon className="ml-1 h-3 w-3" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('client')}
              >
                <div className="flex items-center">
                  <UserCircleIcon className="h-3 w-3 mr-1.5 text-gray-500" />
                  CLIENT
                  {sortField === 'client' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                      <ChevronDownIcon className="ml-1 h-3 w-3" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('dateCreation')}
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1.5 text-gray-500" />
                  DATE CRÉATION
                  {sortField === 'dateCreation' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                      <ChevronDownIcon className="ml-1 h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                PRODUITS
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                MONTANT FINAL
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                STATUT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentCommandes.map((commande) => {
              const pourcentageRemise = calculerPourcentageRemise(commande.sousTotal, commande.remise);
              
              // DEBUG: Vérifiez les données
              console.log(`📊 Commande ${commande.id} - Produits:`, commande.produits);
              
              return (
                <tr key={commande.id} className="hover:bg-gray-50 transition-colors">
                  {/* N° Commande */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-blue-600 text-sm">
                        {commande.numero}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {commande.dateCreation}
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 text-sm flex items-center">
                        <UserCircleIcon className="h-3 w-3 text-gray-400 mr-1.5" />
                        <span className="truncate max-w-[120px]">{commande.client?.nom || 'Client inconnu'}</span>
                      </div>
                      {commande.client?.type && (
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getClientTypeColor(commande.client.type)}`}>
                            {getClientTypeIcon(commande.client.type)}
                            {commande.client.type}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Date de création */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {commande.dateCreation}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Livraison: {commande.dateLivraisonPrevue}
                    </div>
                  </td>

                 {/* Produits - CORRECTION */}
<td className="px-4 py-3">
  <div>
    <div className="text-sm font-medium text-gray-900 flex items-center">
      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mr-1.5">
        {commande.produits?.length || 0}
      </span>
      produit{commande.produits?.length !== 1 ? 's' : ''}
    </div>
    
    <div className="text-xs text-gray-500 mt-1 truncate max-w-[180px]">
      {(() => {
        if (!commande.produits || commande.produits.length === 0) {
          return <span className="text-gray-400 italic">Aucun produit</span>;
        }
        
        // On prend les 2 premiers produits valides
        const produitsAAfficher = commande.produits
          .filter(p => p && (p.libelle || p.id_produit))
          .slice(0, 2);
        
        if (produitsAAfficher.length === 0) {
          return `${commande.produits.length} produit(s)`;
        }

        const affichage = produitsAAfficher.map(p => {
          const libelle = p.libelle || `Produit ${p.id_produit || 'ID inconnu'}`;
          const quantite = p.quantite ? `x${p.quantite}` : '';
          return quantite ? `${libelle} (${quantite})` : libelle;
        }).join(', ');

        // Ajouter "..." si plus de 2 produits
        const totalValides = commande.produits.filter(p => p && (p.libelle || p.id_produit)).length;
        if (totalValides > 2) {
          return `${affichage} + ${totalValides - 2} autre(s)`;
        }

        return affichage;
      })()}
    </div>
  </div>
</td>


                  {/* Montant Final avec Remise */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {formatMontant(commande.total)}
                      </div>
                      
                      {pourcentageRemise > 0 && (
                        <div className="flex items-center mt-1">
                          <div className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium border border-green-200">
                            <TagIcon className="h-2.5 w-2.5 mr-1" />
                            -{pourcentageRemise}%
                          </div>
                          <div className="ml-2 text-xs text-gray-500 line-through">
                            {formatMontant(commande.sousTotal)}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <button className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center justify-center w-32 ${
                        commande.statut === 'EN_ATTENTE' || commande.statut === 'En attente'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300' 
                          : commande.statut === 'CONFIRMEE' || commande.statut === 'Confirmé'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                          : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                      } transition-colors`}>
                        {(commande.statut === 'EN_ATTENTE' || commande.statut === 'En attente') && <ClockIcon className="h-3.5 w-3.5 mr-1.5" />}
                        {(commande.statut === 'CONFIRMEE' || commande.statut === 'Confirmé') && <CheckBadgeIcon className="h-3.5 w-3.5 mr-1.5" />}
                        {(commande.statut === 'ANNULEE' || commande.statut === 'Refusé') && <XMarkIcon className="h-3.5 w-3.5 mr-1.5" />}
                        <span className="font-semibold">
                          {commande.statut === 'EN_ATTENTE' ? 'En attente' : 
                           commande.statut === 'CONFIRMEE' ? 'Confirmé' : 
                           commande.statut === 'ANNULEE' ? 'Refusé' : commande.statut}
                        </span>
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onVoirDetails(commande)}
                        className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200"
                        title="Voir détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {(commande.statut === 'EN_ATTENTE' || commande.statut === 'En attente') && (
                        <>
                          <button
                            onClick={() => onValider(commande.id)}
                            className="p-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200"
                            title="Valider la commande"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => onRejeter(commande.id)}
                            className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200"
                            title="Rejeter la commande"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {(commande.statut === 'CONFIRMEE' || commande.statut === 'Confirmé' || 
                        commande.statut === 'ANNULEE' || commande.statut === 'Refusé') && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-300">
                          Traitée
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* État vide */}
      {commandes.length === 0 && (
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande trouvée</h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Aucune commande ne correspond à vos critères de recherche.
          </p>
        </div>
      )}

      {/* Pagination */}
      {commandes.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Informations de pagination */}
            <div className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
              <span className="font-medium">{endIndex}</span> sur{' '}
              <span className="font-medium">{commandes.length}</span> commandes
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Sélection du nombre d'éléments par page */}
              <div className="text-sm text-gray-700 flex items-center">
                <span className="mr-2">Afficher :</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="ml-2">par page</span>
              </div>

              {/* Contrôles de pagination */}
              <div className="flex items-center space-x-2">
                {/* Bouton précédent */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                  } transition-colors`}
                  aria-label="Page précédente"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                {/* Numéros de page */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border border-blue-700'
                            : 'text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                        } transition-colors`}
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Bouton suivant */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                  } transition-colors`}
                  aria-label="Page suivante"
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

export default OrderTable;