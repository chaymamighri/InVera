// src/services/commandeService.js
import api from './api'; 

export const commandeService = {
  // Récupérer toutes les commandes
  async getAllCommandes() {
    try {
      console.log('📡 Appel API: /commandes/getAllCommandes');
      const response = await api.get('/commandes/getAllCommandes');
      
      if (response.data && response.data.success && response.data.commandes) {
        return response.data.commandes;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(' Erreur getAllCommandes:', error);
      throw error;
    }
  },

  // Récupérer les commandes validées
  getCommandesValidees: async () => {
    try {
      console.log('📡 Appel API: /commandes/validated');
      const response = await api.get('/commandes/validated');
      
      if (response.data && response.data.success && response.data.commandes) {
        return response.data.commandes;
      }
      return response.data;
    } catch (error) {
      console.error(' Erreur getCommandesValidees:', error);
      throw error;
    }
  },

  // Créer une nouvelle commande
  async createCommande(commandeData) {
    try {
      const response = await api.post('/commandes/creer', commandeData );
      return response.data;
    } catch (error) {
      console.error(' Erreur createCommande:', error);
      throw error;
    }
  },

  // Récupérer une commande par ID
  async getCommandeById(id) {
    try {
      const response = await api.get(`/commandes/${id}`);
      
      if (response.data && response.data.success && response.data.commande) {
        return response.data.commande;
      }
      return response.data;
    } catch (error) {
      console.error(` Erreur getCommandeById ${id}:`, error);
      throw error;
    }
  },

  /**
   *  Valider une commande - URL correcte
   * PUT /api/commandes/{id}/valider
   */
   async validerCommande(commandeId) {
    try {
      console.log(`📡 Validation commande ${commandeId}`);
      
      // ✅ UN SEUL ENDPOINT CORRECT
      const response = await api.put(`/commandes/${commandeId}/valider`, {});
      
      console.log(`✅ Commande ${commandeId} validée avec succès`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Erreur validation commande ${commandeId}:`, error);
      
      if (error.response?.status === 403) {
        console.error('🔒 ACCÈS REFUSÉ: Votre rôle n\'a pas la permission de valider des commandes');
      }
      if (error.response?.status === 404) {
        console.error('🔍 Commande non trouvée ou endpoint incorrect');
      }
      
      throw error;
    }
  },

  /**
   *  Rejeter une commande - URL correcte
   * PUT /api/commandes/{id}/rejeter
   */
  async rejeterCommande(commandeId) {
    try {
      console.log(`📡 Rejet commande ${commandeId}`);
      
      // ✅ UN SEUL ENDPOINT CORRECT
      const response = await api.put(`/commandes/${commandeId}/rejeter`, {});
      
      console.log(`✅ Commande ${commandeId} rejetée avec succès`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Erreur rejet commande ${commandeId}:`, error);
      throw error;
    }
  },

// update commande
async updateCommande(commandeId, commandeData) {
  try {
    console.log(`📡 Mise à jour commande ${commandeId}:`, commandeData);
    
    //  S'assurer que les IDs des produits sont bien formatés
    const payload = {
      ...commandeData,
      produits: commandeData.produits.map(p => ({
        ...p,
        // S'assurer que l'id est soit un nombre, soit absent
        id: p.id && !isNaN(parseInt(p.id)) ? parseInt(p.id) : undefined
      }))
    };
    
    const response = await api.put(`/commandes/${commandeId}`, payload);

    console.log('✅ Réponse mise à jour:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur updateCommande ${commandeId}:`, error);
    if (error.response) {
      console.error('📋 Détails erreur:', {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message || error.message
      });
    }
    throw error;
  }
},


  /**
   * Générer une facture pour une commande validée
   * @param {number} commandeId 
   */
  async generateInvoice(commandeId) {
    try {
      const response = await api.post(`/factures/generer/${commandeId}`);
      console.log('📥 Réponse génération facture:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur generateInvoice:', error);
      throw error.response?.data || error;
    }
  },

  // Récupération de toutes les factures
  async getAllInvoices() {
    try {
      const response = await api.get('/factures/all');
      console.log('📥 Réponse brute factures:', response.data);
      
      // Si la réponse est déjà un tableau
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Si la réponse est encapsulée
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllInvoices:', error);
      throw error;
    }
  },
  
  
//  Marquer une facture comme payée
async marquerFacturePayee(factureId) {
  try {
    // Extraire l'ID numérique si nécessaire
    let numericId = factureId;
    
    // Si c'est une chaîne comme "FAC-4" ou "FAC-123"
    if (typeof factureId === 'string' && factureId.includes('FAC-')) {
      const match = factureId.match(/FAC-(\d+)/);
      if (match && match[1]) {
        numericId = parseInt(match[1], 10);
        console.log(`🔢 Conversion: ${factureId} -> ${numericId}`);
      }
    }
    
    // Si c'est une chaîne qui ne contient que des chiffres
    if (typeof factureId === 'string' && /^\d+$/.test(factureId)) {
      numericId = parseInt(factureId, 10);
    }
    
    console.log(`📡 Marquage facture ${numericId} comme payée`);
    
    // Endpoint exact du backend avec l'ID numérique
    const response = await api.put(`/factures/${numericId}/payer`);
    
    console.log(` Succès: facture ${numericId} marquée comme payée`);
    return response.data;
    
  } catch (error) {
    console.error(' Erreur marquerFacturePayee:', error);
    throw error;
  }
},

  //Changer le statut (appelle marquerFacturePayee)
  async updateInvoiceStatus(invoiceId, newStatus) {
    try {
      console.log(`📡 Mise à jour statut facture ${invoiceId} -> ${newStatus}`);
      
      // Le backend a seulement "payer", pas de "NON_PAYE"
      if (newStatus === 'PAYE') {
        return await this.marquerFacturePayee(invoiceId);
      } else {
        // Pour "NON_PAYE", il faut une autre logique ou le faire côté frontend
        console.log('Le backend ne supporte que le passage à PAYÉ');
        
        // Option: faire une mise à jour locale uniquement
        return { success: true, message: 'Mise à jour locale uniquement' };
      }
      
    } catch (error) {
      console.error(' Erreur updateInvoiceStatus:', error);
      throw error;
    }
  },
// Dans commandeService.js

async getInvoiceById(invoiceId) {
  try {
    const response = await api.get(`/factures/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur chargement facture:', error);
    throw error;
  }
},

// recupere les commande d'une client

async getCommandesByClientId(clientId) {
    try {
        console.log(`📡 Récupération des commandes pour le client ${clientId}`);
        
        // Endpoint que vous avez créé dans le controller
        const response = await api.get(`/commandes/client/${clientId}`);
        
        console.log('✅ Réponse API:', response.data);
        
        // La réponse a la structure: { success: true, commandes: [...], count: X }
        return response.data;
        
    } catch (error) {
        console.error(`❌ Erreur récupération commandes client ${clientId}:`, error);
        
        // En cas d'erreur 404 (pas de commandes), retourner un tableau vide
        if (error.response?.status === 404) {
            return { success: true, commandes: [], count: 0 };
        }
        
        throw error;
    }
},

async generateOrGetInvoice(commandeId) {
  try {
    // 1. Vérifier si une facture existe déjà
    const existing = await this.checkExistingInvoice(commandeId);
    
    if (existing) {
      console.log('📄 Facture existante trouvée:', existing);
      const invoiceId = existing.idFactureClient;
      console.log('🎯 ID facture existante:', invoiceId);
      
      if (invoiceId) {
        const factureDetails = await this.getInvoiceById(invoiceId);
        return { facture: factureDetails, existing: true };
      }
      return { facture: existing, existing: true };
    }
    
    // 2. Générer une nouvelle facture
    console.log('🆕 Génération nouvelle facture');
    const newInvoice = await this.generateInvoice(commandeId);
    console.log('📦 Nouvelle facture générée (brute):', newInvoice);
    
    // ✅ Attendre un court instant pour que le backend finalise
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ✅ Récupérer la facture complète en utilisant l'ID de la commande
    // Parce que newInvoice n'a peut-être pas encore l'idFactureClient
    const factureComplete = await this.checkExistingInvoice(commandeId);
    
    if (factureComplete) {
      console.log('✅ Facture complète récupérée:', factureComplete);
      return { facture: factureComplete, existing: false };
    }
    
    // Fallback: retourner la nouvelle facture même si incomplète
    return { facture: newInvoice, existing: false };
    
  } catch (error) {
    console.error('❌ Erreur generateOrGetInvoice:', error);
    throw error;
  }
},


async checkExistingInvoice(commandeId) {
  try {
    console.log(`📡 Vérification facture pour commande ${commandeId}`);
    const response = await api.get(`/factures/commande/${commandeId}`);
    console.log('📦 Réponse checkExistingInvoice:', response.data);
    
    // Si on arrive ici, c'est qu'une facture existe
    return response.data;
    
  } catch (error) {
    // Si c'est une 404, c'est normal (pas de facture)
    if (error.response?.status === 404) {
      console.log(`ℹ️ Pas de facture pour la commande ${commandeId}`);
      return null; // Retourner null pour indiquer "pas de facture"
    }
    
    // Pour les autres erreurs, logger et retourner null aussi
    console.error(`❌ Erreur checkExistingInvoice pour commande ${commandeId}:`, error);
    return null;
  }
},

// ✅ CORRIGER aussi checkInvoiceExistsForCommande
async checkInvoiceExistsForCommande(commandeId) {
  try {
    console.log(`📡 Vérification existence facture pour commande ${commandeId}`);
    
    // Utiliser checkExistingInvoice qui gère déjà les erreurs
    const existingInvoice = await this.checkExistingInvoice(commandeId);
    
    // Si existingInvoice est null ou undefined, pas de facture
    const exists = !!existingInvoice;
    console.log(`📊 Résultat: ${exists ? 'Facture existe' : 'Pas de facture'}`);
    
    return { exists };
    
  } catch (error) {
    console.error(`❌ Erreur vérification facture pour commande ${commandeId}:`, error);
    return { exists: false };
  }
},
};



// Fonctions de transformation (optionnelles, si vous voulez formater les données)
function transformInvoices(facturesData) {
  if (!Array.isArray(facturesData)) return [];
  return facturesData.map(facture => transformInvoice(facture));
}

function transformInvoice(facture) {
  return {
    id: facture.idFactureClient || facture.id,
    reference: facture.referenceFactureClient,
    dateFacture: facture.dateFacture,
    montantTotal: facture.montantTotal || 0,
    statut: facture.statut || 'NON_PAYE',
    
    client: facture.client ? {
      id: facture.client.idClient || facture.client.id,
      nom: facture.client.nom || '',
      prenom: facture.client.prenom || '',
      nomComplet: facture.client.nomComplet || 
                  `${facture.client.prenom || ''} ${facture.client.nom || ''}`.trim() ||
                  'Client',
      entreprise: facture.client.entreprise || '',
      typeClient: facture.client.typeClient || 'PARTICULIER',
      telephone: facture.client.telephone || '',
      email: facture.client.email || '',
      adresse: facture.client.adresse || ''
    } : null,
    
    commande: facture.commande ? {
      id: facture.commande.idCommandeClient || facture.commande.id,
      reference: facture.commande.referenceCommandeClient,
      lignesCommande: transformLignesCommande(facture.commande.lignesCommande)
    } : null
  };
}

function transformLignesCommande(lignes) {
  if (!Array.isArray(lignes)) return [];
  
  return lignes.map(ligne => ({
    id: ligne.idLigneCommandeClient,
    quantite: ligne.quantite,
    prixUnitaire: ligne.prix_unitaire,
    sousTotal: ligne.sous_total,
    produit: ligne.produit ? {
      id: ligne.produit.idProduit,
      libelle: ligne.produit.libelle,
      categorie: ligne.produit.categorie?.nomCategorie
    } : null
  }));
}