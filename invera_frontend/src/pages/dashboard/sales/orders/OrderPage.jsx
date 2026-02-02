// src/pages/dashboard/sales/orders/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import OrderFilters from './components/OrderFilters';
import OrderTable from './components/OrderTable';
import CreateOrderModal from './components/CreateOrderModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import { 
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const OrdersPage = () => {
  // Données initiales
  const initialClients = [
    { id: 1, nom: 'SARL TechSolutions', type: 'Entreprise', telephone: '71 123 456' },
    { id: 2, nom: 'Mohamed Ben Ali', type: 'Standard', telephone: '98 765 432' },
    { id: 3, nom: 'Société Générale', type: 'Fidèle', telephone: '70 111 222' },
    { id: 4, nom: 'Ahmed Ben Salah', type: 'VIP', telephone: '97 888 999' },
    { id: 5, nom: 'Boutique El Medina', type: 'Professionnel', telephone: '72 333 444' }
  ];

  const initialProduits = [
    {
      id: 1,
      libelle: 'Ordinateur Portable Pro',
      prix: 1299.99,
      quantiteStock: 45,
      uniteMesure: 'unité',
      categorie: 'Électronique'
    },
    {
      id: 2,
      libelle: 'Smartphone Premium',
      prix: 899.99,
      quantiteStock: 120,
      uniteMesure: 'unité',
      categorie: 'Électronique'
    },
    {
      id: 3,
      libelle: 'Chaise de Bureau Ergonomique',
      prix: 249.99,
      quantiteStock: 32,
      uniteMesure: 'unité',
      categorie: 'Bureau'
    }
  ];

  const initialCommandes = [
    {
      id: 1,
      numero: 'CMD001-2026',
      client: { id: 1, nom: 'SARL TechSolutions', type: 'Entreprise' },
      dateCreation: '2026-01-15',
      dateLivraisonPrevue: '2026-01-22',
      produits: [
        { id: 1, libelle: 'Ordinateur Portable Pro', quantite: 2, prix: 1299.99, sousTotal: 2599.98 },
        { id: 2, libelle: 'Smartphone Premium', quantite: 5, prix: 899.99, sousTotal: 4499.95 }
      ],
      sousTotal: 7099.93,
      remise: 709.99,
      total: 6389.94,
      statut: 'Confirmé',
      remarques: 'Livraison urgente demandée'
    },
    {
      id: 2,
      numero: 'CMD002-2026',
      client: { id: 2, nom: 'Mohamed Ben Ali', type: 'Standard' },
      dateCreation: '2026-01-18',
      dateLivraisonPrevue: '2026-01-25',
      produits: [
        { id: 3, libelle: 'Chaise de Bureau Ergonomique', quantite: 3, prix: 249.99, sousTotal: 749.97 }
      ],
      sousTotal: 749.97,
      remise: 0,
      total: 749.97,
      statut: 'En attente',
      remarques: ''
    }
  ];

  // États
  const [commandes, setCommandes] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedClient, setSelectedClient] = useState('Tous');
  const [sortField, setSortField] = useState('dateCreation');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [clients, setClients] = useState(initialClients);
  const [produits, setProduits] = useState(initialProduits);
  const [nouvelleCommande, setNouvelleCommande] = useState({
    client: '',
    produits: [],
    remarques: ''
  });

  // Fonction utilitaire
  const toNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fonction pour normaliser les données
  const normaliserCommandes = (commandesData) => {
    return commandesData.map(commande => ({
      ...commande,
      sousTotal: toNumber(commande.sousTotal),
      remise: toNumber(commande.remise),
      total: toNumber(commande.total),
      produits: commande.produits?.map(produit => ({
        ...produit,
        prix: toNumber(produit.prix),
        sousTotal: toNumber(produit.sousTotal),
        quantite: toNumber(produit.quantite)
      })) || []
    }));
  };

  // Charger les commandes au démarrage
  useEffect(() => {
    const commandesSauvegardees = localStorage.getItem('commandes');
    
    if (commandesSauvegardees) {
      try {
        const parsedCommandes = JSON.parse(commandesSauvegardees);
        const commandesNormalisees = normaliserCommandes(parsedCommandes);
        setCommandes(commandesNormalisees);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        const commandesNormalisees = normaliserCommandes(initialCommandes);
        setCommandes(commandesNormalisees);
      }
    } else {
      const commandesNormalisees = normaliserCommandes(initialCommandes);
      setCommandes(commandesNormalisees);
    }
  }, []);

  // Filtrer les commandes
  useEffect(() => {
    const filtered = commandes
      .filter(commande => {
        const matchesSearch = 
          commande.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          commande.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'Tous' || commande.statut === selectedStatus;
        const matchesClient = selectedClient === 'Tous' || commande.client?.id === parseInt(selectedClient);
        
        return matchesSearch && matchesStatus && matchesClient;
      })
      .sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (sortField === 'dateCreation' || sortField === 'dateLivraisonPrevue') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortField === 'client') {
          aValue = a.client?.nom || '';
          bValue = b.client?.nom || '';
        }
        
        if (sortField === 'total' || sortField === 'sousTotal') {
          aValue = toNumber(aValue);
          bValue = toNumber(bValue);
        }
        
        return sortDirection === 'asc' 
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      });
    
    setFilteredCommandes(filtered);
  }, [commandes, searchTerm, selectedStatus, selectedClient, sortField, sortDirection]);

  // Fonctions de gestion des commandes
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleValiderCommande = (commandeId) => {
    const commandesMaj = commandes.map(commande => {
      if (commande.id === commandeId) {
        // Vérifier la disponibilité
        const produitsDisponibles = commande.produits.every(produit => {
          const produitStock = produits.find(p => p.id === produit.id);
          return produitStock && produitStock.quantiteStock >= toNumber(produit.quantite);
        });

        if (!produitsDisponibles) {
          alert('Stock insuffisant pour certains produits');
          return commande;
        }

        // Mettre à jour le stock
        const nouveauxProduits = [...produits];
        commande.produits.forEach(produitCmd => {
          const index = nouveauxProduits.findIndex(p => p.id === produitCmd.id);
          if (index !== -1) {
            nouveauxProduits[index].quantiteStock -= toNumber(produitCmd.quantite);
          }
        });

        setProduits(nouveauxProduits);

        return {
          ...commande,
          statut: 'Confirmé',
          dateValidation: new Date().toISOString().split('T')[0]
        };
      }
      return commande;
    });

    setCommandes(commandesMaj);
    localStorage.setItem('commandes', JSON.stringify(commandesMaj));
    alert('Commande validée avec succès !');
  };

  const handleRejeterCommande = (commandeId) => {
    const commandesMaj = commandes.map(commande => 
      commande.id === commandeId 
        ? { ...commande, statut: 'Refusé' }
        : commande
    );

    setCommandes(commandesMaj);
    localStorage.setItem('commandes', JSON.stringify(commandesMaj));
    alert('Commande rejetée.');
  };

  const handleVoirDetails = (commande) => {
    setSelectedCommande(commande);
    setShowDetailModal(true);
  };

  const handleCreerCommande = () => {
    if (!nouvelleCommande.client || nouvelleCommande.produits.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un produit');
      return;
    }

    const clientSelectionne = clients.find(c => c.id === parseInt(nouvelleCommande.client));
    
    // Générer numéro de commande
    const date = new Date();
    const annee = date.getFullYear();
    const mois = (date.getMonth() + 1).toString().padStart(2, '0');
    const jour = date.getDate().toString().padStart(2, '0');
    const dernierNum = commandes.length > 0 
      ? Math.max(...commandes.map(c => {
          const match = c.numero?.match(/CMD(\d+)-/);
          return match ? parseInt(match[1]) || 0 : 0;
        }))
      : 0;
    const nouveauNum = (dernierNum + 1).toString().padStart(3, '0');
    const numeroCommande = `CMD${nouveauNum}-${annee}${mois}${jour}`;
    
    // Calculer les totaux
    const sousTotal = nouvelleCommande.produits.reduce((sum, p) => sum + toNumber(p.sousTotal), 0);
    const total = sousTotal;

    const nouvelleCommandeObj = {
      id: Date.now(),
      numero: numeroCommande,
      client: clientSelectionne,
      dateCreation: date.toISOString().split('T')[0],
      dateLivraisonPrevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      produits: nouvelleCommande.produits.map(p => ({
        id: p.id,
        libelle: p.libelle,
        quantite: toNumber(p.quantite),
        prix: toNumber(p.prix),
        sousTotal: toNumber(p.sousTotal)
      })),
      sousTotal: sousTotal,
      remise: 0,
      total: total,
      statut: 'En attente',
      remarques: nouvelleCommande.remarques
    };

    const nouvellesCommandes = [...commandes, nouvelleCommandeObj];
    setCommandes(nouvellesCommandes);
    localStorage.setItem('commandes', JSON.stringify(nouvellesCommandes));

    // Réinitialiser
    setNouvelleCommande({
      client: '',
      produits: [],
      remarques: ''
    });
    
    setShowCreateModal(false);
    alert('Commande créée avec succès !');
  };

  // Fonctions pour les icônes et couleurs
  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'Confirmé': return <CheckCircleIcon className="h-5 w-5" />;
      case 'En attente': return <ClockIcon className="h-5 w-5" />;
      case 'Refusé': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des Commandes Clients</h1>
            <p className="text-gray-600 mt-2">Consultez et gérez toutes les commandes clients</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvelle Commande
            </button>
          </div>
        </div>

        <OrderFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          clients={clients}
          onReset={() => {
            setSearchTerm('');
            setSelectedStatus('Tous');
            setSelectedClient('Tous');
          }}
        />
      </div>

      {/* Tableau */}
      <OrderTable
        commandes={filteredCommandes}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onValider={handleValiderCommande}
        onRejeter={handleRejeterCommande}
        onVoirDetails={handleVoirDetails}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        toNumber={toNumber}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          clients={clients}
          produits={produits}
          nouvelleCommande={nouvelleCommande}
          setNouvelleCommande={setNouvelleCommande}
          onCreerCommande={handleCreerCommande}
          toNumber={toNumber}
        />
      )}

      {showDetailModal && selectedCommande && (
        <OrderDetailsModal
          show={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          commande={selectedCommande}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          toNumber={toNumber}
        />
      )}
    </div>
  );
};

export default OrdersPage;