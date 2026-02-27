// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:8081/api', 
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
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
    
    console.log('=====================================');
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur response
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse reçue:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Erreur réponse:', error.config?.url, error.response?.status);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Nettoyer les tokens
      ['token', 'userRole', 'userName', 'userEmail', 'userDashboard', 
       'rememberMe', 'savedEmail', 'tokenExpiry'].forEach(k => 
        localStorage.removeItem(k)
      );
      sessionStorage.removeItem('token');
      
      toast.error('Session expirée');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;