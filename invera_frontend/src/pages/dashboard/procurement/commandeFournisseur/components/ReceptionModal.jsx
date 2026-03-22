// components/ReceptionModal.jsx - Version avec popup de confirmation
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(price);
};

const ReceptionModal = ({ isOpen, onClose, commande, onConfirm }) => {
  const [quantitesRecues, setQuantitesRecues] = useState({});
  const [notes, setNotes] = useState('');
  const [numeroBL, setNumeroBL] = useState('');
  
  // États pour la confirmation
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);
  
  // ✅ État pour savoir si l'utilisateur a choisi de réactiver ou non
  const [choixReactivation, setChoixReactivation] = useState(null); // 'oui' ou 'non'

  // Initialiser avec les quantités commandées
  useEffect(() => {
    if (commande?.lignesCommande) {
      const initial = {};
      commande.lignesCommande.forEach(ligne => {
        const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
        initial[ligneId] = ligne.quantite;
      });
      
      setQuantitesRecues(initial);
      setNotes('');
      setNumeroBL('');
      setChoixReactivation(null);
    }
  }, [commande]);

  if (!isOpen || !commande) return null;

  const handleQuantityChange = (ligneId, value) => {
    const quantite = parseInt(value) || 0;
    const ligne = commande.lignesCommande.find(l => 
      (l.idLigneCommandeFournisseur || l.id) === ligneId
    );
    
    if (quantite > ligne.quantite) {
      alert(`La quantité reçue ne peut pas dépasser la quantité commandée (${ligne.quantite})`);
      return;
    }
    
    setQuantitesRecues(prev => ({
      ...prev,
      [ligneId]: quantite
    }));
  };

  const calculerTotauxRecus = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    commande.lignesCommande.forEach(ligne => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      const prixUnitaire = ligne.prixUnitaire || 0;
      
      const tauxTVA = ligne.tauxTVA || 20;
      const sousTotalHT = qteRecue * prixUnitaire;
      const montantTVA = sousTotalHT * tauxTVA / 100;
      const sousTotalTTC = sousTotalHT + montantTVA;
      
      totalHT += sousTotalHT;
      totalTVA += montantTVA;
      totalTTC += sousTotalTTC;
    });

    return { totalHT, totalTVA, totalTTC };
  };

  // ✅ Vérifier s'il y a des produits inactifs avec quantité > 0
  const verifierProduitsInactifs = () => {
    const produitsInactifsAvecQté = commande.lignesCommande.filter(ligne => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      return ligne.estInactif && qteRecue > 0;
    });
    return produitsInactifsAvecQté;
  };

  // ✅ Vérifier si tous les produits sont reçus
  const toutesRecues = commande.lignesCommande.every(ligne => {
    const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
    return quantitesRecues[ligneId] === ligne.quantite;
  });

  const handleSubmitClick = () => {
    // Validations de base
    const aAuMoinsUnProduit = Object.values(quantitesRecues).some(q => q > 0);
    if (!aAuMoinsUnProduit) {
      alert('Veuillez saisir au moins un produit reçu');
      return;
    }

    if (!numeroBL.trim()) {
      alert('Veuillez saisir le numéro de bon de livraison');
      return;
    }

    const produitsInactifs = verifierProduitsInactifs();

    // ✅ S'il y a des produits inactifs, afficher la confirmation
    if (produitsInactifs.length > 0) {
      setPendingSubmission({
        quantitesRecues,
        numeroBL,
        notes: notes.trim() || null,
        dateReception: new Date().toISOString()
      });
      setShowConfirmDialog(true);
    } else {
      // Pas de produits inactifs, soumettre directement
      onConfirm({
        quantitesRecues,
        numeroBL,
        notes: notes.trim() || null,
        dateReception: new Date().toISOString(),
        produitsAReactiver: {} // Pas de produits à réactiver
      });
    }
  };

  // ✅ Confirmation avec réactivation
  const handleConfirmWithActivation = () => {
    // ✅ Construire l'objet produitsAReactiver avec TOUS les produits inactifs reçus
    const produitsAReactiverMap = {};
    
    commande.lignesCommande.forEach(ligne => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      if (ligne.estInactif && qteRecue > 0) {
        produitsAReactiverMap[ligneId] = true; 
      }
    });
    
    const dataToSend = {
      ...pendingSubmission,
      produitsAReactiver: produitsAReactiverMap
    };
    
    onConfirm(dataToSend);
    setShowConfirmDialog(false);
    setPendingSubmission(null);
  };

  // ✅ Confirmation sans réactivation
  const handleConfirmWithoutActivation = () => {
    const dataToSend = {
      ...pendingSubmission,
      produitsAReactiver: {}
    };
    
    onConfirm(dataToSend);
    setShowConfirmDialog(false);
    setPendingSubmission(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingSubmission(null);
  };

  const totauxRecus = calculerTotauxRecus();
  const produitsInactifs = verifierProduitsInactifs();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-green-700 sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              Réception de commande - {commande.numeroCommande}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Info fournisseur */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Fournisseur</h4>
              <p className="font-medium">{commande.fournisseur?.nomFournisseur}</p>
              <p className="text-sm text-gray-600">{commande.fournisseur?.email}</p>
            </div>

            {/* Numéro BL */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de bon de livraison <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroBL}
                onChange={(e) => setNumeroBL(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ex: BL-2024-001"
                required
              />
            </div>

            {/* Tableau des produits */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Produit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Commandé</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Prix unit.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Reçu</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Écart</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commande.lignesCommande.map((ligne) => {
                    const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
                    const qteRecue = quantitesRecues[ligneId] || 0;
                    const ecart = ligne.quantite - qteRecue;
                    const estActif = !ligne.estInactif;
                    const statutCouleur = estActif ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
                    const statutTexte = estActif ? 'Actif' : 'Inactif';
                    
                    return (
                      <tr key={ligneId} className={`hover:bg-gray-50 ${ligne.estInactif ? 'bg-orange-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{ligne.produitLibelle}</div>
                          <div className="text-xs text-gray-500">Réf: {ligne.produitReference}</div>
                          {ligne.categorie && (
                            <div className="text-xs text-gray-400">{ligne.categorie}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{ligne.quantite}</td>
                        <td className="px-4 py-3 text-right">{formatPrice(ligne.prixUnitaire)}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={ligne.quantite}
                            value={qteRecue}
                            onChange={(e) => handleQuantityChange(ligneId, e.target.value)}
                            className="w-20 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {ecart !== 0 && (
                            <span className={ecart > 0 ? 'text-orange-600' : 'text-blue-600'}>
                              {ecart > 0 ? `-${ecart}` : `+${Math.abs(ecart)}`}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutCouleur}`}>
                            {statutTexte}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes de réception (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ajouter des notes sur cette réception (retard, qualité, etc.)..."
              />
            </div>

            {/* Totaux */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Récapitulatif réception</h4>
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT reçu</span>
                    <span className="font-medium">{formatPrice(totauxRecus.totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total TVA</span>
                    <span className="font-medium">{formatPrice(totauxRecus.totalTVA)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total TTC reçu</span>
                    <span className="text-green-600">{formatPrice(totauxRecus.totalTTC)}</span>
                  </div>
                  {!toutesRecues && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded mt-2">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>Réception partielle - certaines quantités sont différentes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 border-t pt-4 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitClick}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Enregistrer la réception
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Dialog de confirmation pour les produits inactifs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={handleCancelConfirm} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 p-2 rounded-full">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Produits inactifs détectés
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Cette commande contient <strong>{produitsInactifs.length}</strong> produit(s) inactif(s) avec quantité reçue.
                Que souhaitez-vous faire ?
              </p>

              <div className="bg-orange-50 p-3 rounded-lg mb-4">
                <ul className="text-sm text-orange-800 space-y-1">
                  {produitsInactifs.map(prod => (
                    <li key={prod.id || prod.produitId} className="flex items-center gap-2">
                      <span>•</span>
                      <span className="font-medium">{prod.produitLibelle}</span>
                      <span className="text-xs text-gray-500">
                        (Qté: {quantitesRecues[prod.idLigneCommandeFournisseur || prod.id] || 0})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Si vous activez les produits, ils seront disponibles dans le catalogue.
                    Sinon, ils resteront inactifs et pourront être activés plus tard depuis la gestion des produits.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleConfirmWithoutActivation}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  ❌ Garder inactifs
                </button>
                <button
                  onClick={handleConfirmWithActivation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  ✅ Activer les produits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionModal;