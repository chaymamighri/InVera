// src/pages/dashboard/sales/orders/components/CreateOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  TrashIcon,
  PlusIcon,
  MinusIcon,
  UserCircleIcon,
  ShoppingCartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import clientService from '../../../../../services/clientService';

// Badge simple pour le type de client
const ClientBadge = ({ type }) => {
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800',
    'FIDELE': 'bg-blue-100 text-blue-800',
    'ENTREPRISE': 'bg-indigo-100 text-indigo-800',
    'PROFESSIONNEL': 'bg-indigo-100 text-indigo-800',
    'PARTICULIER': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[type] || colors['PARTICULIER']}`}>
      {type}
    </span>
  );
};

// Composant pour les indicateurs d'étapes
const StepIndicator = ({ step, currentStep, t }) => {
  const steps = [
    { number: 1, label: t('salesPages.client') },
    { number: 2, label: t('salesPages.products') },
    { number: 3, label: t('salesPages.validate') }
  ];

  const current = steps[step - 1];
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  return (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
        isCompleted 
          ? 'bg-green-500 text-white'
          : isActive
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-500'
      }`}>
        {isCompleted ? (
          <CheckCircleIcon className="h-4 w-4" />
        ) : (
          <span className="text-sm font-medium">{step}</span>
        )}
      </div>
      <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
        {current.label}
      </span>
    </div>
  );
};

// Bouton simple
const SimpleButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
};

const CreateOrderModal = ({
  show,
  onClose,
  clients,
  produits,
  selectedProducts,
  selectedClient,
  onSelectClient,
  onSelectProduct,
  onModifierQuantite,
  onSupprimerProduit,
  onCreateCommande,
  toNumber,
  isCreating = false,
  t = (key) => key,
  isArabic = false,
}) => {
  const [searchProduit, setSearchProduit] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  // État pour la remise client
  const [clientRemise, setClientRemise] = useState(0);
  const [loadingRemise, setLoadingRemise] = useState(false);

  // Récupérer la remise du client par son type
  useEffect(() => {
    const fetchClientRemise = async () => {
      const clientSelectionne = clients.find(c => c.id === parseInt(selectedClient));
      if (!clientSelectionne?.typeClient) return;
      
      setLoadingRemise(true);
      try {
        const response = await clientService.getRemiseByType(clientSelectionne.typeClient);
        if (response?.success) {
          setClientRemise(response.remise || 0);
          console.log(`✅ Remise client ${clientSelectionne.typeClient}: ${response.remise}%`);
        }
      } catch (error) {
        console.error('Erreur chargement remise client:', error);
      } finally {
        setLoadingRemise(false);
      }
    };
    
    fetchClientRemise();
  }, [selectedClient, clients]);

  if (!show) return null;

  const clientSelectionne = clients.find(c => c.id === parseInt(selectedClient));
  
  // Filtrer les produits
  const produitsFiltres = produits.filter(p => {
    const searchLower = searchProduit.toLowerCase();
    const categorieNom = p.categorie?.nomCategorie || p.categorieNom || '';
    return p.libelle.toLowerCase().includes(searchLower) ||
           categorieNom.toLowerCase().includes(searchLower);
  });
  
  const clientsFiltres = clients.filter(c =>
    c.nom.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.telephone?.includes(searchClient)
  );

  // Calcul des montants avec TVA par produit
  const calculerTotaux = () => {
    let sousTotalHT = 0;
    let remiseTotaleProduits = 0;
    let totalHT = 0;
    let tvaParProduit = [];
    let totalTTC = 0;

    selectedProducts.forEach(p => {
      const prixHT = toNumber(p.prixVente || p.prix || 0);
      const quantite = p.quantite;
      const montantHTLigne = prixHT * quantite;
      
      // Remise du produit (par catégorie)
      const tauxRemiseProduit = p.categorieRemiseStandard || 0;
      const montantRemise = montantHTLigne * (tauxRemiseProduit / 100);
      const montantHTApresRemise = montantHTLigne - montantRemise;
      
      // TVA du produit (par catégorie)
      let tauxTVA = p.categorie?.tauxTVA || 19;
      let tauxTVANumerique = typeof tauxTVA === 'number' ? tauxTVA : parseFloat(tauxTVA);
      if (tauxTVANumerique > 1 && tauxTVANumerique <= 100) {
        tauxTVANumerique = tauxTVANumerique / 100;
      } else if (tauxTVANumerique > 100) {
        tauxTVANumerique = 0.19;
      }
      
      const montantTVA = montantHTApresRemise * tauxTVANumerique;
      const montantTTCLigne = montantHTApresRemise + montantTVA;
      
      sousTotalHT += montantHTLigne;
      remiseTotaleProduits += montantRemise;
      totalHT += montantHTApresRemise;
      tvaParProduit.push({
        produitId: p.id,
        libelle: p.libelle,
        taux: tauxTVANumerique * 100,
        montant: montantTVA
      });
      totalTTC += montantTTCLigne;
    });
    
    // Remise client
    const tauxRemiseClient = clientRemise;
    const montantRemiseClient = totalHT * (tauxRemiseClient / 100);
    const totalHTApresRemiseClient = totalHT - montantRemiseClient;
    
    // TVA totale après remise client
    const tvaTotale = tvaParProduit.reduce((sum, item) => sum + item.montant, 0);
    const totalTTCApresRemiseClient = totalHTApresRemiseClient + tvaTotale;
    
    // Économies totales
    const totalEconomies = remiseTotaleProduits + montantRemiseClient;
    
    return {
      sousTotalHT,
      remiseTotaleProduits,
      totalHT,
      tvaParProduit,
      tvaTotale,
      totalTTC,
      tauxRemiseClient,
      montantRemiseClient,
      totalHTApresRemiseClient,
      totalTTCApresRemiseClient,
      totalEconomies
    };
  };

  const totaux = calculerTotaux();

  const handleAddProduct = (produit) => {
    const existing = selectedProducts.find(p => p.id === produit.id);
    if (existing) {
      onModifierQuantite(produit.id, existing.quantite + 1);
    } else {
      if (!produit.id) {
        console.error('Produit ajouté sans ID:', produit);
        return;
      }
      
      onSelectProduct({
        ...produit,
        quantite: 1,
        prix: produit.prixVente || produit.prix || 0,
        prixVente: produit.prixVente || produit.prix || 0,
        categorieRemiseStandard: produit.categorieRemiseStandard || 0,
        categorie: produit.categorie
      });
    }
  };

  const handleCreateOrder = () => {
    if (!selectedClient || selectedProducts.length === 0) {
      alert('Veuillez sélectionner un client et ajouter des produits');
      return;
    }
    
    const produitSansStock = selectedProducts.find(p => {
      const produitOriginal = produits.find(prod => prod.id === p.id);
      const stockDisponible = produitOriginal?.quantiteStock || 0;
      return p.quantite > stockDisponible;
    });

    if (produitSansStock) {
      alert(`Stock insuffisant pour "${produitSansStock.libelle}". Disponible: ${produitSansStock.quantiteStock}`);
      return;
    }

    onCreateCommande(selectedClient, notes);
  };

  const handleClearCart = () => {
    if (window.confirm('Vider le panier ?')) {
      selectedProducts.forEach(p => onSupprimerProduit(p.id));
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClientClick = (clientId) => {
    if (isCreating) return;
    
    if (selectedClient === clientId.toString()) {
      onSelectClient('');
      setCurrentStep(1);
    } else {
      onSelectClient(clientId.toString());
      setCurrentStep(2);
    }
  };

  useEffect(() => {
    if (clientSelectionne && selectedProducts.length > 0) {
      setCurrentStep(2);
    }
  }, [clientSelectionne, selectedProducts.length]);

  const formatMontant = (value) => `${toNumber(value).toFixed(3)} ${t('salesPages.currencyLower') || 'dt'}`;

  // Étape 1 : Sélection du client
  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
          
          {/* En-tête */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">{t('salesPages.newOrder')}</h2>
                <p className="text-blue-100 text-sm mt-1">{t('salesPages.stepSelectClient')}</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-blue-700 rounded" disabled={isCreating}>
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Étapes */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex justify-center items-center space-x-8">
              <StepIndicator step={1} currentStep={currentStep} t={t} />
              <div className={`h-0.5 w-12 ${clientSelectionne ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              <StepIndicator step={2} currentStep={currentStep} t={t} />
              <div className="h-0.5 w-12 bg-gray-300"></div>
              <StepIndicator step={3} currentStep={currentStep} t={t} />
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Recherche */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder={t('salesPages.searchClient')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                disabled={isCreating}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {/* Indicateur client sélectionné */}
            {clientSelectionne && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">{t('salesPages.selectedClient')}</div>
                      <div className="text-sm text-gray-600">{clientSelectionne.nom} • {clientSelectionne.telephone}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClientClick(parseInt(selectedClient))}
                    className="text-sm text-red-600 hover:text-red-700"
                    disabled={isCreating}
                  >
                    {t('salesPages.change')}
                  </button>
                </div>
              </div>
            )}

            {/* Liste clients */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {clientsFiltres.map(client => {
                const isSelected = selectedClient === client.id.toString();
                
                return (
                  <button
                    key={client.id}
                    onClick={() => handleClientClick(client.id)}
                    className={`w-full p-3 text-left border rounded-lg transition-colors flex justify-between items-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isCreating}
                  >
                    <div className="flex items-center">
                      <UserCircleIcon className={`h-4 w-4 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium text-gray-900">{client.nom}</div>
                        <div className="text-sm text-gray-600">{client.telephone}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClientBadge type={client.typeClient || client.type} />  
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Message vide */}
            {clientsFiltres.length === 0 && (
              <div className="text-center py-8">
                <UserCircleIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">{t('salesPages.noClientFound')}</p>
              </div>
            )}

            {/* Boutons */}
            <div className="mt-6 flex justify-between">
              <SimpleButton onClick={onClose} variant="outline" disabled={isCreating}>
                {t('salesPages.cancel')}
              </SimpleButton>
              <SimpleButton
                onClick={handleNextStep}
                disabled={!clientSelectionne || isCreating}
                variant="primary"
                className="px-5"
              >
                {isCreating ? t('salesPages.loading') : t('salesPages.next')}
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Étape 2 : Sélection des produits
  if (currentStep === 2) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-lg">
          
          {/* En-tête */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">{t('salesPages.newOrder')}</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {t('salesPages.client')}: {clientSelectionne?.nom} - {t('salesPages.productCount', { count: selectedProducts.length })}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded px-3 py-1.5">
                  <div className="text-xs text-blue-100">{t('salesPages.total')}</div>
                  <div className="text-sm font-semibold text-white">{formatMontant(totaux.totalTTCApresRemiseClient)}</div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-blue-700 rounded" disabled={isCreating}>
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Étapes */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex justify-center items-center space-x-8">
              <StepIndicator step={1} currentStep={currentStep} t={t} />
              <div className="h-0.5 w-12 bg-green-400"></div>
              <StepIndicator step={2} currentStep={currentStep} t={t} />
              <div className={`h-0.5 w-12 ${selectedProducts.length > 0 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              <StepIndicator step={3} currentStep={currentStep} t={t} />
            </div>
          </div>

          <div className="flex h-[calc(90vh-140px)]">
            {/* Produits */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <ShoppingCartIcon className="h-4 w-4 text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-800">{t('salesPages.products')}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleClientClick(parseInt(selectedClient))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    disabled={isCreating}
                  >
                    {t('salesPages.changeClient')}
                  </button>
                </div>
              </div>

              {/* Recherche produits */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder={t('salesPages.searchProduct')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchProduit}
                  onChange={(e) => setSearchProduit(e.target.value)}
                  disabled={isCreating}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>

              {/* Grille produits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                {produitsFiltres.map(produit => {
                  const selected = selectedProducts.find(p => p.id === produit.id);
                  const stock = produit.quantiteStock || 0;
                  const tauxRemise = produit.categorieRemiseStandard || 0;
                  const tauxTVA = produit.categorie?.tauxTVA || 19;
                  
                  return (
                    <div key={produit.id} className={`border rounded-lg p-3 ${selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} ${isCreating ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{produit.libelle}</div>
                          <div className="text-xs text-gray-600">
                            {produit.categorie?.nomCategorie || produit.categorieNom || '—'}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {tauxRemise > 0 && (
                              <span className="text-xs text-green-600">Remise: {tauxRemise}%</span>
                            )}
                            {tauxTVA > 0 && tauxTVA !== 19 && (
                              <span className="text-xs text-blue-600">TVA: {tauxTVA}%</span>
                            )}
                          </div>
                          <div className={`text-xs mt-1 ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {t('salesPages.stock')}: {stock} {produit.uniteMesure}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600 text-sm">
                            {formatMontant(produit.prixVente || produit.prix)}
                          </div>
                          <button
                            onClick={() => handleAddProduct(produit)}
                            disabled={stock <= 0 || isCreating}
                            className={`mt-1 px-2 py-1 text-xs rounded flex items-center ${stock > 0 && !isCreating ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500'}`}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            {selected ? '+1' : t('salesPages.add')}
                          </button>
                        </div>
                      </div>
                      
                      {/* Gestion quantité */}
                      {selected && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => onModifierQuantite(produit.id, selected.quantite - 1)}
                                disabled={selected.quantite <= 1 || isCreating}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                              >
                                <MinusIcon className="h-3 w-3" />
                              </button>
                              <span className="font-medium">{selected.quantite}</span>
                              <button
                                onClick={() => onModifierQuantite(produit.id, selected.quantite + 1)}
                                disabled={selected.quantite >= stock || isCreating}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <button onClick={() => onSupprimerProduit(produit.id)} className="text-red-600 hover:text-red-700 text-xs flex items-center disabled:opacity-50" disabled={isCreating}>
                              <TrashIcon className="h-3 w-3 mr-1" />
                              {t('salesPages.remove')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <SimpleButton onClick={handlePrevStep} variant="outline" disabled={isCreating}>
                  {t('salesPages.back')}
                </SimpleButton>
                <SimpleButton
                  onClick={handleNextStep}
                  disabled={selectedProducts.length === 0 || isCreating}
                  variant="primary"
                >
                  {isCreating ? t('salesPages.loading') : t('salesPages.nextValidate')}
                </SimpleButton>
              </div>
            </div>

            {/* Panier */}
            <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto bg-gray-50">
              <h3 className="font-medium text-gray-800 mb-3">{t('salesPages.cart')}</h3>
              
              {/* Client sélectionné avec remise */}
              <div className="bg-white p-3 rounded-lg border mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{clientSelectionne?.nom}</div>
                      <div className="text-xs text-gray-600">{clientSelectionne?.telephone}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClientBadge type={clientSelectionne?.typeClient || clientSelectionne?.type} />
                    <button
                      onClick={() => handleClientClick(parseInt(selectedClient))}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      title={t('salesPages.changeClient')}
                      disabled={isCreating}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {totaux.tauxRemiseClient > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs text-green-600">
                    Remise client: {totaux.tauxRemiseClient}%
                  </div>
                )}
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">{t('salesPages.emptyCart')}</p>
                </div>
              ) : (
                <>
                  {/* Produits panier avec TVA */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {selectedProducts.map(produit => {
                      const tauxRemise = produit.categorieRemiseStandard || 0;
                      const tauxTVA = produit.categorie?.tauxTVA || 19;
                      const totalLigne = toNumber(produit.prixVente || produit.prix) * produit.quantite;
                      const montantRemise = totalLigne * (tauxRemise / 100);
                      const totalApresRemise = totalLigne - montantRemise;
                      const montantTVA = totalApresRemise * (tauxTVA / 100);
                      const totalTTCLigne = totalApresRemise + montantTVA;
                      
                      return (
                        <div key={produit.id} className="bg-white p-3 rounded-lg border shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{produit.libelle}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {produit.categorie?.nomCategorie || produit.categorieNom || '—'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {produit.quantite} × {formatMontant(produit.prixVente || produit.prix)}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {tauxRemise > 0 && (
                                  <span className="text-xs text-green-600">Remise: {tauxRemise}%</span>
                                )}
                                <span className="text-xs text-blue-600">TVA: {tauxTVA}%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-blue-600">
                                {formatMontant(totalTTCLigne)}
                              </div>
                              {montantRemise > 0 && (
                                <div className="text-xs text-green-600 mt-1">
                                  -{formatMontant(montantRemise)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bouton vider */}
                  <SimpleButton
                    onClick={handleClearCart}
                    variant="danger"
                    className="w-full mb-4"
                    disabled={isCreating}
                  >
                    <TrashIcon className="h-3 w-3 mr-1 inline" />
                    {t('salesPages.clearCart')}
                  </SimpleButton>

                  {/* Totaux détaillés */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{t('salesPages.subtotal')}</span>
                        <span className="font-medium">{formatMontant(totaux.sousTotalHT)}</span>
                      </div>
                      
                      {totaux.remiseTotaleProduits > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Remises produits</span>
                          <span className="font-medium">-{formatMontant(totaux.remiseTotaleProduits)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Total HT</span>
                        <span className="font-medium">{formatMontant(totaux.totalHT)}</span>
                      </div>
                      
                      {totaux.tauxRemiseClient > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Remise client ({totaux.tauxRemiseClient}%)</span>
                          <span className="font-medium">-{formatMontant(totaux.montantRemiseClient)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">TVA totale</span>
                        <span className="font-medium">{formatMontant(totaux.tvaTotale)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>{t('salesPages.total')}</span>
                        <span className="text-green-600 text-lg">{formatMontant(totaux.totalTTCApresRemiseClient)}</span>
                      </div>
                      {totaux.totalEconomies > 0 && (
                        <div className="text-right text-xs text-green-600 mt-1">
                          Économie : {formatMontant(totaux.totalEconomies)}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Étape 3 : Validation
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        
        {/* En-tête */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">{t('salesPages.newOrder')}</h2>
              <p className="text-blue-100 text-sm mt-1">{t('salesPages.stepValidation')}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-blue-700 rounded" disabled={isCreating}>
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Étapes */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex justify-center items-center space-x-8">
            <StepIndicator step={1} currentStep={currentStep} t={t} />
            <div className="h-0.5 w-12 bg-green-400"></div>
            <StepIndicator step={2} currentStep={currentStep} t={t} />
            <div className="h-0.5 w-12 bg-green-400"></div>
            <StepIndicator step={3} currentStep={currentStep} t={t} />
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Message de confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <h3 className="font-medium text-green-800">{t('salesPages.verifyDetails')}</h3>
                <p className="text-green-700 text-sm mt-1">{t('salesPages.readyToCreateOrder')}</p>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800">{t('salesPages.client')}</h4>
              <button
                onClick={() => handleClientClick(parseInt(selectedClient))}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={isCreating}
              >
                {t('salesPages.change')}
              </button>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <UserCircleIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">{clientSelectionne?.nom}</div>
                    <div className="text-sm text-gray-600">{clientSelectionne?.telephone}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ClientBadge type={clientSelectionne?.typeClient || clientSelectionne?.type} />
                  <button
                    onClick={() => handleClientClick(parseInt(selectedClient))}
                    className="text-xs text-red-600 hover:text-red-700"
                    title={t('salesPages.changeClient')}
                    disabled={isCreating}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {totaux.tauxRemiseClient > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  Remise client: {totaux.tauxRemiseClient}% appliquée
                </div>
              )}
            </div>
          </div>

          {/* Produits avec TVA */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800">{t('salesPages.products')}</h4>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                {t('salesPages.itemCount', { count: selectedProducts.length })}
              </span>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">{t('salesPages.product')}</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">{t('salesPages.quantityShort')}</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">{t('salesPages.price')}</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">{t('salesPages.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map(produit => {
                      const tauxRemise = produit.categorieRemiseStandard || 0;
                      const tauxTVA = produit.categorie?.tauxTVA || 19;
                      const totalLigne = toNumber(produit.prixVente || produit.prix) * produit.quantite;
                      const montantRemise = totalLigne * (tauxRemise / 100);
                      const totalApresRemise = totalLigne - montantRemise;
                      const montantTVA = totalApresRemise * (tauxTVA / 100);
                      const totalTTCLigne = totalApresRemise + montantTVA;
                      
                      return (
                        <tr key={produit.id} className="border-t">
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 text-sm">{produit.libelle}</div>
                            <div className="text-xs text-gray-500">{produit.categorie?.nomCategorie || produit.categorieNom || '—'}</div>
                          </td>
                          <td className="px-4 py-2 text-gray-900 text-sm">{produit.quantite}</td>
                          <td className="px-4 py-2 text-gray-900 text-sm">{formatMontant(produit.prixVente || produit.prix)}</td>
                          <td className="px-4 py-2 font-medium text-blue-600 text-sm">{formatMontant(totalTTCLigne)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t p-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={isCreating}
                >
                  {t('salesPages.edit')}
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">{t('salesPages.notes')}</h4>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('salesPages.additionalInstructions')}
              disabled={isCreating}
            />
          </div>

          {/* Totaux détaillés */}
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3">{t('salesPages.summary')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('salesPages.subtotal')}</span>
                <span className="font-medium">{formatMontant(totaux.sousTotalHT)}</span>
              </div>
              
              {totaux.remiseTotaleProduits > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remises produits</span>
                  <span className="font-medium">-{formatMontant(totaux.remiseTotaleProduits)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total HT</span>
                <span className="font-medium">{formatMontant(totaux.totalHT)}</span>
              </div>
              
              {totaux.tauxRemiseClient > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise client ({totaux.tauxRemiseClient}%)</span>
                  <span className="font-medium">-{formatMontant(totaux.montantRemiseClient)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">TVA totale</span>
                <span className="font-medium">{formatMontant(totaux.tvaTotale)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-medium">
                  <span>{t('salesPages.orderTotal')}</span>
                  <span className="text-green-600 text-lg">{formatMontant(totaux.totalTTCApresRemiseClient)}</span>
                </div>
                {totaux.totalEconomies > 0 && (
                  <div className="text-right text-xs text-green-600 mt-1">
                    Économies : {formatMontant(totaux.totalEconomies)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons finaux */}
          <div className="flex justify-between pt-4 border-t">
            <SimpleButton onClick={handlePrevStep} variant="outline" disabled={isCreating}>
              {t('salesPages.back')}
            </SimpleButton>
            
            <div className="flex space-x-3">
              <SimpleButton onClick={onClose} variant="outline" disabled={isCreating}>
                {t('salesPages.cancel')}
              </SimpleButton>
              <SimpleButton 
                onClick={handleCreateOrder} 
                variant="primary" 
                className="px-6"
                disabled={isCreating}
              >
                {isCreating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('salesPages.creating')}
                  </span>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1 inline" />
                    {t('salesPages.createOrder')}
                  </>
                )}
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;