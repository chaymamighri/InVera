// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from '../i18n/translations';

const api = axios.create({
  baseURL: 'http://localhost:8081/api', 
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 60000
});

// ✅ Intercepteur avec LOGS OBLIGATOIRES pour debug
api.interceptors.request.use(
  (config) => {
    console.log('=== INTERCEPTEUR REQUÊTE DÉCLENCHÉ ===');
    console.log('URL complète:', config.baseURL + config.url);
    console.log('Méthode:', config.method);
    
    // 1. Vérifier les DEUX sources
    const sessionToken = sessionStorage.getItem('token');
    const localToken = localStorage.getItem('token');
    
    console.log('Session token:', sessionToken ? 'PRÉSENT' : 'ABSENT');
    console.log('Local token:', localToken ? 'PRÉSENT' : 'ABSENT');
    console.log('Remember me:', localStorage.getItem('rememberMe') === 'true' ? 'OUI' : 'NON');
    
    // 2. Choisir le token
    const token = sessionToken || localToken;
    
    // 3. Ajouter le token aux headers
    if (token) {
      const cleanedToken = token.replace(/^"|"$/g, '').trim();
      config.headers.Authorization = `Bearer ${cleanedToken}`;
      console.log('✅ TOKEN AJOUTÉ !');
      console.log('Authorization:', config.headers.Authorization.substring(0, 30) + '...');
    } else {
      console.log('❌ AUCUN TOKEN TROUVÉ !');
    }

    const currentLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    config.headers['Accept-Language'] = SUPPORTED_LANGUAGES.includes(currentLanguage)
      ? currentLanguage
      : DEFAULT_LANGUAGE;
    
    console.log('=====================================');
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur response - CORRIGÉ
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse reçue:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Erreur réponse:', error.config?.url, error.response?.status);
    
    // ✅ Récupérer les données d'erreur
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    const errorMessage = errorData?.message;
    
    // ✅ Cas 1: SESSION_EXPIRED (connexion depuis un autre appareil)
    if (error.response?.status === 401 && errorCode === 'SESSION_EXPIRED') {
      console.warn('🔒 Session unique - Connexion depuis un autre appareil');
      
      // Stocker le message pour l'afficher au prochain login
      sessionStorage.setItem('sessionExpired', 'true');
      sessionStorage.setItem('sessionExpiredMessage', errorMessage || 'Vous êtes connecté depuis un autre appareil.');
      
      // Nettoyer les tokens
      ['token', 'userRole', 'userName', 'userEmail', 'userDashboard', 
       'rememberMe', 'savedEmail', 'tokenExpiry', 'clientDatabase', 'clientId'].forEach(k => 
        localStorage.removeItem(k)
      );
      sessionStorage.removeItem('token');
      
      // Message spécifique
      toast.error('🔒 Session fermée - Connexion depuis un autre appareil');
      
      // Redirection
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // ✅ Cas 2: TOKEN_EXPIRED (token normalement expiré)
    if (error.response?.status === 401 && errorCode === 'TOKEN_EXPIRED') {
      console.warn('⏰ Token expiré');
      sessionStorage.setItem('tokenExpired', 'true');
      
      // Nettoyer les tokens
      ['token', 'userRole', 'userName', 'userEmail', 'userDashboard', 
       'rememberMe', 'savedEmail', 'tokenExpiry', 'clientDatabase', 'clientId'].forEach(k => 
        localStorage.removeItem(k)
      );
      sessionStorage.removeItem('token');
      
      toast.error('⏰ Session expirée. Veuillez vous reconnecter.');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // ✅ Cas 3: Période d'essai expirée (status 403)
    if (error.response?.status === 403 && errorMessage?.includes('Période d\'essai expirée')) {
      console.warn('⚠️ Période d\'essai expirée');
      sessionStorage.setItem('essaiExpire', 'true');
      
      toast.error('Période d\'essai expirée. Veuillez souscrire un abonnement.');
      // Ne pas rediriger automatiquement, laisser le message s'afficher sur la page de login
      return Promise.reject(error);
    }
    
    // ✅ Cas 4: Autres erreurs 401/403
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔒 Authentification invalide');
      
      // Nettoyer les tokens
      ['token', 'userRole', 'userName', 'userEmail', 'userDashboard', 
       'rememberMe', 'savedEmail', 'tokenExpiry', 'clientDatabase', 'clientId'].forEach(k => 
        localStorage.removeItem(k)
      );
      sessionStorage.removeItem('token');
      
      toast.error('Session invalide. Veuillez vous reconnecter.');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
