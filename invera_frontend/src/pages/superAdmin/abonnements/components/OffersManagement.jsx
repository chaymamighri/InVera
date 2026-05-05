// components/OffersManagement.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PencilSquareIcon,
  PlusIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  TagIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { subscriptionPlatformService } from '../../../../servicesPlatform/subscriptionPlatformService';

const formatPrice = (value, devise = 'TND') => {
  if (value === null || value === undefined || value === '') return 'Non défini';
  return `${Number(value).toFixed(2)} ${devise}`;
};

const getOfferStateClass = (offer) => {
  if (offer?.deleted) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (offer?.active) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const getOfferStateIcon = (offer) => {
  if (offer?.deleted) return <XCircleIcon className="h-3.5 w-3.5" />;
  if (offer?.active) return <CheckCircleIcon className="h-3.5 w-3.5" />;
  return <PauseCircleIcon className="h-3.5 w-3.5" />;
};

const getOfferStateLabel = (offer) => {
  if (offer?.deleted) return 'Supprimée';
  if (offer?.active) return 'Active';
  return 'Inactive';
};

const defaultOfferForm = {
  nom: '',
  dureeMois: 1,
  prix: '',
  devise: 'TND',
  description: '',
  active: true,
};

const OffersManagement = ({ offers, onRefresh, actionLoading, runAction }) => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(defaultOfferForm);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [savingOffer, setSavingOffer] = useState(false);
  const [expandedOfferId, setExpandedOfferId] = useState(null);

  const resetOfferForm = () => {
    setOfferForm(defaultOfferForm);
    setEditingOfferId(null);
    setSelectedOffer(null);
  };

  const fillOfferForm = (offer) => {
    setOfferForm({
      nom: offer?.nom || '',
      dureeMois: offer?.dureeMois ?? 1,
      prix: offer?.prix ?? '',
      devise: offer?.devise || 'TND',
      description: offer?.description || '',
      active: offer?.active ?? true,
    });
    setEditingOfferId(offer?.id || null);
    setSelectedOffer(offer);
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    setSavingOffer(true);
    try {
      const payload = {
        nom: offerForm.nom,
        dureeMois: Number(offerForm.dureeMois),
        prix: Number(offerForm.prix),
        devise: offerForm.devise,
        description: offerForm.description,
        active: offerForm.active,
      };
      if (editingOfferId) {
        await subscriptionPlatformService.updateOffer(editingOfferId, payload);
        toast.success('Offre mise à jour avec succès');
      } else {
        await subscriptionPlatformService.createOffer(payload);
        toast.success('Offre créée avec succès');
      }
      resetOfferForm();
      await onRefresh();
    } catch (error) {
      toast.error("L'offre n'a pas pu être enregistrée.");
      console.error('Error saving offer:', error);
    } finally {
      setSavingOffer(false);
    }
  };

  // Statistiques des offres
  const stats = {
    total: offers.length,
    active: offers.filter(o => o.active && !o.deleted).length,
    inactive: offers.filter(o => !o.active && !o.deleted).length,
    deleted: offers.filter(o => o.deleted).length,
  };

  return (
    <div className="space-y-6">
      {/* Cartes statistiques - Offres */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total offres</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-medium">Actives</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <PlayCircleIcon className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Inactives</p>
              <p className="text-2xl font-bold text-amber-600">{stats.inactive}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <PauseCircleIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Supprimées</p>
              <p className="text-2xl font-bold text-gray-500">{stats.deleted}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <TrashIcon className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {editingOfferId ? (
                    <>
                      <PencilSquareIcon className="h-5 w-5 text-purple-600" />
                      Modifier l'offre
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5 text-purple-600" />
                      Nouvelle offre
                    </>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingOfferId ? 'Modifiez les informations de l\'offre' : 'Créez une nouvelle offre d\'abonnement'}
                </p>
              </div>
              {editingOfferId && (
                <button 
                  type="button" 
                  onClick={resetOfferForm} 
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Nouvelle offre
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            <form className="space-y-4" onSubmit={handleOfferSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nom de l'offre <span className="text-red-500">*</span>
                </label>
                <input 
                  value={offerForm.nom} 
                  onChange={(e) => setOfferForm({ ...offerForm, nom: e.target.value })} 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:bg-white" 
                  placeholder="Ex: Offre Premium" 
                  required 
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Durée (mois) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="36" 
                    step="1" 
                    value={offerForm.dureeMois} 
                    onChange={(e) => setOfferForm({ ...offerForm, dureeMois: e.target.value })} 
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:bg-white" 
                    required 
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Prix <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={offerForm.prix} 
                    onChange={(e) => setOfferForm({ ...offerForm, prix: e.target.value })} 
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:bg-white" 
                    placeholder="0.00" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Devise <span className="text-red-500">*</span>
                </label>
                <select 
                  value={offerForm.devise} 
                  onChange={(e) => setOfferForm({ ...offerForm, devise: e.target.value })} 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:bg-white" 
                  required
                >
                  <option value="TND">TND - Dinar Tunisien</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dollar US</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  rows="3" 
                  value={offerForm.description} 
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:bg-white" 
                  placeholder="Description de l'offre (optionnelle)" 
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="active" 
                  checked={offerForm.active} 
                  onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })} 
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Offre active (visible par les clients)
                </label>
              </div>
              
              <button 
                type="submit" 
                disabled={savingOffer} 
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition"
              >
                {savingOffer ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    {editingOfferId ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                    {editingOfferId ? 'Mettre à jour' : 'Créer l\'offre'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Liste des offres */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-purple-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-purple-600" />
              Catalogue des offres
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{offers.length} offre(s) disponible(s)</p>
          </div>
          
          <div className="p-5">
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {offers.map((offer) => {
                const isExpanded = expandedOfferId === offer.id;
                const description = offer.description || 'Aucune description.';
                const needsTruncation = description.length > 80;
                const displayDescription = isExpanded ? description : (needsTruncation ? description.slice(0, 80) + '...' : description);
                const isSelected = selectedOffer?.id === offer.id;
                
                return (
                  <div 
                    key={offer.id} 
                    className={`rounded-lg border p-4 transition-all duration-200 ${
                      isSelected 
                        ? 'border-purple-300 bg-purple-50/60 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-sm'
                    } ${isExpanded ? 'shadow-sm' : ''}`}
                    onClick={() => setSelectedOffer(isSelected ? null : offer)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{offer.nom}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getOfferStateClass(offer)}`}>
                            {getOfferStateIcon(offer)}
                            {getOfferStateLabel(offer)}
                          </span>
                          {offer.deleted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-xs">
                              <XCircleIcon className="h-3 w-3" />
                              Non disponible
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                            📅 {offer.dureeMois} mois
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                            💰 {formatPrice(offer.prix, offer.devise)}
                          </span>
                          {!offer.active && !offer.deleted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                              <ClockIcon className="h-3 w-3" />
                              En attente d'activation
                            </span>
                          )}
                        </div>
                        
                        <div className="transition-all duration-200">
                          <p className="text-sm text-gray-600">{displayDescription}</p>
                          {needsTruncation && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setExpandedOfferId(isExpanded ? null : offer.id); }} 
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1 inline-flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <><ChevronUpIcon className="h-3 w-3" /> Voir moins</>
                              ) : (
                                <><ChevronDownIcon className="h-3 w-3" /> Voir plus</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        {!offer.deleted && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); fillOfferForm(offer); }} 
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition" 
                            title="Modifier l'offre"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                            Modifier
                          </button>
                        )}
                        
                        {offer.active && !offer.deleted && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); runAction(`deactivate-offer-${offer.id}`, () => subscriptionPlatformService.deactivateOffer(offer.id), 'Offre désactivée avec succès'); }} 
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition" 
                            title="Désactiver l'offre"
                          >
                            <PauseCircleIcon className="h-4 w-4" />
                            Désactiver
                          </button>
                        )}
                        
                        {!offer.active && !offer.deleted && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); runAction(`activate-offer-${offer.id}`, () => subscriptionPlatformService.activateOffer(offer.id), 'Offre activée avec succès'); }} 
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition" 
                            title="Activer l'offre"
                          >
                            <PlayCircleIcon className="h-4 w-4" />
                            Activer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {offers.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
                  <TagIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600">Aucune offre configurée</p>
                  <p className="text-sm text-gray-400 mt-1">Créez votre première offre via le formulaire</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersManagement;