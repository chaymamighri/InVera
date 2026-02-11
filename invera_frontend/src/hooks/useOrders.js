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

 // CORRECTION de la fonction getProduitsAvecDetails
const getProduitsAvecDetails = useCallback((produitsMap, produitsData) => {
  console.log('🔍 getProduitsAvecDetails appelée');
  console.log('🔍 produitsMap reçu:', produitsMap);
  console.log('🔍 produitsData:', produitsData?.length || 0, 'produits');
  
  // CAS 1: produitsMap est déjà un tableau (venant du backend)
  if (Array.isArray(produitsMap)) {
    console.log('✅ produitsMap est déjà un tableau - retour direct');
    return produitsMap.map(p => ({
      id: p.id,
      libelle: p.libelle || `Produit ${p.id}`,
      prixUnitaire: toNumber(p.prixUnitaire || p.prix || 0),
      quantite: toNumber(p.quantite || 1),
      sousTotal: toNumber(p.sousTotal || 0),
      totalLigne: toNumber(p.totalLigne || p.sousTotal || 0),
      categorie: p.categorie || '',
      imageUrl: p.imageUrl || '',
      quantiteStock: p.quantiteStock || 0,
      statutStock: p.statutStock || 'INCONNU'
    }));
  }
  
  // CAS 2: produitsMap est un objet Map {produitId: quantite}
  if (produitsMap && typeof produitsMap === 'object' && !Array.isArray(produitsMap)) {
    console.log('🔄 Conversion Map -> Tableau');
    
    return Object.entries(produitsMap).map(([produitId, quantite]) => {
      const produitIdNum = parseInt(produitId);
      console.log(`🔍 Traitement produit ID ${produitId}, quantité: ${quantite}`);
      
      // Chercher le produit dans produitsData
      let produit = null;
      if (produitsData && Array.isArray(produitsData)) {
        produit = produitsData.find(p => 
          p.id === produitIdNum || 
          p.idProduit === produitIdNum
        );
      }
      
      if (produit) {
        console.log(`✅ Produit trouvé: ${produit.libelle}`);
        return {
          id: produitIdNum,
          libelle: produit.libelle || `Produit ${produitIdNum}`,
          prixUnitaire: toNumber(produit.prix || produit.prixVente || 0),
          quantite: toNumber(quantite),
          sousTotal: toNumber(produit.prix || produit.prixVente || 0) * toNumber(quantite),
          categorie: produit.categorie || '',
          imageUrl: produit.image || produit.imageUrl || '',
          quantiteStock: produit.quantiteStock || 0,
          statutStock: produit.status || produit.statut || 'INCONNU'
        };
      } else {
        console.log(`⚠️ Produit ${produitIdNum} non trouvé dans produitsData`);
        return {
          id: produitIdNum,
          libelle: `Produit ${produitIdNum}`,
          prixUnitaire: 0,
          quantite: toNumber(quantite),
          sousTotal: 0,
          categorie: '',
          imageUrl: '',
          quantiteStock: 0,
          statutStock: 'INCONNU'
        };
      }
    });
  }
  
  console.log('⚠️ Format produitsMap non reconnu, retour tableau vide');
  return [];
}, [toNumber]);
const transformCommandes = useCallback((commandesData, produitsData) => {
  if (!Array.isArray(commandesData)) {
    console.log('❌ commandesData n\'est pas un tableau:', typeof commandesData);
    return [];
  }
  
  console.log(`🔄 Transformation de ${commandesData.length} commandes`);
  
  return commandesData.map((commande, index) => {
    if (!commande) return null;
    
    console.log(`🔍 Commande ${index}:`, {
      id: commande.id,
      numero: commande.numeroCommande,
      statut: commande.statut,
      produits: commande.produits
    });
    
    // DEBUG: Vérifiez la structure des produits
    console.log(`📦 Produits commande ${commande.id}:`, commande.produits);
    console.log(`📦 Type produits:`, typeof commande.produits);
    console.log(`📦 Est un array?`, Array.isArray(commande.produits));
    
    if (commande.produits && Array.isArray(commande.produits)) {
      commande.produits.forEach((p, i) => {
        console.log(`  Produit ${i}:`, {
          id: p.id,
          libelle: p.libelle,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire
        });
      });
    }
    
    const clientNom = commande.client?.nom || 
                     commande.clientNom || 
                     `${commande.client?.prenom || ''} ${commande.client?.nom || ''}`.trim() ||
                     'Client inconnu';
    
    const clientId = commande.client?.id || commande.clientId;
    const clientType = commande.client?.type || commande.clientType || 'STANDARD';
    
    // IMPORTANT: Utilisez directement commande.produits s'il est déjà un tableau
    const produitsTransformes = commande.produits && Array.isArray(commande.produits) 
      ? commande.produits.map(p => ({
          id: p.id,
          libelle: p.libelle || `Produit ${p.id}`,
          prixUnitaire: toNumber(p.prixUnitaire || 0),
          quantite: toNumber(p.quantite || 1),
          sousTotal: toNumber(p.sousTotal || 0),
          totalLigne: toNumber(p.totalLigne || p.sousTotal || 0),
          categorie: p.categorie || '',
          imageUrl: p.imageUrl || '',
          quantiteStock: p.quantiteStock || 0,
          statutStock: p.statutStock || 'INCONNU'
        }))
      : getProduitsAvecDetails(commande.produits, produitsData);
    
    console.log(`✅ Produits transformés pour commande ${commande.id}:`, produitsTransformes.length);
    
    const result = {
      id: commande.id || commande.idCommande,
      numero: commande.numeroCommande || commande.numero || commande.reference || `CMD-${commande.id || 'N/A'}`,
      client: {
        id: clientId,
        nom: clientNom,
        type: clientType,
        telephone: commande.client?.telephone || '',
        email: commande.client?.email || ''
      },
      dateCreation: commande.dateCreation || commande.dateCommande || commande.createdAt
        ? new Date(commande.dateCreation || commande.dateCommande || commande.createdAt).toLocaleDateString('fr-FR')
        : 'Non définie',
      dateLivraisonPrevue: commande.dateLivraison || commande.dateLivraisonPrevue || commande.deliveryDate
        ? new Date(commande.dateLivraison || commande.dateLivraisonPrevue || commande.deliveryDate).toLocaleDateString('fr-FR')
        : 'Non définie',
      produits: produitsTransformes, // CORRECTION ICI
      sousTotal: toNumber(commande.sousTotal || commande.montantHorsTaxe || commande.amountWithoutTax || 0),
      remise: toNumber(commande.montantRemise || commande.remise || commande.discount || 0),
      total: toNumber(commande.total || commande.montantTotal || commande.totalAmount || 0),
      statut: getStatutDisplay(commande.statut || commande.status || commande.state),
      remarques: commande.notes || commande.remarques || commande.remarks || '',
      statutOriginal: commande.statut || commande.status || commande.state || 'EN_ATTENTE'
    };
    
    console.log(` Commande ${result.id} transformée:`, {
      numero: result.numero,
      produitsCount: result.produits.length,
      produits: result.produits
    });
    
    return result;
  }).filter(Boolean);
}, [getProduitsAvecDetails, getStatutDisplay, toNumber]);
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

  // Charger toutes les données - LOG SIMPLIFIÉ
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
      } else if (commandesResult.status === 'rejected') {
        const error = commandesResult.reason;
        if (error.response?.status === 403) {
          setError('Pas d\'accès aux commandes. Vous pouvez créer de nouvelles commandes.');
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

      //  LOG POUR AFFICHER LA LISTE DES COMMANDES
      console.log('📋 Liste des commandes chargées:', commandesData.map(c => ({
        id: c.id,
        numero: c.numeroCommande || c.numero,
        client: c.client?.nom || 'N/A',
        statut: c.statut,
        total: c.total
      })));

      // Transformer et mettre à jour les états
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

  // Gestion des produits sélectionnés
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
    setSelectedProducts(prevProducts => 
      prevProducts.map(p => {
        if (p.id === productId || p.idProduit === productId) {
          const quantite = Math.max(1, toNumber(nouvelleQuantite));
          const prix = toNumber(p.prix || p.price);
          return {
            ...p,
            quantite,
            sousTotal: prix * quantite
          };
        }
        return p;
      })
    );
  }, [toNumber]);

  const handleSupprimerProduit = useCallback((productId) => {
    setSelectedProducts(prevProducts => 
      prevProducts.filter(p => (p.id !== productId) && (p.idProduit !== productId))
    );
  }, []);

  // Gestion des commandes
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
            ? { 
                ...c, 
                statut: 'Confirmé', 
                statutOriginal: 'CONFIRMEE'
              }
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
            ? { 
                ...c, 
                statut: 'Refusé', 
                statutOriginal: 'ANNULEE'
              }
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
        return {
          success: true,
          data: commandeLocale,
          message: 'Détails depuis le cache local'
        };
      }
      throw error;
    }
  }, [commandes]);

  // Réinitialiser la sélection
  const resetSelection = useCallback(() => {
    setSelectedProducts([]);
    setSelectedClient(null);
  }, []);

  // Calcul du total des produits sélectionnés
  const totalSelectedProducts = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + toNumber(p.sousTotal), 0);
  }, [selectedProducts, toNumber]);

  // Fonction pour mettre à jour les commandes après une action
  const updateCommandeStatus = useCallback((commandeId, newStatus) => {
    setCommandes(prev => prev.map(c => 
      c.id === commandeId 
        ? { 
            ...c, 
            statut: getStatutDisplay(newStatus),
            statutOriginal: newStatus
          }
        : c
    ));
  }, [getStatutDisplay]);



  return {
    // États
    commandes,
    clients,
    produits,
    loading,
    error,
    selectedProducts,
    selectedClient,
    totalSelectedProducts,
    
    // Setters
    setSelectedProducts,
    setSelectedClient,
    setCommandes,
    setError,
    
    // Fonctions utilitaires
    toNumber,
    chargerDonnees,
    resetSelection,
    updateCommandeStatus,
    
    // Gestion des produits
    handleSelectProduct,
    handleModifierQuantite,
    handleSupprimerProduit,
    
    // Gestion des commandes
    handleCreerCommande,
    handleValiderCommande,
    handleRejeterCommande,
    handleGetRemise,
    handleVoirDetails
  };
};

export default useOrders;