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
    switch(statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'ANNULEE': return 'Annulée';
      default: return statut || 'En attente';
    }
  }, []);

  // ✅ CORRIGÉ - getProduitsAvecDetails
  const getProduitsAvecDetails = useCallback((lignesCommande, produitsData) => {
    console.log('🔍 getProduitsAvecDetails appelée');
    
    if (!Array.isArray(lignesCommande)) {
      return [];
    }
    
    return lignesCommande.map(ligne => {
      const produit = ligne.produit || {};
      
      return {
        id: ligne.idLigneCommandeClient,
        ligneId: ligne.idLigneCommandeClient,
        produitId: produit.idProduit || ligne.produitId,
        libelle: produit.libelle || ligne.libelle || 'Produit',
        prixUnitaire: toNumber(ligne.prixUnitaire || 0),
        quantite: toNumber(ligne.quantite || 1),
        sousTotal: toNumber(ligne.sousTotal || 0),
        imageUrl: produit.imageUrl || ligne.imageUrl,
        uniteMesure: produit.uniteMesure || ligne.uniteMesure || 'unité'
      };
    });
  }, [toNumber]);

  // ✅ CORRIGÉ - transformCommandes
  const transformCommandes = useCallback((commandesData, produitsData) => {
    if (!Array.isArray(commandesData)) {
      return [];
    }
    
    return commandesData.map((commande) => {
      if (!commande) return null;
      
      // ✅ Récupérer les lignes de commande
      const lignes = commande.lignesCommande || [];
      
      return {
        idCommandeClient: commande.idCommandeClient,
        id: commande.idCommandeClient, // Pour compatibilité
        referenceCommandeClient: commande.referenceCommandeClient || `CMD-${commande.idCommandeClient}`,
        numero: commande.referenceCommandeClient || `CMD-${commande.idCommandeClient}`,
        
        client: commande.client ? {
          idClient: commande.client.idClient,
          id: commande.client.idClient,
          nom: commande.client.nom || '',
          prenom: commande.client.prenom || '',
          typeClient: commande.client.typeClient || 'PARTICULIER',
          telephone: commande.client.telephone || '',
          email: commande.client.email || '',
          adresse: commande.client.adresse || ''
        } : null,
        
        dateCommande: commande.dateCommande,
        
        lignesCommande: lignes.map(l => ({
          idLigneCommandeClient: l.idLigneCommandeClient,
          produit: l.produit ? {
            idProduit: l.produit.idProduit,
            libelle: l.produit.libelle,
            imageUrl: l.produit.imageUrl,
            uniteMesure: l.produit.uniteMesure,
            prixVente: l.produit.prixVente
          } : null,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          sousTotal: l.sousTotal
        })),
        
        // ✅ Version simplifiée pour l'affichage
        produits: getProduitsAvecDetails(lignes, produitsData),
        
        sousTotal: toNumber(commande.sousTotal || 0),
        tauxRemise: toNumber(commande.tauxRemise || 0),
        total: toNumber(commande.total || 0),
        
        statut: commande.statut || 'EN_ATTENTE',
        statutDisplay: getStatutDisplay(commande.statut)
      };
    }).filter(Boolean);
  }, [getProduitsAvecDetails, getStatutDisplay, toNumber]);

  // ✅ transformClients
  const transformClients = useCallback((clientsData) => {
    if (!Array.isArray(clientsData)) {
      if (clientsData && clientsData.clients && Array.isArray(clientsData.clients)) {
        clientsData = clientsData.clients;
      } else {
        return [];
      }
    }
    
    return clientsData.map(client => ({
      idClient: client.idClient,
      id: client.idClient,
      nom: client.nom || '',
      prenom: client.prenom || '',
      typeClient: client.typeClient || 'PARTICULIER',
      telephone: client.telephone || '',
      email: client.email || '',
      adresse: client.adresse || '',
      nomComplet: `${client.prenom || ''} ${client.nom || ''}`.trim()
    }));
  }, []);

  // ✅ transformProduits
  const transformProduits = useCallback((produitsData) => {
    if (!Array.isArray(produitsData)) {
      if (produitsData && produitsData.produits && Array.isArray(produitsData.produits)) {
        produitsData = produitsData.produits;
      } else {
        return [];
      }
    }
    
    return produitsData.map(produit => ({
      idProduit: produit.idProduit,
      id: produit.idProduit,
      libelle: produit.libelle || 'Produit sans nom',
      prixVente: toNumber(produit.prixVente || 0),
      prixAchat: toNumber(produit.prixAchat || 0),
      quantiteStock: toNumber(produit.quantiteStock || 0),
      seuilMinimum: toNumber(produit.seuilMinimum || 5),
      uniteMesure: produit.uniteMesure || 'unité',
      status: produit.status || 'EN_STOCK',
      imageUrl: produit.imageUrl || '',
      categorie: produit.categorie ? {
        idCategorie: produit.categorie.idCategorie,
        nomCategorie: produit.categorie.nomCategorie
      } : null
    }));
  }, [toNumber]);

  // ✅ chargerDonnees
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
        console.log('📦 Commandes brutes:', data);
        
        if (data && data.success && data.commandes) {
          commandesData = data.commandes;
        } else if (Array.isArray(data)) {
          commandesData = data;
        } else if (data && Array.isArray(data.data)) {
          commandesData = data.data;
        }
      }

      // Clients
      if (clientsResult.status === 'fulfilled') {
        const data = clientsResult.value;
        console.log('👥 Clients bruts:', data);
        
        if (data && data.success && data.clients) {
          clientsData = data.clients;
        } else if (Array.isArray(data)) {
          clientsData = data;
        }
      }

      // Produits
      if (produitsResult.status === 'fulfilled') {
        const data = produitsResult.value;
        console.log('📦 Produits bruts:', data);
        
        if (data && data.success && data.produits) {
          produitsData = data.produits;
        } else if (Array.isArray(data)) {
          produitsData = data;
        }
      }

      const commandesTransformees = transformCommandes(commandesData, produitsData);
      console.log('✅ Commandes transformées:', commandesTransformees);
      
      setCommandes(commandesTransformees);
      setClients(transformClients(clientsData));
      setProduits(transformProduits(produitsData));
      
    } catch (err) {
      console.error('❌ Erreur chargerDonnees:', err);
      setError('Erreur système lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [transformCommandes, transformClients, transformProduits]);

  // ✅ Gestion des produits sélectionnés
  const handleSelectProduct = useCallback((product) => {
    if (!product || !product.idProduit) return;
    
    setSelectedProducts(prev => {
      const exists = prev.some(p => p.idProduit === product.idProduit);
      if (exists) {
        return prev.filter(p => p.idProduit !== product.idProduit);
      } else {
        return [...prev, { 
          ...product, 
          quantiteCommande: 1,
          prix: product.prixVente || 0
        }];
      }
    });
  }, []);

  const handleModifierQuantite = useCallback((produitId, nouvelleQuantite) => {
    setSelectedProducts(prev => 
      prev.map(p => {
        if (p.idProduit === produitId) {
          const quantite = Math.max(1, toNumber(nouvelleQuantite));
          return { ...p, quantiteCommande: quantite };
        }
        return p;
      })
    );
  }, [toNumber]);

  const handleSupprimerProduit = useCallback((produitId) => {
    setSelectedProducts(prev => 
      prev.filter(p => p.idProduit !== produitId)
    );
  }, []);

  // ✅ Gestion des commandes
  const handleValiderCommande = useCallback(async (commandeId) => {
    try {
      console.log('🔍 Validation commande ID:', commandeId);
      
      if (!commandeId) {
        throw new Error('ID de commande manquant');
      }
      
      const result = await commandeService.validerCommande(commandeId);
      console.log('✅ Résultat validation:', result);
      
      if (result && result.success) {
        setCommandes(prev => prev.map(c => 
          c.idCommandeClient === commandeId 
            ? { ...c, statut: 'CONFIRMEE', statutDisplay: 'Confirmée' }
            : c
        ));
        return result;
      }
      throw new Error(result?.message || 'Échec de la validation');
    } catch (error) {
      console.error('❌ Erreur handleValiderCommande:', error);
      throw error;
    }
  }, []);

  const handleRejeterCommande = useCallback(async (commandeId) => {
    try {
      console.log('🔍 Rejet commande ID:', commandeId);
      
      if (!commandeId) {
        throw new Error('ID de commande manquant');
      }
      
      const result = await commandeService.rejeterCommande(commandeId);
      console.log('✅ Résultat rejet:', result);
      
      if (result && result.success) {
        setCommandes(prev => prev.map(c => 
          c.idCommandeClient === commandeId 
            ? { ...c, statut: 'ANNULEE', statutDisplay: 'Annulée' }
            : c
        ));
        return result;
      }
      throw new Error(result?.message || 'Échec du rejet');
    } catch (error) {
      console.error('❌ Erreur handleRejeterCommande:', error);
      throw error;
    }
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedProducts([]);
    setSelectedClient(null);
  }, []);

  const totalSelectedProducts = useMemo(() => {
    return selectedProducts.reduce((sum, p) => 
      sum + (toNumber(p.prixVente) * toNumber(p.quantiteCommande)), 0);
  }, [selectedProducts, toNumber]);

  return {
    commandes,
    setCommandes, // Important pour OrdersPage.jsx
    clients,
    produits,
    loading,
    error,
    selectedProducts,
    selectedClient,
    totalSelectedProducts,
    setSelectedProducts,
    setSelectedClient,
    toNumber,
    chargerDonnees,
    resetSelection,
    handleSelectProduct,
    handleModifierQuantite,
    handleSupprimerProduit,
    handleValiderCommande,
    handleRejeterCommande
  };
};

export default useOrders;