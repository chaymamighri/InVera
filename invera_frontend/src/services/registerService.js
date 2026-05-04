// src/services/registerService.js
import api from './api';

// Déclarer les variables en dehors de l'objet
let pendingOtpCode = null;
let pendingOtpEmail = null;

export const registerService = {
  
  async sendOtp(email) {
    try {
      const response = await api.post('/platform/clients/request-otp', { email });
      
      console.log('📧 OTP envoyé avec succès');
      
      return { 
        success: true, 
        message: 'Code envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur envoi OTP:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'envoi du code';
      return { success: false, message };
    }
  },

  async verifyOtp(email, code) {
  try {
    const response = await api.post('/platform/clients/verify-otp', { 
      email, 
      code: code.toString() 
    });
    
    console.log('📡 Vérification OTP - réponse brute:', response);
    console.log('📡 response.data:', response.data);
    console.log('📡 response.data.success:', response.data?.success);
    
    // ✅ Retourner explicitement l'objet complet
    if (response.data && response.data.success === true) {
      console.log('✅ Code OTP valide - retour success true');
      return { success: true, message: response.data.message };
    } else {
      console.log('❌ Code OTP invalide - retour success false');
      return { success: false, message: response.data?.message || 'Code invalide' };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification OTP:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
},


async register(formDataToSend) {
    try {
        // ✅ Vérifier que c'est bien un FormData
        if (!(formDataToSend instanceof FormData)) {
            console.error('❌ Erreur: register a reçu un objet qui n\'est pas FormData');
            return { success: false, message: 'Erreur interne: format de données invalide' };
        }
        
        // ✅ Afficher les données reçues pour déboguer
        console.log('=== registerService: Données reçues (FormData) ===');
        for (let pair of formDataToSend.entries()) {
            if (pair[1] instanceof File) {
                console.log(pair[0] + ':', '[FILE]', pair[1].name);
            } else {
                console.log(pair[0] + ':', pair[1]);
            }
        }
        
        // ✅ Envoyer directement le FormData (ne pas en recréer un nouveau !)
        const response = await api.post('/platform/clients/register', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        console.log('✅ Inscription réussie:', response.data);
        
        // Récupérer le clientId
        const clientId = response.data.clientId;
        
        // Note: Les documents sont déjà dans formDataToSend, 
        // pas besoin de les uploader séparément ici
        
        return { 
            success: true, 
            clientId: clientId,
            message: response.data.message,
            connexionsRestantes: response.data.connexionsRestantes,
            statut: response.data.statut,
            logoUrl: response.data.logoUrl
        };
        
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        
        let message = 'Erreur lors de l\'inscription';
        
        if (error.response) {
            message = error.response.data?.error || 
                      error.response.data?.message || 
                      `Erreur ${error.response.status}`;
                      
            if (error.response.status === 409) {
                message = 'Un compte existe déjà avec ces informations.';
            } else if (error.response.status === 400) {
                message = error.response.data?.error || 'Données invalides. Vérifiez vos informations.';
            }
        }
        
        return { success: false, message };
    }
},

  // Upload de justificatifs après inscription
  async uploadJustificatif(clientId, file, typeDocument) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('typeDocument', typeDocument);
      
      const response = await api.post(`/platform/clients/${clientId}/justificatifs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur upload document:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'upload du document';
      return { success: false, message };
    }
  },
  
  // Récupérer les documents requis selon le type de compte et d'abonnement
  getRequiredDocuments(typeCompte, typeInscription = 'ESSAI') {
    // Pour l'essai gratuit, aucun document n'est requis
    if (typeInscription === 'ESSAI') {
      return [];
    }
    
    // Pour l'abonnement payant, documents requis selon le type de compte
    if (typeCompte === 'ENTREPRISE') {
      return [
        { field: 'GERANT_CIN', label: 'Carte d\'identité du gérant', required: true, acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
        { field: 'PATENTE', label: 'Patente', required: true, acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
        { field: 'RNE', label: 'Extrait RNE (moins de 3 mois)', required: true, acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'] }
      ];
    } else {
      return [
        { field: 'CIN', label: 'Carte d\'identité nationale', required: true, acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'] }
      ];
    }
  },
  
  // Uploader le logo après inscription
  async uploadLogo(clientId, logoFile) {
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const response = await api.post(`/platform/clients/${clientId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur upload logo:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'upload du logo';
      return { success: false, message };
    }
  },
  
  // Récupérer le logo
  async getLogo(clientId) {
    try {
      const response = await api.get(`/platform/clients/${clientId}/logo`, {
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur récupération logo:', error);
      return { success: false, message: 'Logo non trouvé' };
    }
  },
  
  // Supprimer le logo
  async deleteLogo(clientId) {
    try {
      const response = await api.delete(`/platform/clients/${clientId}/logo`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur suppression logo:', error);
      const message = error.response?.data?.error || 'Erreur lors de la suppression du logo';
      return { success: false, message };
    }
  }
};


// Exports
export const sendOtp = (email) => registerService.sendOtp(email);
export const verifyOtp = (email, code) => registerService.verifyOtp(email, code);
export const register = (formData) => registerService.register(formData);
export const uploadJustificatif = (clientId, file, typeDocument) => registerService.uploadJustificatif(clientId, file, typeDocument);
export const getRequiredDocuments = (typeCompte, typeAbonnement) => registerService.getRequiredDocuments(typeCompte, typeAbonnement);
export const uploadLogo = (clientId, logoFile) => registerService.uploadLogo(clientId, logoFile);
export const getLogo = (clientId) => registerService.getLogo(clientId);
export const deleteLogo = (clientId) => registerService.deleteLogo(clientId);

export default registerService;