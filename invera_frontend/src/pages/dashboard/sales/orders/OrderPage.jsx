import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const OrdersPage = () => {
  // État initial des commandes (simulé depuis localStorage ou API)
  const [commandes, setCommandes] = useState([]);
  
  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedClient, setSelectedClient] = useState('Tous');
  const [sortField, setSortField] = useState('dateCreation');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // États pour la modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  
  // États pour la nouvelle commande
  const [nouvelleCommande, setNouvelleCommande] = useState({
    client: '',
    produits: [],
    remarques: ''
  });
  
  // Données simulées
  const [clients, setClients] = useState([
    { id: 1, nom: 'SARL TechSolutions', type: 'Entreprise', telephone: '71 123 456' },
    { id: 2, nom: 'Mohamed Ben Ali', type: 'Standard', telephone: '98 765 432' },
    { id: 3, nom: 'Société Générale', type: 'Fidèle', telephone: '70 111 222' },
    { id: 4, nom: 'Ahmed Ben Salah', type: 'VIP', telephone: '97 888 999' },
    { id: 5, nom: 'Boutique El Medina', type: 'Professionnel', telephone: '72 333 444' }
  ]);

  const [produits, setProduits] = useState([
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
  ]);

  // Fonction pour normaliser les données (convertir les chaînes en nombres)
  const normaliserCommandes = (commandesData) => {
    return commandesData.map(commande => ({
      ...commande,
      sousTotal: parseFloat(commande.sousTotal) || 0,
      remise: parseFloat(commande.remise) || 0,
      total: parseFloat(commande.total) || 0,
      produits: commande.produits?.map(produit => ({
        ...produit,
        prix: parseFloat(produit.prix) || 0,
        sousTotal: parseFloat(produit.sousTotal) || 0,
        quantite: parseInt(produit.quantite) || 1
      })) || []
    }));
  };

  // Charger les commandes depuis localStorage au démarrage
  useEffect(() => {
    const commandesSauvegardees = localStorage.getItem('commandes');
    
    if (commandesSauvegardees) {
      try {
        const parsedCommandes = JSON.parse(commandesSauvegardees);
        const commandesNormalisees = normaliserCommandes(parsedCommandes);
        setCommandes(commandesNormalisees);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        // Initialiser avec des données par défaut
        initialiserCommandesParDefaut();
      }
    } else {
      initialiserCommandesParDefaut();
    }
  }, []);

  // Fonction pour initialiser avec des données par défaut
  const initialiserCommandesParDefaut = () => {
    const commandesInitiales = [
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
      },
      {
        id: 3,
        numero: 'CMD003-2026',
        client: { id: 4, nom: 'Ahmed Ben Salah', type: 'VIP' },
        dateCreation: '2026-01-20',
        dateLivraisonPrevue: '2026-01-27',
        produits: [
          { id: 1, libelle: 'Ordinateur Portable Pro', quantite: 1, prix: 1299.99, sousTotal: 1299.99 },
          { id: 2, libelle: 'Smartphone Premium', quantite: 2, prix: 899.99, sousTotal: 1799.98 }
        ],
        sousTotal: 3099.97,
        remise: 619.99,
        total: 2479.98,
        statut: 'Refusé',
        remarques: 'Client a annulé'
      },
      {
        id: 4,
        numero: 'CMD004-2026',
        client: { id: 3, nom: 'Société Générale', type: 'Fidèle' },
        dateCreation: '2026-01-22',
        dateLivraisonPrevue: '2026-01-29',
        produits: [
          { id: 1, libelle: 'Ordinateur Portable Pro', quantite: 10, prix: 1299.99, sousTotal: 12999.90 },
          { id: 2, libelle: 'Smartphone Premium', quantite: 15, prix: 899.99, sousTotal: 13499.85 }
        ],
        sousTotal: 26499.75,
        remise: 3974.96,
        total: 22524.79,
        statut: 'Confirmé',
        remarques: 'Commande importante'
      }
    ];
    
    const commandesNormalisees = normaliserCommandes(commandesInitiales);
    setCommandes(commandesNormalisees);
    localStorage.setItem('commandes', JSON.stringify(commandesNormalisees));
  };

  // Générer un numéro de commande unique
  const genererNumeroCommande = () => {
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
    return `CMD${nouveauNum}-${annee}${mois}${jour}`;
  };

  // Filtrer et trier les commandes
  const filteredCommandes = commandes
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
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });

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
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'Confirmé': return <CheckCircleIcon className="h-5 w-5" />;
      case 'En attente': return <ClockIcon className="h-5 w-5" />;
      case 'Refusé': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  // Fonction utilitaire pour convertir en nombre
  const toNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Valider une commande
  const handleValiderCommande = (commandeId) => {
    const commandesMaj = commandes.map(commande => {
      if (commande.id === commandeId) {
        // Vérifier la disponibilité des produits
        const produitsDisponibles = commande.produits.every(produit => {
          const produitStock = produits.find(p => p.id === produit.id);
          return produitStock && produitStock.quantiteStock >= toNumber(produit.quantite);
        });

        if (!produitsDisponibles) {
          alert('Stock insuffisant pour certains produits');
          return commande;
        }

        // Réserver le stock
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
    alert('Commande validée avec succès ! Stock réservé.');
  };

  // Rejeter une commande
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

  // Voir les détails d'une commande
  const handleVoirDetails = (commande) => {
    setSelectedCommande(commande);
    setShowDetailModal(true);
  };

  // Ajouter un produit à la nouvelle commande
  const handleAjouterProduit = (produit) => {
    const produitExistantIndex = nouvelleCommande.produits.findIndex(p => p.id === produit.id);
    
    if (produitExistantIndex !== -1) {
      const nouveauxProduits = [...nouvelleCommande.produits];
      nouveauxProduits[produitExistantIndex].quantite += 1;
      setNouvelleCommande({...nouvelleCommande, produits: nouveauxProduits});
    } else {
      setNouvelleCommande({
        ...nouvelleCommande,
        produits: [...nouvelleCommande.produits, {
          ...produit,
          quantite: 1,
          sousTotal: toNumber(produit.prix)
        }]
      });
    }
  };

  // Modifier la quantité d'un produit
  const handleModifierQuantite = (produitId, nouvelleQuantite) => {
    const nouveauxProduits = nouvelleCommande.produits.map(p => {
      if (p.id === produitId) {
        const quantite = Math.max(1, toNumber(nouvelleQuantite));
        return {
          ...p,
          quantite,
          sousTotal: toNumber(p.prix) * quantite
        };
      }
      return p;
    });
    
    setNouvelleCommande({...nouvelleCommande, produits: nouveauxProduits});
  };

  // Supprimer un produit de la nouvelle commande
  const handleSupprimerProduit = (produitId) => {
    const nouveauxProduits = nouvelleCommande.produits.filter(p => p.id !== produitId);
    setNouvelleCommande({...nouvelleCommande, produits: nouveauxProduits});
  };

  // Créer une nouvelle commande
  const handleCreerCommande = () => {
    if (!nouvelleCommande.client || nouvelleCommande.produits.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un produit');
      return;
    }

    const clientSelectionne = clients.find(c => c.id === parseInt(nouvelleCommande.client));
    
    // Calculer les totaux
    const sousTotal = nouvelleCommande.produits.reduce((sum, p) => sum + toNumber(p.sousTotal), 0);
    const total = sousTotal; // Pour l'instant pas de remise
    
    const nouvelleCommandeObj = {
      id: Date.now(),
      numero: genererNumeroCommande(),
      client: clientSelectionne,
      dateCreation: new Date().toISOString().split('T')[0],
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

    // Réinitialiser le formulaire
    setNouvelleCommande({
      client: '',
      produits: [],
      remarques: ''
    });
    
    setShowCreateModal(false);
    alert('Commande créée avec succès !');
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
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

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par numéro de commande ou client..."
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="Tous">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="Confirmé">Confirmé</option>
                <option value="Refusé">Refusé</option>
                <option value="Livré">Livré</option>
                <option value="En préparation">En préparation</option>
              </select>
            </div>
            
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="Tous">Tous les clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.nom}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('Tous');
                setSelectedClient('Tous');
              }}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des commandes */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('numero')}
                >
                  <div className="flex items-center">
                    N° Commande
                    {sortField === 'numero' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                        <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center">
                    Client
                    {sortField === 'client' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                        <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dateCreation')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'dateCreation' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                        <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produits
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    Montant
                    {sortField === 'total' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                        <ChevronDownIcon className="ml-1 h-4 w-4" />
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
                        <ChevronUpIcon className="ml-1 h-4 w-4" /> : 
                        <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommandes.map((commande) => (
                <tr key={commande.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-600">{commande.numero}</div>
                    <div className="text-sm text-gray-500">
                      Livraison: {commande.dateLivraisonPrevue}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{commande.client?.nom || 'Client inconnu'}</div>
                    <div className="text-sm text-gray-500">{commande.client?.type || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{commande.dateCreation}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {commande.produits?.length || 0} produit(s)
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">
                      {(commande.produits || []).map(p => p.libelle).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                      {toNumber(commande.total).toFixed(2)} dt
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="line-through">{toNumber(commande.sousTotal).toFixed(2)} dt</span>
                      {toNumber(commande.remise) > 0 && (
                        <span className="text-red-600 ml-2">-{toNumber(commande.remise).toFixed(2)} dt</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(commande.statut)}`}>
                      {getStatusIcon(commande.statut)}
                      <span className="ml-1.5">{commande.statut}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVoirDetails(commande)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                     
                      
                      {commande.statut === 'En attente' && (
                        <>
                          <button
                            onClick={() => handleValiderCommande(commande.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Valider"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleRejeterCommande(commande.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Rejeter"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
              
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCommandes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 text-gray-300">📋</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* Modal Création de Commande */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Créer une Nouvelle Commande</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sélection Client */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionner un client *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nouvelleCommande.client}
                        onChange={(e) => setNouvelleCommande({...nouvelleCommande, client: e.target.value})}
                      >
                        <option value="">Choisir un client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.nom} ({client.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {nouvelleCommande.client && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-2">Client sélectionné</h4>
                        <div className="text-sm text-gray-600">
                          {clients.find(c => c.id === parseInt(nouvelleCommande.client))?.nom}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Téléphone: {clients.find(c => c.id === parseInt(nouvelleCommande.client))?.telephone}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarques
                      </label>
                      <textarea
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="4"
                        value={nouvelleCommande.remarques}
                        onChange={(e) => setNouvelleCommande({...nouvelleCommande, remarques: e.target.value})}
                        placeholder="Instructions spéciales, préférences..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sélection Produits */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border">
                    <div className="p-6 border-b">
                      <h3 className="font-bold text-gray-800 mb-4">Produits à commander</h3>
                      
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Rechercher un produit..."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute left-3 top-3 text-gray-400">
                          <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2">
                        {produits.map(produit => (
                          <div key={produit.id} className="border rounded-lg p-3 hover:border-blue-300 hover:bg-blue-25 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">{produit.libelle}</div>
                                <div className="text-sm text-gray-600">{produit.categorie}</div>
                                <div className="text-sm text-green-600 mt-1">
                                  Stock: {produit.quantiteStock} {produit.uniteMesure}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">{produit.prix.toFixed(2)} dt</div>
                                <button
                                  onClick={() => handleAjouterProduit(produit)}
                                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                  Ajouter
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Produits sélectionnés */}
                    <div className="p-6">
                      <h4 className="font-bold text-gray-800 mb-4">
                        Produits sélectionnés ({nouvelleCommande.produits.length})
                      </h4>
                      
                      {nouvelleCommande.produits.length > 0 ? (
                        <div className="space-y-3">
                          {nouvelleCommande.produits.map(produit => (
                            <div key={produit.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{produit.libelle}</div>
                                <div className="text-sm text-gray-600">
                                  {toNumber(produit.prix).toFixed(2)} dt / {produit.uniteMesure}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center border rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => handleModifierQuantite(produit.id, produit.quantite - 1)}
                                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max={produit.quantiteStock}
                                    value={produit.quantite}
                                    onChange={(e) => handleModifierQuantite(produit.id, parseInt(e.target.value) || 1)}
                                    className="w-16 text-center py-1.5 border-x"
                                  />
                                  <button
                                    onClick={() => handleModifierQuantite(produit.id, produit.quantite + 1)}
                                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                <div className="font-bold text-blue-600 min-w-20 text-right">
                                  {toNumber(produit.sousTotal).toFixed(2)} dt
                                </div>
                                
                                <button
                                  onClick={() => handleSupprimerProduit(produit.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Total */}
                          <div className="mt-6 pt-4 border-t">
                            <div className="flex justify-between text-lg font-bold text-gray-800">
                              <span>Total</span>
                              <span>
                                {nouvelleCommande.produits
                                  .reduce((sum, p) => sum + toNumber(p.sousTotal), 0)
                                  .toFixed(2)} dt
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Aucun produit sélectionné. Ajoutez des produits depuis la liste ci-dessus.
                        </div>
                      )}
                      
                      {/* Boutons */}
                      <div className="mt-6 flex justify-end space-x-4">
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleCreerCommande}
                          disabled={!nouvelleCommande.client || nouvelleCommande.produits.length === 0}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Créer la Commande
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Commande */}
      {showDetailModal && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Détails de la Commande</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Informations Commande</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Numéro</div>
                      <div className="font-medium text-gray-900">{selectedCommande.numero}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Date création</div>
                      <div className="font-medium text-gray-900">{selectedCommande.dateCreation}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Livraison prévue</div>
                      <div className="font-medium text-gray-900">{selectedCommande.dateLivraisonPrevue}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Statut</div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCommande.statut)}`}>
                        {getStatusIcon(selectedCommande.statut)}
                        <span className="ml-1.5">{selectedCommande.statut}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Client</div>
                      <div className="font-medium text-gray-900">{selectedCommande.client?.nom || 'Client inconnu'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Type</div>
                      <div className="font-medium text-gray-900">{selectedCommande.client?.type || ''}</div>
                    </div>
                    {selectedCommande.remarques && (
                      <div>
                        <div className="text-sm text-gray-600">Remarques</div>
                        <div className="font-medium text-gray-900">{selectedCommande.remarques}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Détails des produits */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-4">Produits commandés</h3>
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
                      {(selectedCommande.produits || []).map(produit => (
                        <tr key={produit.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{produit.libelle}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-900">{toNumber(produit.quantite)}</td>
                          <td className="px-4 py-3 text-gray-900">{toNumber(produit.prix).toFixed(2)} dt</td>
                          <td className="px-4 py-3 font-medium text-blue-600">
                            {toNumber(produit.sousTotal).toFixed(2)} dt
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Récapitulatif financier</h3>
                <div className="space-y-3 max-w-md ml-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{toNumber(selectedCommande.sousTotal).toFixed(2)} dt</span>
                  </div>
                  {toNumber(selectedCommande.remise) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remise</span>
                      <span className="font-medium text-red-600">-{toNumber(selectedCommande.remise).toFixed(2)} dt</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="text-xl font-bold text-blue-600">
                        {toNumber(selectedCommande.total).toFixed(2)} dt
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;