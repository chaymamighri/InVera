// ReceptionModal.jsx - Version avec messages d'erreur sous les champs
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
  const [produitsAReactiver, setProduitsAReactiver] = useState({});
  
  // ✅ États pour les erreurs
  const [errors, setErrors] = useState({
    numeroBL: '',
    quantiteZero: '',
    quantitesDepassees: {}
  });

  // Initialiser avec les quantités commandées
  useEffect(() => {
    if (commande?.lignesCommande) {
      const initialQuantites = {};
      const initialReactiver = {};
      
      commande.lignesCommande.forEach(ligne => {
        const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
        initialQuantites[ligneId] = ligne.quantite;
        
        if (ligne.estInactif) {
          initialReactiver[ligneId] = true;
        }
      });
      
      setQuantitesRecues(initialQuantites);
      setProduitsAReactiver(initialReactiver);
      setNotes('');
      setNumeroBL('');
      // ✅ Réinitialiser les erreurs
      setErrors({
        numeroBL: '',
        quantiteZero: '',
        quantitesDepassees: {}
      });
    }
  }, [commande]);

  if (!isOpen || !commande) return null;

  const handleQuantityChange = (ligneId, value) => {
    const quantite = parseInt(value) || 0;
    const ligne = commande.lignesCommande.find(l => 
      (l.idLigneCommandeFournisseur || l.id) === ligneId
    );
    
    // ✅ Vérifier que la quantité ne dépasse pas la commande
    if (quantite > ligne.quantite) {
      setErrors(prev => ({
        ...prev,
        quantitesDepassees: {
          ...prev.quantitesDepassees,
          [ligneId]: `La quantité ne peut pas dépasser ${ligne.quantite}`
        }
      }));
      return;
    } else {
      setErrors(prev => ({
        ...prev,
        quantitesDepassees: {
          ...prev.quantitesDepassees,
          [ligneId]: ''
        }
      }));
    }
    
    setQuantitesRecues(prev => ({
      ...prev,
      [ligneId]: quantite
    }));
    
    // ✅ Vérifier si au moins un produit est reçu
    const aAuMoinsUnProduitRecu = Object.values({
      ...quantitesRecues,
      [ligneId]: quantite
    }).some(q => q > 0);
    
    if (!aAuMoinsUnProduitRecu) {
      setErrors(prev => ({
        ...prev,
        quantiteZero: 'Veuillez saisir au moins un produit reçu (quantité > 0)'
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        quantiteZero: ''
      }));
    }
  };

  const handleNumeroBLChange = (value) => {
    setNumeroBL(value);
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, numeroBL: 'Le numéro de bon de livraison est obligatoire' }));
    } else {
      setErrors(prev => ({ ...prev, numeroBL: '' }));
    }
  };

  const handleReactiverChange = (ligneId, checked) => {
    setProduitsAReactiver(prev => ({
      ...prev,
      [ligneId]: checked
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

  // ✅ Vérifier si au moins un produit a une quantité > 0
  const aAuMoinsUnProduitRecu = Object.values(quantitesRecues).some(q => q > 0);

  const handleSubmit = () => {
    let hasError = false;
    const newErrors = {
      numeroBL: '',
      quantiteZero: '',
      quantitesDepassees: {}
    };
    
    // ✅ Vérification 1 : Numéro BL obligatoire
    if (!numeroBL.trim()) {
      newErrors.numeroBL = 'Le numéro de bon de livraison est obligatoire';
      hasError = true;
    }
    
    // ✅ Vérification 2 : Au moins un produit reçu
    if (!aAuMoinsUnProduitRecu) {
      newErrors.quantiteZero = 'Veuillez saisir au moins un produit reçu (quantité > 0)';
      hasError = true;
    }
    
    // ✅ Vérification 3 : Quantités ne dépassent pas les commandes
    commande.lignesCommande.forEach(ligne => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      if (qteRecue > ligne.quantite) {
        newErrors.quantitesDepassees[ligneId] = `La quantité ne peut pas dépasser ${ligne.quantite}`;
        hasError = true;
      }
    });
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // ✅ Construire l'objet des produits à réactiver
    const produitsAReactiverMap = {};
    commande.lignesCommande.forEach(ligne => {
      const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
      const qteRecue = quantitesRecues[ligneId] || 0;
      if (ligne.estInactif && qteRecue > 0 && produitsAReactiver[ligneId]) {
        produitsAReactiverMap[ligneId] = true;
      }
    });

    onConfirm({
      quantitesRecues,
      numeroBL,
      notes: notes.trim() || null,
      dateReception: new Date().toISOString(),
      produitsAReactiver: produitsAReactiverMap
    });
  };

  const totauxRecus = calculerTotauxRecus();
  const toutesRecues = commande.lignesCommande.every(ligne => {
    const ligneId = ligne.idLigneCommandeFournisseur || ligne.id;
    return quantitesRecues[ligneId] === ligne.quantite;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-green-700 sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              Réception de Bon De Commande - {commande.numeroCommande}
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

            {/* Numéro BL avec message d'erreur sous le champ */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de bon de livraison <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroBL}
                onChange={(e) => handleNumeroBLChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.numeroBL ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="Ex: BL-2024-001"
                required
              />
              {errors.numeroBL && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.numeroBL}
                </p>
              )}
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Activer</th>
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
                    const estInactifEtRecu = ligne.estInactif && qteRecue > 0;
                    const hasError = errors.quantitesDepassees[ligneId];
                    
                    return (
                      <tr key={ligneId} className={`hover:bg-gray-50 ${estInactifEtRecu ? 'bg-amber-50' : ''}`}>
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
                            className={`w-20 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-green-500 ${
                              qteRecue === 0 ? 'border-red-300 bg-red-50' : ''
                            } ${hasError ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          {hasError && (
                            <p className="text-xs text-red-600 mt-1">{hasError}</p>
                          )}
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
                        <td className="px-4 py-3 text-center">
                          {estInactifEtRecu && (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={produitsAReactiver[ligneId] || false}
                                onChange={(e) => handleReactiverChange(ligneId, e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                              />
                              <span className="ml-1 text-xs text-gray-500">
                                {produitsAReactiver[ligneId] ? 'Oui' : 'Non'}
                              </span>
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ✅ Message d'erreur global pour quantité zéro */}
            {errors.quantiteZero && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-600">{errors.quantiteZero}</p>
              </div>
            )}

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
                onClick={handleSubmit}
                disabled={!aAuMoinsUnProduitRecu}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                  aAuMoinsUnProduitRecu
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-400 cursor-not-allowed text-gray-200'
                }`}
              >
                <CheckIcon className="w-4 h-4" />
                Confirmer la réception
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionModal;