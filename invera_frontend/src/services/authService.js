// src/services/authService.js
import api from './api';

const API_URL = '/auth';

export const authService = {
  login: async (credentials) => {
    const response = await api.post(`${API_URL}/login`, {
      email: credentials.email,
      password: credentials.password,
    });

    const data = response.data;

    if (!data.token) throw new Error('Aucun token reçu du serveur');

    const cleanedToken = String(data.token || '').replace(/^"|"$/g, '').trim();
    const normalizedToken = cleanedToken.startsWith('Bearer ') ? cleanedToken.slice(7) : cleanedToken;

    localStorage.setItem('token', normalizedToken);

    if (data.role) localStorage.setItem('userRole', String(data.role));
    else localStorage.removeItem('userRole');

    const fullName = `${data.nom || ''} ${data.prenom || ''}`.trim() || 'Utilisateur';
    localStorage.setItem('userName', fullName);

    const backendEmail = data.email || data.username || credentials.email;
    localStorage.setItem('userEmail', backendEmail);

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
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((k) =>
      localStorage.removeItem(k)
    );
    return { success: true };
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Non authentifié');

    const response = await api.get(`${API_URL}/me`);
    const data = response.data;

    // ✅ If user is inactive => force logout
    if (data.active === false) {
      await authService.logout();
      throw new Error("Compte désactivé. Contactez l'administrateur.");
    }

    return {
      success: true,
      data: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: `${data.nom} ${data.prenom}`.trim(),
        role: data.role,
        firstName: data.prenom,
        lastName: data.nom,
        active: data.active
      }
    };
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
    // backend will now return 403 if inactive
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

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getToken: () => localStorage.getItem('token'),

  fetchWithAuth: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Non authentifié');

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
  }
};
