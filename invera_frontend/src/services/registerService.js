// src/services/registerService.js
import api from './api';

// ✅ Déclarer les variables en dehors de l'objet
let pendingOtpCode = null;
let pendingOtpEmail = null;

export const registerService = {
  async sendOtp(email) {
    try {
      const response = await api.post('/platform/clients/request-otp', { email });
      
      // ✅ Maintenant pendingOtpCode est défini
      pendingOtpCode = response.data.debug_otp;
      pendingOtpEmail = email;
      
      console.log('📧 OTP envoyé à:', email);
      console.log('🔑 Code OTP (debug):', pendingOtpCode);
      
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
    console.log('🔍 Vérification OTP - Email:', email);
    console.log('🔍 Code saisi:', code);
    console.log('🔍 Code attendu:', pendingOtpCode);
    
    // ✅ Vérifier que pendingOtpCode existe
    if (pendingOtpCode && code === pendingOtpCode) {
      console.log('✅ Code OTP valide');
      return true;
    }
    
    console.log('❌ Code OTP invalide');
    return false;
  },

  async register(formData) {
    try {
      console.log('=== REGISTER DEBUG ===');
      console.log('Email:', formData.email);
      console.log('Code OTP saisi:', formData.code);
      console.log('Code OTP stocké:', pendingOtpCode);
      console.log('=====================');
      
      // Vérification supplémentaire
      if (formData.code !== pendingOtpCode) {
        console.error('❌ Code OTP incorrect avant envoi!');
        return { 
          success: false, 
          message: 'Code OTP invalide. Veuillez retourner à l\'étape 1.' 
        };
      }
      
      const payload = {
        email: formData.email,
        telephone: formData.telephone,
        nom: formData.nom || '',
        prenom: formData.prenom || '',
        raisonSociale: formData.raisonSociale || '',
        siret: formData.siret || '',
        typeCompte: formData.typeCompte,
        typeInscription: formData.typeInscription || 'ESSAI',
        otp: formData.code,
        password: formData.motDePasse
      };
      
      const response = await api.post('/platform/clients/register', payload);
      
      // ✅ Nettoyer après succès
      pendingOtpCode = null;
      pendingOtpEmail = null;
      
      const clientId = response.data.clientId;
      
      // Upload des documents si DEFINITIF
      if (formData.typeInscription === 'DEFINITIF' && formData.documents && formData.documents.length > 0) {
        console.log('📎 Upload des documents pour le client:', clientId);
        
        for (const doc of formData.documents) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', doc.file);
          uploadFormData.append('typeDocument', doc.field);
          
          await api.post(`/platform/clients/${clientId}/justificatifs`, uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        
        console.log('✅ Documents uploadés avec succès');
      }
      
      return { 
        success: true, 
        clientId: clientId,
        message: response.data.message,
        connexionsRestantes: response.data.connexionsRestantes,
        motDePasse: formData.motDePasse
      };
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      console.error('❌ Détails réponse:', error.response?.data);
      
      // ✅ Nettoyer en cas d'erreur aussi
      pendingOtpCode = null;
      pendingOtpEmail = null;
      
      const message = error.response?.data?.error || 'Erreur lors de l\'inscription';
      return { success: false, message };
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/platform/clients/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'ADMIN_CLIENT');
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userName', response.data.nom);
        localStorage.setItem('clientDatabase', response.data.database || '');
        localStorage.setItem('clientId', response.data.clientId);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur connexion:', error);
      const message = error.response?.data?.error || 'Erreur lors de la connexion';
      return { success: false, message };
    }
  }
};

// Exports
export const sendOtp = (email) => registerService.sendOtp(email);
export const verifyOtp = (email, code) => registerService.verifyOtp(email, code);
export const register = (formData) => registerService.register(formData);
export const login = (email, password) => registerService.login(email, password);

export default registerService;