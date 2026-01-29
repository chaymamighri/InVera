// src/pages/dashboard/sales/products/ProductsPage.jsx
import React, { useState } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const ProductsPage = () => {
  // Données initiales des produits avec images
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
      derniereMAJ: '2024-01-22',
      imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 6,
      libelle: 'Café Premium 1kg',
      prix: 34.99,
      prixInitial: 39.99,
      quantiteStock: 85,
      seuilMinimum: 20,
      uniteMesure: 'kg',
      categorie: 'Consommables',
      remise: 12.50,
      statut: 'En stock',
      derniereMAJ: '2024-01-19',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 7,
      libelle: 'Écran 27" 4K',
      prix: 399.99,
      prixInitial: 449.99,
      quantiteStock: 0,
      seuilMinimum: 10,
      uniteMesure: 'unité',
      categorie: 'Électronique',
      remise: 11.11,
      statut: 'Rupture',
      derniereMAJ: '2024-01-05',
      imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 8,
      libelle: 'Service Cloud Entreprise',
      prix: 149.99,
      prixInitial: 149.99,
      quantiteStock: -1,
      seuilMinimum: 0,
      uniteMesure: 'mois',
      categorie: 'Services',
      remise: 0,
      statut: 'Service',
      derniereMAJ: '2024-01-25',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortField, setSortField] = useState('libelle');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(null);
  const [showPriceUpdate, setShowPriceUpdate] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(null);

  // Données du nouveau produit
  const [newProduct, setNewProduct] = useState({
    libelle: '',
    prix: '',
    quantiteStock: '',
    seuilMinimum: '',
    uniteMesure: 'unité',
    categorie: 'Électronique',
    imageFile: null,
    imagePreview: null
  });

  // Données pour mise à jour de prix
  const [priceUpdate, setPriceUpdate] = useState({
    nouveauPrix: '',
    raison: ''
  });

  // Données pour remise
  const [discountData, setDiscountData] = useState({
    pourcentage: '',
    dateDebut: '',
    dateFin: ''
  });

  // Pour l'upload d'image
  const [imageUpload, setImageUpload] = useState({
    file: null,
    preview: null
  });

  const categories = ['Tous', 'Électronique', 'Bureau', 'Mobilier', 'Fournitures', 'Consommables', 'Services'];
  const units = ['unité', 'kg', 'litre', 'paquet', 'mètre', 'mois'];

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
    ruptureStock: products.filter(p => p.statut === 'Rupture').length,
     totalProduits: products.length,
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

  // Gérer l'upload d'image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUpload({
          file: file,
          preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Gérer l'upload d'image pour nouveau produit
  const handleNewProductImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Mettre à jour l'image d'un produit existant
  const handleUpdateImage = () => {
    if (!imageUpload.file) return;

    const updatedProducts = products.map(p => {
      if (p.id === showImageUpload) {
        return {
          ...p,
          imageUrl: imageUpload.preview,
          derniereMAJ: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setShowImageUpload(null);
    setImageUpload({ file: null, preview: null });
  };

  // Gérer l'ajout de produit
  const handleAddProduct = () => {
    const newId = Math.max(...products.map(p => p.id)) + 1;
    const quantiteStock = parseInt(newProduct.quantiteStock);
    const seuilMinimum = parseInt(newProduct.seuilMinimum);
    const prix = parseFloat(newProduct.prix);
    
    const nouveauProduit = {
      id: newId,
      libelle: newProduct.libelle,
      prix: prix,
      prixInitial: prix,
      quantiteStock: quantiteStock,
      seuilMinimum: seuilMinimum,
      uniteMesure: newProduct.uniteMesure,
      categorie: newProduct.categorie,
      remise: 0,
      statut: quantiteStock > seuilMinimum ? 'En stock' : 
              quantiteStock > 0 ? 'Stock faible' : 'Rupture',
      derniereMAJ: new Date().toISOString().split('T')[0],
      imageUrl: newProduct.imagePreview || 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    };

    setProducts([...products, nouveauProduit]);
    setShowAddProduct(false);
    setNewProduct({
      libelle: '',
      prix: '',
      quantiteStock: '',
      seuilMinimum: '',
      uniteMesure: 'unité',
      categorie: 'Électronique',
      imageFile: null,
      imagePreview: null
    });
  };

  // Mettre à jour le prix d'un produit
  const handleUpdatePrice = () => {
    const updatedProducts = products.map(p => {
      if (p.id === showPriceUpdate) {
        const nouveauPrix = parseFloat(priceUpdate.nouveauPrix);
        const ancienPrix = p.prixInitial;
        const remise = ((ancienPrix - nouveauPrix) / ancienPrix * 100).toFixed(2);
        
        return {
          ...p,
          prix: nouveauPrix,
          remise: parseFloat(remise),
          derniereMAJ: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setShowPriceUpdate(null);
    setPriceUpdate({ nouveauPrix: '', raison: '' });
  };

  // Appliquer une remise
  const handleApplyDiscount = () => {
    const updatedProducts = products.map(p => {
      if (p.id === showDiscountModal) {
        const pourcentage = parseFloat(discountData.pourcentage);
        const nouveauPrix = p.prixInitial * (1 - pourcentage / 100);
        
        return {
          ...p,
          prix: parseFloat(nouveauPrix.toFixed(2)),
          remise: pourcentage,
          derniereMAJ: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setShowDiscountModal(null);
    setDiscountData({ pourcentage: '', dateDebut: '', dateFin: '' });
  };

  // Supprimer un produit
  const handleDeleteProduct = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== id));
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

  // Obtenir la couleur pour la quantité
  const getStockColor = (quantite, seuil) => {
    if (quantite > seuil) return 'text-green-600';
    if (quantite > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits & Prix</h1>
            <p className="text-gray-600 mt-2">Gérez le catalogue de produits, les prix, remises et promotions</p>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="mt-4 md:mt-0 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un produit
          </button>
        </div>

        {/* Statistiques */}
       {/* Statistiques - Version avec 5 cartes */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
    <p className="text-sm text-blue-600 font-medium">Total Produits</p>
    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalProduits}</p>
  </div>
  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
    <p className="text-sm text-green-600 font-medium">En Stock</p>
    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.enStock}</p>
  </div>
  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
    <p className="text-sm text-orange-600 font-medium">Stock Critique</p>
    <p className="text-2xl font-bold text-gray-800 mt-2">{products.filter(p => p.statut === 'Stock critique').length}</p>
  </div>
  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
    <p className="text-sm text-red-600 font-medium">Rupture Stock</p>
    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.ruptureStock}</p>
  </div>
  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
    <p className="text-sm text-yellow-600 font-medium">Stock Faible</p>
    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.stockFaible}</p>
  </div>

</div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un produit..."
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('statut')}
                >
                  <div className="flex items-center">
                    Statut
                    {sortField === 'statut' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="relative group">
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
                      <button
                        onClick={() => setShowImageUpload(product.id)}
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        title="Changer l'image"
                      >
                        <PencilIcon className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{product.libelle}</div>
                      <div className="text-sm text-gray-500">
                        {product.categorie} • {product.uniteMesure}
                      </div>
                      <div className="text-xs text-gray-400">
                        MAJ: {product.derniereMAJ}
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
                      <div className={`font-medium ${getStockColor(product.quantiteStock, product.seuilMinimum)}`}>
                        {product.quantiteStock >= 0 ? product.quantiteStock : '∞'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Seuil: {product.seuilMinimum}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            product.quantiteStock > product.seuilMinimum ? 'bg-green-500' :
                            product.quantiteStock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${product.quantiteStock >= 0 ? 
                              Math.min((product.quantiteStock / (product.seuilMinimum * 2)) * 100, 100) : 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.statut)}`}>
                      {product.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowPriceUpdate(product.id)}
                          className="flex-1 p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                          title="Modifier le prix"
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDiscountModal(product.id)}
                          className="flex-1 p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center"
                          title="Appliquer une remise"
                        >
                          <TagIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="w-full p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Modal Ajout Produit */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Nouveau Produit</h2>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colonne gauche - Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image du produit
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                    <div className="space-y-1 text-center">
                      {newProduct.imagePreview ? (
                        <div className="relative">
                          <img
                            src={newProduct.imagePreview}
                            alt="Preview"
                            className="mx-auto h-48 w-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setNewProduct({...newProduct, imagePreview: null, imageFile: null})}
                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                              <span>Télécharger une image</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleNewProductImageUpload}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colonne droite - Formulaire */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Libellé du produit *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newProduct.libelle}
                      onChange={(e) => setNewProduct({...newProduct, libelle: e.target.value})}
                      placeholder="Ex: Ordinateur Portable Pro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix (dt) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newProduct.prix}
                        onChange={(e) => setNewProduct({...newProduct, prix: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unité de mesure
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newProduct.uniteMesure}
                        onChange={(e) => setNewProduct({...newProduct, uniteMesure: e.target.value})}
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantité en stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newProduct.quantiteStock}
                        onChange={(e) => setNewProduct({...newProduct, quantiteStock: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seuil minimum *
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newProduct.seuilMinimum}
                        onChange={(e) => setNewProduct({...newProduct, seuilMinimum: e.target.value})}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newProduct.categorie}
                      onChange={(e) => setNewProduct({...newProduct, categorie: e.target.value})}
                    >
                      {categories.filter(c => c !== 'Tous').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={!newProduct.libelle || !newProduct.prix || !newProduct.quantiteStock || !newProduct.seuilMinimum}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter le produit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Image */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Changer l'image du produit</h2>
                <button
                  onClick={() => {
                    setShowImageUpload(null);
                    setImageUpload({ file: null, preview: null });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    {imageUpload.preview ? (
                      <img
                        src={imageUpload.preview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Aucune image sélectionnée</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <span>Sélectionner une image</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  Formats supportés: JPG, PNG, GIF. Taille max: 5MB
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => {
                    setShowImageUpload(null);
                    setImageUpload({ file: null, preview: null });
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateImage}
                  disabled={!imageUpload.file}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mettre à jour l'image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mise à jour Prix */}
      {showPriceUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Modifier le prix</h2>
                <button
                  onClick={() => setShowPriceUpdate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau prix (dt) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={priceUpdate.nouveauPrix}
                    onChange={(e) => setPriceUpdate({...priceUpdate, nouveauPrix: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du changement
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    value={priceUpdate.raison}
                    onChange={(e) => setPriceUpdate({...priceUpdate, raison: e.target.value})}
                    placeholder="Ex: Mise à jour tarifaire, promotion..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowPriceUpdate(null)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdatePrice}
                  disabled={!priceUpdate.nouveauPrix}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Application Remise */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Appliquer une remise</h2>
                <button
                  onClick={() => setShowDiscountModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pourcentage de remise (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max="100"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={discountData.pourcentage}
                    onChange={(e) => setDiscountData({...discountData, pourcentage: e.target.value})}
                    placeholder="Ex: 15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={discountData.dateDebut}
                      onChange={(e) => setDiscountData({...discountData, dateDebut: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={discountData.dateFin}
                      onChange={(e) => setDiscountData({...discountData, dateFin: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowDiscountModal(null)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleApplyDiscount}
                  disabled={!discountData.pourcentage}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Appliquer la remise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;