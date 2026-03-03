// src/services/authService.js
import api from './api';

const API_URL = '/auth';

export const authService = {

  // login fucntion
 login: async (credentials) => {
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

  //  DÉFINIR backendEmail ICI 
  const fullName = `${data.nom || ''} ${data.prenom || ''}`.trim() || 'Utilisateur';
  const backendEmail = data.email || data.username || credentials.email; 

  // Stockage différencié selon rememberMe
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

  // Stocker les infos utilisateur
  localStorage.setItem('userRole', data.role || '');
  localStorage.setItem('userName', fullName);
  localStorage.setItem('userEmail', backendEmail); 

  return {
    success: true,
    data: {
      token: normalizedToken,
      user: {
        email: backendEmail,  
        name: fullName,
        role: data.role,
        firstName: data.prenom,
        lastName: data.nom
      }
    }
  };
},


logout: async () => {
  localStorage.clear();   
  sessionStorage.clear(); 
  localStorage.removeItem('profile');
localStorage.removeItem('users-management');
localStorage.removeItem('commandes');
localStorage.removeItem('rememberMe');
localStorage.removeItem('savedEmail');
localStorage.removeItem('tokenExpiry');
  return { success: true };
},

  createPassword: async (code, email, newPassword) => {
    const response = await api.post('/auth/create-password', {
      code,
      email,
      newPassword
    });
    return response.data;
  },


  forgotPassword: async (email) => {
    await api.post(
      `/auth/forgot-password?email=${encodeURIComponent(email)}`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return { success: true, message: 'Instructions envoyées par email' };
  },



  resetPassword: async (code, email, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      code,
      email,
      newPassword
    });
    return response.data;
  },

  
// vérif cordonnées user connecter
 isAuthenticated: () => {
  // Vérifier d'abord sessionStorage (session normale)
  let token = sessionStorage.getItem('token');
  
  // Sinon vérifier localStorage (remember me)
  if (!token) {
    token = localStorage.getItem('token');
    
    // Vérifier l'expiration pour remember me
    if (token) {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && new Date(expiry) < new Date()) {
        // Token expiré, nettoyer
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


  // ✅ AJOUTEZ CE CI !
  getCurrentUser: async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) throw new Error('Non authentifié');

    const response = await api.get(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = response.data;

    // Si le compte est désactivé
    if (data?.active === false) {
      await authService.logout();
      throw new Error("Compte désactivé. Contactez l'administrateur.");
    }

    return {
      success: true,
      data: {
        id: data.id,
        email: data.email,
        name: `${data.nom || ''} ${data.prenom || ''}`.trim() || 'Utilisateur',
        role: data.role,
        firstName: data.prenom,
        lastName: data.nom,
        active: data.active
      }
    };
  },
  


getToken: () => {
  // Priorité à sessionStorage (session en cours)
  return sessionStorage.getItem('token') || localStorage.getItem('token');
},
  fetchWithAuth: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Non authentifié');

    const response = await api({
      url: `${API_URL}${url}`,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    return response.data;
  }
};
