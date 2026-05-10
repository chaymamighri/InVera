// src/services/commandeService.js
import api from './api';

// ==================== FONCTIONS DE TRANSFORMATION ====================

export function transformLignesCommande(lignes) {
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

export function transformInvoice(facture) {
  if (!facture) return null;
  
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

export function transformInvoices(facturesData) {
  if (!Array.isArray(facturesData)) return [];
  return facturesData.map(facture => transformInvoice(facture));
}

// ==================== SERVICE ====================

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
      console.error('❌ Erreur getAllCommandes:', error);
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
      console.error('❌ Erreur getCommandesValidees:', error);
      throw error;
    }
  },

  // Créer une nouvelle commande
  async createCommande(commandeData) {
    try {
      const response = await api.post('/commandes/creer', commandeData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur createCommande:', error);
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
      console.error(`❌ Erreur getCommandeById ${id}:`, error);
      throw error;
    }
  },

  async validerCommande(commandeId) {
    try {
      console.log(`📡 Validation commande ${commandeId}`);
      const response = await api.put(`/commandes/${commandeId}/valider`, {});
      console.log(`✅ Commande ${commandeId} validée avec succès`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur validation commande ${commandeId}:`, error);
      throw error;
    }
  },

  async rejeterCommande(commandeId) {
    try {
      console.log(`📡 Rejet commande ${commandeId}`);
      const response = await api.put(`/commandes/${commandeId}/rejeter`, {});
      console.log(`✅ Commande ${commandeId} rejetée avec succès`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur rejet commande ${commandeId}:`, error);
      throw error;
    }
  },

  async updateCommande(commandeId, commandeData) {
    try {
      console.log(`📡 Mise à jour commande ${commandeId}:`, commandeData);
      
      const payload = {
        ...commandeData,
        produits: commandeData.produits?.map(p => ({
          ...p,
          id: p.id && !isNaN(parseInt(p.id)) ? parseInt(p.id) : undefined
        })) || []
      };
      
      const response = await api.put(`/commandes/${commandeId}`, payload);
      console.log('✅ Réponse mise à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur updateCommande ${commandeId}:`, error);
      throw error;
    }
  },

  // Récupération de toutes les factures
  async getAllInvoices() {
    try {
      const response = await api.get('/factures/all');
      console.log('📥 Réponse brute factures:', response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllInvoices:', error);
      throw error;
    }
  },

  // Marquer une facture comme payée
  async marquerFacturePayee(factureId) {
    try {
      let numericId = this._extractNumericId(factureId);
      console.log(`📡 Marquage facture ${numericId} comme payée`);
      const response = await api.put(`/factures/${numericId}/payer`);
      console.log(`✅ Facture ${numericId} marquée comme payée`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur marquerFacturePayee:', error);
      throw error;
    }
  },

  // Méthode utilitaire privée
  _extractNumericId(id) {
    if (typeof id === 'number') return id;
    if (typeof id === 'string' && id.includes('FAC-')) {
      const match = id.match(/FAC-(\d+)/);
      if (match && match[1]) return parseInt(match[1], 10);
    }
    if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10);
    return id;
  },

  // Vérifier si une facture existe pour une commande
  async checkInvoiceExistsForCommande(commandeId) {
    try {
      console.log(`📡 Vérification facture pour commande ${commandeId}`);
      const response = await api.get(`/factures/commande/${commandeId}`);
      
      if (response.data && response.data.idFactureClient) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      console.error(`❌ Erreur checkInvoiceExistsForCommande ${commandeId}:`, error);
      return false;
    }
  },

  // Générer une facture pour une commande
  async generateOrGetInvoice(commandeId) {
    try {
      const response = await api.post(`/factures/generer/${commandeId}`);
      
      if (response.data && response.data.success) {
        console.log('✅ Facture générée avec succès');
        return response.data;
      }
      throw new Error(response.data?.message || 'Erreur lors de la génération');
    } catch (error) {
      console.error('❌ Erreur generateOrGetInvoice:', error);
      throw error;
    }
  },

  // Récupérer une facture par ID de commande
  async getInvoiceByCommandeId(commandeId) {
    try {
      const response = await api.get(`/factures/commande/${commandeId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`❌ Erreur getInvoiceByCommandeId ${commandeId}:`, error);
      throw error;
    }
  },

  // Visualiser une facture (ouvre dans un nouvel onglet)
// Dans commandeService.js
async viewInvoice(commandeId) {
    try {
        const invoice = await this.getInvoiceByCommandeId(commandeId);
        
        if (!invoice || !invoice.idFactureClient) {
            throw new Error('Facture non trouvée');
        }
        
        // Télécharger le PDF
        const pdfBlob = await this.downloadInvoicePDF(invoice.idFactureClient);
        
        // Ouvrir dans un nouvel onglet
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        
        // Nettoyer
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
    } catch (error) {
        console.error('❌ Erreur viewInvoice:', error);
        throw error;
    }
},

  // Téléchargement du PDF avec blob
async downloadInvoicePDF(factureId) {
    try {
        console.log(`📡 Téléchargement PDF facture ${factureId}`);
        
        const response = await api.get(`/factures/${factureId}/pdf`, {
            responseType: 'blob'
        });
        
        // Créer un lien de téléchargement
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture_${factureId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ PDF téléchargé avec succès`);
        return response.data;
    } catch (error) {
        console.error('❌ Erreur downloadInvoicePDF:', error);
        throw error;
    }
},

async getInvoicePDFBlob(factureId) {
  try {
    const response = await api.get(`/factures/${factureId}/pdf`, {
      responseType: 'blob',
      // Ne pas mettre de headers 'Content-Disposition' pour éviter le téléchargement auto
    });
    return response.data;
  } catch (error) {
    console.error('Erreur récupération PDF:', error);
    throw error;
  }
}

}; 