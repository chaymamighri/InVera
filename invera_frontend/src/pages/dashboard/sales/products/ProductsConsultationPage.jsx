// src/pages/dashboard/sales/products/ProductsConsultationPage.jsx
import React, { useState, useEffect } from 'react';
import ProductFilters from './components/ProductFilterSection';
import ProductStats from './components/ProductStats';
import ProductTable from './components/ProductTable';
import OrderModal from './components/OrderModal';
import OrderRecapModal from './components/OrderRecapModal';
import SuccessModal from './components/SuccessModal';

const ProductsConsultationPage = () => {
  // Données initiales des produits (à remplacer par API)
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

  // Clients existants (à remplacer par API)
  const [clients, setClients] = useState([
    { id: 1, nom: 'SARL TechSolutions', type: 'Entreprise', telephone: '71 123 456', adresse: '15 Rue de la République, Tunis' },
    { id: 2, nom: 'Mohamed Ben Ali', type: 'standard', telephone: '98 765 432', adresse: '42 Avenue Habib Bourguiba, Sfax' },
    { id: 3, nom: 'Société Générale', type: 'Fidèle', telephone: '70 111 222', adresse: 'Centre Urbain Nord, Ariana' },
    { id: 4, nom: 'Ahmed Ben Salah', type: 'VIP', telephone: '97 888 999', adresse: 'Les Berges du Lac, Tunis' },
    { id: 5, nom: 'Boutique El Medina', type: 'Professionnel', telephone: '72 333 444', adresse: 'Medina, Tunis' },
    { id: 6, nom: 'Client Normal', type: 'Standard', telephone: '55 666 777', adresse: '12 Rue des Oliviers, Nabeul' }
  ]);

  // États
  const [commandes, setCommandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortField, setSortField] = useState('libelle');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [remiseAppliquee, setRemiseAppliquee] = useState(0);
  const [nouveauClient, setNouveauClient] = useState({
    nom: '',
    prenom: '',
    type: 'Professionnel',
    telephone: '',
    adresse: ''
  });

  // Données statiques (constantes)
  const categories = ['Tous', 'Électronique', 'Bureau', 'Mobilier', 'Fournitures', 'Consommables', 'Services'];
  const typesClient = ['VIP', 'Entreprise', 'Professionnel', 'Fidèle', 'Standard'];
  
  // Remises par type de client
  const remisesParType = {
    'VIP': 20,
    'Professionnel': 15,
    'Entreprise': 10,
    'Fidèle': 5,
    'Standard': 0
  };

  // Fonctions utilitaires
  const calculateStats = (products) => {
    return {
      totalProduits: products.length,
      enStock: products.filter(p => p.statut === 'En stock').length,
      stockFaible: products.filter(p => p.statut === 'Stock faible').length,
      stockCritique: products.filter(p => p.statut === 'Stock critique').length,
      rupture: products.filter(p => p.statut === 'Rupture').length,
      valeurStock: products.reduce((sum, p) => sum + (p.prix * (p.quantiteStock > 0 ? p.quantiteStock : 0)), 0)
    };
  };

  const filterAndSortProducts = (products, searchTerm, selectedCategory, sortField, sortDirection) => {
    return products
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
  };

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

  const checkDisponibilite = (selectedProducts) => {
    return selectedProducts.every(p => 
      p.quantiteStock >= (p.quantiteCommande || 1)
    );
  };

  const calculerTotaux = (selectedProducts, remisePourcentage = 0) => {
    if (!selectedProducts || selectedProducts.length === 0) {
      return { sousTotal: 0, remise: 0, total: 0 };
    }
    
    const sousTotal = selectedProducts.reduce((sum, p) => 
      sum + (p.prix * (p.quantiteCommande || 1)), 0
    );
    
    const montantRemise = sousTotal * (remisePourcentage / 100);
    const total = sousTotal - montantRemise;
    
    return {
      sousTotal: sousTotal.toFixed(2),
      remise: montantRemise.toFixed(2),
      total: total.toFixed(2),
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

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectProduct = (product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantiteCommande: 1 }]);
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
    
    // Appliquer automatiquement la remise selon le type de client
    if (client && remisesParType[client.type] !== undefined) {
      setRemiseAppliquee(remisesParType[client.type]);
    } else {
      setRemiseAppliquee(0);
    }
  };

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

  const handleEnregistrerCommande = () => {
    const totaux = calculerTotaux(selectedProducts, remiseAppliquee);
    const date = new Date();
    
    // Créer l'objet commande
    const nouvelleCommande = {
      id: Date.now(),
      numero: genererNumeroCommande(commandes.length),
      date: date.toISOString().split('T')[0],
      heure: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      client: selectedClient,
      produits: selectedProducts.map(p => ({
        produitId: p.id,
        libelle: p.libelle,
        quantite: p.quantiteCommande || 1,
        prixUnitaire: p.prix,
        uniteMesure: p.uniteMesure,
        sousTotal: (p.prix * (p.quantiteCommande || 1)).toFixed(2)
      })),
      sousTotal: totaux.sousTotal,
      remise: totaux.remise,
      remisePourcentage: totaux.remisePourcentage,
      total: totaux.total,
      statut: 'En attente',
      disponibilite: checkDisponibilite(selectedProducts) ? 'Disponible' : 'Rupture'
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

  // Effets
  useEffect(() => {
    const commandesSauvegardees = localStorage.getItem('commandes');
    if (commandesSauvegardees) {
      setCommandes(JSON.parse(commandesSauvegardees));
    }
  }, []);

  // Calculs
  const stats = calculateStats(products);
  const filteredProducts = filterAndSortProducts(products, searchTerm, selectedCategory, sortField, sortDirection);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consultation des Produits</h1>
            <p className="text-gray-600 mt-2">Consultez le catalogue et créez des commandes clients</p>
          </div>
          
          {selectedProducts.length > 0 && (
            <ProductStats 
              selectedProducts={selectedProducts}
              handleCreateOrder={handleCreateOrder}
            />
          )}
        </div>

        <ProductStats stats={stats} />

        <ProductFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
      </div>

      <ProductTable 
        products={filteredProducts}
        selectedProducts={selectedProducts}
        handleSelectProduct={handleSelectProduct}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        getStatusColor={getStatusColor}
        setSelectedProducts={setSelectedProducts}
        checkDisponibilite={checkDisponibilite}
        calculerTotaux={calculerTotaux}
      />

      {showCreateOrder && !showRecap && (
        <OrderModal 
          showCreateOrder={showCreateOrder}
          setShowCreateOrder={setShowCreateOrder}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          clients={clients}
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
          typesClient={typesClient}
          remisesParType={remisesParType}
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