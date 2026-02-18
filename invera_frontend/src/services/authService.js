// authService.js
import api from './api'; // Pour les autres requêtes

const API_URL = '/auth';

export const authService = {
  login: async (credentials) => {
    try {
      console.log(' Tentative de connexion avec:', credentials.email);
      const response = await api.post(`${API_URL}/login`, {
        email: credentials.email,
        password: credentials.password,
      });
      const data = response.data;
      console.log('Données reçues:', data);
      
      // Vérifiez que le token est présent
      if (!data.token) {
        console.error(' AUCUN TOKEN dans la réponse!', data);
        throw new Error('Aucun token reçu du serveur');
      }
      const cleanedToken = String(data.token || '').replace(/^"|"$/g, '').trim();
      const normalizedToken = cleanedToken.startsWith('Bearer ') ? cleanedToken.slice(7) : cleanedToken;
      console.log('Token reçu:', normalizedToken.substring(0, 50) + '...');

      // Sauvegarder rememberMe si coché
      if (credentials.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', credentials.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
      }
      
      return {
        success: true,
        data: {
          token: normalizedToken,
          user: {
            email: data.username, // C'est 'username' dans la réponse
            name: `${data.nom} ${data.prenom}`,
            role: data.role,
            firstName: data.prenom,
            lastName: data.nom
          }
        }
      };
    } catch (error) {
      console.error(' Erreur login:', error);
      throw error;
    }
  },

  // Déconnexion
  logout: async () => {
    console.log('🚪 Déconnexion...');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDashboard');
    return { success: true };
  },

  // Récupérer l'utilisateur courant - UTILISE api.get() (avec intercepteur)
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      console.log('👤 Récupération utilisateur avec token:', token.substring(0, 30) + '...');
      const response = await api.get(`${API_URL}/me`);
      const data = response.data;
      
      return {
        success: true,
        data: {
          id: data.id,
          username: data.username,
          email: data.email,
          name: `${data.nom} ${data.prenom}`,
          role: data.role,
          firstName: data.prenom,
          lastName: data.nom
        }
      };
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userDashboard');
      }
      throw new Error('Erreur de récupération de l\'utilisateur');
    }
  },
  // frontend/src/services/authService.js
// Ajouter cette méthode après resetPassword

  // ===== CREATE PASSWORD (first time) =====
  createPassword: async (code, email, newPassword) => {
    try {
      console.log('📤 Envoi create password - URL:', '/auth/create-password');
      console.log('📤 Données envoyées:', { code, email, newPassword });
      
      const response = await api.post('/auth/create-password', {
        code: code,
        email: email,
        newPassword: newPassword
      });
      
      console.log('✅ Réponse reçue:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur complète:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // Mot de passe oublié
  
  // ✅ CORRECTION - forgotPassword avec @RequestParam
forgotPassword: async (email) => {
  try {
    // IMPORTANT: Le backend attend @RequestParam, pas @RequestBody !
    const response = await api.post(
      `/auth/forgot-password?email=${encodeURIComponent(email)}`,  
      {},  // ← Body vide !
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return { 
      success: true, 
      message: 'Instructions envoyées par email' 
    };
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération du mot de passe');
  }
},

/// authService.js - VERSION CORRIGÉE
resetPassword: async (code, email, newPassword) => {
  try {
    console.log('📤 Envoi reset password - URL:', '/auth/reset-password');
    console.log('📤 Données envoyées:', { code, email, newPassword });
    
    const response = await api.post('/auth/reset-password', {
      code: code,        // ← IMPORTANT: s'appelle 'code' dans le backend
      email: email,      // ← IMPORTANT: s'appelle 'email' dans le backend
      newPassword: newPassword
    });
    
    console.log('✅ Réponse reçue:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur complète:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
},

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔒 Non authentifié: pas de token');
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      console.log('🔒 Authentification vérifiée:', isValid);
      return isValid;
    } catch {
      console.log('🔒 Token invalide');
      return false;
    }
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Fonction utilitaire pour les requêtes authentifiées
  fetchWithAuth: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await api({
        url: `${API_URL}${url}`,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }


  
};
