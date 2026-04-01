// components/commandeDetailsModal.jsx - Version Clean Code
import React, { useEffect, useMemo } from 'react';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  TruckIcon,
  TagIcon,
  MapPinIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';

// ========== CONSTANTES ==========
const StatutCommande = {
  BROUILLON: 'BROUILLON',
  VALIDEE: 'VALIDEE',
  ENVOYEE: 'ENVOYEE',
  RECUE: 'RECUE',
  FACTUREE: 'FACTUREE',
  ANNULEE: 'ANNULEE',
};

const STATUTS_RECUS = [StatutCommande.RECUE, StatutCommande.FACTUREE];

// ========== UTILITAIRES ==========
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price);
};

const getStatusBadge = (statut) => {
  const colors = {
    [StatutCommande.BROUILLON]: 'bg-gray-100 text-gray-800 border-gray-300',
    [StatutCommande.VALIDEE]: 'bg-blue-100 text-blue-800 border-blue-300',
    [StatutCommande.ENVOYEE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [StatutCommande.RECUE]: 'bg-green-100 text-green-800 border-green-300',
    [StatutCommande.FACTUREE]: 'bg-purple-100 text-purple-800 border-purple-300',
    [StatutCommande.ANNULEE]: 'bg-red-100 text-red-800 border-red-300',
  };
  return (
    <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${colors[statut] || colors[StatutCommande.BROUILLON]}`}>
      {statut}
    </span>
  );
};

// ========== HOOK PERSONNALISÉ ==========
const useCommandeCalculs = (commande) => {
  const estRecue = useMemo(() => 
    STATUTS_RECUS.includes(commande?.statut), 
    [commande?.statut]
  );

  const ligneAvecTotaux = useMemo(() => {
    if (!commande?.lignesCommande) return [];
    
    return commande.lignesCommande.map(ligne => {
      // ✅ Règle métier : quantité utilisée selon le statut
      const quantite = estRecue 
        ? (ligne.quantiteRecue || 0)  // Si reçue : utiliser qté reçue (0 par défaut)
        : (ligne.quantite || 0);       // Sinon : utiliser qté commandée
      
      const prixUnitaire = ligne.prixUnitaire || 0;
      const tauxTVA = ligne.tauxTVA || 19;
      
      const sousTotalHT = quantite * prixUnitaire;
      const montantTVA = sousTotalHT * tauxTVA / 100;
      const sousTotalTTC = sousTotalHT + montantTVA;
      
      return {
        ...ligne,
        quantiteUtilisee: quantite,
        sousTotalHT,
        montantTVA,
        sousTotalTTC
      };
    });
  }, [commande, estRecue]);

  const totaux = useMemo(() => {
    if (!ligneAvecTotaux.length) return { totalHT: 0, totalTVA: 0, totalTTC: 0 };
    
    return ligneAvecTotaux.reduce((acc, ligne) => ({
      totalHT: acc.totalHT + ligne.sousTotalHT,
      totalTVA: acc.totalTVA + ligne.montantTVA,
      totalTTC: acc.totalTTC + ligne.sousTotalTTC
    }), { totalHT: 0, totalTVA: 0, totalTTC: 0 });
  }, [ligneAvecTotaux]);

  const detailTVA = useMemo(() => {
    return ligneAvecTotaux.reduce((acc, ligne) => {
      const taux = ligne.tauxTVA || 19;
      if (!acc[taux]) acc[taux] = { ht: 0, tva: 0 };
      acc[taux].ht += ligne.sousTotalHT;
      acc[taux].tva += ligne.montantTVA;
      return acc;
    }, {});
  }, [ligneAvecTotaux]);

  return { estRecue, ligneAvecTotaux, totaux, detailTVA };
};

// ========== COMPOSANT PRINCIPAL ==========
const CommandeDetailsModal = ({ isOpen, onClose, commande }) => {
  const { estRecue, ligneAvecTotaux, totaux, detailTVA } = useCommandeCalculs(commande);

  useEffect(() => {
    if (commande) {
      console.log('📦 Commande reçue dans modal:', commande);
    }
  }, [commande]);

  if (!isOpen || !commande) return null;

  // Helper pour le statut de réception
  const getReceptionStatus = (ligne) => {
    const quantiteRecue = ligne.quantiteRecue || 0;
    const quantiteCommandee = ligne.quantite || 0;
    
    if (quantiteRecue === 0) return { type: 'none', text: '❌ Non reçu', color: 'red' };
    if (quantiteRecue === quantiteCommandee) return { type: 'full', text: '✓ Reçu complet', color: 'green' };
    return { type: 'partial', text: `⚠️ Réception partielle (${quantiteRecue}/${quantiteCommandee})`, color: 'orange' };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl shadow-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-full max-w-6xl">

          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <TagIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      Commande {commande.numeroCommande || 'N/A'}
                    </h3>
                    {getStatusBadge(commande.statut)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors" title="Exporter">
                  <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors" title="Fermer">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Corps */}
          <div className="px-8 py-6 bg-gray-50 max-h-[calc(85vh-200px)] overflow-y-auto">
            <div className="space-y-6">

              {/* Informations de livraison */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InfoCard icon={CalendarIcon} label="Date commande" value={formatDate(commande.dateCommande)} />
                <InfoCard icon={TruckIcon} label="Livraison prévue" value={formatDate(commande.dateLivraisonPrevue)} />
                {commande.dateLivraisonReelle && (
                  <InfoCard icon={TruckIcon} label="Livraison réelle" value={formatDate(commande.dateLivraisonReelle)} highlight />
                )}
                <InfoCard icon={MapPinIcon} label="Adresse livraison" value={commande.adresseLivraison || 'Non spécifiée'} />
              </div>

              {/* Fournisseur */}
              <FournisseurCard fournisseur={commande.fournisseur} />

              {/* Articles */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Détail des articles</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">Produit</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">Qté commandée</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">Qté reçue</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">Prix unit.</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500">TVA</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">Total HT</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ligneAvecTotaux.map((ligne, idx) => {
                        const quantiteRecue = ligne.quantiteRecue || 0;
                        const receptionStatus = getReceptionStatus(ligne);
                        const colorMap = { green: 'text-green-600', orange: 'text-orange-600', red: 'text-red-600' };
                        
                        return (
                          <tr key={ligne.idLigneCommandeFournisseur || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{ligne.produitLibelle || 'Produit sans nom'}</div>
                              {ligne.produitReference && <div className="text-sm text-gray-500">Réf: {ligne.produitReference}</div>}
                              {estRecue && (
                                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-${receptionStatus.color}-100 text-${receptionStatus.color}-800`}>
                                  {receptionStatus.text}
                                </span>
                              )}
                              {!estRecue && commande.statut === StatutCommande.ENVOYEE && (
                                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">🚚 En cours de livraison</span>
                              )}
                              {!estRecue && commande.statut === StatutCommande.VALIDEE && (
                                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏳ En attente de réception</span>
                              )}
                             </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">{ligne.quantite}</td>
                            <td className="px-6 py-4 text-right">
                              {estRecue ? (
                                <div>
                                  <span className={`font-semibold ${colorMap[receptionStatus.color]}`}>{quantiteRecue}</span>
                                  {receptionStatus.type === 'partial' && (
                                    <div className="text-xs text-orange-500 mt-0.5">Manque: {ligne.quantite - quantiteRecue}</div>
                                  )}
                                </div>
                              ) : <span className="text-gray-400 italic text-sm">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">{formatPrice(ligne.prixUnitaire)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{ligne.tauxTVA || 19}%</span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">{formatPrice(ligne.sousTotalHT)}</td>
                            <td className="px-6 py-4 text-right font-semibold text-blue-600">{formatPrice(ligne.sousTotalTTC)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Détail TVA */}
              {Object.keys(detailTVA).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <ReceiptPercentIcon className="w-5 h-5 text-blue-600" />
                    Détail de la TVA
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(detailTVA).map(([taux, valeurs]) => (
                      <div key={taux} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">TVA {taux}%</p>
                        <p className="text-lg font-semibold text-blue-600">{formatPrice(valeurs.tva)}</p>
                        <p className="text-xs text-gray-400">Base: {formatPrice(valeurs.ht)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Récapitulatif des montants</h4>
                  <div className="space-y-3">
                    <TotalRow label="Total HT" value={formatPrice(totaux.totalHT)} />
                    <TotalRow label="Total TVA" value={formatPrice(totaux.totalTVA)} />
                    <TotalRow label="Total TTC" value={formatPrice(totaux.totalTTC)} isBold />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied */}
          <div className="bg-gray-100 px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== COMPOSANTS UTILITAIRES ==========
const InfoCard = ({ icon: Icon, label, value, highlight }) => (
  <div className={`bg-white p-4 rounded-xl border shadow-sm ${highlight ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${highlight ? 'text-green-600' : 'text-blue-600'}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-semibold ${highlight ? 'text-green-700' : ''}`}>{value}</p>
      </div>
    </div>
  </div>
);

const FournisseurCard = ({ fournisseur }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
        <h4 className="font-semibold text-gray-900">Informations fournisseur</h4>
      </div>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase">Nom</p>
          <p className="text-base font-semibold text-gray-900">{fournisseur?.nomFournisseur || fournisseur?.nom || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
          <a href={`mailto:${fournisseur?.email}`} className="text-base text-blue-600 hover:text-blue-800 font-medium">{fournisseur?.email || 'N/A'}</a>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase">Téléphone</p>
          <a href={`tel:${fournisseur?.telephone}`} className="text-base text-gray-900 font-medium">{fournisseur?.telephone || 'N/A'}</a>
        </div>
      </div>
    </div>
  </div>
);

const TotalRow = ({ label, value, isBold }) => (
  <div className={`flex justify-between items-center ${isBold ? 'border-t border-gray-200 pt-3 mt-3' : 'text-sm'}`}>
    <span className={isBold ? 'text-base font-semibold text-gray-900' : 'text-gray-600'}>{label}</span>
    <span className={isBold ? 'text-xl font-bold text-blue-600' : 'font-medium text-gray-900'}>{value}</span>
  </div>
);

export default CommandeDetailsModal;