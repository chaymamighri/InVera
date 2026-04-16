// produits/components/ProduitCard.jsx 
import React, { useState } from 'react';
import {
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const ProduitCard = ({ 
  produit, 
  onEdit, 
  onToggleActive,
  getStatusColor,
  getStatusLabel 
}) => {
  const [imageError, setImageError] = useState(false);

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
    
    if (!produit) {
      console.error('❌ Erreur: produit est null!');
      return;
    }
    
    const productId = produit.idProduit || produit.id;
    
    if (!productId) {
      console.error('❌ Erreur: produit.id est manquant!');
      return;
    }

    onEdit(produit);
  };

  // ========== GESTION DE L'IMAGE ==========
  const getImageUrl = () => {
    if (!produit.imageUrl) return null;
    
    if (produit.imageUrl.startsWith('http')) {
      return produit.imageUrl;
    }
    
    let cleanPath = produit.imageUrl.replace(/^\/+|\/+$/g, '');
    return `http://localhost:8081/${cleanPath}`;
  };

  const handleImageError = () => {
    console.error('Erreur chargement image:', produit.imageUrl);
    setImageError(true);
  };

  // ========== FORMATAGE DES PRIX ==========
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(price);
  };

  const imageUrl = getImageUrl();
  const hasValidImage = imageUrl && !imageError;

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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
            {hasValidImage ? (
              <img 
                src={imageUrl} 
                alt={produit.libelle} 
                className="w-full h-full object-cover"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                <span className="text-lg font-bold text-white">
                  {produit.libelle?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate text-base">{produit.libelle}</h3>
            <p className="text-xs text-gray-600 truncate">
              {produit.categorieNom || 'Sans catégorie'}
            </p>
          </div>
        </div>

        {/* ========== INFORMATIONS PRIX ========== */}
        {/* ✅ Suppression du bloc "Prix achat" - Affichage uniquement du prix de vente */}
        <div className="mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600">Prix de vente</p>
            <p className="font-semibold text-blue-700 truncate text-base">{formatPrice(produit.prixVente)}</p>
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

        {/* ========== REMISE ========== */}
        {produit.remise > 0 && (
          <div className="p-2 bg-green-50 rounded-lg border border-green-200 mb-3">
            <p className="text-xs text-green-700">Remise temporaire</p>
            <p className="text-sm font-semibold text-green-800">{produit.remise}%</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProduitCard;