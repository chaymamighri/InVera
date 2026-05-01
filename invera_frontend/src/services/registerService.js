// src/services/registerService.js
import api from './api';

//  Déclarer les variables en dehors de l'objet
let pendingOtpCode = null;
let pendingOtpEmail = null;

export const registerService = {
  async sendOtp(email) {
    try {
      const response = await api.post('/platform/clients/request-otp', { email });
      
      pendingOtpCode = response.data.debug_otp;
      pendingOtpEmail = email;
    
      
      return { 
        success: true, 
        otp: pendingOtpCode
      };
    } catch (error) {
      console.error('Erreur envoi OTP:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'envoi du code';
      return { success: false, message };
    }
  },

  async verifyOtp(email, code) {
    
    if (pendingOtpCode && code === pendingOtpCode) {
      console.log(' Code OTP valide');
      return true;
    }
    
    console.log(' Code OTP invalide');
    return false;
  },

  async register(formData) {
    try {
      // Vérification OTP
      if (formData.code !== pendingOtpCode) {
        console.error(' Code OTP incorrect avant envoi!');
        return { 
          success: false, 
          message: 'Code OTP invalide. Veuillez retourner à l\'étape 1.' 
        };
      }
      
      // Construire le payload selon le type de compte
      const payload = {
        email: formData.email,
        telephone: formData.telephone,
        typeCompte: formData.typeCompte,
        typeInscription: formData.typeInscription || 'ESSAI',
        otp: formData.code,
        password: formData.motDePasse,
        offreId: formData.offreId || null,
        nom: formData.nom || '',
        prenom: formData.prenom || ''
      };
      
      //  Ajouter les champs spécifiques pour entreprise
      if (formData.typeCompte === 'ENTREPRISE') {
        payload.raisonSociale = formData.raisonSociale;
        payload.matriculeFiscal = formData.matriculeFiscal;
      }
            
      //  ÉTAPE 1: Inscription
      const response = await api.post('/platform/clients/register', payload);
            
      //  Nettoyer après succès
      pendingOtpCode = null;
      pendingOtpEmail = null;
      
      //  Récupérer le clientId APRÈS la réponse
      const clientId = response.data.clientId;
      
      //  ÉTAPE 2: Upload des documents si DEFINITIF
      if (formData.typeInscription === 'DEFINITIF' && formData.documents && formData.documents.length > 0) {
        console.log('Upload des documents pour le client:', clientId);
        console.log('Nombre de documents à uploader:', formData.documents.length);
        console.log('Détails des documents:', formData.documents.map(d => ({ 
          type: d.type, 
          name: d.file?.name, 
          size: d.file?.size 
        })));
        
        for (const doc of formData.documents) {          
          const uploadFormData = new FormData();
          uploadFormData.append('file', doc.file);
          uploadFormData.append('typeDocument', doc.type);
          
          try {
            const uploadResponse = await api.post(`/platform/clients/${clientId}/justificatifs`, uploadFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (uploadError) {
            console.error(`Statut erreur:`, uploadError.response?.status);
            // Continuer avec les autres documents même si un échoue
          }
        }
        
        console.log(' Traitement des documents terminé');
      } else {
        console.log('Aucun document à uploader (ESSAI ou aucun document sélectionné)');
      }
      
      //  Retourner la réponse
      return { 
        success: true, 
        clientId: clientId,
        message: response.data.message,
        connexionsRestantes: response.data.connexionsRestantes,
        motDePasse: formData.motDePasse,
        statut: response.data.statut
      };
      
    } catch (error) {
      console.error(' Erreur inscription:', error);
      console.error(' Détails réponse:', error.response?.data);
      
      pendingOtpCode = null;
      pendingOtpEmail = null;
      
      const message = error.response?.data?.error || 'Erreur lors de l\'inscription';
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
  
  //  Récupérer les documents requis selon le type de compte
  getRequiredDocuments(typeCompte) {
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
  }
};

export const fetchOffres = async () => {
  try {
    const response = await fetch('/api/public/offres');
        
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
};

// Exports
export const sendOtp = (email) => registerService.sendOtp(email);
export const verifyOtp = (email, code) => registerService.verifyOtp(email, code);
export const register = (formData) => registerService.register(formData);
export const login = (email, password) => registerService.login(email, password);
export const uploadJustificatif = (clientId, file, typeDocument) => registerService.uploadJustificatif(clientId, file, typeDocument);
export const getRequiredDocuments = (typeCompte) => registerService.getRequiredDocuments(typeCompte);

export default registerService;