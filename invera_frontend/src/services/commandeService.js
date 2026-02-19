// src/services/commandeService.js
import api from './api'; 
import { authHeader } from './authHeader';

export const commandeService = {
  // Récupérer toutes les commandes
  async getAllCommandes() {
    try {
      console.log('📡 Appel API: /commandes/getAllCommandes');
      const response = await api.get('/commandes/getAllCommandes', { headers: authHeader() });
      
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
      const response = await api.get('/commandes/validated', { headers: authHeader() });
      
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
      const response = await api.post('/commandes/creer', commandeData, { 
        headers: authHeader() 
      });
      return response.data;
    } catch (error) {
      console.error(' Erreur createCommande:', error);
      throw error;
    }
  },

  // Récupérer une commande par ID
  async getCommandeById(id) {
    try {
      const response = await api.get(`/commandes/${id}`, {
        headers: authHeader()
      });
      
      if (response.data && response.data.success && response.data.commande) {
        return response.data.commande;
      }
      return response.data;
    } catch (error) {
      console.error(` Erreur getCommandeById ${id}:`, error);
      throw error;
    }
  },

  async validerCommande(commandeId) {
    try {
      console.log(`Tentative validation commande ${commandeId}`);
      
      const endpoints = [
        `/commandes/${commandeId}/valider`,
        `/api/commandes/${commandeId}/valider`,
        `/commandes/valider/${commandeId}`
      ];
      
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Essai endpoint: ${endpoint}`);
          const response = await api.put(endpoint, {}, { 
            headers: authHeader() 
          });
          
          console.log(` Succès avec endpoint: ${endpoint}`);
          return response.data;
        } catch (err) {
          console.log(` Échec endpoint ${endpoint}:`, err.response?.status);
          lastError = err;
        }
      }
      
      throw lastError || new Error('Aucun endpoint de validation trouvé');
      
    } catch (error) {
      console.error('Erreur validerCommande:', error);
      
      if (error.response?.status === 403) {
        console.error(' ACCÈS REFUSÉ: Votre rôle n\'a pas la permission de valider des commandes');
      }
      
      throw error;
    }
  },

  async rejeterCommande(commandeId) {
    try {
      console.log(` Tentative rejet commande ${commandeId}`);
      
      const endpoints = [
        `/commandes/${commandeId}/rejeter`,
        `/api/commandes/${commandeId}/rejeter`,
        `/commandes/rejeter/${commandeId}`
      ];
      
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Essai endpoint: ${endpoint}`);
          const response = await api.put(endpoint, {}, { 
            headers: authHeader() 
          });
          
          console.log(`Succès avec endpoint: ${endpoint}`);
          return response.data;
        } catch (err) {
          console.log(` Échec endpoint ${endpoint}:`, err.response?.status);
          lastError = err;
        }
      }
      
      throw lastError || new Error('Aucun endpoint de rejet trouvé');
      
    } catch (error) {
      console.error(' Erreur rejeterCommande:', error);
      throw error;
    }
  },

  /**
   * Générer une facture pour une commande validée
   * @param {number} commandeId - ID de la commande
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
  
  /**
   * Télécharger une facture au format PDF
   * @param {number} factureId - ID de la facture
   */
  async downloadInvoicePDF(factureId) {
    try {
      const response = await api.get(`/factures/telecharger/${factureId}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur downloadInvoicePDF:', error);
      throw error;
    }
  },
  

  // ✅ MÉTHODE CORRIGÉE: Marquer une facture comme payée
  async marquerFacturePayee(factureId) {
    try {
      console.log(`📡 Marquage facture ${factureId} comme payée`);
      
      // Endpoint exact du backend
      const response = await api.put(`/factures/${factureId}/payer`, {}, { 
        headers: authHeader() 
      });
      
      console.log(`✅ Succès: facture ${factureId} marquée comme payée`);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur marquerFacturePayee:', error);
      throw error;
    }
  },

  // ✅ MÉTHODE UTILITAIRE: Changer le statut (appelle marquerFacturePayee)
  async updateInvoiceStatus(invoiceId, newStatus) {
    try {
      console.log(`📡 Mise à jour statut facture ${invoiceId} -> ${newStatus}`);
      
      // Le backend a seulement "payer", pas de "NON_PAYE"
      if (newStatus === 'PAYE') {
        return await this.marquerFacturePayee(invoiceId);
      } else {
        // Pour "NON_PAYE", il faut une autre logique ou le faire côté frontend
        console.log('⚠️ Le backend ne supporte que le passage à PAYÉ');
        
        // Option: faire une mise à jour locale uniquement
        return { success: true, message: 'Mise à jour locale uniquement' };
      }
      
    } catch (error) {
      console.error('❌ Erreur updateInvoiceStatus:', error);
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

async generateOrGetInvoice(commandeId) {
  try {
    // 1. Vérifier si une facture existe déjà
    const existing = await this.checkExistingInvoice(commandeId);
    
    if (existing) {
      console.log('📄 Facture existante trouvée:', existing);
      
      // ✅ Utilisez idFactureClient
      const invoiceId = existing.idFactureClient;
      console.log('🎯 ID facture:', invoiceId);
      
      if (invoiceId) {
        // Récupérer les détails complets de la facture
        const factureDetails = await this.getInvoiceById(invoiceId);
        return { facture: factureDetails, existing: true };
      } else {
        // Fallback si l'ID n'est pas trouvé
        return { facture: existing, existing: true };
      }
    }
    
    // 2. Sinon, générer une nouvelle facture
    console.log(' Génération nouvelle facture');
    const newInvoice = await this.generateInvoice(commandeId);
    console.log('📦 Nouvelle facture générée:', newInvoice);
    
    //  Utilisez idFactureClient pour la nouvelle facture aussi
    const invoiceId = newInvoice.idFactureClient;
    
    if (invoiceId) {
      const factureDetails = await this.getInvoiceById(invoiceId);
      return { facture: factureDetails, existing: false };
    }
    
    return { facture: newInvoice, existing: false };
    
  } catch (error) {
    console.error(' Erreur generateOrGetInvoice:', error);
    throw error;
  }
},

async checkExistingInvoice(commandeId) {
  try {
    const response = await api.get(`/factures/commande/${commandeId}`);
    console.log('📦 Réponse checkExistingInvoice:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
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