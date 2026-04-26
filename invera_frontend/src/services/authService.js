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
    // ⭐ Ajout des informations de connexion
    connexionsRestantes: data?.connexionsRestantes,
    connexionsMax: data?.connexionsMax,
    typeInscription: data?.typeInscription,
    hasActiveSubscription: data?.hasActiveSubscription,
    clientStatut: data?.statut,
    clientId: data?.clientId
  }
});

// Normalisation pour Super Admin
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

    const response = await api.post(`${API_URL}/login`, {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe
    });

    const data = response.data;
    if (!data.token) throw new Error('Aucun token reçu du serveur');

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

    localStorage.setItem('userRole', data.role || '');
    localStorage.setItem('userName', fullName);
    localStorage.setItem('userEmail', backendEmail);

    // ⭐ STOCKER LES INFORMATIONS DE CONNEXION CLIENT
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

    // ⭐ STOCKER LE FLAG POUR LE TOAST
    sessionStorage.setItem('justLoggedIn', 'true');
    console.log('✅ Flag justLoggedIn stocké dans sessionStorage');

    // Stocker le warning si une autre session a été fermée
    if (data.warning) {
      sessionStorage.setItem('sessionWarning', data.warning);
    }

    // ⭐ RETOURNER TOUTES LES DONNÉES CLIENT DANS LA RÉPONSE
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
        // ⭐ DONNÉES DE CONNEXION ESSENTIELLES POUR LE TOAST
        connexionsRestantes: data.connexionsRestantes,
        connexionsMax: data.connexionsMax,
        typeInscription: data.typeInscription,
        hasActiveSubscription: data.hasActiveSubscription,
        statut: data.statut,
        clientId: data.clientId
      }
    };
  },

  // Login pour Super Admin
  loginSuperAdmin: async (credentials) => {
    clearCurrentUserCache();
    
    const response = await api.post('/super-admin/login', {
      email: credentials.email,
      motDePasse: credentials.password
    });
    
    const data = response.data;
    if (!data.token) throw new Error('Aucun token reçu du serveur');
    
    const normalizedToken = data.token;
    
    localStorage.setItem('token', normalizedToken);
    localStorage.setItem('userRole', 'SUPER_ADMIN');
    localStorage.setItem('userName', data.nom);
    localStorage.setItem('userEmail', data.email);
    
    if (data.warning) {
      sessionStorage.setItem('sessionWarning', data.warning);
    }

    return {
      success: true,
      data: {
        token: normalizedToken,
        user: {
          email: data.email,
          name: data.nom,
          role: 'SUPER_ADMIN',
          nom: data.nom
        }
      }
    };
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
    
    // ⭐ NETTOYER LES DONNÉES DE CONNEXION
    localStorage.removeItem('connexionsRestantes');
    localStorage.removeItem('connexionsMax');
    localStorage.removeItem('typeInscription');
    localStorage.removeItem('hasActiveSubscription');
    localStorage.removeItem('clientStatut');
    localStorage.removeItem('clientId');
    sessionStorage.removeItem('justLoggedIn');
    sessionStorage.removeItem('toastShownForSession');
    
    localStorage.clear();
    sessionStorage.clear();
    
    return { success: true };
  },

  // ✅ CORRIGÉ: Récupérer les infos du token d'activation
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

  // ✅ CORRIGÉ: Activer le compte avec le mot de passe
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

  // ✅ NOUVEAU: Vérifier si le token d'activation est valide
  verifyActivationToken: async (token) => {
    try {
      const response = await api.get(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error) {
      console.error('❌ verifyActivationToken - Token invalide:', error);
      throw error;
    }
  },

  // ✅ NOUVEAU: Renvoyer un email d'activation
  resendActivationEmail: async (email) => {
    try {
      const response = await api.post('/auth/resend-activation', { email });
      return response.data;
    } catch (error) {
      console.error('❌ resendActivationEmail - Erreur:', error);
      throw error;
    }
  },

  // Mot de passe oublié
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Réinitialisation avec code OTP
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