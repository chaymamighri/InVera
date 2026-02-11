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

// Badge simple pour le type de client
const ClientBadge = ({ type }) => {
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800',
    'FIDELE': 'bg-blue-100 text-blue-800',
    'ENTREPRISE': 'bg-indigo-100 text-indigo-800',
    'PROFESSIONNEL': 'bg-teal-100 text-teal-800',
    'PARTICULIER': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[type] || colors['PARTICULIER']}`}>
      {type}
    </span>
  );
};

// Composant pour les indicateurs d'étapes
const StepIndicator = ({ step, currentStep }) => {
  const steps = [
    { number: 1, label: 'Client' },
    { number: 2, label: 'Produits' },
    { number: 3, label: 'Valider' }
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
  isCreating = false
}) => {
  const [searchProduit, setSearchProduit] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  if (!show) return null;

  const clientSelectionne = clients.find(c => c.id === parseInt(selectedClient));
  const produitsFiltres = produits.filter(p =>
    p.libelle.toLowerCase().includes(searchProduit.toLowerCase()) ||
    p.categorie.toLowerCase().includes(searchProduit.toLowerCase())
  );
  const clientsFiltres = clients.filter(c =>
    c.nom.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.telephone?.includes(searchClient)
  );

  const totalProduits = selectedProducts.reduce((sum, p) => 
    sum + (toNumber(p.prix) * p.quantite), 0
  );

  const remisePourcentage = clientSelectionne ? 
    (clientSelectionne.type === 'VIP' ? 0.15 :
     clientSelectionne.type === 'FIDELE' ? 0.10 :
     clientSelectionne.type === 'ENTREPRISE' ? 0.08 :
     clientSelectionne.type === 'PROFESSIONNEL' ? 0.05 : 0) : 0;

  const montantRemise = totalProduits * remisePourcentage;
  const totalFinal = totalProduits - montantRemise;

 const handleAddProduct = (produit) => {
  const existing = selectedProducts.find(p => p.id === produit.id);
  if (existing) {
    onModifierQuantite(produit.id, existing.quantite + 1);
  } else {
    // VÉRIFIEZ QUE LE PRODUIT A UN ID
    if (!produit.id) {
      console.error('Produit ajouté sans ID:', produit);
      alert('Erreur: le produit n\'a pas d\'ID');
      return;
    }
    
    onSelectProduct({
      ...produit,
      quantite: 1,
      // Assurez que le prix est bien présent
      prix: produit.prix || produit.prixUnitaire || 0
    });
  }
};

  const handleCreateOrder = () => {
    if (!selectedClient || selectedProducts.length === 0) {
      alert('Veuillez sélectionner un client et ajouter des produits');
      return;
    }
    
    // Vérifier les stocks
    const produitSansStock = selectedProducts.find(p => {
      const produitOriginal = produits.find(prod => prod.id === p.id);
      const stockDisponible = produitOriginal?.quantiteStock || 0;
      return p.quantite > stockDisponible;
    });

    if (produitSansStock) {
      alert(`Quantité insuffisante pour "${produitSansStock.libelle}". Stock disponible: ${produitSansStock.quantiteStock}`);
      return;
    }

    onCreateCommande(selectedClient, notes);
  };

  const handleClearCart = () => {
    if (confirm('Voulez-vous vider tous les produits du panier ?')) {
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

  // Fonction pour gérer la sélection/désélection d'un client
  const handleClientClick = (clientId) => {
    if (isCreating) return; // Empêcher le changement pendant la création
    
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

  // Étape 1 : Sélection du client
  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
          
          {/* En-tête */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Nouvelle Commande</h2>
                <p className="text-blue-100 text-sm mt-1">Étape 1 : Sélectionnez un client</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-blue-700 rounded"
                disabled={isCreating}
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Étapes */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex justify-center items-center space-x-8">
              <StepIndicator step={1} currentStep={currentStep} />
              <div className={`h-0.5 w-12 ${clientSelectionne ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              <StepIndicator step={2} currentStep={currentStep} />
              <div className="h-0.5 w-12 bg-gray-300"></div>
              <StepIndicator step={3} currentStep={currentStep} />
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Recherche */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Rechercher un client..."
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
                      <div className="font-medium text-gray-900">Client sélectionné</div>
                      <div className="text-sm text-gray-600">{clientSelectionne.nom} • {clientSelectionne.telephone}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClientClick(parseInt(selectedClient))}
                    className="text-sm text-red-600 hover:text-red-700"
                    disabled={isCreating}
                  >
                    Changer
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
                      <ClientBadge type={client.type} />
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
                <p className="text-gray-600">Aucun client trouvé</p>
              </div>
            )}

            {/* Boutons */}
            <div className="mt-6 flex justify-between">
              <SimpleButton
                onClick={onClose}
                variant="outline"
                disabled={isCreating}
              >
                Annuler
              </SimpleButton>
              <SimpleButton
                onClick={handleNextStep}
                disabled={!clientSelectionne || isCreating}
                variant="primary"
                className="px-5"
              >
                {isCreating ? 'Chargement...' : 'Suivant'}
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-lg">
          
          {/* En-tête */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Nouvelle Commande</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Client : {clientSelectionne.nom} • {selectedProducts.length} produit{selectedProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded px-3 py-1.5">
                  <div className="text-xs text-blue-100">Total</div>
                  <div className="text-sm font-semibold text-white">{totalFinal.toFixed(2)} dt</div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-blue-700 rounded"
                  disabled={isCreating}
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Étapes */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex justify-center items-center space-x-8">
              <StepIndicator step={1} currentStep={currentStep} />
              <div className="h-0.5 w-12 bg-green-400"></div>
              <StepIndicator step={2} currentStep={currentStep} />
              <div className={`h-0.5 w-12 ${selectedProducts.length > 0 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              <StepIndicator step={3} currentStep={currentStep} />
            </div>
          </div>

          <div className="flex h-[calc(90vh-140px)]">
            {/* Produits */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <ShoppingCartIcon className="h-4 w-4 text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-800">Produits</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleClientClick(parseInt(selectedClient))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    disabled={isCreating}
                  >
                    ← Changer client
                  </button>
                </div>
              </div>

              {/* Recherche produits */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
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
                  
                  return (
                    <div key={produit.id} className={`border rounded-lg p-3 ${selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} ${isCreating ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{produit.libelle}</div>
                          <div className="text-xs text-gray-600">{produit.categorie}</div>
                          <div className={`text-xs mt-1 ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Stock: {stock} {produit.uniteMesure}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600 text-sm">{toNumber(produit.prix).toFixed(2)} dt</div>
                          <button
                            onClick={() => handleAddProduct(produit)}
                            disabled={stock <= 0 || isCreating}
                            className={`mt-1 px-2 py-1 text-xs rounded flex items-center ${stock > 0 && !isCreating ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500'}`}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            {selected ? '+1' : 'Ajouter'}
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
                            <button
                              onClick={() => onSupprimerProduit(produit.id)}
                              className="text-red-600 hover:text-red-700 text-xs flex items-center disabled:opacity-50"
                              disabled={isCreating}
                            >
                              <TrashIcon className="h-3 w-3 mr-1" />
                              Retirer
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
                  ← Retour
                </SimpleButton>
                <SimpleButton
                  onClick={handleNextStep}
                  disabled={selectedProducts.length === 0 || isCreating}
                  variant="primary"
                >
                  {isCreating ? 'Chargement...' : 'Suivant → Valider'}
                </SimpleButton>
              </div>
            </div>

            {/* Panier */}
            <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto bg-gray-50">
              <h3 className="font-medium text-gray-800 mb-3">Panier</h3>
              
              {/* Client sélectionné avec option de désélection */}
              <div className="bg-white p-3 rounded-lg border mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{clientSelectionne.nom}</div>
                      <div className="text-xs text-gray-600">{clientSelectionne.telephone}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClientBadge type={clientSelectionne.type} />
                    <button
                      onClick={() => handleClientClick(parseInt(selectedClient))}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      title="Changer de client"
                      disabled={isCreating}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Panier vide</p>
                </div>
              ) : (
                <>
                  {/* Produits panier */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {selectedProducts.map(produit => (
                      <div key={produit.id} className="bg-white p-2 rounded border">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{produit.libelle}</div>
                            <div className="text-xs text-gray-600">
                              {produit.quantite} × {toNumber(produit.prix).toFixed(2)} dt
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600 text-sm">
                              {(toNumber(produit.prix) * produit.quantite).toFixed(2)} dt
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bouton vider */}
                  <SimpleButton
                    onClick={handleClearCart}
                    variant="danger"
                    className="w-full mb-4"
                    disabled={isCreating}
                  >
                    <TrashIcon className="h-3 w-3 mr-1 inline" />
                    Vider le panier
                  </SimpleButton>

                  {/* Totaux */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Sous-total</span>
                        <span className="font-medium">{totalProduits.toFixed(2)} dt</span>
                      </div>
                      
                      {remisePourcentage > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Remise ({Math.round(remisePourcentage * 100)}%)</span>
                          <span className="font-medium">-{montantRemise.toFixed(2)} dt</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-green-600">{totalFinal.toFixed(2)} dt</span>
                      </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        
        {/* En-tête */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Nouvelle Commande</h2>
              <p className="text-blue-100 text-sm mt-1">Étape 3 : Validation</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-blue-700 rounded"
              disabled={isCreating}
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Étapes */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex justify-center items-center space-x-8">
            <StepIndicator step={1} currentStep={currentStep} />
            <div className="h-0.5 w-12 bg-green-400"></div>
            <StepIndicator step={2} currentStep={currentStep} />
            <div className="h-0.5 w-12 bg-green-400"></div>
            <StepIndicator step={3} currentStep={currentStep} />
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Message de confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <h3 className="font-medium text-green-800">Vérifiez les détails</h3>
                <p className="text-green-700 text-sm mt-1">Tout est prêt pour créer la commande</p>
              </div>
            </div>
          </div>

          {/* Client avec option de désélection */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800">Client</h4>
              <button
                onClick={() => handleClientClick(parseInt(selectedClient))}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={isCreating}
              >
                Changer
              </button>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <UserCircleIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">{clientSelectionne.nom}</div>
                    <div className="text-sm text-gray-600">{clientSelectionne.telephone}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ClientBadge type={clientSelectionne.type} />
                  <button
                    onClick={() => handleClientClick(parseInt(selectedClient))}
                    className="text-xs text-red-600 hover:text-red-700"
                    title="Changer de client"
                    disabled={isCreating}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800">Produits</h4>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                {selectedProducts.length} article{selectedProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">Produit</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">Qté</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">Prix</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map(produit => (
                      <tr key={produit.id} className="border-t">
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900 text-sm">{produit.libelle}</div>
                        </td>
                        <td className="px-4 py-2 text-gray-900 text-sm">{produit.quantite}</td>
                        <td className="px-4 py-2 text-gray-900 text-sm">{toNumber(produit.prix).toFixed(2)} dt</td>
                        <td className="px-4 py-2 font-medium text-blue-600 text-sm">
                          {(toNumber(produit.prix) * produit.quantite).toFixed(2)} dt
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t p-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={isCreating}
                >
                  ← Modifier
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions supplémentaires..."
              disabled={isCreating}
            />
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Récapitulatif</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Sous-total</span>
                <span className="font-medium">{totalProduits.toFixed(2)} dt</span>
              </div>
              
              {remisePourcentage > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise ({Math.round(remisePourcentage * 100)}%)</span>
                  <span className="font-medium">-{montantRemise.toFixed(2)} dt</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-medium">
                  <span>Total commande</span>
                  <span className="text-green-600 text-lg">{totalFinal.toFixed(2)} dt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons finaux */}
          <div className="flex justify-between pt-4 border-t">
            <SimpleButton onClick={handlePrevStep} variant="outline" disabled={isCreating}>
              ← Retour
            </SimpleButton>
            
            <div className="flex space-x-3">
              <SimpleButton onClick={onClose} variant="outline" disabled={isCreating}>
                Annuler
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
                    Création en cours...
                  </span>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1 inline" />
                    Créer la commande
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