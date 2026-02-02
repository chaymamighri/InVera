// src/pages/dashboard/sales/products/ProductsConsultationPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShoppingCartIcon,
  UserPlusIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  DocumentTextIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const ProductsConsultationPage = () => {
  // Données initiales des produits 
  const [products, setProducts] = useState([
    {
      id: 1,
      libelle: 'Ordinateur Portable Pro',
      prix: 1299.99,
      prixInitial: 1499.99,
      quantiteStock: 45,
      seuilMinimum: 10,
      uniteMesure: 'unité',
      categorie: 'Électronique',
      remise: 13.33,
      statut: 'En stock',
      typeClientAutorise: ['Professionnel', 'VIP'],
      derniereMAJ: '2024-01-15',
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 2,
      libelle: 'Smartphone Premium',
      prix: 899.99,
      prixInitial: 999.99,
      quantiteStock: 120,
      seuilMinimum: 25,
      uniteMesure: 'unité',
      categorie: 'Électronique',
      remise: 10.00,
      statut: 'En stock',
      typeClientAutorise: ['Tous'],
      derniereMAJ: '2024-01-20',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 3,
      libelle: 'Chaise de Bureau Ergonomique',
      prix: 249.99,
      prixInitial: 299.99,
      quantiteStock: 32,
      seuilMinimum: 15,
      uniteMesure: 'unité',
      categorie: 'Bureau',
      remise: 16.67,
      statut: 'Stock faible',
      typeClientAutorise: ['Professionnel', 'Entreprise'],
      derniereMAJ: '2024-01-18',
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 4,
      libelle: 'Table de Conférence',
      prix: 1199.99,
      prixInitial: 1299.99,
      quantiteStock: 8,
      seuilMinimum: 5,
      uniteMesure: 'unité',
      categorie: 'Mobilier',
      remise: 7.69,
      statut: 'Stock critique',
      typeClientAutorise: ['Fidéle', 'VIP'],
      derniereMAJ: '2024-01-10',
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 5,
      libelle: 'Pack Papier A4',
      prix: 24.99,
      prixInitial: 29.99,
      quantiteStock: 500,
      seuilMinimum: 100,
      uniteMesure: 'paquet',
      categorie: 'Fournitures',
      remise: 16.67,
      statut: 'En stock',
      typeClientAutorise: ['Tous'],
      derniereMAJ: '2024-01-22',
      imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 6,
      libelle: 'Écran 27" 4K',
      prix: 399.99,
      prixInitial: 449.99,
      quantiteStock: 0,
      seuilMinimum: 10,
      uniteMesure: 'unité',
      categorie: 'Électronique',
      remise: 11.11,
      statut: 'Rupture',
      typeClientAutorise: ['Tous'],
      derniereMAJ: '2024-01-05',
      imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 7,
      libelle: 'Clavier Mécanique Gaming',
      prix: 89.99,
      prixInitial: 99.99,
      quantiteStock: 0,
      seuilMinimum: 15,
      uniteMesure: 'unité',
      categorie: 'Électronique',
      remise: 10.00,
      statut: 'Rupture',
      typeClientAutorise: ['Tous'],
      derniereMAJ: '2024-01-12',
      imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    }
  ]);

  // Clients existants
  const [clients, setClients] = useState([
    { id: 1, nom: 'SARL TechSolutions', type: 'Entreprise', telephone: '71 123 456', adresse: '15 Rue de la République, Tunis' },
    { id: 2, nom: 'Mohamed Ben Ali', type: 'standard', telephone: '98 765 432', adresse: '42 Avenue Habib Bourguiba, Sfax' },
    { id: 3, nom: 'Société Générale', type: 'Fidèle', telephone: '70 111 222', adresse: 'Centre Urbain Nord, Ariana' },
    { id: 4, nom: 'Ahmed Ben Salah', type: 'VIP', telephone: '97 888 999', adresse: 'Les Berges du Lac, Tunis' },
    { id: 5, nom: 'Boutique El Medina', type: 'Professionnel', telephone: '72 333 444', adresse: 'Medina, Tunis' },
    { id: 6, nom: 'Client Normal', type: 'Standard', telephone: '55 666 777', adresse: '12 Rue des Oliviers, Nabeul' }
  ]);

  // Commandes enregistrées localement
  const [commandes, setCommandes] = useState([]);

  // États pour la consultation
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortField, setSortField] = useState('libelle');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // États pour la création de commande avec plusieurs produits
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [remiseAppliquee, setRemiseAppliquee] = useState(0);
  
  // Nouveau client
  const [nouveauClient, setNouveauClient] = useState({
    nom: '',
    prenom: '',
    type: 'Professionnel',
    telephone: '',
    adresse: ''
  });

  // Remises par type de client (simulant la base de données)
  const remisesParType = {
    'VIP': 20, // 20% de remise pour les VIP
    'Professionnel': 15, // 15% de remise pour les professionnels
    'Entreprise': 10, // 10% de remise pour les entreprises
    'Fidèle': 5, // 5% de remise pour les clients fidèles
    'Standard': 0 // 0% de remise pour les clients normaux
  };

  const categories = ['Tous', 'Électronique', 'Bureau', 'Mobilier', 'Fournitures', 'Consommables', 'Services'];
  const typesClient = ['VIP', 'Entreprise', 'Professionnel', 'Fidèle', 'Standard'];

  // Filtrer et trier les produits
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.categorie.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tous' || product.categorie === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'libelle' || sortField === 'categorie' || sortField === 'statut') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  // Calculer les statistiques
  const stats = {
    totalProduits: products.length,
    enStock: products.filter(p => p.statut === 'En stock').length,
    stockFaible: products.filter(p => p.statut === 'Stock faible').length,
    stockCritique: products.filter(p => p.statut === 'Stock critique').length,
    valeurStock: products.reduce((sum, p) => sum + (p.prix * (p.quantiteStock > 0 ? p.quantiteStock : 0)), 0)
  };

  // Gérer le tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (statut) => {
    switch(statut) {
      case 'En stock': return 'bg-green-100 text-green-800';
      case 'Stock faible': return 'bg-yellow-100 text-yellow-800';
      case 'Stock critique': return 'bg-orange-100 text-orange-800';
      case 'Rupture': return 'bg-red-100 text-red-800';
      case 'Service': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sélectionner/désélectionner un produit pour la commande
  const handleSelectProduct = (product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantiteCommande: 1 }]);
    }
  };

  // Démarrer la création d'une commande avec produits sélectionnés
  const handleCreateOrder = () => {
    if (selectedProducts.length === 0) {
      alert('Veuillez sélectionner au moins un produit');
      return;
    }
    
    setSelectedClient(null);
    setNewClientMode(false);
    setRemiseAppliquee(0);
    setShowCreateOrder(true);
  };

  // Modifier la quantité d'un produit dans la commande
  const handleChangeQuantite = (productId, newQuantite) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId 
        ? { ...p, quantiteCommande: Math.max(1, newQuantite) }
        : p
    ));
  };

  // Retirer un produit de la commande
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Vérifier la disponibilité pour tous les produits
  const checkDisponibilite = () => {
    return selectedProducts.every(p => 
      p.quantiteStock >= p.quantiteCommande
    );
  };

  // Vérifier si un produit spécifique est disponible
  const checkDisponibiliteProduit = (product) => {
    return product.quantiteStock >= product.quantiteCommande;
  };

  // Calculer les totaux pour la commande
  const calculerTotaux = () => {
    if (selectedProducts.length === 0) return { sousTotal: 0, remise: 0, total: 0 };
    
    const sousTotal = selectedProducts.reduce((sum, p) => 
      sum + (p.prix * p.quantiteCommande), 0
    );
    
    const montantRemise = sousTotal * (remiseAppliquee / 100);
    const total = sousTotal - montantRemise;
    
    return {
      sousTotal: sousTotal.toFixed(2),
      remise: montantRemise.toFixed(2),
      total: total.toFixed(2),
      remisePourcentage: remiseAppliquee
    };
  };

  // Sélectionner un client
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setNewClientMode(false);
    
    // Appliquer automatiquement la remise selon le type de client
    if (client && remisesParType[client.type] !== undefined) {
      setRemiseAppliquee(remisesParType[client.type]);
    } else {
      setRemiseAppliquee(0);
    }
  };

  // Ajouter un nouveau client
  const handleAddNewClient = () => {
    const newId = Math.max(...clients.map(c => c.id)) + 1;
    
    // Combiner nom et prénom
    const nomComplet = nouveauClient.prenom 
      ? `${nouveauClient.nom} ${nouveauClient.prenom}`
      : nouveauClient.nom;
    
    const clientToAdd = {
      id: newId,
      nom: nomComplet,
      type: nouveauClient.type,
      telephone: nouveauClient.telephone,
      adresse: nouveauClient.adresse
    };
    
    setClients([...clients, clientToAdd]);
    setSelectedClient(clientToAdd);
    setNewClientMode(false);
    
    // Appliquer automatiquement la remise selon le type de client
    setRemiseAppliquee(remisesParType[clientToAdd.type] || 0);
    
    setNouveauClient({
      nom: '',
      prenom: '',
      type: 'Professionnel',
      telephone: '',
      adresse: ''
    });
  };

  // Créer la commande (première étape)
  const handleCreateCommande = () => {
    if (selectedProducts.length === 0 || !selectedClient) {
      alert('Veuillez sélectionner un client et au moins un produit');
      return;
    }

    if (!checkDisponibilite()) {
      alert('Certains produits ne sont pas disponibles en quantité suffisante');
      return;
    }

    // Passer à l'étape du récapitulatif
    setShowRecap(true);
  };

  // Enregistrer la commande (deuxième étape)
  const handleEnregistrerCommande = () => {
    const totaux = calculerTotaux();
    const date = new Date();
    
    // Créer l'objet commande
    const nouvelleCommande = {
      id: Date.now(),
      numero: `CMD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${(commandes.length + 1).toString().padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      heure: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      client: selectedClient,
      produits: selectedProducts.map(p => ({
        produitId: p.id,
        libelle: p.libelle,
        quantite: p.quantiteCommande,
        prixUnitaire: p.prix,
        uniteMesure: p.uniteMesure,
        sousTotal: (p.prix * p.quantiteCommande).toFixed(2)
      })),
      sousTotal: totaux.sousTotal,
      remise: totaux.remise,
      remisePourcentage: totaux.remisePourcentage,
      total: totaux.total,
      statut: 'En attente',
      disponibilite: checkDisponibilite() ? 'Disponible' : 'Rupture'
    };

    // Enregistrer la commande localement
    const nouvellesCommandes = [...commandes, nouvelleCommande];
    setCommandes(nouvellesCommandes);
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('commandes', JSON.stringify(nouvellesCommandes));
    
    // Afficher le popup de succès
    setShowSuccessPopup(true);
    setShowRecap(false);
    setShowCreateOrder(false);
  };

  // Réinitialiser le formulaire
  const handleResetForm = () => {
    setSelectedProducts([]);
    setSelectedClient(null);
    setRemiseAppliquee(0);
    setShowCreateOrder(false);
    setShowRecap(false);
  };

  // Gérer la vue des commandes
  const handleVoirCommandes = () => {
    setShowSuccessPopup(false);
    // Ici, vous redirigeriez vers la page des commandes
    // Pour l'instant, on affiche un message
    alert('Redirection vers la page des commandes clients');
  };

  // Charger les commandes depuis le localStorage au démarrage
  useEffect(() => {
    const commandesSauvegardees = localStorage.getItem('commandes');
    if (commandesSauvegardees) {
      setCommandes(JSON.parse(commandesSauvegardees));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête avec badge produits sélectionnés */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consultation des Produits</h1>
            <p className="text-gray-600 mt-2">Consultez le catalogue et créez des commandes clients</p>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <span className="font-medium">{selectedProducts.length}</span> produit(s) sélectionné(s)
              </div>
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium flex items-center"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Créer Commande ({selectedProducts.length})
              </button>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalProduits}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-600 font-medium">En Stock</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.enStock}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-sm text-yellow-600 font-medium">Faible</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.stockFaible}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Critique</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.stockCritique}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm text-red-600 font-medium">Rupture</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{products.filter(p => p.statut === 'Rupture').length}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un produit par nom ou catégorie..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-3 text-gray-400">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded"
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => 
                        selectedProducts.some(sp => sp.id === p.id)
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const produitsDisponibles = filteredProducts.filter(p => p.statut !== 'Rupture');
                          setSelectedProducts([...selectedProducts, ...produitsDisponibles
                            .filter(p => !selectedProducts.some(sp => sp.id === p.id))
                            .map(p => ({ ...p, quantiteCommande: 1 }))
                          ]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(sp => 
                            !filteredProducts.some(p => p.id === sp.id)
                          ));
                        }
                      }}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('libelle')}
                >
                  <div className="flex items-center">
                    Produit
                    {sortField === 'libelle' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('prix')}
                >
                  <div className="flex items-center">
                    Prix et remise
                    {sortField === 'prix' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantiteStock')}
                >
                  <div className="flex items-center">
                    Stock
                    {sortField === 'quantiteStock' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sélection
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.some(p => p.id === product.id);
                
                return (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-25' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product)}
                          disabled={product.statut === 'Rupture'}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={product.imageUrl}
                          alt={product.libelle}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{product.libelle}</div>
                        <div className="text-sm text-gray-500">
                          {product.categorie} • {product.uniteMesure}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Types clients: {product.typeClientAutorise?.join(', ') || 'Tous'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">
                          {product.prix.toFixed(2)} dt
                        </div>
                        {product.remise > 0 && (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 line-through mr-2">
                              {product.prixInitial.toFixed(2)} dt
                            </span>
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                              -{product.remise}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className={`font-medium ${
                          product.quantiteStock > product.seuilMinimum ? 'text-green-600' :
                          product.quantiteStock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.quantiteStock} {product.uniteMesure}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.statut)}`}>
                          {product.statut}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isSelected ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm flex items-center"
                            title="Retirer de la commande"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Retirer
                          </button>
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleChangeQuantite(product.id, 
                                selectedProducts.find(p => p.id === product.id)?.quantiteCommande - 1
                              )}
                              className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={product.quantiteStock}
                              value={selectedProducts.find(p => p.id === product.id)?.quantiteCommande || 1}
                              onChange={(e) => handleChangeQuantite(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center py-1.5 border-x"
                            />
                            <button
                              onClick={() => handleChangeQuantite(product.id, 
                                selectedProducts.find(p => p.id === product.id)?.quantiteCommande + 1
                              )}
                              className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectProduct(product)}
                          disabled={product.statut === 'Rupture'}
                          className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center ${
                            product.statut === 'Rupture'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                          }`}
                        >
                          <ShoppingCartIcon className="h-4 w-4 mr-2" />
                          {product.statut === 'Rupture' ? 'Rupture' : 'Sélectionner'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 text-gray-300">📦</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* Modal Création Commande - Étape 1: Sélection client */}
      {showCreateOrder && !showRecap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Créer une Commande Client ({selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''})
                </h2>
                <button
                  onClick={() => setShowCreateOrder(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Informations sur les produits sélectionnés */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Produits Sélectionnés</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                            <img src={product.imageUrl} alt={product.libelle} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.libelle}</div>
                            <div className="text-sm text-gray-600">
                              {product.quantiteCommande} × {product.prix.toFixed(2)} dt
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-blue-600">
                          {(product.prix * product.quantiteCommande).toFixed(2)} dt
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sélection du client */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Sélection du Client</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setNewClientMode(false)}
                      className={`px-3 py-1 rounded-lg text-sm ${!newClientMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Client existant
                    </button>
                    <button
                      onClick={() => setNewClientMode(true)}
                      className={`px-3 py-1 rounded-lg text-sm ${newClientMode ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <UserPlusIcon className="h-4 w-4 inline mr-1" />
                      Nouveau client
                    </button>
                  </div>
                </div>

                {!newClientMode ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clients.map(client => (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedClient?.id === client.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{client.nom}</div>
                            <div className="text-sm text-gray-600">{client.type}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              📞 {client.telephone}
                            </div>
                            {client.adresse && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 {client.adresse}
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.type === 'VIP' ? 'bg-purple-100 text-purple-800' :
                            client.type === 'Entreprise' ? 'bg-blue-100 text-blue-800' :
                            client.type === 'Professionnel' ? 'bg-green-100 text-green-800' :
                            client.type === 'Fidèle' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {client.type}
                          </span>
                        </div>
                        {selectedClient?.id === client.id && remiseAppliquee > 0 && (
                          <div className="mt-2 text-sm text-green-600 font-medium">
                            Remise automatique appliquée: {remiseAppliquee}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom et Prénom *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={nouveauClient.nom}
                          onChange={(e) => setNouveauClient({...nouveauClient, nom: e.target.value})}
                          placeholder="Nom"
                        />
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={nouveauClient.prenom}
                          onChange={(e) => setNouveauClient({...nouveauClient, prenom: e.target.value})}
                          placeholder="Prénom"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type de client
                        </label>
                        <select
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={nouveauClient.type}
                          onChange={(e) => setNouveauClient({...nouveauClient, type: e.target.value})}
                        >
                          {typesClient.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={nouveauClient.telephone}
                          onChange={(e) => setNouveauClient({...nouveauClient, telephone: e.target.value})}
                          placeholder="XX XXX XXX"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse complète
                      </label>
                      <textarea
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        value={nouveauClient.adresse}
                        onChange={(e) => setNouveauClient({...nouveauClient, adresse: e.target.value})}
                        placeholder="Numéro, rue, ville, code postal..."
                      />
                    </div>
                    
                    <button
                      onClick={handleAddNewClient}
                      disabled={!nouveauClient.nom || !nouveauClient.telephone}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ajouter le client
                    </button>
                  </div>
                )}
              </div>

              {/* Vérification de disponibilité */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vérification Disponibilité
                </label>
                <div className={`p-4 rounded-lg ${checkDisponibilite() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {checkDisponibilite() ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-700 font-medium">Tous les produits sont disponibles</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-red-700 font-medium">Certains produits ne sont pas disponibles</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProducts.filter(p => p.quantiteStock < p.quantiteCommande).length} produit(s) avec stock insuffisant
                  </p>
                </div>
              </div>

              {/* Boutons Créer/Annuler */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowCreateOrder(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateCommande}
                  disabled={!selectedClient || !checkDisponibilite()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Créer Commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Récapitulatif - Étape 2 */}
      {showRecap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Récapitulatif de la Commande</h2>
                <button
                  onClick={() => setShowRecap(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Informations client */}
              <div className="mb-6 bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Nom</div>
                    <div className="font-medium text-gray-900">{selectedClient?.nom}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedClient?.type === 'VIP' ? 'bg-purple-100 text-purple-800' :
                        selectedClient?.type === 'Entreprise' ? 'bg-blue-100 text-blue-800' :
                        selectedClient?.type === 'Professionnel' ? 'bg-green-100 text-green-800' :
                        selectedClient?.type === 'Fidèle' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedClient?.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Téléphone</div>
                    <div className="font-medium text-gray-900">{selectedClient?.telephone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Adresse</div>
                    <div className="font-medium text-gray-900">{selectedClient?.adresse}</div>
                  </div>
                </div>
              </div>

              {/* Détails des produits */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-4">Détails des Produits</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Unitaire</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sous-total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProducts.map(product => (
                        <tr key={product.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
                                <img src={product.imageUrl} alt={product.libelle} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{product.libelle}</div>
                                <div className="text-sm text-gray-500">{product.uniteMesure}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-900">{product.quantiteCommande}</td>
                          <td className="px-4 py-3 text-gray-900">{product.prix.toFixed(2)} dt</td>
                          <td className="px-4 py-3 font-medium text-blue-600">
                            {(product.prix * product.quantiteCommande).toFixed(2)} dt
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="mb-6 bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Totaux</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{calculerTotaux().sousTotal} dt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remise ({remiseAppliquee}%)</span>
                    <span className="font-medium text-red-600">-{calculerTotaux().remise} dt</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="text-xl font-bold text-blue-600">{calculerTotaux().total} dt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton Enregistrer */}
              <div className="flex justify-end">
                <button
                  onClick={handleEnregistrerCommande}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 font-medium flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Enregistrer la Commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup de succès */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Commande créée avec succès</h3>
              <p className="text-gray-600 mb-6">
                La commande a été enregistrée dans la section commandes clients.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleVoirCommandes}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium flex items-center justify-center"
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Voir les Commandes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsConsultationPage;