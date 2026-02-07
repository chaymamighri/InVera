// src/pages/dashboard/sales/products/ProductsConsultationPage.jsx
import React, { useState, useEffect } from 'react';
import ProductFilters from './components/ProductFilterSection';
import ProductStats from './components/ProductStatis';
import ProductTable from './components/ProductTable';
import OrderModal from './components/OrderModal/OrderModal';
import OrderRecapModal from './components/OrderRecapModal';
import SuccessModal from './components/SuccessModal';
import productService from '../../../../services/productService';
import clientService from '../../../../services/clientService';
import { useAuth } from '../../../../hooks/useAuth';

const ProductsConsultationPage = () => {
  // États pour les données
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientTypes, setClientTypes] = useState([]); // Types de clients dynamiques
  
  // États pour les commandes
  const [commandes, setCommandes] = useState([]);
  
  // États pour les filtres et tri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortField, setSortField] = useState('libelle');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categories, setCategories] = useState(['Tous']);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // États pour les modales
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // États pour la sélection
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [remiseAppliquee, setRemiseAppliquee] = useState(0);
  
  // État pour nouveau client
  const [nouveauClient, setNouveauClient] = useState({
    nom: '',
    prenom: '',
    typeClient: 'PROFESSIONNEL', // Utiliser les mêmes valeurs que le backend
    telephone: '',
    adresse: ''
  });

  // Fonction pour charger les produits depuis l'API
  const loadProducts = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construire les paramètres de requête
      const params = {
        keyword: searchTerm,
        ...filters
      };
      
      // Appeler l'API
      const response = await productService.getAllProducts(params);
      
      // Mettre à jour les produits
      const produits = response.produits || [];
      setProducts(produits);
      
      // Extraire les catégories uniques depuis les données de l'API
      const allCategories = [...new Set(produits
        .map(p => p.categorie)
        .filter(Boolean) || [])];
      setCategories(['Tous', ...allCategories]);
      
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      setError(err.response?.data?.message || 'Erreur de chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les clients depuis l'API
  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const response = await clientService.getAllClients();
      const clientsData = response.clients || response.data || [];
      setClients(clientsData);
      
      // Extraire les types de clients uniques depuis l'API
      const uniqueTypes = [...new Set(clientsData.map(c => c.typeClient))].filter(Boolean);
      setClientTypes(uniqueTypes);
      
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      // Ne pas utiliser de données statiques, laisser vide en cas d'erreur
      setClients([]);
      setClientTypes([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fonction pour charger les types de clients depuis l'API (endpoint spécifique)
  const loadClientTypes = async () => {
    try {
      // Si votre backend a un endpoint pour les types de clients
      const response = await clientService.getClientTypes();
      setClientTypes(response.types || []);
    } catch (err) {
      console.error('Erreur chargement types clients:', err);
    }
  };

  // Fonction pour vérifier la disponibilité des stocks
  const checkStockAvailability = async (productIds) => {
    try {
      const response = await productService.checkAvailability(productIds);
      return response.allAvailable || false;
    } catch (err) {
      console.error('Erreur vérification disponibilité:', err);
      return false;
    }
  };

  // Fonctions utilitaires adaptées à la nouvelle structure
 const calculateStats = (products) => {
  if (!products || products.length === 0) {
    return {
      totalProduits: 0,
      enStock: 0,
      stockFaible: 0,
      stockCritique: 0,
      rupture: 0,
      valeurStock: 0
    };
  }
    
  // Réinitialiser tous les compteurs
  let enStock = 0;
  let stockFaible = 0;
  let stockCritique = 0;
  let rupture = 0;
  
  // Parcourir chaque produit une seule fois
  products.forEach(p => {
    const stock = Number(p.quantiteStock) || 0;
    const seuil = Number(p.seuilMinimum) || 5;
    
    if (stock <= 0) {
      rupture++;
    } else if (stock <= 3) {
      // CRITIQUE: stock très bas (1-3 unités)
      stockCritique++;
    } else if (stock <= seuil) {
      // FAIBLE: stock inférieur ou égal au seuil minimum
      stockFaible++;
    } else {
      // EN STOCK: stock supérieur au seuil minimum
      enStock++;
    }
  });
    
  const valeurStock = products.reduce((sum, p) => {
    const prix = Number(p.prixVente) || 0;
    const stock = Number(p.quantiteStock) || 0;
    return sum + (prix * (stock > 0 ? stock : 0));
  }, 0);
    
  return {
    totalProduits: products.length,
    enStock,
    stockFaible,
    stockCritique,
    rupture,
    valeurStock: valeurStock.toFixed(2)
  };
};

  const filterAndSortProducts = (products, searchTerm, selectedCategory, sortField, sortDirection) => {
    if (!products) return [];
    
    return products
      .filter(product => {
        const libelle = product.libelle || '';
        const categorie = product.categorie || '';
        const matchesSearch = libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             categorie.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Tous' || 
                               product.categorie === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        // Normaliser les champs selon la nouvelle structure
        switch(sortField) {
          case 'libelle':
            aValue = a.libelle || '';
            bValue = b.libelle || '';
            break;
          case 'categorie':
            aValue = a.categorie || '';
            bValue = b.categorie || '';
            break;
          case 'prixVente':
            aValue = Number(a.prixVente) || 0;
            bValue = Number(b.prixVente) || 0;
            break;
          case 'quantiteStock':
            aValue = Number(a.quantiteStock) || 0;
            bValue = Number(b.quantiteStock) || 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          default:
            aValue = a[sortField] || '';
            bValue = b[sortField] || '';
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
      });
  };

  const getStatusColor = (product) => {
    const stock = product.quantiteStock || 0;
    const seuil = product.seuilMinimum || 5;
    const statut = product.status || '';
    
    if (statut === 'RUPTURE' || stock <= 0) {
      return 'bg-red-100 text-red-800';
    } else if (statut === 'FAIBLE' || (stock > 0 && stock <= seuil)) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statut === 'CRITIQUE' || stock <= 3) {
      return 'bg-orange-100 text-orange-800';
    } else if (statut === 'EN_STOCK' || stock > seuil) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const checkDisponibilite = (selectedProducts) => {
    return selectedProducts.every(p => {
      const stock = p.quantiteStock || 0;
      const quantite = p.quantiteCommande || 1;
      return stock >= quantite;
    });
  };

  const calculerTotaux = (selectedProducts, remisePourcentage = 0) => {
    if (!selectedProducts || selectedProducts.length === 0) {
      return { 
        sousTotal: 0, 
        remise: 0, 
        total: 0, 
        remisePourcentage 
      };
    }
    
    const sousTotal = selectedProducts.reduce((sum, p) => {
      const prix = Number(p.prix) || Number(p.prixVente) || 0;
      const quantite = Number(p.quantiteCommande) || 1;
      return sum + (prix * quantite);
    }, 0);
    
    const montantRemise = sousTotal * (remisePourcentage / 100);
    const total = sousTotal - montantRemise;
    
    return {
      sousTotal,
      remise: montantRemise,
      total,
      remisePourcentage
    };
  };

  const genererNumeroCommande = (commandesCount) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (commandesCount + 1).toString().padStart(4, '0');
    
    return `CMD-${year}${month}${day}-${sequence}`;
  };

  // Handlers adaptés
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectProduct = (product) => {
    const productId = product.idProduit || product.id;
    
    if (selectedProducts.some(p => (p.idProduit || p.id) === productId)) {
      setSelectedProducts(selectedProducts.filter(p => (p.idProduit || p.id) !== productId));
    } else {
      setSelectedProducts([...selectedProducts, { 
        ...product, 
        quantiteCommande: 1,
        // Normaliser les données selon la nouvelle structure
        idProduit: productId,
        prix: product.prix || product.prixVente || 0,
        quantiteStock: product.quantiteStock || 0,
        uniteMesure: product.uniteMesure || 'unité'
      }]);
    }
  };

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

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setNewClientMode(false);
    
    // Appliquer la remise selon le type de client (dynamique depuis le backend)
    // Vous pouvez implémenter la logique de remise côté backend ou côté frontend
    if (client && client.typeClient) {
      // Logique de remise à définir selon votre business logic
      // Par exemple, récupérer depuis une API
      applyRemiseByClientType(client.typeClient);
    } else {
      setRemiseAppliquee(0);
    }
  };

  const applyRemiseByClientType = async (clientType) => {
    try {
      // Appeler l'API pour obtenir la remise selon le type de client
      const response = await clientService.getRemiseByType(clientType);
      setRemiseAppliquee(response.remise || 0);
    } catch (err) {
      console.error('Erreur récupération remise:', err);
      setRemiseAppliquee(0);
    }
  };

  const handleAddNewClient = async () => {
    try {
      // Valider les données
      if (!nouveauClient.nom.trim() || !nouveauClient.telephone.trim()) {
        alert('Veuillez remplir les champs obligatoires (nom et téléphone)');
        return;
      }
      
      const clientData = {
        nom: nouveauClient.nom,
        prenom: nouveauClient.prenom || '',
        typeClient: nouveauClient.typeClient || 'PROFESSIONNEL',
        telephone: nouveauClient.telephone,
        adresse: nouveauClient.adresse || ''
      };
      
      // Appeler l'API pour créer le client
      const response = await clientService.createClient(clientData);
      const newClient = response.client || response.data;
      
      if (newClient) {
        // Ajouter le client à la liste
        setClients(prev => [...prev, newClient]);
        // Ajouter le type à la liste si nouveau
        if (!clientTypes.includes(newClient.typeClient)) {
          setClientTypes(prev => [...prev, newClient.typeClient]);
        }
        
        setSelectedClient(newClient);
        setNewClientMode(false);
        
        // Appliquer la remise pour ce nouveau client
        applyRemiseByClientType(newClient.typeClient);
        
        // Réinitialiser le formulaire
        setNouveauClient({
          nom: '',
          prenom: '',
          typeClient: 'PROFESSIONNEL',
          telephone: '',
          adresse: ''
        });
      }
      
    } catch (err) {
      console.error('Erreur lors de la création du client:', err);
      alert(err.response?.data?.message || 'Erreur lors de la création du client');
    }
  };

  const handleCreateCommande = () => {
    if (selectedProducts.length === 0 || !selectedClient) {
      alert('Veuillez sélectionner un client et au moins un produit');
      return;
    }


    if (!checkDisponibilite(selectedProducts)) {
      alert('Certains produits ne sont pas disponibles en quantité suffisante');
      return;
    }

    // Passer à l'étape du récapitulatif
    setShowRecap(true);
  };

  const handleEnregistrerCommande = async () => {
    try {
      const totaux = calculerTotaux(selectedProducts, remiseAppliquee);
      const date = new Date();
      
      // Préparer les données de la commande pour l'API
      const commandeData = {
        clientId: selectedClient.idProduit || selectedClient.id,
        dateCommande: date.toISOString().split('T')[0],
        heureCommande: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        produits: selectedProducts.map(p => ({
          produitId: p.idProduit || p.id,
          quantite: p.quantiteCommande || 1,
          prixUnitaire: p.prix || p.prixVente || 0,
          remiseProduit: p.remiseTemporaire || 0
        })),
        sousTotal: totaux.sousTotal,
        remiseGlobale: totaux.remise,
        remisePourcentage: remiseAppliquee,
        total: totaux.total,
        statut: 'EN_ATTENTE',
        notes: ''
      };
      
      // TODO: Appeler l'API pour enregistrer la commande
      // const response = await orderService.createOrder(commandeData);
      
      // Pour l'instant, sauvegarder localement
      const nouvelleCommande = {
        id: Date.now(),
        numero: genererNumeroCommande(commandes.length),
        date: date.toISOString().split('T')[0],
        heure: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        client: selectedClient,
        produits: selectedProducts.map(p => ({
          produitId: p.idProduit || p.id,
          libelle: p.libelle || 'Produit',
          quantite: p.quantiteCommande || 1,
          prixUnitaire: p.prix || p.prixVente || 0,
          uniteMesure: p.uniteMesure || 'unité',
          sousTotal: ((p.prix || p.prixVente || 0) * (p.quantiteCommande || 1)).toFixed(2)
        })),
        sousTotal: totaux.sousTotal.toFixed(2),
        remise: totaux.remise.toFixed(2),
        remisePourcentage: totaux.remisePourcentage,
        total: totaux.total.toFixed(2),
        statut: 'EN_ATTENTE',
        disponibilite: checkDisponibilite(selectedProducts) ? 'DISPONIBLE' : 'RUPTURE'
      };

      // Enregistrer la commande localement
      const nouvellesCommandes = [...commandes, nouvelleCommande];
      setCommandes(nouvellesCommandes);
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('commandes', JSON.stringify(nouvellesCommandes));
      
      // Mettre à jour les stocks (appeler l'API)
      for (const product of selectedProducts) {
        try {
          const productId = product.idProduit || product.id;
          const newStock = (product.quantiteStock || 0) - (product.quantiteCommande || 1);
          await productService.syncStock(productId, newStock);
        } catch (err) {
          console.error(`Erreur mise à jour stock produit ${product.idProduit || product.id}:`, err);
        }
      }
      
      // Afficher le popup de succès
      setShowSuccessPopup(true);
      setShowRecap(false);
      setShowCreateOrder(false);
      
      // Réinitialiser la sélection
      setSelectedProducts([]);
      
      // Recharger les produits pour mettre à jour les stocks
      loadProducts();
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la commande:', err);
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement de la commande');
    }
  };

  // Gestion des filtres
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset à la première page lors d'une nouvelle recherche
    loadProducts({ keyword: term });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset à la première page lors d'un changement de catégorie
    loadProducts({ 
      categorie: category !== 'Tous' ? category : undefined 
    });
  };

  // Gestion de la pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Effets
  useEffect(() => {
    // Charger les produits et clients au chargement de la page
    loadProducts();
    loadClients();
    
    // Charger les commandes sauvegardées
    const commandesSauvegardees = localStorage.getItem('commandes');
    if (commandesSauvegardees) {
      try {
        setCommandes(JSON.parse(commandesSauvegardees));
      } catch (err) {
        console.error('Erreur parsing commandes:', err);
      }
    }
  }, []);

  // Calculs
  const stats = calculateStats(products);
  const filteredProducts = filterAndSortProducts(products, searchTerm, selectedCategory, sortField, sortDirection);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consultation des Produits</h1>
            <p className="text-gray-600 mt-2">Consultez le catalogue et créez des commandes clients</p>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleCreateOrder}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Créer commande ({selectedProducts.length})
              </button>
            </div>
          )}
        </div>

        <ProductStats stats={stats} />

        <ProductFilters 
          searchTerm={searchTerm}
          setSearchTerm={handleSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
          categories={categories}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">
              ⚠️
            </div>
            <div>
              <p className="text-red-700 font-medium">Erreur de chargement</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <ProductTable 
        products={filteredProducts}
        selectedProducts={selectedProducts}
        handleSelectProduct={handleSelectProduct}
        handleCreateOrder={handleCreateOrder}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        getStatusColor={getStatusColor}
        setSelectedProducts={setSelectedProducts}
        checkDisponibilite={checkDisponibilite}
        calculerTotaux={calculerTotaux}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {showCreateOrder && !showRecap && (
        <OrderModal 
          showCreateOrder={showCreateOrder}
          setShowCreateOrder={setShowCreateOrder}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          clients={clients}
          clientTypes={clientTypes}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          newClientMode={newClientMode}
          setNewClientMode={setNewClientMode}
          nouveauClient={nouveauClient}
          setNouveauClient={setNouveauClient}
          remiseAppliquee={remiseAppliquee}
          setRemiseAppliquee={setRemiseAppliquee}
          handleSelectClient={handleSelectClient}
          handleAddNewClient={handleAddNewClient}
          handleCreateCommande={handleCreateCommande}
          checkDisponibilite={checkDisponibilite}
          calculerTotaux={calculerTotaux}
          loadingClients={loadingClients}
          applyRemiseByClientType={applyRemiseByClientType}
          loadClients={loadClients}
        />
      )}

      {showRecap && (
        <OrderRecapModal 
          showRecap={showRecap}
          setShowRecap={setShowRecap}
          selectedProducts={selectedProducts}
          selectedClient={selectedClient}
          remiseAppliquee={remiseAppliquee}
          calculerTotaux={calculerTotaux}
          handleEnregistrerCommande={handleEnregistrerCommande}
        />
      )}

      {showSuccessPopup && (
        <SuccessModal 
          showSuccessPopup={showSuccessPopup}
          setShowSuccessPopup={setShowSuccessPopup}
        />
      )}
    </div>
  );
};

export default ProductsConsultationPage;