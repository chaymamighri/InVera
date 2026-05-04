// src/services/authService.js
import api from './api';

const API_URL = '/auth';
const SUPER_ADMIN_API_URL = '/super-admin';
const CURRENT_USER_CACHE_TTL_MS = 1000;

let currentUserPromise = null;
let currentUserCache = null;
let currentUserCacheToken = null;
let currentUserCacheTimestamp = 0;

const clearCurrentUserCache = () => {
  currentUserPromise = null;
  currentUserCache = null;
  currentUserCacheToken = null;
  currentUserCacheTimestamp = 0;
};

const normalizeCurrentUser = (data) => ({
  success: true,
  data: {
    id: data?.id,
    username: data?.username || '',
    email: data?.email || '',
    name: `${data?.nom || ''} ${data?.prenom || ''}`.trim() || 'Utilisateur',
    role: data?.role || '',
    firstName: data?.prenom || '',
    lastName: data?.nom || '',
    prenom: data?.prenom || '',
    nom: data?.nom || '',
    active: data?.active !== false,
    memberSince: data?.memberSince || null,
    lastLogin: data?.lastLogin || null,
    sessionsThisWeek: data?.sessionsThisWeek ?? 0,
    connexionsRestantes: data?.connexionsRestantes,
    connexionsMax: data?.connexionsMax,
    typeInscription: data?.typeInscription,
    hasActiveSubscription: data?.hasActiveSubscription,
    clientStatut: data?.statut,
    clientId: data?.clientId
  }
});

const normalizeSuperAdmin = (data) => ({
  success: true,
  data: {
    id: data?.id,
    email: data?.email,
    name: data?.nom || 'Super Admin',
    role: 'SUPER_ADMIN',
    nom: data?.nom,
    active: true,
    memberSince: data?.memberSince,
    lastLogin: data?.lastLogin
  }
});

export const authService = {
  login: async (credentials) => {
    clearCurrentUserCache();

    try {
      const response = await api.post(`${API_URL}/login`, {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe
      });

      const data = response.data;
      
      if (!data.token) {
        const error = new Error('Aucun token reçu du serveur');
        error.userMessage = 'Erreur technique. Veuillez réessayer.';
        throw error;
      }

      const cleanedToken = String(data.token || '').replace(/^"|"$/g, '').trim();
      const normalizedToken = cleanedToken.startsWith('Bearer ')
        ? cleanedToken.slice(7)
        : cleanedToken;

      const fullName = `${data.nom || ''} ${data.prenom || ''}`.trim() || 'Utilisateur';
      const backendEmail = data.email || data.username || credentials.email;

      if (credentials.rememberMe) {
        localStorage.setItem('token', normalizedToken);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', credentials.email);
      } else {
        sessionStorage.setItem('token', normalizedToken);
      }

      // ✅ Stocker toutes les informations utilisateur
      localStorage.setItem('userRole', data.role || '');
      localStorage.setItem('userName', fullName);
      localStorage.setItem('userEmail', backendEmail);
      localStorage.setItem('userNom', data.nom || '');      // ← AJOUTÉ
      localStorage.setItem('userPrenom', data.prenom || ''); // ← AJOUTÉ
      localStorage.setItem('userFullName', fullName);        // ← AJOUTÉ

      if (data.connexionsRestantes !== undefined) {
        localStorage.setItem('connexionsRestantes', data.connexionsRestantes);
      }
      if (data.connexionsMax !== undefined) {
        localStorage.setItem('connexionsMax', data.connexionsMax);
      }
      if (data.typeInscription) {
        localStorage.setItem('typeInscription', data.typeInscription);
      }
      if (data.hasActiveSubscription !== undefined) {
        localStorage.setItem('hasActiveSubscription', data.hasActiveSubscription);
      }
      if (data.statut) {
        localStorage.setItem('clientStatut', data.statut);
      }
      if (data.clientId) {
        localStorage.setItem('clientId', data.clientId);
      }
      if (data.memberSince) {
        localStorage.setItem('memberSince', data.memberSince);
      }
      if (data.lastLogin) {
        localStorage.setItem('lastLogin', data.lastLogin);
      }

      sessionStorage.setItem('justLoggedIn', 'true');

      if (data.warning) {
        sessionStorage.setItem('sessionWarning', data.warning);
      }

      return {
        success: true,
        data: {
          token: normalizedToken,
          user: {
            email: backendEmail,
            name: fullName,
            role: data.role,
            firstName: data.prenom,
            lastName: data.nom,
            prenom: data.prenom,
            nom: data.nom
          },
          connexionsRestantes: data.connexionsRestantes,
          connexionsMax: data.connexionsMax,
          typeInscription: data.typeInscription,
          hasActiveSubscription: data.hasActiveSubscription,
          statut: data.statut,
          clientId: data.clientId
        }
      };
    } catch (error) {
      console.error('❌ authService.login error:', error);
      clearCurrentUserCache();
      
      let userMessage = 'Email ou mot de passe incorrect';
      
      if (error.response) {
        const status = error.response.status;
        const backendMessage = error.response.data?.message;
        const errorCode = error.response.data?.error;
        
        if (status === 401) {
          userMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.';
        } else if (status === 404) {
          userMessage = 'Aucun compte trouvé avec cet email.';
        } else if (status === 403) {
          if (errorCode === 'ACCOUNT_INACTIVE') {
            userMessage = 'Votre compte est désactivé. Veuillez contacter l\'administrateur.';
          } else if (errorCode === 'ACCOUNT_LOCKED') {
            userMessage = 'Votre compte est verrouillé. Veuillez contacter l\'administrateur.';
          } else {
            userMessage = backendMessage || 'Accès refusé.';
          }
        } else if (status === 500) {
          userMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          userMessage = backendMessage || userMessage;
        }
      } else if (error.userMessage) {
        userMessage = error.userMessage;
      } else if (error.message && error.message !== 'Request failed with status code 401') {
        userMessage = error.message;
      }
      
      const formattedError = new Error(userMessage);
      formattedError.userMessage = userMessage;
      formattedError.originalError = error;
      if (error.response) {
        formattedError.status = error.response.status;
        formattedError.response = error.response;
      }
      
      throw formattedError;
    }
  },

 loginSuperAdmin: async (credentials) => {
  clearCurrentUserCache();
  
  try {
    const response = await api.post('/super-admin/login', {
      email: credentials.email,
      motDePasse: credentials.password
    });
    
    const data = response.data;
    if (!data.token) {
      const error = new Error('Aucun token reçu du serveur');
      error.userMessage = 'Erreur technique. Veuillez réessayer.';
      throw error;
    }
    
    const normalizedToken = data.token;
    const backendEmail = data.email || credentials.email;
    const fullName = data.nom || 'Super Admin';
    
    localStorage.setItem('token', normalizedToken);
    localStorage.setItem('userRole', 'SUPER_ADMIN');
    localStorage.setItem('userName', fullName);
    localStorage.setItem('userEmail', backendEmail);
    localStorage.setItem('userNom', data.nom || '');
    localStorage.setItem('userPrenom', '');
    localStorage.setItem('userFullName', fullName);
    
    if (data.warning) {
      sessionStorage.setItem('sessionWarning', data.warning);
    }

    return {
      success: true,
      data: {
        token: normalizedToken,
        user: {
          email: backendEmail,
          name: fullName,
          role: 'SUPER_ADMIN',
          nom: data.nom
        }
      }
    };
  } catch (error) {
    console.error('❌ authService.loginSuperAdmin error:', error);
    
    let userMessage = 'Email ou mot de passe incorrect';
    
    if (error.response) {
      const status = error.response.status;
      const backendMessage = error.response.data?.message;
      
      if (status === 401) {
        userMessage = 'Email ou mot de passe incorrect.';
      } else if (status === 404) {
        userMessage = 'Aucun compte Super Admin trouvé.';
      } else {
        userMessage = backendMessage || userMessage;
      }
    } else if (error.userMessage) {
      userMessage = error.userMessage;
    } else if (error.message) {
      userMessage = error.message;
    }
    
    const formattedError = new Error(userMessage);
    formattedError.userMessage = userMessage;
    throw formattedError;
  }
},

  logout: async () => {
    clearCurrentUserCache();
    
    const token = authService.getToken();
    const userRole = localStorage.getItem('userRole');
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    
    if (token) {
      try {
        const endpoint = isSuperAdmin ? '/super-admin/logout' : '/auth/logout';
        await api.post(endpoint);
        console.log('✅ Logout API appelé avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du logout API:', error);
      }
    }
    
    localStorage.clear();
    sessionStorage.clear();
    
    return { success: true };
  },

  getActivationLinkInfo: async (token) => {
    try {
      const response = await api.get(`/auth/activation-link-info?token=${encodeURIComponent(token)}`);
      console.log('✅ getActivationLinkInfo - Réponse reçue:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getActivationLinkInfo - Erreur:', error);
      throw error;
    }
  },

  activateAccount: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/activate-account', {
        token: token,
        newPassword: newPassword
      });
      console.log('✅ activateAccount - Compte activé avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ activateAccount - Erreur:', error);
      throw error;
    }
  },

  verifyActivationToken: async (token) => {
    try {
      const response = await api.get(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error) {
      console.error('❌ verifyActivationToken - Token invalide:', error);
      throw error;
    }
  },

  resendActivationEmail: async (email) => {
    try {
      const response = await api.post('/auth/resend-activation', { email });
      return response.data;
    } catch (error) {
      console.error('❌ resendActivationEmail - Erreur:', error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (code, email, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        code: code,
        email: email,
        newPassword: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('❌ Reset password error:', error);
      throw error;
    }
  },

  isAuthenticated: () => {
    let token = sessionStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('token');
      if (token) {
        const expiry = localStorage.getItem('tokenExpiry');
        if (expiry && new Date(expiry) < new Date()) {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedEmail');
          return false;
        }
      }
    }
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getCurrentUser: async ({ force = false } = {}) => {
    const token = authService.getToken();
    if (!token) throw new Error('Non authentifié');

    const userRole = localStorage.getItem('userRole');
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    
    console.log(`🔍 getCurrentUser - isSuperAdmin: ${isSuperAdmin}, role: ${userRole}`);

    const now = Date.now();
    const cacheIsValid =
      !force &&
      currentUserCache &&
      currentUserCacheToken === token &&
      now - currentUserCacheTimestamp < CURRENT_USER_CACHE_TTL_MS;

    if (cacheIsValid) {
      return currentUserCache;
    }

    if (!force && currentUserPromise && currentUserCacheToken === token) {
      return currentUserPromise;
    }

    currentUserCacheToken = token;
    
    const endpoint = isSuperAdmin ? '/super-admin/me' : '/auth/me';
    console.log(`🔍 getCurrentUser - Endpoint: ${endpoint}`);

    currentUserPromise = api
      .get(endpoint)
      .then(async (response) => {
        const data = response.data;
        
        const normalized = isSuperAdmin ? normalizeSuperAdmin(data) : normalizeCurrentUser(data);

        if (normalized.data?.active === false) {
          clearCurrentUserCache();
          await authService.logout();
          throw new Error("Compte désactivé. Contactez l'administrateur.");
        }

        currentUserCache = normalized;
        currentUserCacheTimestamp = Date.now();
        return normalized;
      })
      .catch((error) => {
        console.error(`❌ Erreur sur ${endpoint}:`, error);
        clearCurrentUserCache();
        throw error;
      })
      .finally(() => {
        currentUserPromise = null;
      });

    return currentUserPromise;
  },

  getToken: () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  },

  getSessionWarning: () => {
    const warning = sessionStorage.getItem('sessionWarning');
    if (warning) {
      sessionStorage.removeItem('sessionWarning');
      return warning;
    }
    return null;
  },

  fetchWithAuth: async (url, options = {}) => {
    const token = authService.getToken();
    if (!token) throw new Error('Non authentifié');

    const response = await api({
      url: `${API_URL}${url}`,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    return response.data;
  }
};