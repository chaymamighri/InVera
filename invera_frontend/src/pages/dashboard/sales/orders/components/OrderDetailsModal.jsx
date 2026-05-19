// src/pages/dashboard/sales/orders/components/OrderDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CubeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import clientService from '../../../../../services/clientService';

// Badge pour le type de client
const ClientTypeBadge = ({ type }) => {
  const colors = {
    'VIP': 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200',
    'FIDELE': 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
    'ENTREPRISE': 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200',
    'PROFESSIONNEL': 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200',
    'PARTICULIER': 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
  };
  
  const typeLabels = {
    'ENTREPRISE': '🏢 Entreprise',
    'PROFESSIONNEL': '💼 Professionnel',
    'PARTICULIER': '👤 Particulier',
    'VIP': '⭐ VIP',
    'FIDELE': '🔁 Fidèle'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${colors[type] || colors['PARTICULIER']}`}>
      {typeLabels[type] || type}
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
      case 'Annulée':
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
                        statut === 'CONFIRMEE' ? 'Confirmée' : 
                        statut === 'ANNULEE' ? 'Annulée' : statut;

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      {displayStatut}
    </span>
  );
};

// Composant d'info client (adapté pour entreprise vs particulier)
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

// Composant pour afficher les infos client spécifiques selon le type
const ClientInfoSection = ({ client }) => {
  const isEntreprise = client?.typeClient === 'ENTREPRISE' || client?.typeClient === 'PROFESSIONNEL';
  
  return (
    <div className="space-y-4">
      {/* Type de client */}
      {client?.typeClient && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Type de client</div>
          <ClientTypeBadge type={client.typeClient} />
        </div>
      )}
      
      {/* Nom / Raison sociale */}
      {isEntreprise ? (
        <>
          <ClientInfoItem 
            icon={BuildingOfficeIcon}
            label="Raison sociale"
            value={client.raisonSociale || client.nom}
          />
          {client.matriculeFiscal && (
            <ClientInfoItem 
              icon={IdentificationIcon}
              label="Matricule fiscal"
              value={client.matriculeFiscal}
            />
          )}
          <ClientInfoItem 
            icon={BriefcaseIcon}
            label="Gérant"
            value={client.prenom && client.nom ? `${client.prenom} ${client.nom}` : client.nom}
          />
        </>
      ) : (
        <ClientInfoItem 
          icon={IdentificationIcon}
          label="Nom complet"
          value={client.prenom && client.nom ? `${client.prenom} ${client.nom}` : client.nom}
        />
      )}
      
      {/* Coordonnées communes */}
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


const calculerRemiseProduit = (produit) => {
  // Log pour debug
  console.log('🔍 Calcul remise pour produit:', {
    libelle: produit.libelle,
    categorieRemiseStandard: produit.categorieRemiseStandard,
    tauxRemiseProduit: produit.tauxRemiseProduit,
    remiseProduit: produit.remiseProduit
  });
  
  // Utiliser directement les valeurs déjà calculées
  if (produit.remiseProduit > 0) {
    return {
      remiseMontant: produit.remiseProduit,
      tauxRemise: produit.tauxRemiseProduit || 0
    };
  }
  
  // Si la remise est dans categorieRemiseStandard
  if (produit.categorieRemiseStandard > 0) {
    const prixUnitaire = parseFloat(produit.prixUnitaire) || parseFloat(produit.prix) || 0;
    const quantite = parseFloat(produit.quantite) || 1;
    const remiseMontant = (prixUnitaire * quantite) * (produit.categorieRemiseStandard / 100);
    
    return {
      remiseMontant: remiseMontant,
      tauxRemise: produit.categorieRemiseStandard
    };
  }
  
  return {
    remiseMontant: 0,
    tauxRemise: 0
  };
};

const OrderDetailsModal = ({
  show,
  onClose,
  commande: initialCommande, 
  toNumber
}) => {
  const [commande, setCommande] = useState(initialCommande);
  // ✅ Ajout de l'état pour la remise client
  const [clientRemise, setClientRemise] = useState(0);
  const [loadingRemise, setLoadingRemise] = useState(false);

  // ✅ Récupérer la remise du client par son type
  useEffect(() => {
    const fetchClientRemise = async () => {
      if (!commande?.client?.typeClient) return;
      
      setLoadingRemise(true);
      try {
        const response = await clientService.getRemiseByType(commande.client.typeClient);
        if (response?.success) {
          setClientRemise(response.remise || 0);
        }
      } catch (error) {
        console.error('Erreur chargement remise client:', error);
      } finally {
        setLoadingRemise(false);
      }
    };
    
    fetchClientRemise();
  }, [commande?.client?.typeClient]);

  useEffect(() => {
    if (initialCommande) {
      console.log('🔍 STRUCTURE COMPLÈTE DE LA COMMANDE:', initialCommande);
      console.log('🔍 CLIENT:', initialCommande.client);
      console.log('🔍 PRODUITS:', initialCommande.produits);
      
      const commandeAvecId = {
        ...initialCommande,
        id: initialCommande.id || initialCommande.idCommandeClient,
        idCommandeClient: initialCommande.idCommandeClient || initialCommande.id
      };
      
      setCommande(commandeAvecId);
    }
  }, [initialCommande]);

  if (!show || !commande) return null;

  const client = commande.client || {};
  const isEntreprise = client?.typeClient === 'ENTREPRISE' || client?.typeClient === 'PROFESSIONNEL';
  const hasClientInfo = client.nom || client.raisonSociale || client.telephone || client.email || client.adresse;

  // ✅ Enrichir les produits avec les remises calculées
  const produitsEnrichis = commande.produits?.map(produit => {
    const remiseCalculee = calculerRemiseProduit(produit);
    
    return {
      ...produit,
      remiseProduit: remiseCalculee.remiseMontant,
      tauxRemiseProduit: remiseCalculee.tauxRemise
    };
  }) || [];

  // Calcul des totaux avec les produits enrichis
  const sousTotal = produitsEnrichis.reduce((sum, p) => {
    const qte = parseFloat(p.quantite) || 0;
    const prix = parseFloat(p.prixUnitaire) || parseFloat(p.prix) || 0;
    return sum + (qte * prix);
  }, 0);
  
  const remiseTotale = produitsEnrichis.reduce((sum, p) => 
    sum + (parseFloat(p.remiseProduit) || 0), 0);
  
  const totalApresRemises = sousTotal - remiseTotale;
  
  // ✅ Utiliser la remise client récupérée depuis l'API, sinon utiliser celle de la commande
  const remiseGlobale = clientRemise > 0 ? clientRemise : parseFloat(commande.tauxRemise || commande.remise || 0);
  const montantRemiseGlobale = totalApresRemises * (remiseGlobale / 100);
  const totalFinal = totalApresRemises - montantRemiseGlobale;

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
                Numéro : {commande.numero || commande.referenceCommandeClient || 'N/A'}
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
                      <div className="font-medium text-gray-900 text-lg">
                        {commande.numero || commande.referenceCommandeClient || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Date de création</div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDate(commande.dateCommande)}
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

            {/* Informations client - Version adaptée */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {isEntreprise ? (
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <UserCircleIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">
                    {isEntreprise ? 'Entreprise' : 'Client'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isEntreprise ? 'Informations de l\'entreprise' : 'Informations du client'}
                  </p>
                </div>
              </div>
              
              {hasClientInfo ? (
                <ClientInfoSection client={client} />
              ) : (
                <div className="text-center py-4">
                  <UserCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Aucune information client disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 : Produits commandés - SIMPLIFIÉE */}
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
      {produitsEnrichis.length || 0} article{produitsEnrichis.length !== 1 ? 's' : ''}
    </span>
  </div>

  {/* Tableau des produits - SIMPLIFIÉ (sans les totaux dans le tableau) */}
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
    {produitsEnrichis.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Produit</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Qté</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Prix unit.</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Sous-total</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Remise</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200">
            {produitsEnrichis.map((produit, index) => {
              const quantite = parseFloat(produit.quantite) || 0;
              const prixUnitaire = parseFloat(produit.prixUnitaire) || parseFloat(produit.prix) || 0;
              const sousTotalLigne = quantite * prixUnitaire;
              const remiseLigne = parseFloat(produit.remiseProduit) || 0;
              const tauxRemiseLigne = parseFloat(produit.tauxRemiseProduit) || 
                                     (remiseLigne > 0 ? (remiseLigne / sousTotalLigne * 100) : 0);
              const totalLigne = sousTotalLigne - remiseLigne;

              return (
                <tr key={produit.id || produit.produitId || index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {produit.imageUrl && (
                        <img 
                          src={produit.imageUrl}
                          alt={produit.libelle}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">
                          {produit.libelle || `Produit ${produit.id || produit.produitId}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-medium text-gray-900">
                      {quantite}
                      {produit.uniteMesure && (
                        <span className="text-xs text-gray-500 ml-1">{produit.uniteMesure}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-gray-900">
                      {prixUnitaire.toFixed(3)} dt
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-gray-900">
                      {sousTotalLigne.toFixed(3)} dt
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {remiseLigne > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-red-600 font-medium">
                          -{remiseLigne.toFixed(3)} dt
                        </span>
                        {tauxRemiseLigne > 0 && (
                          <span className="text-xs text-red-500">
                            ({tauxRemiseLigne.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-green-700">
                      {totalLigne.toFixed(3)} dt
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-10">
        <CubeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Aucun produit dans cette commande</p>
      </div>
    )}
  </div>
</div>

{/* SECTION RÉCAPITULATIVE - UNIQUEMENT À DROITE */}
<div className="flex justify-end mt-2">
  <div className="w-80 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 shadow-sm">
    <div className="space-y-1.5 text-sm">
      {/* Sous-total */}
      <div className="flex justify-between">
        <span className="text-gray-600">Sous-total</span>
        <span className="font-medium">{sousTotal.toFixed(3)} dt</span>
      </div>
      
      {/* Remises sur produits */}
      {remiseTotale > 0 && (
        <div className="flex justify-between text-red-600">
          <span>Remises produits</span>
          <span>-{remiseTotale.toFixed(3)} dt</span>
        </div>
      )}
      
      {/* Remise client */}
      {remiseGlobale > 0 && (
        <div className="flex justify-between text-red-600 bg-white/50 rounded p-1.5 -mx-1.5">
          <span className="flex items-center gap-1">
            <TagIcon className="h-3 w-3 text-green-600" />
            Remise {client.typeClient || 'client'} ({remiseGlobale}%)
          </span>
          <span>-{montantRemiseGlobale.toFixed(3)} dt</span>
        </div>
      )}
      
      <div className="border-t border-green-200 my-1"></div>
      
      {/* Total final */}
      <div className="flex justify-between font-bold">
        <span className="text-gray-800">Total</span>
        <span className="text-green-700 font-bold text-base">{totalFinal.toFixed(3)} dt</span>
      </div>
      
      {/* Économies */}
      {(remiseTotale > 0 || remiseGlobale > 0) && (
        <div className="text-right">
          <span className="text-xs text-green-600">
            Économie : {(remiseTotale + montantRemiseGlobale).toFixed(3)} dt
          </span>
        </div>
      )}
    </div>
      </div>
    </div>
      
          {/* Actions */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-3">
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