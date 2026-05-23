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

  // ✅ getProduitsAvecDetails avec remise de catégorie
  const getProduitsAvecDetails = useCallback((lignesCommande, produitsData) => {
    console.log('🔍 getProduitsAvecDetails - Reçu:', {
      lignesCommande,
      produitsDataLength: produitsData?.length,
    });
    
    if (!Array.isArray(lignesCommande)) return [];
    
    return lignesCommande.map(ligne => {
      const produitId = ligne.produit?.idProduit || ligne.produitId;
      
      const produitInfo = Array.isArray(produitsData) 
        ? produitsData.find(p => p.idProduit === produitId)
        : null;
      
      let categorieRemise = 0;
      let categorieNom = null;
      
      if (produitInfo?.categorie) {
        categorieRemise = produitInfo.categorie.remiseStandard || 0;
        categorieNom = produitInfo.categorie.nomCategorie;
        console.log(`✅ Catégorie trouvée pour ${produitInfo.libelle}: ${categorieNom} (remise: ${categorieRemise}%)`);
      } else if (produitInfo?.categorieRemiseStandard) {
        categorieRemise = produitInfo.categorieRemiseStandard;
        categorieNom = produitInfo.categorieNom;
      }
      
      const quantite = toNumber(ligne.quantite || 1);
      const prixUnitaire = toNumber(ligne.prixUnitaire || 0);
      const sousTotalLigne = quantite * prixUnitaire;
      const remiseMontant = sousTotalLigne * (categorieRemise / 100);
      
      return {
        id: ligne.idLigneCommandeClient,
        ligneId: ligne.idLigneCommandeClient,
        produitId: produitId,
        libelle: produitInfo?.libelle || ligne.libelle || 'Produit sans nom',
        prixUnitaire: prixUnitaire,
        quantite: quantite,
        sousTotal: sousTotalLigne,
        imageUrl: produitInfo?.imageUrl || ligne.imageUrl,
        uniteMesure: produitInfo?.uniteMesure || ligne.uniteMesure || 'unité',
        categorie: produitInfo?.categorie,
        categorieNom: categorieNom,
        categorieRemiseStandard: categorieRemise,
        remiseProduit: remiseMontant,
        tauxRemiseProduit: categorieRemise,
        totalLigne: sousTotalLigne - remiseMontant
      };
    });
  }, [toNumber]);


const transformCommandes = useCallback((commandesData, produitsData) => {
  if (!Array.isArray(commandesData)) return [];
  
  return commandesData.map((commande) => {
    if (!commande) return null;
    
    const lignes = commande.lignesCommande || [];
    
    const produitsEnrichis = lignes.map(l => {
      const produitId = l.produit?.idProduit || l.produitId;
      const produitComplet = produitsData.find(p => p.idProduit === produitId);
      
      const quantite = toNumber(l.quantite || 1);
      const prixUnitaire = toNumber(l.prixUnitaire || 0);
      const sousTotalLigne = quantite * prixUnitaire;
      
      // ✅ Récupérer la remise de la catégorie DEPUIS LE PRODUIT COMPLET
      let categorieRemise = 0;
      let categorieNom = null;
      
      // Source 1: via l'objet categorie
      if (produitComplet?.categorie) {
        categorieRemise = produitComplet.categorie.remiseStandard || 0;
        categorieNom = produitComplet.categorie.nomCategorie;
      }
      // Source 2: via categorieRemiseStandard direct
      else if (produitComplet?.categorieRemiseStandard !== undefined) {
        categorieRemise = produitComplet.categorieRemiseStandard;
        categorieNom = produitComplet.categorieNom;
      }
      
      // Calculer le montant de la remise
      const remiseMontant = (sousTotalLigne * categorieRemise) / 100;
      
      console.log(`💰 PRODUIT: ${produitComplet?.libelle} | Catégorie: ${categorieNom} | Remise: ${categorieRemise}% | Montant: ${remiseMontant}dt`);
      
      return {
        idLigneCommandeClient: l.idLigneCommandeClient,
        produitId: produitId,
        libelle: produitComplet?.libelle || l.libelle || 'Produit',
        quantite: quantite,
        prixUnitaire: prixUnitaire,
        sousTotal: sousTotalLigne,
        imageUrl: produitComplet?.imageUrl,
        uniteMesure: produitComplet?.uniteMesure,
        // ✅ AJOUTER CES CHAMPS POUR LA REMISE
        categorieNom: categorieNom,
        categorieRemiseStandard: categorieRemise,
        remiseProduit: remiseMontant,
        tauxRemiseProduit: categorieRemise,
        totalLigne: sousTotalLigne - remiseMontant
      };
    });
    
    // Calcul des totaux
    const sousTotalGlobal = produitsEnrichis.reduce((sum, p) => sum + p.sousTotal, 0);
    const remiseTotaleProduits = produitsEnrichis.reduce((sum, p) => sum + p.remiseProduit, 0);
    const totalApresRemisesProduits = sousTotalGlobal - remiseTotaleProduits;
    const tauxRemiseGlobale = toNumber(commande.tauxRemise || 0);
    const montantRemiseGlobale = totalApresRemisesProduits * (tauxRemiseGlobale / 100);
    const totalFinal = totalApresRemisesProduits - montantRemiseGlobale;
    
    return {
      idCommandeClient: commande.idCommandeClient,
      id: commande.idCommandeClient,
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
        adresse: commande.client.adresse || '',
        raisonSociale: commande.client.raisonSociale || '',
        matriculeFiscal: commande.client.matriculeFiscal || '',
        nomComplet: `${commande.client.prenom || ''} ${commande.client.nom || ''}`.trim()
      } : null,
      
      dateCommande: commande.dateCommande,
      produits: produitsEnrichis,  // ← Les produits enrichis avec remise
      
      sousTotal: sousTotalGlobal,
      remiseTotaleProduits: remiseTotaleProduits,
      tauxRemise: tauxRemiseGlobale,
      remise: montantRemiseGlobale,
      total: totalFinal,
      
      statut: commande.statut || 'EN_ATTENTE',
      statutDisplay: getStatutDisplay(commande.statut),
      remarques: commande.remarques || ''
    };
  }).filter(Boolean);
}, [getStatutDisplay, toNumber]);

  // ✅ transformClients (AJOUTÉE)
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
      raisonSociale: client.raisonSociale || '',
      matriculeFiscal: client.matriculeFiscal || '',
      nomComplet: `${client.prenom || ''} ${client.nom || ''}`.trim()
    }));
  }, []);

const transformProduits = useCallback((produitsData) => {
  if (!Array.isArray(produitsData)) {
    if (produitsData && produitsData.produits && Array.isArray(produitsData.produits)) {
      produitsData = produitsData.produits;
    } else if (produitsData && produitsData.data && Array.isArray(produitsData.data)) {
      produitsData = produitsData.data;
    } else {
      return [];
    }
  }
  
  console.log('🔍 PRODUITS DATA REÇUS:', produitsData);
  
  return produitsData.map(produit => {
    // ✅ Récupérer la remise standard - le DTO l'envoie directement
    let categorieRemiseStandard = 0;
    let categorieInfo = null;
    
    // Le DTO peut envoyer categorieRemiseStandard directement
    if (produit.categorieRemiseStandard !== undefined && produit.categorieRemiseStandard !== null) {
      categorieRemiseStandard = Number(produit.categorieRemiseStandard);
    }
    // Ou via l'objet categorie
    else if (produit.categorie && produit.categorie.remiseStandard !== undefined) {
      categorieRemiseStandard = Number(produit.categorie.remiseStandard);
      categorieInfo = {
        idCategorie: produit.categorie.idCategorie,
        nomCategorie: produit.categorie.nomCategorie,
        remiseStandard: categorieRemiseStandard
      };
    }
    
    // Si on a une catégorie via categorieId, créer l'objet
    if (produit.categorieId && !categorieInfo && produit.categorieNom) {
      categorieInfo = {
        idCategorie: produit.categorieId,
        nomCategorie: produit.categorieNom,
        remiseStandard: categorieRemiseStandard
      };
    }
    
    console.log(`📊 Produit ${produit.libelle}: catégorieRemiseStandard = ${categorieRemiseStandard}%`);
    
    return {
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
      remiseTemporaire: toNumber(produit.remiseTemporaire || 0),
      
      // ✅ Catégorie avec remise standard
      categorie: categorieInfo,
      categorieId: produit.categorieId || categorieInfo?.idCategorie,
      categorieNom: produit.categorieNom || categorieInfo?.nomCategorie || null,
      categorieRemiseStandard: categorieRemiseStandard,  // ← CLÉ POUR LA REMISE
      
      prixEffectif: toNumber(produit.prixVente || 0) * (1 - (toNumber(produit.remiseTemporaire || 0) / 100)),
      
      stockStatus: (() => {
        const stock = toNumber(produit.quantiteStock || 0);
        const seuil = toNumber(produit.seuilMinimum || 5);
        if (stock <= 0) return 'RUPTURE';
        if (stock <= seuil) return 'FAIBLE';
        if (stock <= seuil * 2) return 'MOYEN';
        return 'ELEVE';
      })()
    };
  }).filter(Boolean);
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

      // 1️⃣ TRAITER LES PRODUITS
      let produitsData = [];
      if (produitsResult.status === 'fulfilled') {
        const data = produitsResult.value;
        if (data && data.success && data.data) {
          produitsData = data.data;
        } else if (data && data.success && data.produits) {
          produitsData = data.produits;
        } else if (Array.isArray(data)) {
          produitsData = data;
        }
      }
      
      const produitsTransformes = transformProduits(produitsData);
      setProduits(produitsTransformes);

      // 2️⃣ TRAITER LES COMMANDES
      let commandesData = [];
      if (commandesResult.status === 'fulfilled') {
        const data = commandesResult.value;
        if (data && data.success && data.commandes) {
          commandesData = data.commandes;
        } else if (Array.isArray(data)) {
          commandesData = data;
        } else if (data && Array.isArray(data.data)) {
          commandesData = data.data;
        }
      }

      const commandesTransformees = transformCommandes(commandesData, produitsTransformes);
      setCommandes(commandesTransformees);

      // 3️⃣ TRAITER LES CLIENTS
      let clientsData = [];
      if (clientsResult.status === 'fulfilled') {
        const data = clientsResult.value;
        if (data && data.success && data.clients) {
          clientsData = data.clients;
        } else if (Array.isArray(data)) {
          clientsData = data;
        }
      }
      
      const clientsTransformes = transformClients(clientsData);
      setClients(clientsTransformes);
      
    } catch (err) {
      console.error('❌ Erreur chargerDonnees:', err);
      setError('Erreur système lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [transformCommandes, transformClients, transformProduits]);

  // Gestion des produits sélectionnés
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
    setSelectedProducts(prev => prev.filter(p => p.idProduit !== produitId));
  }, []);

  // Gestion des commandes
  const handleValiderCommande = useCallback(async (commandeId) => {
    try {
      const result = await commandeService.validerCommande(commandeId);
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
      const result = await commandeService.rejeterCommande(commandeId);
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

  const handleUpdateCommande = useCallback(async (commandeId, commandeData) => {
    try {
      const result = await commandeService.updateCommande(commandeId, commandeData);
      if (result && result.success !== false) {
        await chargerDonnees();
        return result;
      }
      throw new Error(result?.message || 'Échec de la mise à jour');
    } catch (error) {
      console.error('❌ Erreur handleUpdateCommande:', error);
      throw error;
    }
  }, [chargerDonnees]);

  const getCommandeById = useCallback((commandeId) => {
    return commandes.find(c => c.idCommandeClient === commandeId) || null;
  }, [commandes]);

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
    setCommandes, 
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
    handleRejeterCommande,
    handleUpdateCommande,
    getCommandeById
  };
};

export default useOrders;