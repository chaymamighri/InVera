// produits/components/ProduitCard.jsx
import React, { useState } from 'react';
import {
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProduitCard = ({ 
  produit, 
  onEdit, 
  onToggleActive, 
  onStockAdjust,
  getStatusColor,
  getStatusLabel 
}) => {
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [newQuantity, setNewQuantity] = useState(produit.quantiteStock);

  // ========== GESTION DU STOCK ==========
  const handleStockSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (newQuantity < 0) {
      toast.error('La quantité ne peut pas être négative');
      return;
    }
    
    if (newQuantity === produit.quantiteStock) {
      setShowStockAdjust(false);
      return;
    }
    
    onStockAdjust(produit.idProduit, parseInt(newQuantity));
    setShowStockAdjust(false);
  };

  // ========== GESTION DE L'ACTIVATION/DÉSACTIVATION ==========
  const handleToggleClick = (e) => {
    e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation();
    
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation?.();
    }
    
    if (e.target instanceof HTMLButtonElement) {
      e.target.blur();
    }
    
    onToggleActive(produit.idProduit, produit.active);
    return false;
  };

  // ========== GESTION DE L'ÉDITION ==========
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(produit);
  };

  // ========== GESTION DE L'AJUSTEMENT ==========
  const handleAdjustClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowStockAdjust(true);
  };

  // ========== FORMATAGE DES PRIX ==========
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 relative h-full flex flex-col ${
      !produit.active ? 'opacity-75 bg-gray-50' : ''
    }`}>
      {/* ========== BOUTONS D'ACTION EN HAUT À GAUCHE ========== */}
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        <button
          type="button"
          onClick={handleEditClick}
          className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-blue-50 transition-colors border border-gray-200 group"
          title="Modifier le produit"
        >
          <PencilSquareIcon className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
        </button>
        
        <button
          type="button"
          onClick={handleToggleClick}
          className={`p-1.5 bg-white rounded-lg shadow-sm transition-colors border ${
            produit.active 
              ? 'hover:bg-red-50 border-gray-200 hover:border-red-200' 
              : 'hover:bg-green-50 border-gray-200 hover:border-green-200'
          }`}
          title={produit.active ? "Désactiver le produit" : "Activer le produit"}
        >
          {produit.active ? (
            <XCircleIcon className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          )}
        </button>
      </div>

      {/* ========== POINT DE STATUT EN HAUT À DROITE ========== */}
      <div className="absolute top-4 right-4 z-10">
        <span 
          className={`inline-block w-3 h-3 rounded-full ${
            produit.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} 
          title={produit.active ? 'Produit actif' : 'Produit inactif'}
        />
      </div>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className="p-4 pt-12 flex-1 flex flex-col">
        
        {/* ========== EN-TÊTE AVEC IMAGE ========== */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {produit.imageUrl ? (
              <img src={produit.imageUrl} alt={produit.libelle} className="w-8 h-8 object-cover rounded" />
            ) : (
              <span className="text-lg font-bold text-blue-600">
                {produit.libelle.charAt(0)}
              </span>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate text-base">{produit.libelle}</h3>
            <p className="text-xs text-gray-600 truncate">{produit.categorie?.libelle || 'Sans catégorie'}</p>
          </div>
        </div>

        {/* ========== INFORMATIONS PRIX ========== */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-1.5">
            <p className="text-xs text-gray-600">Prix achat</p>
            <p className="font-semibold text-gray-900 truncate text-sm">{formatPrice(produit.prixAchat)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5">
            <p className="text-xs text-gray-600">Prix vente</p>
            <p className="font-semibold text-blue-700 truncate text-sm">{formatPrice(produit.prixVente)}</p>
          </div>
        </div>

        {/* ========== STOCK ET SEUIL ========== */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Stock actuel</span>
            <span className="font-bold text-gray-900">
              {produit.quantiteStock} {produit.uniteMesure}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Seuil minimum</span>
            <span className="font-medium text-gray-800">
              {produit.seuilMinimum} {produit.uniteMesure}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Statut stock</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(produit.status)}`}>
              {getStatusLabel(produit.status)}
            </span>
          </div>
        </div>

        {/* ========== ESPACE RÉSERVÉ POUR LA REMISE ========== */}
        <div className="min-h-[52px] mb-3">
          {produit.remise > 0 ? (
            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">Remise temporaire</p>
              <p className="text-sm font-semibold text-green-800">{produit.remise}%</p>
            </div>
          ) : null}
        </div>

       {/* ========== ACTIONS STOCK ========== */}
<div className="pt-1 border-t border-gray-200 mt-auto">
  {showStockAdjust ? (
    <form onSubmit={handleStockSubmit} className="flex gap-1.5">
      <input
        type="number"
        value={newQuantity}
        onChange={(e) => setNewQuantity(e.target.value)}
        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        min="0"
        step="1"
        placeholder="Qté"
        autoFocus
      />
      <button
        type="submit"
        className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => {
          setShowStockAdjust(false);
          setNewQuantity(produit.quantiteStock);
        }}
        className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
      >
        Annuler
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={handleAdjustClick}
      disabled={!produit.active}
      className={`w-full py-1.5 rounded-lg transition-colors text-sm font-medium ${
        produit.active 
          ? 'bg-orange-50 text-orange-800 hover:bg-orange-100 cursor-pointer' 
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
      title={produit.active ? "Modifier le stock" : "Produit inactif - modification impossible"}
    >
      Modifier le stock
    </button>
  )}
</div>
      </div>
    </div>
  );
};

export default ProduitCard;