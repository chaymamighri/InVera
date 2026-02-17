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
      case 'CONFIRMEE':
      case 'Confirmé':
        return {
          color: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
          icon: <CheckCircleIcon className="h-5 w-5 mr-1.5" />
        };
      case 'EN_ATTENTE':
      case 'En attente':
        return {
          color: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
          icon: <ClockIcon className="h-5 w-5 mr-1.5" />
        };
      case 'ANNULEE':
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
  const displayStatut = statut === 'EN_ATTENTE' ? 'En attente' : 
                        statut === 'CONFIRMEE' ? 'Confirmé' : 
                        statut === 'ANNULEE' ? 'Refusé' : statut;

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      {displayStatut}
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

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return 'Non définie';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

const OrderDetailsModal = ({
  show,
  onClose,
  commande,
  toNumber
}) => {
  if (!show || !commande) return null;

  // ✅ DEBUG - Vérifier la structure des produits reçus
  console.log('🎯 OrderDetailsModal - Commande reçue:', {
    id: commande.id,
    numero: commande.numero,
    dateCommande: commande.dateCommande,
    produitsCount: commande.produits?.length || 0,
    produits: commande.produits?.map(p => ({
      id: p.id,
      produitId: p.produitId,
      libelle: p.libelle,
      imageUrl: p.imageUrl,
      prixUnitaire: p.prixUnitaire,
      prix: p.prix,
      quantite: p.quantite,
      sousTotal: p.sousTotal,
      remiseProduit: p.remiseProduit,
      totalLigne: p.totalLigne,
      quantiteStock: p.quantiteStock,
      uniteMesure: p.uniteMesure
    }))
  });

  // ✅ Fonction utilitaire pour extraire le prix unitaire
  const getPrixUnitaire = (produit) => {
    if (produit.prixUnitaire) return parseFloat(produit.prixUnitaire);
    if (produit.prix) return parseFloat(produit.prix);
    return 0;
  };

  // ✅ Fonction utilitaire pour extraire le sous-total
  const getSousTotal = (produit) => {
    if (produit.sousTotal) return parseFloat(produit.sousTotal);
    const prix = getPrixUnitaire(produit);
    const qte = parseFloat(produit.quantite) || 0;
    return prix * qte;
  };

  // ✅ Fonction utilitaire pour extraire le total ligne
  const getTotalLigne = (produit) => {
    if (produit.totalLigne) return parseFloat(produit.totalLigne);
    const sousTotal = getSousTotal(produit);
    const remise = parseFloat(produit.remiseProduit) || 0;
    return sousTotal - remise;
  };

  // Calculer le pourcentage de remise
  const pourcentageRemise = toNumber(commande.sousTotal) > 0 
    ? Math.round((toNumber(commande.tauxRemise || commande.remise) / toNumber(commande.sousTotal)) * 100)
    : 0;

  // Extraire les informations client
  const client = commande.client || {};
  const hasClientInfo = client.nom || client.prenom || client.telephone || client.email || client.adresse;
  
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
                        {formatDate(commande.dateCommande)}  {/* ✅ CORRIGÉ: dateCommande */}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
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
                          {client.prenom || ''} {client.nom || ''}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Type de client */}
                  {client.typeClient && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-2">Type de client</div>
                      <ClientTypeBadge type={client.typeClient} />
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
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Aucune information client disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 : Produits commandés */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-2.5">
                  <CubeIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Produits Commandés</h3>
                  <p className="text-xs text-gray-500">Détails des articles</p>
                </div>
              </div>
              <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                {commande.produits?.length || 0} article{commande.produits?.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Section Produits */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
              {commande.produits?.length > 0 ? (
                <>
                  {/* Tableau */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Produit</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Catégorie</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Qté</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Prix unit.</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sous-total</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Remise</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-gray-200">
                        {commande.produits.map((produit, index) => {
                          // ✅ SÉCURISATION DE TOUTES LES VALEURS
                          const quantite = produit.quantite ? parseFloat(produit.quantite) : 0;
                          const prixUnitaire = getPrixUnitaire(produit);
                          const sousTotal = getSousTotal(produit);
                          const remiseProduit = produit.remiseProduit ? parseFloat(produit.remiseProduit) : 0;
                          const tauxRemiseProduit = produit.tauxRemiseProduit ? parseFloat(produit.tauxRemiseProduit) : 0;
                          const totalProduit = getTotalLigne(produit);

                          return (
                            <tr key={produit.id || produit.produitId || index} className="hover:bg-gray-50/50 transition-colors">
                              {/* Produit avec image et libellé */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {produit.imageUrl && (
                                    <div className="relative flex-shrink-0">
                                      <img 
                                        src={produit.imageUrl}
                                        alt={produit.libelle || `Produit ${produit.id || produit.produitId}`}
                                        className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900">
                                      {produit.libelle || `Produit ${produit.id || produit.produitId}`}
                                    </div>
                                    {produit.code && (
                                      <div className="text-xs text-gray-400 mt-0.5">
                                        Réf: {produit.code}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                          {/* Catégorie */}
<td className="px-4 py-3">
  {produit.categorie ? (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      {produit.categorie.nomCategorie || produit.categorie.nom || 'Catégorie'} 
    </span>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )}
</td>
                              {/* Quantité */}
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900">
                                    {quantite.toLocaleString('fr-FR')}
                                    {produit.uniteMesure && (
                                      <span className="text-xs text-gray-500 ml-1">{produit.uniteMesure}</span>
                                    )}
                                  </div>
                                  {produit.quantiteStock !== undefined && produit.quantiteStock !== null && (
                                    <div className="text-xs text-gray-500">
                                      Stock: {produit.quantiteStock}
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              {/* Prix unitaire */}
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {prixUnitaire.toFixed(3)} dt
                                </div>
                              </td>
                              
                              {/* Sous-total */}
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900">
                                    {sousTotal.toFixed(3)} dt
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {quantite} × {prixUnitaire.toFixed(3)}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Remise */}
                              <td className="px-4 py-3">
                                {remiseProduit > 0 ? (
                                  <div className="space-y-1">
                                    <div className="font-medium text-red-600">
                                      -{remiseProduit.toFixed(3)} dt
                                    </div>
                                    {tauxRemiseProduit > 0 && (
                                      <div className="text-xs text-red-500">
                                        {tauxRemiseProduit.toFixed(1)}%
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              
                              {/* Total produit */}
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  <div className="font-bold text-green-700">
                                    {totalProduit.toFixed(3)} dt
                                  </div>
                                  <div className="text-xs text-gray-500">Net</div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      
                      {/* Totaux */}
                      <tfoot className="bg-gray-50">
                        <tr className="font-medium border-t border-gray-300">
                          <td colSpan="4" className="px-4 py-3 text-right text-gray-600 text-sm">
                            Sous-total
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            <div className="text-sm font-medium">
                              {commande.produits.reduce((sum, p) => {
                                const qte = parseFloat(p.quantite) || 0;
                                const prix = getPrixUnitaire(p);
                                return sum + (qte * prix);
                              }, 0).toFixed(3)} dt
                            </div>
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            <div className="text-sm font-medium">
                              -{commande.produits.reduce((sum, p) => 
                                sum + (parseFloat(p.remiseProduit) || 0), 0).toFixed(3)} dt
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-green-700">
                            <div className="text-sm">
                              {commande.produits.reduce((sum, p) => {
                                const qte = parseFloat(p.quantite) || 0;
                                const prix = getPrixUnitaire(p);
                                const remise = parseFloat(p.remiseProduit) || 0;
                                return sum + (qte * prix - remise);
                              }, 0).toFixed(3)} dt
                            </div>
                          </td>
                        </tr>
                        
                        {/* Remise globale */}
                        {toNumber(commande.tauxRemise || commande.remise) > 0 && (
                          <tr className="bg-green-50">
                            <td colSpan="6" className="px-4 py-2.5 text-right text-gray-900">
                              <div className="text-sm font-medium flex items-center justify-end gap-1">
                                <TagIcon className="h-3 w-3 text-green-600" />
                                Remise globale ({toNumber(commande.tauxRemise || commande.remise).toFixed(1)}%)
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="font-bold text-red-600 text-sm">
                                -{toNumber(commande.montantRemise || commande.remise).toFixed(3)} dt
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {/* Total final */}
                        <tr className="bg-green-50 border-t border-green-200">
                          <td colSpan="6" className="px-4 py-3 text-right text-gray-900">
                            <div className="font-bold">Total commande</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-green-700">
                            <div className="text-base">{toNumber(commande.total).toFixed(3)} dt</div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Aucun produit</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Cette commande ne contient aucun produit.
                  </p>
                </div>
              )}
            </div>
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
                  <span className="font-medium">{toNumber(commande.sousTotal).toFixed(3)} dt</span>
                </div>
                
                {toNumber(commande.tauxRemise || commande.remise) > 0 && (
                  <div className="flex justify-between items-center py-2 bg-white/50 rounded-lg px-3">
                    <span className="text-gray-600 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-green-600" />
                      Remise ({pourcentageRemise}%)
                    </span>
                    <span className="font-semibold text-green-600">-{toNumber(commande.remise).toFixed(3)} dt</span>
                  </div>
                )}
                
                <div className="border-t border-green-200 pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">Total commande</div>
                      {client.typeClient && ( 
                        <div className="text-xs text-green-600 mt-1">
                          Remise appliquée pour client {client.typeClient}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {toNumber(commande.total).toFixed(3)} dt
                      </div>
                      {toNumber(commande.remise) > 0 && (
                        <div className="text-xs text-green-500 mt-1">
                          Économie : {toNumber(commande.remise).toFixed(3)} dt
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