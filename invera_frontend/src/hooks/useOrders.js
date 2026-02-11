// src/pages/dashboard/sales/orders/hooks/useOrders.js
import { useState, useCallback, useMemo } from 'react';
import { commandeService } from '../services/commandeService';
import clientService from '../services/clientService'; 
import productService from '../services/productService'; 

const useOrders = () => {
  // États principaux
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour la création de commande
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // Fonction utilitaire
  const toNumber = useCallback((value) => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }, []);

  // Fonctions de transformation
  const getStatutDisplay = useCallback((statut) => {
    switch(statut?.toUpperCase()) {
      case 'CONFIRMEE': 
      case 'CONFIRMÉ': 
      case 'VALIDEE': 
      case 'VALIDÉ': 
        return 'Confirmé';
      case 'EN_ATTENTE': 
      case 'EN ATTENTE': 
      case 'PENDING': 
        return 'En attente';
      case 'ANNULEE': 
      case 'ANNULÉ': 
      case 'REFUSEE': 
      case 'REJECTED': 
        return 'Refusé';
      case 'LIVREE': 
      case 'DELIVERED': 
        return 'Livrée';
      default: 
        return statut || 'En attente';
    }
  }, []);

  // ✅ CORRIGÉ - getProduitsAvecDetails
  const getProduitsAvecDetails = useCallback((produitsMap, produitsData) => {
    console.log('🔍 getProduitsAvecDetails appelée');
    
    // CAS 1: produitsMap est déjà un tableau
    if (Array.isArray(produitsMap)) {
      console.log('✅ produitsMap est déjà un tableau');
      return produitsMap.map(p => ({
        id: p.id,
        produitId: p.id,
        libelle: p.libelle,  // ✅ Ne pas mettre de fallback ici
        prixUnitaire: toNumber(p.prixUnitaire || p.prix || 0),
        quantite: toNumber(p.quantite || 1),
        sousTotal: toNumber(p.sousTotal || 0),
        totalLigne: toNumber(p.totalLigne || p.sousTotal || 0),
        categorie: p.categorie,
        imageUrl: p.imageUrl,
        quantiteStock: toNumber(p.quantiteStock || 0),
        statutStock: p.statutStock || 'DISPONIBLE',
        uniteMesure: p.uniteMesure
      }));
    }
    
    // CAS 2: produitsMap est une Map {produitId: quantite}
    if (produitsMap && typeof produitsMap === 'object' && !Array.isArray(produitsMap)) {
      console.log('🔄 Conversion Map -> Tableau');
      
      return Object.entries(produitsMap).map(([produitId, quantite]) => {
        const produitIdNum = parseInt(produitId);
        const produit = produitsData?.find(p => 
          p.id === produitIdNum || p.idProduit === produitIdNum
        );
        
        if (produit) {
          return {
            id: produitIdNum,
            produitId: produitIdNum,
            libelle: produit.libelle,  // ✅ Ne pas mettre de fallback
            prixUnitaire: toNumber(produit.prix || produit.prixVente || 0),
            quantite: toNumber(quantite),
            sousTotal: toNumber(produit.prix || produit.prixVente || 0) * toNumber(quantite),
            categorie: produit.categorie,
            imageUrl: produit.image || produit.imageUrl,
            quantiteStock: toNumber(produit.quantiteStock || 0),
            statutStock: produit.status || produit.statut || 'DISPONIBLE',
            uniteMesure: produit.uniteMesure
          };
        } else {
          return {
            id: produitIdNum,
            produitId: produitIdNum,
            libelle: null,  // ✅ null pour utiliser le fallback dans le composant
            prixUnitaire: 0,
            quantite: toNumber(quantite),
            sousTotal: 0,
            categorie: null,
            imageUrl: null,
            quantiteStock: 0,
            statutStock: 'INCONNU',
            uniteMesure: null
          };
        }
      });
    }
    
    return [];
  }, [toNumber]);

  // ✅ CORRIGÉ - transformCommandes
  const transformCommandes = useCallback((commandesData, produitsData) => {
    if (!Array.isArray(commandesData)) {
      return [];
    }
    
    return commandesData.map((commande) => {
      if (!commande) return null;
      
      // ✅ LOG DE DEBUG
      if (commande.produits && Array.isArray(commande.produits) && commande.produits.length > 0) {
        console.log(`📦 Commande ${commande.id} - Produits reçus du backend:`, 
          commande.produits.map(p => ({
            id: p.id,
            libelle: p.libelle,
            imageUrl: p.imageUrl,
            categorie: p.categorie,
            prixUnitaire: p.prixUnitaire
          }))
        );
      }
      
      const clientNom = commande.client?.nom || 
                       `${commande.client?.prenom || ''} ${commande.client?.nom || ''}`.trim() ||
                       'Client inconnu';
      
      const clientId = commande.client?.id || commande.clientId;
      const clientType = commande.client?.type || 'STANDARD';
      
      // ✅ TRANSFORMATION DES PRODUITS - SANS ÉCRASER LES DONNÉES
      let produitsTransformes = [];
      
      if (commande.produits && Array.isArray(commande.produits)) {
        produitsTransformes = commande.produits.map(p => ({
          // ✅ Identifiants
          id: p.id || p.produitId,
          produitId: p.id || p.produitId,
          
          // ✅ DONNÉES PRODUIT - Garder les valeurs du backend, même null/undefined
          libelle: p.libelle,                    // ← NE PAS METTRE DE FALLBACK
          categorie: p.categorie,
          imageUrl: p.imageUrl,
          uniteMesure: p.uniteMesure,
          code: p.code || p.reference,
          
          // ✅ Prix et quantités
          prixUnitaire: toNumber(p.prixUnitaire || p.prix || 0),
          prix: toNumber(p.prixUnitaire || p.prix || 0),
          quantite: toNumber(p.quantite || 1),
          sousTotal: toNumber(p.sousTotal || 0),
          totalLigne: toNumber(p.totalLigne || p.sousTotal || 0),
          
          // ✅ Remises
          remiseProduit: toNumber(p.remiseProduit || 0),
          tauxRemiseProduit: toNumber(p.tauxRemiseProduit || 0),
          
          // ✅ Stock
          quantiteStock: toNumber(p.quantiteStock || 0),
          statutStock: p.statutStock || 'DISPONIBLE'
        }));
      } else if (commande.produits && typeof commande.produits === 'object') {
        produitsTransformes = getProduitsAvecDetails(commande.produits, produitsData);
      }
      
      return {
        id: commande.id || commande.idCommande,
        numero: commande.numeroCommande || `CMD-${commande.id}`,
        numeroCommande: commande.numeroCommande || `CMD-${commande.id}`,
        
        client: {
          id: clientId,
          nom: clientNom,
          type: clientType,
          telephone: commande.client?.telephone || '',
          email: commande.client?.email || '',
          adresse: commande.client?.adresse || ''
        },
        
        dateCreation: commande.dateCreation 
          ? new Date(commande.dateCreation).toLocaleDateString('fr-FR')
          : 'Non définie',
        dateLivraisonPrevue: commande.dateLivraison 
          ? new Date(commande.dateLivraison).toLocaleDateString('fr-FR')
          : 'Non définie',
        
        produits: produitsTransformes,
        
        sousTotal: toNumber(commande.sousTotal || 0),
        remise: toNumber(commande.montantRemise || 0),
        montantRemise: toNumber(commande.montantRemise || 0),
        tauxRemise: toNumber(commande.tauxRemise || 0),
        total: toNumber(commande.total || 0),
        
        statut: getStatutDisplay(commande.statut),
        statutOriginal: commande.statut,
        
        remarques: commande.notes || commande.remarques || '',
        notes: commande.notes || commande.remarques || ''
      };
    }).filter(Boolean);
  }, [getProduitsAvecDetails, getStatutDisplay, toNumber]);

  // ✅ transformClients (inchangé)
  const transformClients = useCallback((clientsData) => {
    if (!Array.isArray(clientsData)) {
      if (clientsData && clientsData.clients && Array.isArray(clientsData.clients)) {
        clientsData = clientsData.clients;
      } else {
        return [];
      }
    }
    
    return clientsData.map(client => ({
      id: client.id,
      nom: client.nom || client.name || `Client ${client.id}`,
      prenom: client.prenom || client.firstName || '',
      nomComplet: `${client.prenom || client.firstName || ''} ${client.nom || client.name || ''}`.trim(),
      type: client.type || client.typeClient || client.clientType || 'STANDARD',
      telephone: client.telephone || client.phone || client.phoneNumber || '',
      email: client.email || client.mail || '',
      adresse: client.adresse || client.address || client.adresseComplete || '',
      ville: client.ville || client.city || ''
    }));
  }, []);

  // ✅ transformProduits (inchangé)
  const transformProduits = useCallback((produitsData) => {
    if (!Array.isArray(produitsData)) {
      if (produitsData && produitsData.produits && Array.isArray(produitsData.produits)) {
        produitsData = produitsData.produits;
      } else if (produitsData && produitsData.products && Array.isArray(produitsData.products)) {
        produitsData = produitsData.products;
      } else if (produitsData && produitsData.items && Array.isArray(produitsData.items)) {
        produitsData = produitsData.items;
      } else if (produitsData && produitsData.data && Array.isArray(produitsData.data)) {
        produitsData = produitsData.data;
      } else {
        return [];
      }
    }
    
    return produitsData.map(produit => {
      const produitId = produit.id || produit.idProduit || produit.productId;
      
      return {
        id: produitId,
        idProduit: produit.idProduit,
        libelle: produit.libelle || produit.nom || produit.name || produit.label || `Produit ${produitId}`,
        description: produit.description || '',
        prix: toNumber(produit.prixVente || produit.prix || produit.price || produit.sellingPrice || 0),
        prixAchat: toNumber(produit.prixAchat || produit.costPrice || produit.purchasePrice || 0),
        quantiteStock: toNumber(produit.quantiteStock || produit.stock || produit.quantity || produit.availableStock || 0),
        uniteMesure: produit.uniteMesure || produit.unit || produit.unitMeasure || 'unité',
        categorie: produit.categorie || produit.category || 'Non catégorisé',
        code: produit.code || produit.reference || produit.sku || '',
        image: produit.image || produit.imageUrl || '',
        estActif: produit.estActif !== false
      };
    });
  }, [toNumber]);

  // ✅ chargerDonnees (inchangé)
  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [commandesResult, clientsResult, produitsResult] = await Promise.allSettled([
        commandeService.getAllCommandes(),
        clientService.getAllClients(), 
        productService.getAllProducts()
      ]);

      let commandesData = [];
      let clientsData = [];
      let produitsData = [];

      // Commandes
      if (commandesResult.status === 'fulfilled') {
        const data = commandesResult.value;
        if (Array.isArray(data)) {
          commandesData = data;
        } else if (data && Array.isArray(data.commandes)) {
          commandesData = data.commandes;
        } else if (data && Array.isArray(data.data)) {
          commandesData = data.data;
        } else if (data && Array.isArray(data.orders)) {
          commandesData = data.orders;
        }
      }

      // Clients
      if (clientsResult.status === 'fulfilled') {
        const data = clientsResult.value;
        if (Array.isArray(data)) {
          clientsData = data;
        } else if (data && Array.isArray(data.clients)) {
          clientsData = data.clients;
        } else if (data && Array.isArray(data.data)) {
          clientsData = data.data;
        } else if (data && Array.isArray(data.customers)) {
          clientsData = data.customers;
        }
      }

      // Produits
      if (produitsResult.status === 'fulfilled') {
        const data = produitsResult.value;
        if (Array.isArray(data)) {
          produitsData = data;
        } else if (data && Array.isArray(data.produits)) {
          produitsData = data.produits;
        } else if (data && Array.isArray(data.products)) {
          produitsData = data.products;
        } else if (data && Array.isArray(data.data)) {
          produitsData = data.data;
        } else if (data && Array.isArray(data.items)) {
          produitsData = data.items;
        }
      }

      setCommandes(transformCommandes(commandesData, produitsData));
      setClients(transformClients(clientsData));
      setProduits(transformProduits(produitsData));
      
    } catch (err) {
      setError('Erreur système lors du chargement des données.');
      setClients([]);
      setProduits([]);
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  }, [transformCommandes, transformClients, transformProduits]);

  // ✅ Gestion des produits sélectionnés (inchangé)
  const handleSelectProduct = useCallback((product) => {
    if (!product || (!product.id && !product.idProduit)) return;
    const productId = product.id || product.idProduit;
    
    setSelectedProducts(prev => {
      const exists = prev.some(p => (p.id === productId) || (p.idProduit === productId));
      if (exists) {
        return prev.filter(p => (p.id !== productId) && (p.idProduit !== productId));
      } else {
        return [...prev, { 
          ...product, 
          quantite: 1,
          sousTotal: toNumber(product.prix || product.price)
        }];
      }
    });
  }, [toNumber]);

  const handleModifierQuantite = useCallback((productId, nouvelleQuantite) => {
    setSelectedProducts(prev => 
      prev.map(p => {
        if (p.id === productId || p.idProduit === productId) {
          const quantite = Math.max(1, toNumber(nouvelleQuantite));
          const prix = toNumber(p.prix || p.price);
          return { ...p, quantite, sousTotal: prix * quantite };
        }
        return p;
      })
    );
  }, [toNumber]);

  const handleSupprimerProduit = useCallback((productId) => {
    setSelectedProducts(prev => 
      prev.filter(p => (p.id !== productId) && (p.idProduit !== productId))
    );
  }, []);

  // ✅ Gestion des commandes (inchangé)
  const handleCreerCommande = useCallback(async (commandeData) => {
    try {
      const disponibilite = await commandeService.verifierDisponibilite(commandeData.produits);
      if (!disponibilite.disponible) {
        throw new Error('Stock insuffisant pour certains produits');
      }

      const result = await commandeService.createCommande(commandeData);
      
      if (result.success || result.id || result.commandeId) {
        await chargerDonnees();
        setSelectedProducts([]);
        setSelectedClient(null);
        return result;
      } else {
        throw new Error(result.message || result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      throw error;
    }
  }, [chargerDonnees]);

  const handleValiderCommande = useCallback(async (commandeId) => {
    try {
      const result = await commandeService.validerCommande(commandeId);
      if (result.success || result.statut === 'CONFIRMEE' || result.status === 'CONFIRMED') {
        setCommandes(prev => prev.map(c => 
          c.id === commandeId 
            ? { ...c, statut: 'Confirmé', statutOriginal: 'CONFIRMEE' }
            : c
        ));
        return result;
      }
      throw new Error(result.message || 'Échec de la validation');
    } catch (error) {
      throw error;
    }
  }, []);

  const handleRejeterCommande = useCallback(async (commandeId) => {
    try {
      const result = await commandeService.rejeterCommande(commandeId);
      if (result.success || result.statut === 'ANNULEE' || result.status === 'CANCELLED') {
        setCommandes(prev => prev.map(c => 
          c.id === commandeId 
            ? { ...c, statut: 'Refusé', statutOriginal: 'ANNULEE' }
            : c
        ));
        return result;
      }
      throw new Error(result.message || 'Échec du rejet');
    } catch (error) {
      throw error;
    }
  }, []);

  const handleGetRemise = useCallback(async (typeClient) => {
    try {
      return await commandeService.getRemiseForClientType(typeClient);
    } catch (error) {
      return { 
        success: false, 
        remise: typeClient === 'VIP' ? 10 : typeClient === 'FIDELE' ? 5 : 0,
        message: 'Remise par défaut appliquée'
      };
    }
  }, []);

  const handleVoirDetails = useCallback(async (commandeId) => {
    try {
      return await commandeService.getCommandeDetails(commandeId);
    } catch (error) {
      const commandeLocale = commandes.find(c => c.id === commandeId);
      if (commandeLocale) {
        return { success: true, data: commandeLocale, message: 'Détails depuis le cache local' };
      }
      throw error;
    }
  }, [commandes]);

  const resetSelection = useCallback(() => {
    setSelectedProducts([]);
    setSelectedClient(null);
  }, []);

  const totalSelectedProducts = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + toNumber(p.sousTotal), 0);
  }, [selectedProducts, toNumber]);

  const updateCommandeStatus = useCallback((commandeId, newStatus) => {
    setCommandes(prev => prev.map(c => 
      c.id === commandeId 
        ? { ...c, statut: getStatutDisplay(newStatus), statutOriginal: newStatus }
        : c
    ));
  }, [getStatutDisplay]);

  return {
    commandes,
    clients,
    produits,
    loading,
    error,
    selectedProducts,
    selectedClient,
    totalSelectedProducts,
    setSelectedProducts,
    setSelectedClient,
    setCommandes,
    setError,
    toNumber,
    chargerDonnees,
    resetSelection,
    updateCommandeStatus,
    handleSelectProduct,
    handleModifierQuantite,
    handleSupprimerProduit,
    handleCreerCommande,
    handleValiderCommande,
    handleRejeterCommande,
    handleGetRemise,
    handleVoirDetails
  };
};

export default useOrders;