// src/pages/dashboard/sales/orders/components/OrderDetailsModal.jsx
import React from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  UserCircleIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClipboardDocumentIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

// Badge pour le type de client
const ClientTypeBadge = ({ type }) => {
  const colors = {
    'VIP': 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200',
    'FIDELE': 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
    'ENTREPRISE': 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200',
    'PROFESSIONNEL': 'bg-gradient-to-r from-teal-100 to-teal-50 text-teal-800 border border-teal-200',
    'PARTICULIER': 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${colors[type] || colors['PARTICULIER']}`}>
      {type}
    </span>
  );
};

// Badge pour le statut
const StatusBadge = ({ statut }) => {
  const getStatusConfig = (statut) => {
    switch(statut) {
      case 'Confirmé':
        return {
          color: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
          icon: <CheckCircleIcon className="h-5 w-5 mr-1.5" />
        };
      case 'En attente':
        return {
          color: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
          icon: <ClockIcon className="h-5 w-5 mr-1.5" />
        };
      case 'Refusé':
        return {
          color: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200',
          icon: <XCircleIcon className="h-5 w-5 mr-1.5" />
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200',
          icon: <ClockIcon className="h-5 w-5 mr-1.5" />
        };
    }
  };

  const config = getStatusConfig(statut);

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      {statut}
    </span>
  );
};

// Composant d'info client
const ClientInfoItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
};

// Composant de produit simplifié
const ProductItem = ({ produit, index }) => {
  const hasUsefulData = produit.libelle || produit.categorie || produit.description;
  
  if (!hasUsefulData) return null;

  return (
    <div className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Numéro du produit */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
        </div>
      </div>
      
      {/* Détails du produit */}
      <div className="flex-1 min-w-0">
        {/* Libellé */}
        {produit.libelle && (
          <div className="font-medium text-gray-900 mb-1">
            {produit.libelle}
          </div>
        )}
        
        {/* Catégorie */}
        {produit.categorie && (
          <div className="text-sm text-gray-600 mb-1">
            Catégorie: {produit.categorie}
          </div>
        )}
        
        {/* Description */}
        {produit.description && (
          <div className="text-sm text-gray-500">
            {produit.description}
          </div>
        )}
        
        {/* Référence */}
        {produit.reference && (
          <div className="text-xs text-gray-400 mt-1">
            Réf: {produit.reference}
          </div>
        )}
      </div>
      
      {/* Sous-total si disponible */}
      {produit.sousTotal && parseFloat(produit.sousTotal) > 0 && (
        <div className="flex-shrink-0">
          <div className="font-semibold text-blue-600">
            {parseFloat(produit.sousTotal).toFixed(2)} dt
          </div>
        </div>
      )}
    </div>
  );
};

const OrderDetailsModal = ({
  show,
  onClose,
  commande,
  toNumber
}) => {
  if (!show || !commande) return null;

  // Calculer le pourcentage de remise
  const pourcentageRemise = toNumber(commande.sousTotal) > 0 
    ? Math.round((toNumber(commande.remise) / toNumber(commande.sousTotal)) * 100)
    : 0;

  // Extraire les informations client
  const client = commande.client || {};
  const hasClientInfo = client.nom || client.prenom || client.telephone || client.email || client.adresse;
  
  // Filtrer les produits pour n'afficher que ceux avec des données utiles
  const produitsUtiles = (commande.produits || []).filter(produit => 
    produit.libelle || produit.categorie || produit.description || produit.reference
  );

  // Vérifier si on a des sous-totaux utiles
  const hasSousTotals = produitsUtiles.some(produit => 
    produit.sousTotal && parseFloat(produit.sousTotal) > 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Détails de la Commande</h2>
              <p className="text-blue-100 text-sm mt-1 flex items-center">
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                Numéro : {commande.numero}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Section 1 : Informations principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Informations commande */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <ClipboardDocumentIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Informations Commande</h3>
                    <p className="text-sm text-gray-600">Détails de la commande</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Numéro de commande</div>
                      <div className="font-medium text-gray-900 text-lg">{commande.numero}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Date de création</div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                        {commande.dateCreation}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Livraison prévue</div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2 text-green-500" />
                        {commande.dateLivraisonPrevue}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Statut de la commande</div>
                      <div className="mt-1">
                        <StatusBadge statut={commande.statut} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations client */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <UserCircleIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Client</h3>
                  <p className="text-sm text-gray-600">Informations du client</p>
                </div>
              </div>
              
              {hasClientInfo ? (
                <div className="space-y-4">
                  {/* Nom complet */}
                  {(client.nom || client.prenom) && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <IdentificationIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Nom complet</div>
                        <div className="font-semibold text-gray-900">
                          {client.nom} {client.prenom}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type de client */}
                  {client.type && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-2">Type de client</div>
                      <ClientTypeBadge type={client.type} />
                    </div>
                  )}

                  {/* Coordonnées */}
                  <div className="space-y-3">
                    <ClientInfoItem 
                      icon={PhoneIcon}
                      label="Téléphone"
                      value={client.telephone}
                    />
                    
                    <ClientInfoItem 
                      icon={EnvelopeIcon}
                      label="Email"
                      value={client.email}
                    />
                    
                    <ClientInfoItem 
                      icon={MapPinIcon}
                      label="Adresse"
                      value={client.adresse}
                    />
                  </div>

                  {/* Informations supplémentaires */}
                  {(client.codePostal || client.ville || client.pays) && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Localisation</div>
                      <div className="text-sm text-gray-700">
                        {client.codePostal && <span>{client.codePostal} </span>}
                        {client.ville && <span>{client.ville} </span>}
                        {client.pays && <span>{client.pays}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Aucune information client disponible</p>
                </div>
              )}
            </div>
          </div>

                   {/* Section 2 : Produits commandés - TABLEAU */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <CubeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Produits commandés</h3>
                  <p className="text-sm text-gray-600">Articles inclus dans la commande</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full">
                {produitsUtiles.length} article{produitsUtiles.length !== 1 ? 's' : ''}
              </span>
            </div>

            {produitsUtiles.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produit
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catégorie
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Référence
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qté
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix unitaire
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sous-total
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remise
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {produitsUtiles.map((produit, index) => {
                        // Calculer les valeurs
                        const prixUnitaire = parseFloat(produit.prix) || 0;
                        const quantite = parseFloat(produit.quantite) || 0;
                        const sousTotal = parseFloat(produit.sousTotal) || (prixUnitaire * quantite);
                        const remiseProduit = parseFloat(produit.remise) || 0;
                        const totalProduit = sousTotal - remiseProduit;
                        const tauxRemiseProduit = sousTotal > 0 ? Math.round((remiseProduit / sousTotal) * 100) : 0;

                        return (
                          <tr key={produit.id || index} className="hover:bg-gray-50 transition-colors">
                            {/* Numéro */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                                </div>
                              </div>
                            </td>
                            
                            {/* Produit */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <div className="font-medium text-gray-900">
                                  {produit.libelle || 'Produit sans nom'}
                                </div>
                                {produit.description && (
                                  <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                    {produit.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* Catégorie */}
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {produit.categorie ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {produit.categorie}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </div>
                            </td>
                            
                            {/* Référence */}
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">
                                {produit.reference || (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </div>
                            </td>
                            
                            {/* Quantité */}
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="font-medium text-gray-900">
                                  {quantite}
                                </div>
                                {produit.uniteMesure && (
                                  <span className="ml-1 text-xs text-gray-500">
                                    {produit.uniteMesure}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Prix unitaire */}
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-blue-600">
                                {prixUnitaire.toFixed(2)} dt
                              </div>
                            </td>
                            
                            {/* Sous-total */}
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {sousTotal.toFixed(2)} dt
                              </div>
                              <div className="text-xs text-gray-500">
                                {quantite} × {prixUnitaire.toFixed(2)} dt
                              </div>
                            </td>
                            
                            {/* Remise */}
                            <td className="px-4 py-3">
                              {remiseProduit > 0 ? (
                                <div className="flex flex-col">
                                  <div className="text-sm font-medium text-green-600">
                                    -{remiseProduit.toFixed(2)} dt
                                  </div>
                                  <div className="text-xs text-green-500">
                                    ({tauxRemiseProduit}%)
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">-</div>
                              )}
                            </td>
                            
                            {/* Total */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <div className="text-sm font-bold text-green-600">
                                  {totalProduit.toFixed(2)} dt
                                </div>
                                <div className="text-xs text-gray-500">
                                  Net à payer
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Ligne de totaux */}
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-4 py-3 text-right font-medium text-gray-900">
                          Totaux:
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {produitsUtiles.reduce((sum, p) => sum + (parseFloat(p.sousTotal) || 0), 0).toFixed(2)} dt
                        </td>
                        <td className="px-4 py-3 font-medium text-green-600">
                          -{produitsUtiles.reduce((sum, p) => sum + (parseFloat(p.remise) || 0), 0).toFixed(2)} dt
                        </td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          {produitsUtiles.reduce((sum, p) => {
                            const sousTotal = parseFloat(p.sousTotal) || 0;
                            const remise = parseFloat(p.remise) || 0;
                            return sum + (sousTotal - remise);
                          }, 0).toFixed(2)} dt
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Résumé des produits */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Affichage des produits avec données utiles
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{produitsUtiles.length}</span> sur <span className="font-medium">{(commande.produits || []).length}</span> produits
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-xl bg-gray-50">
                <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun détail produit disponible</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(commande.produits || []).length > 0 
                    ? `${(commande.produits || []).length} produits sans détails` 
                    : 'Aucun produit dans cette commande'}
                </p>
              </div>
            )}
          </div>

          {/* Section 3 : Récapitulatif financier */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Récapitulatif financier</h3>
                <p className="text-sm text-gray-600">Détails des montants et remises</p>
              </div>
            </div>
            
            <div className="max-w-md ml-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Sous-total produits</span>
                  <span className="font-medium">{toNumber(commande.sousTotal).toFixed(2)} dt</span>
                </div>
                
                {toNumber(commande.remise) > 0 && (
                  <div className="flex justify-between items-center py-2 bg-white/50 rounded-lg px-3">
                    <span className="text-gray-600 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-green-600" />
                      Remise ({pourcentageRemise}%)
                    </span>
                    <span className="font-semibold text-green-600">-{toNumber(commande.remise).toFixed(2)} dt</span>
                  </div>
                )}
                
                <div className="border-t border-green-200 pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">Total commande</div>
                      {client.type && (
                        <div className="text-xs text-green-600 mt-1">
                          Remise appliquée pour client {client.type}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {toNumber(commande.total).toFixed(2)} dt
                      </div>
                      {toNumber(commande.remise) > 0 && (
                        <div className="text-xs text-green-500 mt-1">
                          Économie : {toNumber(commande.remise).toFixed(2)} dt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 : Remarques */}
          {commande.remarques && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-100 mb-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800">Remarques</h3>
              </div>
              <div className="text-sm text-gray-700 bg-white/70 p-3 rounded-lg border border-yellow-200">
                {commande.remarques}
              </div>
            </div>
          )}

          {/* Section 5 : Actions */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;